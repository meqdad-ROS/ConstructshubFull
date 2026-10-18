"""IfcOpenShell-backed IFC parser.

Returns the same shape as the TS text parser in lib/search/ifc.ts so callers
can swap without touching their types.

What IfcOpenShell gives us beyond the text parser:
  * Correct STEP tokenisation (quoted-string escapes, nested lists)
  * `by_type('IfcWall')` across every subtype
  * `get_psets(element)` returns `{PsetName: {Prop: Value}}` for every pset
    AND every element-quantity (BaseQuantities, custom Qsets)
  * Entity relationships, so IfcRelDefinesByProperties is already resolved
"""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path
from typing import Any

try:
    import ifcopenshell  # type: ignore[import-not-found]
    import ifcopenshell.util.element as ios_element  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover — happens in dev without the wheel
    ifcopenshell = None  # type: ignore[assignment]
    ios_element = None  # type: ignore[assignment]

from .models import IfcAnalysis, IfcLineItem

# --- Taxonomy ----------------------------------------------------------------
# Preferred dimension per class — same as the TS parser.

PREFERRED_DIMENSION: dict[str, str] = {
    "IfcWall": "volume",
    "IfcWallStandardCase": "volume",
    "IfcSlab": "area",
    "IfcBeam": "length",
    "IfcColumn": "length",
    "IfcFooting": "volume",
    "IfcPile": "length",
    "IfcDoor": "count",
    "IfcWindow": "count",
    "IfcStair": "count",
    "IfcRoof": "area",
    "IfcCovering": "area",
    "IfcCurtainWall": "area",
    "IfcRailing": "length",
    "IfcPipeSegment": "length",
    "IfcDuctSegment": "length",
    "IfcCableSegment": "length",
    "IfcFlowFitting": "count",
    "IfcSanitaryTerminal": "count",
    "IfcValve": "count",
    "IfcPump": "count",
    "IfcFlowTerminal": "count",
    "IfcLightFixture": "count",
    "IfcFurnishingElement": "count",
    "IfcReinforcingBar": "weight",
    "IfcReinforcingMesh": "weight",
}

UNIT_FOR_DIMENSION: dict[str, str] = {
    "volume": "m³",
    "area": "m²",
    "length": "m",
    "count": "pcs",
    "weight": "kg",
}

# IFC quantity-row class names, in the order ifcopenshell returns them.
QTO_CLASSES = {
    "IfcQuantityVolume": "volume",
    "IfcQuantityArea": "area",
    "IfcQuantityLength": "length",
    "IfcQuantityCount": "count",
    "IfcQuantityWeight": "weight",
}


def _dimension_for_qto_name(name: str) -> str | None:
    """Map a Qto property name (NetVolume / GrossArea / Length / …) to a dim."""
    n = (name or "").lower()
    if "volume" in n:
        return "volume"
    if "area" in n:
        return "area"
    if any(k in n for k in ("length", "perimeter", "height", "width", "depth")):
        return "length"
    if any(k in n for k in ("count", "number", "qty", "quantity")):
        return "count"
    if any(k in n for k in ("weight", "mass")):
        return "weight"
    return None


def _humanise(ifc_class: str) -> str:
    """IfcWallStandardCase → 'wall standard case'."""
    stripped = re.sub(r"^Ifc", "", ifc_class)
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", stripped).lower()


def _elementquantity_from_pset(pset_dict: dict[str, Any]) -> list[tuple[str, float]]:
    """When `get_psets` returns a BaseQuantities entry it is a flat dict
    `{PropertyName: value}`. We return (name, numeric value) tuples, skipping
    non-numeric values (string Qtos used for geometry refs).
    """
    out: list[tuple[str, float]] = []
    for key, value in pset_dict.items():
        if key == "id":  # ifcopenshell adds `id` to each pset
            continue
        try:
            v = float(value)
        except (TypeError, ValueError):
            continue
        if v > 0:
            out.append((key, v))
    return out


def analyze_ifc_file(path: str | Path) -> IfcAnalysis:
    """Open an IFC file and produce the structured analysis."""
    if ifcopenshell is None or ios_element is None:
        raise RuntimeError(
            "ifcopenshell is not installed. Run `pip install -r requirements.txt` "
            "in services/bim/ before starting the service."
        )

    model = ifcopenshell.open(str(path))
    schema = getattr(model, "schema", "IFC4")

    # Header fields (schema + file_name).
    description: str | None = None
    author: str | None = None
    organisation: str | None = None
    header = getattr(model.wrapped_data, "header", None)
    try:
        file_description = header.file_description.description[0]  # type: ignore[union-attr]
        description = str(file_description) if file_description else None
    except (AttributeError, IndexError):
        description = None
    try:
        file_name = header.file_name  # type: ignore[union-attr]
        if getattr(file_name, "author", None):
            author = ", ".join(str(a) for a in file_name.author if a) or None
        if getattr(file_name, "organization", None):
            organisation = ", ".join(str(o) for o in file_name.organization if o) or None
    except AttributeError:
        pass

    # Entity counts per IFC class.
    entity_counts: dict[str, int] = defaultdict(int)
    for element in model:
        entity_counts[element.is_a()] += 1

    # Per-class aggregation of quantities + sample names.
    per_class_dim_total: dict[tuple[str, str], float] = defaultdict(float)
    samples_by_class: dict[str, list[str]] = defaultdict(list)

    # Walk every element that has `is_a()` matching a *building* class we care
    # about. We include every subtype of the taxonomy keys automatically
    # because `by_type()` is subtype-inclusive.
    classes_to_scan = set(PREFERRED_DIMENSION.keys())
    seen_elements: set[int] = set()
    for cls in classes_to_scan:
        try:
            for el in model.by_type(cls):
                if el.id() in seen_elements:
                    continue
                seen_elements.add(el.id())
                ifc_class = el.is_a()
                name = getattr(el, "Name", None)
                if name and len(samples_by_class[ifc_class]) < 5 and name not in samples_by_class[ifc_class]:
                    samples_by_class[ifc_class].append(name)

                # Quantities — get_psets with qtos_only=True returns only the
                # element quantities (ElementQuantity/BaseQuantities blocks).
                try:
                    qtos: dict[str, Any] = ios_element.get_psets(el, qtos_only=True) or {}
                except TypeError:
                    # Older ifcopenshell versions do not accept the kwarg.
                    qtos = {}
                for _qset_name, qset in qtos.items():
                    if not isinstance(qset, dict):
                        continue
                    for prop_name, value in _elementquantity_from_pset(qset):
                        dim = _dimension_for_qto_name(prop_name)
                        if dim is None:
                            continue
                        per_class_dim_total[(ifc_class, dim)] += float(value)
        except RuntimeError:
            # by_type raises when the schema doesn't declare that class.
            continue

    # Build the line items.
    line_items: list[IfcLineItem] = []
    for ifc_class in sorted({c for (c, _d) in per_class_dim_total} | {c for c in entity_counts if c in PREFERRED_DIMENSION}):
        samples = samples_by_class.get(ifc_class, [])
        label = _humanise(ifc_class)
        if samples:
            label = f"{label} — {samples[0]}"
        emitted = 0
        for dim in ("volume", "area", "length", "count", "weight"):
            key = (ifc_class, dim)
            if key in per_class_dim_total and per_class_dim_total[key] > 0:
                line_items.append(
                    IfcLineItem(
                        description=label,
                        ifcClass=ifc_class,
                        quantity=round(per_class_dim_total[key], 3),
                        unit=UNIT_FOR_DIMENSION[dim],
                        dimension=dim,  # type: ignore[arg-type]
                        source="IfcElementQuantity",
                        sampleNames=samples or None,
                    )
                )
                emitted += 1
        if emitted == 0 and ifc_class in PREFERRED_DIMENSION:
            dim = PREFERRED_DIMENSION[ifc_class]
            line_items.append(
                IfcLineItem(
                    description=label,
                    ifcClass=ifc_class,
                    quantity=entity_counts.get(ifc_class, 0),
                    unit="pcs" if dim == "count" else UNIT_FOR_DIMENSION[dim],
                    dimension=dim,  # type: ignore[arg-type]
                    source="instance-count",
                    sampleNames=samples or None,
                )
            )

    summary_parts = [f"{li.quantity} {li.unit} {li.description}" for li in line_items]
    raw_summary = f"IFC {schema}"
    if description:
        raw_summary += f" — {description}"
    raw_summary += ". " + ("; ".join(summary_parts) if summary_parts else "No building elements recognised.")

    return IfcAnalysis(
        schema=str(schema),
        description=description,
        author=author,
        organisation=organisation,
        entityCounts=dict(entity_counts),
        lineItems=line_items,
        rawTextSummary=raw_summary,
    )

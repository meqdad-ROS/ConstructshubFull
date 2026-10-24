"""Dataset manifest loading + validation.

A dataset is a directory with a `manifest.json` next to the samples. The
manifest records provenance (where the sample came from, its licence, whether
it is real / synthetic / external-not-included) and the ground truth for the
sample. We deliberately keep manifest and sample bytes in the same tree so a
pen-tester can diff a dataset over time with no extra tooling.

Loader rules:

* Reject a manifest whose schema version this harness does not understand —
  we treat the schema as a wire format, not a loose dict.
* Verify every referenced sample file exists on disk; a staged-acquisition
  entry (no bytes yet) must be flagged with `"included": false` so the loader
  skips it and the report shows "pending".
* Compute a sha256 of each sample file and surface it in the loaded record,
  so a run report pins the exact bytes evaluated.

No dependencies: json + hashlib + pathlib are enough.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


SCHEMA_VERSION = 1


@dataclass
class DetectionSample:
    sample_id: str
    file: Path
    sha256: str
    objects: list[dict]  # [{"label": str, "bbox": [x,y,w,h]}, ...]
    language: str
    provenance: dict
    note: str = ""


@dataclass
class OcrSample:
    sample_id: str
    file: Path
    sha256: str
    transcript: str
    language: str  # "ar", "en", "ar+en", "ar-handwritten"
    is_handwritten: bool
    provenance: dict
    note: str = ""


@dataclass
class BimSample:
    sample_id: str
    file: Path
    sha256: str
    expected: list[dict]  # [{"ifc_class": str, "quantity": float, "unit": str}, ...]
    provenance: dict
    note: str = ""


@dataclass
class LoadedDataset:
    kind: str                   # "detection" | "ocr" | "bim"
    name: str
    version: str
    description: str
    samples: list
    skipped: list[dict] = field(default_factory=list)
    root: Path | None = None


class ManifestError(ValueError):
    """A manifest failed structural validation."""


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(64 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _require(d: dict, key: str, where: str) -> Any:
    if key not in d:
        raise ManifestError(f"{where}: missing required key '{key}'")
    return d[key]


def load_manifest(manifest_path: Path) -> LoadedDataset:
    """Load and validate a manifest.json.

    Raises `ManifestError` on structural problems. Missing sample bytes with
    `"included": false` are moved to `skipped` with the recorded reason, not
    raised — the manifest doubles as a staged-acquisition plan.
    """
    manifest_path = Path(manifest_path)
    if not manifest_path.is_file():
        raise ManifestError(f"manifest not found: {manifest_path}")
    try:
        raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ManifestError(f"{manifest_path}: invalid JSON ({e})") from e

    schema = _require(raw, "schema_version", str(manifest_path))
    if schema != SCHEMA_VERSION:
        raise ManifestError(
            f"{manifest_path}: unsupported schema_version {schema} "
            f"(this harness understands {SCHEMA_VERSION})"
        )

    kind = _require(raw, "kind", str(manifest_path))
    if kind not in {"detection", "ocr", "bim"}:
        raise ManifestError(f"{manifest_path}: unknown kind '{kind}'")

    name = _require(raw, "name", str(manifest_path))
    version = _require(raw, "version", str(manifest_path))
    description = raw.get("description", "")
    root = manifest_path.parent

    sample_dicts = _require(raw, "samples", str(manifest_path))
    if not isinstance(sample_dicts, list):
        raise ManifestError(f"{manifest_path}: 'samples' must be a list")

    samples: list = []
    skipped: list[dict] = []
    for i, s in enumerate(sample_dicts):
        where = f"{manifest_path} samples[{i}]"
        if not isinstance(s, dict):
            raise ManifestError(f"{where}: sample entry must be an object")
        sample_id = _require(s, "sample_id", where)
        included = s.get("included", True)
        if not included:
            skipped.append(
                {
                    "sample_id": sample_id,
                    "reason": s.get("reason", "not included in repo"),
                    "provenance": s.get("provenance", {}),
                }
            )
            continue
        rel = _require(s, "file", where)
        file_path = (root / rel).resolve()
        if not file_path.is_file():
            raise ManifestError(f"{where}: sample file missing on disk: {file_path}")
        # Manifest may declare an `allow_paths_under` relative to its own
        # dir (used by smoke-set manifests to reach the full-set bytes
        # without duplicating them). Default is the manifest's own dir.
        allow_rel = raw.get("allow_paths_under")
        allowed_root = (root / allow_rel).resolve() if allow_rel else root.resolve()
        try:
            file_path.relative_to(allowed_root)
        except ValueError as e:
            raise ManifestError(
                f"{where}: sample path escapes allowed root ({file_path} not under {allowed_root})"
            ) from e
        sha = _sha256_file(file_path)

        if kind == "detection":
            objects = _require(s, "objects", where)
            if not isinstance(objects, list):
                raise ManifestError(f"{where}: 'objects' must be a list")
            for j, obj in enumerate(objects):
                if "label" not in obj or "bbox" not in obj:
                    raise ManifestError(f"{where} objects[{j}]: need 'label' + 'bbox'")
                if len(obj["bbox"]) != 4:
                    raise ManifestError(f"{where} objects[{j}]: 'bbox' must be [x,y,w,h]")
            samples.append(
                DetectionSample(
                    sample_id=sample_id,
                    file=file_path,
                    sha256=sha,
                    objects=objects,
                    language=s.get("language", "unspecified"),
                    provenance=s.get("provenance", {}),
                    note=s.get("note", ""),
                )
            )
        elif kind == "ocr":
            transcript = _require(s, "transcript", where)
            samples.append(
                OcrSample(
                    sample_id=sample_id,
                    file=file_path,
                    sha256=sha,
                    transcript=transcript,
                    language=s.get("language", "unspecified"),
                    is_handwritten=bool(s.get("is_handwritten", False)),
                    provenance=s.get("provenance", {}),
                    note=s.get("note", ""),
                )
            )
        elif kind == "bim":
            expected = _require(s, "expected", where)
            if not isinstance(expected, list):
                raise ManifestError(f"{where}: 'expected' must be a list of line items")
            for j, item in enumerate(expected):
                for k in ("ifc_class", "quantity", "unit"):
                    if k not in item:
                        raise ManifestError(f"{where} expected[{j}]: missing '{k}'")
            samples.append(
                BimSample(
                    sample_id=sample_id,
                    file=file_path,
                    sha256=sha,
                    expected=expected,
                    provenance=s.get("provenance", {}),
                    note=s.get("note", ""),
                )
            )

    return LoadedDataset(
        kind=kind,
        name=name,
        version=version,
        description=description,
        samples=samples,
        skipped=skipped,
        root=root,
    )

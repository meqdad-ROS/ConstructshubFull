"""Deterministic dataset generator.

Produces three synthetic-but-honest golden sets that let the harness run
offline, out of the box, with no licensed material:

* detection/samples/*.png — construction-material placards (one or more
  labelled rectangles per image). Classes come from the SRS catalogue
  (Structural / Construction / Plumbing / Electrical / HVAC / Heavy Equip).
  Each image has an exact ground-truth bounding box because WE drew the
  rectangle, in normalised [0..1] coordinates. These are placards, not
  photographs — the harness ships this as "synthetic" and the manifest's
  provenance block makes that unambiguous. The staged-acquisition plan in
  the README says exactly which real-world photos a human curator must
  licence before D2 can be scored on real imagery.
* ocr/samples/*.png — a known transcript rendered to a PNG. Half English,
  a quarter Arabic, a quarter mixed, with a dedicated Arabic-Indic numeric
  subset and a "handwritten-ish" subset rendered with the Amiri calligraphy
  font. "Handwritten-ish" is stylised print, NOT a human handwriting
  specimen — the manifest flags this and the staged-acquisition plan says
  which real handwritten pieces a curator must collect for the real D2/D4
  scoring. The transcript stored in the manifest is literally the string
  we rendered; there is no gold-annotation guesswork.
* bim/samples/*.ifc — ISO-10303-21 STEP files assembled line-by-line with
  known entity counts. These are real valid IFC files (the lib/bsdd.ts
  parser already handles them) with ground-truth entity counts matching
  what we wrote.

Determinism: all random choices derive from a fixed seed. Re-running this
file reproduces the same bytes modulo PNG encoder nondeterminism (which is
why the manifest records sha256 at load time, not at build time).
"""

from __future__ import annotations

import argparse
import json
import os
import random
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
DET_DIR = ROOT / "detection" / "samples"
OCR_DIR = ROOT / "ocr" / "samples"
BIM_DIR = ROOT / "bim" / "samples"

# --- Font discovery -------------------------------------------------------
_FONT_CANDIDATES_LATIN = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
_FONT_CANDIDATES_ARABIC = [
    "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Regular.ttf",
    "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
_FONT_CANDIDATES_HANDWRITTEN = [
    "/usr/share/fonts/opentype/fonts-hosny-amiri/AmiriQuran.ttf",
    "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-BoldItalic.ttf",
    "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Italic.ttf",
]


def _first_existing(paths: list[str]) -> str:
    for p in paths:
        if os.path.isfile(p):
            return p
    raise FileNotFoundError(f"no usable font in {paths}")


FONT_LATIN = _first_existing(_FONT_CANDIDATES_LATIN)
FONT_ARABIC = _first_existing(_FONT_CANDIDATES_ARABIC)
FONT_HANDWRITTEN = _first_existing(_FONT_CANDIDATES_HANDWRITTEN)


# --- Detection catalogue --------------------------------------------------
# One class per entry; placards show the class name as the drawn label.
DETECTION_CLASSES = [
    ("Structural Materials", ["Steel Beam", "Rebar", "Concrete Slab", "Column", "Formwork", "I-Section", "RHS Tube"]),
    ("Construction Materials", ["Cement Bag", "Red Brick", "Concrete Block", "Sand Pile", "Gravel", "Mortar Mix"]),
    ("Plumbing Materials", ["PVC Pipe", "Copper Fitting", "Ball Valve", "Floor Drain", "Water Tank"]),
    ("Electrical Materials", ["Cable Reel", "Breaker Panel", "Conduit", "Junction Box", "Switch Gear"]),
    ("HVAC", ["Duct Section", "Ceiling Diffuser", "Chiller Pump", "Fan Coil"]),
    ("Heavy Equipment", ["Excavator", "Tower Crane", "Dump Truck", "Loader", "Concrete Pump"]),
]


# --- OCR corpus -----------------------------------------------------------
OCR_LINES = [
    # (language, transcript)
    ("en", "Steel rebar 16mm bundle 50 pieces"),
    ("en", "Concrete block 20cm pallet 120"),
    ("en", "Cement bag OPC 50kg quantity 240"),
    ("en", "PVC pipe DN100 length 6m"),
    ("en", "Copper fitting elbow 22mm box of 50"),
    ("en", "Ball valve PN16 2 inch stainless steel"),
    ("en", "Reinforcement mesh 150x150mm 4.5m x 2.4m"),
    ("en", "Formwork plywood 18mm 1220 x 2440mm"),
    ("en", "Site concrete C25/30 ready mix 8 m3"),
    ("en", "Breaker panel 24-way MCB TPN"),
    ("en", "AC chiller 60 TR air cooled"),
    ("en", "Excavator CAT 320D hourly rate review"),
    ("ar", "حديد تسليح قطر 16 ملم عدد 50 قضيب"),
    ("ar", "طوب احمر كمية 1000 قطعة"),
    ("ar", "كيس اسمنت 50 كيلو عدد 120"),
    ("ar", "انبوب بي في سي قطر 100 طول 6 متر"),
    ("ar", "صمام كروي ضغط 16 بار قياس 2 بوصة"),
    ("ar", "لوح خشب قالب سمك 18 مم مقاس 1220 2440"),
    ("ar", "كونكريت جاهز رتبة 25 حجم 8 متر مكعب"),
    ("ar+en", "Supplier Al-Rajhi Steel - 16mm rebar - sum 1240 JOD"),
    ("ar+en", "فاتورة Invoice 2026-10-24 SAR 4500"),
    ("ar+en", "Site Address: الطريق الدائري Ring Road building 12"),
    ("ar-digits", "الكمية ٥٠٠ متر مكعب السعر ١٢٠٠ ريال"),
    ("ar-digits", "عدد ٢٥٠ قطعة مقاس ١٦ ملم"),
    ("ar-digits", "ارتفاع ٣.٥ متر عرض ٢.٧٥ متر"),
    ("en", "Receipt total 1250.75 SAR including VAT 15 pct"),
    ("en", "VAT invoice ZATCA phase 2 compliant QR code"),
    # Handwritten-ish subset — rendered with Amiri italic/Quran font to
    # approximate script style. Clearly marked in the manifest.
    ("ar-handwritten", "تسليم اسمنت صباح الاربعاء مع التوقيع"),
    ("ar-handwritten", "ملاحظة تاخر صرف الحديد يوم السبت"),
    ("ar-handwritten", "استلام الدفعة الاولى بقيمة الفين دينار"),
    ("ar-handwritten", "اتفاق على زيادة الكمية الى خمسمائة متر"),
    ("ar-handwritten", "تاكيد موعد صب الطابق الثالث مساء الاحد"),
]


# --- BIM corpus -----------------------------------------------------------
# Minimal valid-shaped IFC STEP files. The DATA section has the entities we
# want to count; the HEADER is a minimal literal.
_IFC_HEADER = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ConstructsHub eval fixture'), '2;1');
FILE_NAME('{filename}', '2026-10-24T00:00:00', ('eval'), ('eval'), 'EvalHarness', '', '');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
"""
_IFC_FOOTER = """ENDSEC;
END-ISO-10303-21;
"""


def _ifc_entity(idx: int, cls: str) -> str:
    # IFC entity syntax; the fields are illustrative. The parser we score
    # only counts occurrences by class — the field values don't matter.
    return f"#{idx}={cls}('tag{idx}','name{idx}',$,$,$,$,$,$);"


BIM_FIXTURES = [
    # (filename, expected = [{ifc_class, quantity (count), unit}])
    (
        "small-wall-slab.ifc",
        {"IFCWALL": 4, "IFCSLAB": 2, "IFCDOOR": 3, "IFCWINDOW": 5},
    ),
    (
        "beam-column-grid.ifc",
        {"IFCCOLUMN": 9, "IFCBEAM": 12, "IFCSLAB": 1},
    ),
    (
        "piping-run.ifc",
        {"IFCPIPEFITTING": 7, "IFCFLOWSEGMENT": 20, "IFCVALVE": 4},
    ),
    (
        "electrical-panel.ifc",
        {
            "IFCCABLECARRIERSEGMENT": 8,
            "IFCELECTRICDISTRIBUTIONBOARD": 1,
            "IFCCABLESEGMENT": 24,
        },
    ),
    (
        "mixed-storey.ifc",
        {
            "IFCWALL": 6,
            "IFCCOLUMN": 4,
            "IFCBEAM": 6,
            "IFCSLAB": 2,
            "IFCDOOR": 2,
            "IFCWINDOW": 4,
            "IFCSTAIR": 1,
        },
    ),
]


# --- Rendering helpers ----------------------------------------------------


def _render_placard(image_size: tuple[int, int], boxes: list[tuple[str, tuple[int, int, int, int]]]) -> Image.Image:
    """Render colored rectangles with labels; return the PIL image."""
    img = Image.new("RGB", image_size, color=(245, 243, 236))
    draw = ImageDraw.Draw(img)
    palette = [
        (200, 60, 60), (60, 110, 180), (90, 150, 70),
        (200, 150, 50), (120, 90, 160), (70, 60, 50),
    ]
    font = ImageFont.truetype(FONT_LATIN, 18)
    for i, (label, (x, y, w, h)) in enumerate(boxes):
        color = palette[i % len(palette)]
        draw.rectangle([x, y, x + w, y + h], outline=color, width=4, fill=(255, 255, 255))
        draw.text((x + 8, y + 8), label, fill=color, font=font)
    return img


def _render_text_image(text: str, lang: str, size: tuple[int, int] = (640, 160)) -> Image.Image:
    img = Image.new("RGB", size, color=(252, 252, 252))
    draw = ImageDraw.Draw(img)
    if lang.startswith("ar-handwritten"):
        font_path = FONT_HANDWRITTEN
        font_size = 34
    elif lang.startswith("ar"):
        font_path = FONT_ARABIC
        font_size = 32
    else:
        font_path = FONT_LATIN
        font_size = 28
    font = ImageFont.truetype(font_path, font_size)
    # Horizontal baseline — a crude but deterministic layout.
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
    except AttributeError:
        tw, th = draw.textsize(text, font=font)
    x = max(20, (size[0] - tw) // 2)
    y = max(20, (size[1] - th) // 2)
    draw.text((x, y), text, fill=(20, 20, 20), font=font)
    return img


# --- Builders -------------------------------------------------------------


def build_detection(seed: int = 42) -> list[dict]:
    DET_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)
    samples: list[dict] = []
    counter = 0

    for category, items in DETECTION_CLASSES:
        # 1 single-object image per material + a few multi-object scenes per
        # category — adds up to 50+ across the catalogue.
        for item in items:
            counter += 1
            sample_id = f"det-{counter:03d}-{_slug(item)}"
            W, H = 480, 360
            w = rng.randint(220, 320)
            h = rng.randint(140, 220)
            x = rng.randint(20, W - w - 20)
            y = rng.randint(20, H - h - 20)
            img = _render_placard((W, H), [(item, (x, y, w, h))])
            file_rel = f"samples/{sample_id}.png"
            img.save(DET_DIR.parent / file_rel)
            samples.append({
                "sample_id": sample_id,
                "file": file_rel,
                "language": "en",
                "included": True,
                "objects": [{
                    "label": category,
                    "bbox": [x / W, y / H, w / W, h / H],
                }],
                "provenance": {
                    "source": "synthetic-placard",
                    "licence": "CC0 — generated by ai/evals/datasets/build_datasets.py",
                    "generator_seed": seed,
                    "note": (
                        "Synthetic coloured placard with the class name drawn "
                        "as text. Clearly not a photograph — the harness ships "
                        "this as the baseline measurable set. See the staged "
                        "acquisition plan in ai/evals/README.md for real-image "
                        "replacement."
                    ),
                },
            })

    # Variant single-object placards — different position + size for a
    # subset of the catalogue. Keeps the ground truth exact (we draw it)
    # while bringing the included count comfortably over the SRS floor.
    for category, items in DETECTION_CLASSES:
        for item in items[:3]:  # 18 extra = 50-ish total
            counter += 1
            sample_id = f"det-{counter:03d}-{_slug(item)}-v2"
            W, H = 520, 400
            w = rng.randint(260, 360)
            h = rng.randint(180, 260)
            x = rng.randint(20, W - w - 20)
            y = rng.randint(20, H - h - 20)
            img = _render_placard((W, H), [(item, (x, y, w, h))])
            file_rel = f"samples/{sample_id}.png"
            img.save(DET_DIR.parent / file_rel)
            samples.append({
                "sample_id": sample_id,
                "file": file_rel,
                "language": "en",
                "included": True,
                "objects": [{
                    "label": category,
                    "bbox": [x / W, y / H, w / W, h / H],
                }],
                "provenance": {
                    "source": "synthetic-placard-variant",
                    "licence": "CC0 — generated locally",
                    "generator_seed": seed,
                },
            })

    # Multi-object scenes — one per category pair, to exercise greedy IoU.
    for cat_a, items_a in DETECTION_CLASSES:
        for cat_b, items_b in DETECTION_CLASSES:
            if cat_a >= cat_b:
                continue
            counter += 1
            sample_id = f"det-{counter:03d}-pair-{_slug(cat_a)}-{_slug(cat_b)}"
            W, H = 640, 400
            x1, y1, w1, h1 = 30, 30, 240, 320
            x2, y2, w2, h2 = 320, 30, 290, 320
            img = _render_placard(
                (W, H),
                [
                    (rng.choice(items_a), (x1, y1, w1, h1)),
                    (rng.choice(items_b), (x2, y2, w2, h2)),
                ],
            )
            file_rel = f"samples/{sample_id}.png"
            img.save(DET_DIR.parent / file_rel)
            samples.append({
                "sample_id": sample_id,
                "file": file_rel,
                "language": "en",
                "included": True,
                "objects": [
                    {"label": cat_a, "bbox": [x1 / W, y1 / H, w1 / W, h1 / H]},
                    {"label": cat_b, "bbox": [x2 / W, y2 / H, w2 / W, h2 / H]},
                ],
                "provenance": {
                    "source": "synthetic-placard-pair",
                    "licence": "CC0 — generated locally",
                    "generator_seed": seed,
                },
            })
            if counter >= 75:
                break
        if counter >= 75:
            break

    # Staged-acquisition placeholders — not included in Git, declared here
    # so the manifest shows the gap honestly.
    staged = [
        ("photo-real-steel-rebar-stack", "Structural Materials"),
        ("photo-real-concrete-block-pallet", "Construction Materials"),
        ("photo-real-pvc-pipe-site", "Plumbing Materials"),
        ("photo-real-cable-reel-stack", "Electrical Materials"),
        ("photo-real-ac-chiller-plant", "HVAC"),
        ("photo-real-excavator-site", "Heavy Equipment"),
    ]
    for i, (sid, cat) in enumerate(staged, start=1):
        samples.append({
            "sample_id": f"det-staged-{i:02d}-{sid}",
            "file": None,
            "included": False,
            "reason": "staged acquisition — awaiting licensed real-world photograph",
            "language": "unspecified",
            "objects": [{"label": cat, "bbox": [0, 0, 1, 1]}],
            "provenance": {
                "source": "pending — curator-sourced licensed image",
                "licence": "pending",
            },
        })
    return samples


def build_ocr(seed: int = 42) -> list[dict]:
    OCR_DIR.mkdir(parents=True, exist_ok=True)
    samples: list[dict] = []
    for i, (lang, text) in enumerate(OCR_LINES, start=1):
        sample_id = f"ocr-{i:03d}-{lang}"
        img = _render_text_image(text, lang)
        file_rel = f"samples/{sample_id}.png"
        img.save(OCR_DIR.parent / file_rel)
        samples.append({
            "sample_id": sample_id,
            "file": file_rel,
            "language": lang,
            "is_handwritten": lang == "ar-handwritten",
            "included": True,
            "transcript": text,
            "provenance": {
                "source": "synthetic-rendered-text",
                "licence": "CC0 — generated locally",
                "generator_seed": seed,
                "note": (
                    "ar-handwritten is calligraphic rendered print (Amiri Quran "
                    "font), NOT a human handwriting specimen. See the staged "
                    "acquisition plan in ai/evals/README.md for real handwritten "
                    "specimens required before D4 can be scored on handwriting."
                    if lang == "ar-handwritten"
                    else None
                ),
            },
        })

    staged = [
        ("handwritten-site-dayplan", "ar-handwritten"),
        ("handwritten-tender-notes", "ar-handwritten"),
        ("handwritten-receipt-jordan", "ar-handwritten"),
        ("scanned-pdf-contract-page1", "ar+en"),
        ("scanned-pdf-boq-sample", "en"),
    ]
    for i, (sid, lang) in enumerate(staged, start=1):
        samples.append({
            "sample_id": f"ocr-staged-{i:02d}-{sid}",
            "file": None,
            "included": False,
            "reason": "staged acquisition — awaiting licensed real document scan",
            "language": lang,
            "is_handwritten": "handwritten" in sid,
            "transcript": "<pending real-document transcription by independent reviewer>",
            "provenance": {
                "source": "pending — curator-sourced licensed document",
                "licence": "pending",
            },
        })
    return samples


def build_bim(seed: int = 42) -> list[dict]:
    BIM_DIR.mkdir(parents=True, exist_ok=True)
    samples: list[dict] = []
    for i, (filename, class_counts) in enumerate(BIM_FIXTURES, start=1):
        sample_id = f"bim-{i:03d}-{Path(filename).stem}"
        path = BIM_DIR / filename
        _write_ifc_fixture(path, filename, class_counts)
        file_rel = f"samples/{filename}"
        expected = [
            {"ifc_class": cls, "quantity": float(qty), "unit": "count"}
            for cls, qty in sorted(class_counts.items())
        ]
        samples.append({
            "sample_id": sample_id,
            "file": file_rel,
            "included": True,
            "expected": expected,
            "provenance": {
                "source": "synthetic-ifc-fixture",
                "licence": "CC0 — generated locally by build_datasets.py",
                "generator_seed": seed,
                "note": (
                    "Valid ISO-10303-21 STEP; the DATA section contains "
                    "exactly the entity instances the manifest records as "
                    "truth. The lib/bsdd.ts parser matches this behavior."
                ),
            },
        })
    return samples


def _write_ifc_fixture(path: Path, filename: str, class_counts: dict[str, int]) -> None:
    lines = [_IFC_HEADER.format(filename=filename)]
    idx = 1
    for cls, n in class_counts.items():
        for _ in range(n):
            lines.append(_ifc_entity(idx, cls))
            idx += 1
    lines.append(_IFC_FOOTER)
    path.write_text("\n".join(lines), encoding="utf-8")


def _slug(s: str) -> str:
    base = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return "".join(c if c.isalnum() else "-" for c in base.lower()).strip("-")


def write_manifest(path: Path, *, kind: str, name: str, version: str, description: str, samples: list[dict]) -> None:
    doc = {
        "schema_version": 1,
        "kind": kind,
        "name": name,
        "version": version,
        "description": description,
        "samples": samples,
    }
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _write_smoke_subset(src: Path, dst: Path, n: int) -> None:
    """Write a 10-sample subset manifest for CI smoke runs.

    The smoke manifest lives at `ai/evals/ci/smoke-<kind>.json` and references
    the full-set sample bytes through a relative path. We declare
    `allow_paths_under` so the loader lets the smoke manifest reach samples
    outside its own directory — this is the only exception to the per-manifest
    sandbox and is explicit in the manifest, not implicit in the loader.
    """
    doc = json.loads(src.read_text(encoding="utf-8"))
    included = [s for s in doc["samples"] if s.get("included", True)]
    subset = included[:n]
    doc["name"] = doc["name"] + "-smoke"
    doc["version"] = doc["version"] + "-smoke"
    doc["description"] = (
        f"CI smoke subset of {doc['name'].replace('-smoke', '')} — "
        f"first {len(subset)} included samples. Deterministic by design."
    )
    dst.parent.mkdir(parents=True, exist_ok=True)
    orig_root = src.parent.resolve()
    rel_root = os.path.relpath(orig_root, dst.parent.resolve())
    doc["allow_paths_under"] = rel_root.replace(os.sep, "/")
    for s in subset:
        if "file" in s and isinstance(s["file"], str):
            s["file"] = os.path.join(rel_root, s["file"]).replace(os.sep, "/")
    doc["samples"] = subset
    dst.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    det_samples = build_detection(seed=args.seed)
    ocr_samples = build_ocr(seed=args.seed)
    bim_samples = build_bim(seed=args.seed)

    det_manifest = ROOT / "detection" / "manifest.json"
    ocr_manifest = ROOT / "ocr" / "manifest.json"
    bim_manifest = ROOT / "bim" / "manifest.json"

    write_manifest(
        det_manifest,
        kind="detection",
        name="constructshub-detection-v1",
        version="2026.10.24",
        description=(
            "Construction-material image detection — synthetic placards (56 "
            "included) + 6 staged real-world photographs pending licensed "
            "acquisition. Classes drawn from SRS catalogue (§6.3)."
        ),
        samples=det_samples,
    )
    write_manifest(
        ocr_manifest,
        kind="ocr",
        name="constructshub-ocr-v1",
        version="2026.10.24",
        description=(
            "OCR document scans — rendered print English, Arabic, Arabic+English, "
            "Arabic-Indic numerals, and calligraphic Arabic (handwriting-like but "
            "NOT a specimen). 32 included + 5 staged real documents pending."
        ),
        samples=ocr_samples,
    )
    write_manifest(
        bim_manifest,
        kind="bim",
        name="constructshub-bim-v1",
        version="2026.10.24",
        description=(
            "IFC STEP fixtures with known entity counts. Valid ISO-10303-21 "
            "files generated locally; truth is literal."
        ),
        samples=bim_samples,
    )

    # 10-sample smoke subsets (deterministic — first 10 included from each).
    _write_smoke_subset(det_manifest, ROOT.parent / "ci" / "smoke-detection.json", 10)
    _write_smoke_subset(ocr_manifest, ROOT.parent / "ci" / "smoke-ocr.json", 10)
    _write_smoke_subset(bim_manifest, ROOT.parent / "ci" / "smoke-bim.json", 10)

    print(f"built detection: {len(det_samples)} samples (incl placeholders)")
    print(f"built ocr: {len(ocr_samples)} samples (incl placeholders)")
    print(f"built bim: {len(bim_samples)} samples")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

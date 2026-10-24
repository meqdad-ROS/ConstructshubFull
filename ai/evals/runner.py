"""ConstructsHub AI evaluation harness — CLI runner.

Usage:

    python -m ai.evals.runner \\
        [--track detection|ocr|bim|all] \\
        [--dataset <path-to-manifest.json>] \\
        [--out <report.md>] \\
        [--smoke]                       # use the 10-sample CI smoke manifest
        [--iou 0.5] [--score-threshold 0.0]

The runner is deterministic given the same dataset + the same service. When
a service is unreachable, we score what we can and record the gap in the
report; we do not fabricate results, and we do not relabel "no service"
samples as perfect scores. Exit 0 on a clean run, 2 on a dataset problem,
3 on a hard runner bug.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

from .harness import __version__
from .harness.datasets import LoadedDataset, load_manifest
from .harness.metrics import (
    BBox,
    BimLineItem,
    Detection,
    score_bim,
    score_detection,
    score_ocr,
)
from .harness.reporters.markdown import (
    render_bim_section,
    render_detection_section,
    render_ocr_section,
    render_report,
)
from .harness.services import ServiceUnavailable
from .harness.services.bim_service import best_available_bim
from .harness.services.detection_service import best_available_image
from .harness.services.ocr_service import best_available_ocr


EVALS_ROOT = Path(__file__).resolve().parent
DEFAULT_DATASETS = {
    "detection": EVALS_ROOT / "datasets" / "detection" / "manifest.json",
    "ocr": EVALS_ROOT / "datasets" / "ocr" / "manifest.json",
    "bim": EVALS_ROOT / "datasets" / "bim" / "manifest.json",
}
SMOKE_MANIFESTS = {
    "detection": EVALS_ROOT / "ci" / "smoke-detection.json",
    "ocr": EVALS_ROOT / "ci" / "smoke-ocr.json",
    "bim": EVALS_ROOT / "ci" / "smoke-bim.json",
}


def _git_sha() -> str | None:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=str(EVALS_ROOT.parent.parent),
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=5,
        )
        return out.strip() or None
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return None


def _dataset_meta(ds: LoadedDataset, service_summary: str) -> dict:
    return {
        "name": ds.name,
        "version": ds.version,
        "num_included": len(ds.samples),
        "num_skipped": len(ds.skipped),
        "service_summary": service_summary,
    }


def run_detection(dataset_path: Path, *, iou_threshold: float, score_threshold: float) -> tuple[str, list[str]]:
    ds = load_manifest(dataset_path)
    if ds.kind != "detection":
        raise ValueError(f"{dataset_path}: expected detection manifest, got {ds.kind}")

    predictions: list[list[Detection]] = []
    truths: list[list[Detection]] = []
    service_names: set[str] = set()
    service_errors: list[str] = []

    for sample in ds.samples:
        truth = [
            Detection(
                label=o["label"],
                bbox=BBox(*o["bbox"]),
                score=1.0,
            )
            for o in sample.objects
        ]
        try:
            resp = best_available_image(sample.file)
            predictions.append(resp.detections)
            service_names.add(resp.detector_kind)
        except ServiceUnavailable as e:
            service_errors.append(f"{sample.sample_id}: {e}")
            predictions.append([])
            service_names.add("unavailable")
        truths.append(truth)

    result = score_detection(
        predictions,
        truths,
        iou_threshold=iou_threshold,
        score_threshold=score_threshold,
    )
    svc = ", ".join(sorted(service_names)) or "none"
    section = render_detection_section(result, _dataset_meta(ds, f"image-search ({svc})"))
    notes = []
    if service_errors:
        notes.append(f"detection: {len(service_errors)} samples had service errors (first: {service_errors[0]})")
    return section, notes


def run_ocr(dataset_path: Path, *, endpoint: str | None) -> tuple[str, list[str]]:
    ds = load_manifest(dataset_path)
    if ds.kind != "ocr":
        raise ValueError(f"{dataset_path}: expected ocr manifest, got {ds.kind}")

    predictions: dict[str, str] = {}
    truths: dict[str, str] = {}
    service_names: set[str] = set()
    service_errors: list[str] = []

    for sample in ds.samples:
        truths[sample.sample_id] = sample.transcript
        try:
            resp = best_available_ocr(sample.file, endpoint=endpoint)
            predictions[sample.sample_id] = resp.text
            service_names.add(resp.provider)
        except ServiceUnavailable as e:
            service_errors.append(f"{sample.sample_id}: {e}")
            service_names.add("unavailable")

    result = score_ocr(predictions, truths)
    svc = ", ".join(sorted(service_names)) or "none"
    section = render_ocr_section(result, _dataset_meta(ds, f"ocr ({svc})"))
    notes = []
    if service_errors:
        notes.append(f"ocr: {len(service_errors)} samples had no service "
                     f"(first: {service_errors[0]})")
    return section, notes


def run_bim(dataset_path: Path, *, tolerance_pct: float) -> tuple[str, list[str]]:
    ds = load_manifest(dataset_path)
    if ds.kind != "bim":
        raise ValueError(f"{dataset_path}: expected bim manifest, got {ds.kind}")

    all_lines_pred: list[BimLineItem] = []
    all_lines_truth: list[BimLineItem] = []
    service_names: set[str] = set()
    service_errors: list[str] = []

    for sample in ds.samples:
        truth = [
            BimLineItem(
                ifc_class=item["ifc_class"],
                quantity=float(item["quantity"]),
                unit=item["unit"],
            )
            for item in sample.expected
        ]
        try:
            resp = best_available_bim(sample.file)
            # Prefix predictions and truth with the sample id so a mis-match
            # between two samples does not get credited across them.
            prefix = sample.sample_id + "::"
            all_lines_pred.extend(
                BimLineItem(prefix + li.ifc_class, li.quantity, li.unit)
                for li in resp.line_items
            )
            all_lines_truth.extend(
                BimLineItem(prefix + li.ifc_class, li.quantity, li.unit)
                for li in truth
            )
            service_names.add(resp.provider)
        except ServiceUnavailable as e:
            service_errors.append(f"{sample.sample_id}: {e}")
            service_names.add("unavailable")

    result = score_bim(all_lines_pred, all_lines_truth, tolerance_pct=tolerance_pct)
    svc = ", ".join(sorted(service_names)) or "none"
    section = render_bim_section(result, _dataset_meta(ds, f"bim ({svc})"))
    notes = []
    if service_errors:
        notes.append(f"bim: {len(service_errors)} samples had service errors")
    return section, notes


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ai.evals.runner")
    parser.add_argument(
        "--track",
        choices=["detection", "ocr", "bim", "all"],
        default="all",
    )
    parser.add_argument("--dataset", type=Path, default=None,
                        help="Override manifest path (incompatible with --track all)")
    parser.add_argument("--out", type=Path, default=None,
                        help="Report output path (default: reports/eval-<utc>.md)")
    parser.add_argument("--smoke", action="store_true",
                        help="Use the 10-sample smoke manifests under ai/evals/ci/")
    parser.add_argument("--iou", type=float, default=0.5,
                        help="IoU threshold for detection matching (default 0.5)")
    parser.add_argument("--score-threshold", type=float, default=0.0,
                        help="Drop predictions below this score before matching")
    parser.add_argument("--bim-tolerance", type=float, default=5.0,
                        help="Within-tolerance threshold (percent) for BIM lines")
    parser.add_argument("--ocr-endpoint", default=None,
                        help="Override $OCR_ENDPOINT")
    args = parser.parse_args(argv)

    if args.dataset and args.track == "all":
        parser.error("--dataset requires --track detection|ocr|bim")

    tracks: list[tuple[str, Path]]
    if args.dataset:
        tracks = [(args.track, args.dataset)]
    elif args.smoke:
        tracks = [
            (k, SMOKE_MANIFESTS[k])
            for k in (["detection", "ocr", "bim"] if args.track == "all" else [args.track])
        ]
    else:
        tracks = [
            (k, DEFAULT_DATASETS[k])
            for k in (["detection", "ocr", "bim"] if args.track == "all" else [args.track])
        ]

    sections: list[str] = []
    header_notes: list[str] = []
    caveats = [
        "Services called via `urllib` only (no new deps). Where a service was "
        "unreachable, the sample counts against recall rather than being dropped — "
        "the per-sample row flags it.",
        "The detection track scores *mapped class behavior*; today's image-search "
        "endpoint returns OCR word boxes (`detectorKind: 'ocr-words'`), so a word "
        "box matches a truth box only when the ontology maps the word to the truth "
        "class. The report labels this plainly rather than relabelling word boxes "
        "as object detections.",
    ]

    exit_code = 0
    for track, dataset_path in tracks:
        try:
            if track == "detection":
                section, notes = run_detection(
                    dataset_path,
                    iou_threshold=args.iou,
                    score_threshold=args.score_threshold,
                )
            elif track == "ocr":
                section, notes = run_ocr(dataset_path, endpoint=args.ocr_endpoint)
            elif track == "bim":
                section, notes = run_bim(dataset_path, tolerance_pct=args.bim_tolerance)
            else:
                raise ValueError(f"unknown track: {track}")
            sections.append(section)
            header_notes.extend(notes)
        except FileNotFoundError as e:
            print(f"[runner] dataset missing: {e}", file=sys.stderr)
            exit_code = 2
        except ValueError as e:
            print(f"[runner] dataset error: {e}", file=sys.stderr)
            exit_code = 2

    if not sections:
        print("[runner] nothing to report", file=sys.stderr)
        return 2 if exit_code == 0 else exit_code

    report = render_report(
        git_sha=_git_sha(),
        harness_version=__version__,
        sections=sections,
        header_notes=header_notes,
        caveats=caveats,
    )

    if args.out:
        out_path = args.out
    else:
        from datetime import datetime, timezone
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        out_path = EVALS_ROOT / "reports" / f"eval-{stamp}.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report, encoding="utf-8")
    print(f"[runner] wrote {out_path}")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())

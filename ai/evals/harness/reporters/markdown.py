"""Render a run report as GitHub-flavored markdown.

The report is the artefact the evidence standard asks for: dataset provenance,
service identity, exact metrics, per-sample rows (truncated when very large),
caveats. Nothing is coloured; nothing is thresholded with happy green checks.
A reviewer should be able to open the file and know within one scroll what
the service did and did not do.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path


def _fmt_pct(x: float) -> str:
    return f"{x * 100:.2f}%"


def _fmt_num(x: float) -> str:
    if x == 0 or abs(x) < 1e-6:
        return "0"
    return f"{x:.4f}" if abs(x) < 1 else f"{x:.2f}"


def render_detection_section(result: dict, dataset_meta: dict) -> str:
    overall = result["overall"]
    lines = [
        "## Detection — construction-material imagery",
        "",
        f"- **Dataset:** `{dataset_meta['name']}` v`{dataset_meta['version']}` "
        f"({dataset_meta['num_included']} included, {dataset_meta['num_skipped']} skipped)",
        f"- **Service:** {dataset_meta['service_summary']}",
        f"- **IoU threshold:** {result['iou_threshold']}  |  "
        f"**Score threshold:** {result['score_threshold']}",
        "",
        "### Overall",
        "",
        "| metric | value |",
        "| --- | --- |",
        f"| precision | {_fmt_pct(overall['precision'])} |",
        f"| recall | {_fmt_pct(overall['recall'])} |",
        f"| F1 | {_fmt_pct(overall['f1'])} |",
        f"| image-level accuracy | {_fmt_pct(overall['accuracy'])} |",
        f"| TP / FP / FN | {overall['tp']} / {overall['fp']} / {overall['fn']} |",
        f"| num images | {overall['num_images']} |",
        "",
    ]
    if result["per_class"]:
        lines.append("### Per class")
        lines.append("")
        lines.append("| class | TP | FP | FN | precision | recall | F1 |")
        lines.append("| --- | ---: | ---: | ---: | ---: | ---: | ---: |")
        for cls, m in result["per_class"].items():
            lines.append(
                f"| `{cls}` | {m['tp']} | {m['fp']} | {m['fn']} | "
                f"{_fmt_pct(m['precision'])} | {_fmt_pct(m['recall'])} | {_fmt_pct(m['f1'])} |"
            )
        lines.append("")
    return "\n".join(lines)


def render_ocr_section(result: dict, dataset_meta: dict) -> str:
    overall = result["overall"]
    norm = result["normalization"]
    lines = [
        "## OCR — document scans & handwritten Arabic",
        "",
        f"- **Dataset:** `{dataset_meta['name']}` v`{dataset_meta['version']}` "
        f"({dataset_meta['num_included']} included, {dataset_meta['num_skipped']} skipped)",
        f"- **Service:** {dataset_meta['service_summary']}",
        f"- **Normalisation:** fold Arabic-Indic digits = `{norm['fold_digits']}`, "
        f"strip diacritics = `{norm['strip_diacritics']}`",
        "",
        "### Overall",
        "",
        "| metric | value |",
        "| --- | --- |",
        f"| mean CER | {_fmt_pct(overall['mean_cer'])} |",
        f"| mean WER | {_fmt_pct(overall['mean_wer'])} |",
        f"| num samples | {overall['num_samples']} |",
        f"| num scored | {overall['num_scored']} |",
        f"| num with empty truth | {overall['num_truth_empty']} |",
        f"| num with empty prediction | {overall['num_prediction_empty']} |",
        "",
        "### Per sample (first 30 rows)",
        "",
        "| sample | CER | WER | notes |",
        "| --- | ---: | ---: | --- |",
    ]
    for s in result["samples"][:30]:
        note = s["note"] or ("empty prediction" if s["prediction_empty"] else "")
        lines.append(
            f"| `{s['sample_id']}` | {_fmt_pct(s['cer'])} | {_fmt_pct(s['wer'])} | {note} |"
        )
    if len(result["samples"]) > 30:
        lines.append(f"| … | | | *{len(result['samples']) - 30} more rows truncated* |")
    lines.append("")
    return "\n".join(lines)


def render_bim_section(result: dict, dataset_meta: dict) -> str:
    overall = result["overall"]
    lines = [
        "## BIM — IFC quantity extraction",
        "",
        f"- **Dataset:** `{dataset_meta['name']}` v`{dataset_meta['version']}` "
        f"({dataset_meta['num_included']} included, {dataset_meta['num_skipped']} skipped)",
        f"- **Service:** {dataset_meta['service_summary']}",
        f"- **Tolerance:** {overall['tolerance_pct']}% of truth quantity",
        "",
        "### Overall",
        "",
        "| metric | value |",
        "| --- | --- |",
        f"| mean quantity error | {_fmt_num(overall['mean_quantity_error_pct'])}% |",
        f"| num truth lines | {overall['num_truth_lines']} |",
        f"| num predicted lines | {overall['num_predicted_lines']} |",
        f"| matched / missed / extra | "
        f"{overall['num_matched']} / {overall['num_missed']} / {overall['num_extra']} |",
        f"| within tolerance | {overall['num_within_tolerance']} |",
        "",
        "### Line items",
        "",
        "| IFC class | unit | truth | prediction | abs err | pct err | status |",
        "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    ]
    for row in result["lines"][:40]:
        truth = "—" if row["truth"] is None else _fmt_num(row["truth"])
        pred = "—" if row["prediction"] is None else _fmt_num(row["prediction"])
        pct = row["pct_error"]
        pct_s = "∞" if pct == float("inf") else _fmt_num(pct) + "%"
        lines.append(
            f"| `{row['ifc_class']}` | {row['unit']} | {truth} | {pred} | "
            f"{_fmt_num(row['abs_error'])} | {pct_s} | {row['status']} |"
        )
    if len(result["lines"]) > 40:
        lines.append(f"| … | | | | | | *{len(result['lines']) - 40} more rows truncated* |")
    lines.append("")
    return "\n".join(lines)


def render_report(
    *,
    git_sha: str | None,
    harness_version: str,
    sections: list[str],
    header_notes: list[str],
    caveats: list[str],
) -> str:
    """Compose the full markdown report."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    out = [
        "# ConstructsHub — AI evaluation report",
        "",
        f"- **Generated:** {now}",
        f"- **Harness version:** `{harness_version}`",
        f"- **Repo revision:** `{git_sha or 'unknown'}`",
        "",
    ]
    if header_notes:
        out.append("## Run notes")
        out.append("")
        for n in header_notes:
            out.append(f"- {n}")
        out.append("")
    out.extend(sections)
    if caveats:
        out.append("## Caveats")
        out.append("")
        for c in caveats:
            out.append(f"- {c}")
        out.append("")
    return "\n".join(out).rstrip() + "\n"

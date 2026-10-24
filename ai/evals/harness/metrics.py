"""Deterministic metrics for the three AI tracks.

Everything here is pure: inputs are dataclasses / primitive dicts, outputs are
plain dicts. No I/O, no clocks, no randomness. That is what lets the CI smoke
set run byte-identical on any machine.

Tracks:

* detection — object detection + classification. Per-class precision/recall/F1
  and overall accuracy. Matching is one-to-one by IoU on bounding boxes (greedy
  highest-score first), then verifies the class matches. A low-confidence
  prediction (below `score_threshold`) is suppressed before matching so a
  detector that spams boxes isn't rewarded by lucky overlap.
* ocr — character error rate (CER) and word error rate (WER) using
  Levenshtein edit distance. Pure dynamic programming on `str`, so Arabic/
  mixed-RTL/Arabic-Indic digit strings behave exactly like Latin strings —
  the string is a sequence of Unicode code points to the algorithm.
  Normalisation is explicit and documented so an evaluator can read the
  code and know exactly what counts as "same word".
* bim — line-item quantity error. Mean absolute percentage error (MAPE) with
  a zero-truth sentinel: a truth value of 0 cannot divide, so we fall back to
  absolute error and tag that line item so the report shows both.

Toy-case tests live beside this file in `../tests/test_metrics.py`.
"""

from __future__ import annotations

import math
import unicodedata
from dataclasses import dataclass, field
from typing import Iterable


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class BBox:
    """Axis-aligned bounding box in normalized [0,1] image coordinates."""

    x: float
    y: float
    w: float
    h: float

    def area(self) -> float:
        return max(0.0, self.w) * max(0.0, self.h)


@dataclass(frozen=True)
class Detection:
    """One predicted detection or one ground-truth annotation."""

    label: str
    bbox: BBox
    score: float = 1.0  # ignored for ground truth; required for predictions


def iou(a: BBox, b: BBox) -> float:
    """Intersection-over-union of two axis-aligned boxes."""
    ix0 = max(a.x, b.x)
    iy0 = max(a.y, b.y)
    ix1 = min(a.x + a.w, b.x + b.w)
    iy1 = min(a.y + a.h, b.y + b.h)
    iw = max(0.0, ix1 - ix0)
    ih = max(0.0, iy1 - iy0)
    inter = iw * ih
    if inter <= 0.0:
        return 0.0
    union = a.area() + b.area() - inter
    if union <= 0.0:
        return 0.0
    return inter / union


def _safe_div(num: float, denom: float) -> float:
    """Return 0.0 when both numerator and denominator are 0.

    A precision/recall of "zero predictions, zero truths" is conventionally
    reported as 1.0 by some libraries and 0.0 by others. We take 0.0 as the
    neutral value and compute F1 the standard way; the "zero/zero" case is
    always surfaced in the per-image accounting so an evaluator can see it.
    """
    if denom == 0.0:
        return 0.0
    return num / denom


def score_detection(
    predictions_per_image: list[list[Detection]],
    truths_per_image: list[list[Detection]],
    iou_threshold: float = 0.5,
    score_threshold: float = 0.0,
) -> dict:
    """Score a detection run per class + overall.

    `predictions_per_image[i]` corresponds to `truths_per_image[i]`. Matching
    is greedy by descending score; a prediction may match at most one truth,
    and vice versa. A matched pair whose labels disagree is counted as a
    false positive for the predicted label AND a false negative for the truth
    label — relabeling a steel beam as rebar is two mistakes, not one.

    Returns a dict shaped as:
        {
          "per_class": {label: {tp, fp, fn, precision, recall, f1}},
          "overall": {tp, fp, fn, precision, recall, f1, accuracy, num_images},
          "iou_threshold": 0.5,
          "score_threshold": 0.0,
        }
    """
    if len(predictions_per_image) != len(truths_per_image):
        raise ValueError(
            f"predictions_per_image ({len(predictions_per_image)}) "
            f"and truths_per_image ({len(truths_per_image)}) must align"
        )

    per_class: dict[str, dict[str, int]] = {}

    def _bump(label: str, key: str) -> None:
        bucket = per_class.setdefault(label, {"tp": 0, "fp": 0, "fn": 0})
        bucket[key] += 1

    correct_images = 0

    for preds, truths in zip(predictions_per_image, truths_per_image):
        # Suppress low-confidence predictions before matching.
        kept = [p for p in preds if p.score >= score_threshold]
        # Greedy IoU match, highest-score prediction first.
        sorted_preds = sorted(kept, key=lambda p: -p.score)
        matched_truth_idx: set[int] = set()
        image_mistakes = 0

        for p in sorted_preds:
            best_iou = 0.0
            best_j = -1
            for j, t in enumerate(truths):
                if j in matched_truth_idx:
                    continue
                ov = iou(p.bbox, t.bbox)
                if ov > best_iou:
                    best_iou = ov
                    best_j = j
            if best_j >= 0 and best_iou >= iou_threshold:
                matched_truth_idx.add(best_j)
                t = truths[best_j]
                if t.label == p.label:
                    _bump(p.label, "tp")
                else:
                    # Label swap = two mistakes.
                    _bump(p.label, "fp")
                    _bump(t.label, "fn")
                    image_mistakes += 1
            else:
                _bump(p.label, "fp")
                image_mistakes += 1

        for j, t in enumerate(truths):
            if j not in matched_truth_idx:
                _bump(t.label, "fn")
                image_mistakes += 1

        if image_mistakes == 0 and len(truths) == len(sorted_preds):
            correct_images += 1

    per_class_report: dict[str, dict[str, float]] = {}
    tot_tp = tot_fp = tot_fn = 0
    for label, counts in sorted(per_class.items()):
        tp, fp, fn = counts["tp"], counts["fp"], counts["fn"]
        precision = _safe_div(tp, tp + fp)
        recall = _safe_div(tp, tp + fn)
        f1 = _safe_div(2 * precision * recall, precision + recall)
        per_class_report[label] = {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }
        tot_tp += tp
        tot_fp += fp
        tot_fn += fn

    overall_precision = _safe_div(tot_tp, tot_tp + tot_fp)
    overall_recall = _safe_div(tot_tp, tot_tp + tot_fn)
    overall_f1 = _safe_div(2 * overall_precision * overall_recall, overall_precision + overall_recall)
    num_images = len(predictions_per_image)
    accuracy = _safe_div(correct_images, num_images)

    return {
        "per_class": per_class_report,
        "overall": {
            "tp": tot_tp,
            "fp": tot_fp,
            "fn": tot_fn,
            "precision": overall_precision,
            "recall": overall_recall,
            "f1": overall_f1,
            "accuracy": accuracy,
            "num_images": num_images,
        },
        "iou_threshold": iou_threshold,
        "score_threshold": score_threshold,
    }


# ---------------------------------------------------------------------------
# OCR — CER + WER
# ---------------------------------------------------------------------------


# Arabic-Indic digit → ASCII map. Also handles the Persian variants a scanner
# might emit when the font uses a Persian subset (U+06F0..U+06F9), because an
# OCR tool treats a glyph as whatever its model memorised; the SRS asks us to
# compare the semantics, not the font family.
_ARABIC_INDIC = str.maketrans(
    "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹",
    "01234567890123456789",
)


def normalize_ocr(text: str, *, fold_digits: bool = True, strip_diacritics: bool = True) -> str:
    """Deterministic normalisation applied to both prediction and truth.

    * NFKC: fold width/compatibility variants so "Ⅷ" and "VIII" compare equal.
    * Strip Arabic diacritics (tashkeel) unless the evaluator opts out —
      none of our ground truth includes them, and the OCR model typically
      drops them, so a diacritic in only one side is a scanner artefact.
    * Collapse runs of whitespace to a single space.
    * Lowercase ASCII (Arabic has no case).
    * Fold Arabic-Indic digits to ASCII so "٥٠mm" and "50mm" compare equal.

    Return the normalised string. Callers should pass the SAME normalisation
    policy to both sides of a comparison; passing different policies hides
    errors in the model.
    """
    if text is None:
        return ""
    s = unicodedata.normalize("NFKC", text)
    if strip_diacritics:
        s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    if fold_digits:
        s = s.translate(_ARABIC_INDIC)
    s = " ".join(s.split())
    return s.lower()


def levenshtein(a: Iterable[str], b: Iterable[str]) -> int:
    """Edit distance between two sequences.

    Works on both strings (then it's CER) and lists of tokens (then it's WER).
    O(n*m) time, O(min(n,m)) space. Returns the integer edit distance.
    """
    a_list = list(a)
    b_list = list(b)
    if len(a_list) < len(b_list):
        a_list, b_list = b_list, a_list
    if not b_list:
        return len(a_list)
    previous = list(range(len(b_list) + 1))
    for i, ca in enumerate(a_list, start=1):
        current = [i] + [0] * len(b_list)
        for j, cb in enumerate(b_list, start=1):
            insert_cost = current[j - 1] + 1
            delete_cost = previous[j] + 1
            replace_cost = previous[j - 1] + (0 if ca == cb else 1)
            current[j] = min(insert_cost, delete_cost, replace_cost)
        previous = current
    return previous[-1]


def cer(prediction: str, truth: str, **norm_kwargs) -> float:
    """Character error rate. Normalised per `normalize_ocr`.

    By convention: `cer == 0` when truth is empty AND prediction is empty.
    When truth is empty but prediction is non-empty, we return the length of
    the prediction (insertions only); callers should surface this as a flag,
    because dividing by zero is not meaningful.
    """
    p = normalize_ocr(prediction, **norm_kwargs)
    t = normalize_ocr(truth, **norm_kwargs)
    if not t:
        return 0.0 if not p else float(len(p))
    return levenshtein(p, t) / len(t)


def wer(prediction: str, truth: str, **norm_kwargs) -> float:
    """Word error rate. Normalisation = `normalize_ocr` then split on spaces."""
    p = normalize_ocr(prediction, **norm_kwargs).split()
    t = normalize_ocr(truth, **norm_kwargs).split()
    if not t:
        return 0.0 if not p else float(len(p))
    return levenshtein(p, t) / len(t)


@dataclass
class OcrSampleResult:
    sample_id: str
    cer: float
    wer: float
    truth_empty: bool
    prediction_empty: bool
    note: str = ""


def score_ocr(
    predictions: dict[str, str],
    truths: dict[str, str],
    **norm_kwargs,
) -> dict:
    """Score an OCR run — mean CER + WER across samples.

    `predictions[sample_id]` is the raw OCR text; `truths[sample_id]` is the
    gold transcript. A missing prediction (the service failed on that sample)
    counts as CER/WER = 1.0 for that sample and is flagged in the per-sample
    rows — collapsing a crash to "we did perfectly on everything else" is
    exactly the dishonest reporting the SRS forbids.
    """
    samples: list[OcrSampleResult] = []
    for sample_id, truth in truths.items():
        if sample_id not in predictions:
            samples.append(
                OcrSampleResult(
                    sample_id=sample_id,
                    cer=1.0,
                    wer=1.0,
                    truth_empty=not normalize_ocr(truth, **norm_kwargs),
                    prediction_empty=True,
                    note="service returned no prediction",
                )
            )
            continue
        pred = predictions[sample_id]
        s_cer = cer(pred, truth, **norm_kwargs)
        s_wer = wer(pred, truth, **norm_kwargs)
        samples.append(
            OcrSampleResult(
                sample_id=sample_id,
                cer=s_cer,
                wer=s_wer,
                truth_empty=not normalize_ocr(truth, **norm_kwargs),
                prediction_empty=not normalize_ocr(pred, **norm_kwargs),
            )
        )

    valid = [s for s in samples if not s.truth_empty]
    mean_cer = sum(s.cer for s in valid) / len(valid) if valid else 0.0
    mean_wer = sum(s.wer for s in valid) / len(valid) if valid else 0.0

    return {
        "samples": [vars(s) for s in samples],
        "overall": {
            "mean_cer": mean_cer,
            "mean_wer": mean_wer,
            "num_samples": len(samples),
            "num_scored": len(valid),
            "num_truth_empty": sum(1 for s in samples if s.truth_empty),
            "num_prediction_empty": sum(1 for s in samples if s.prediction_empty),
        },
        "normalization": {
            "fold_digits": norm_kwargs.get("fold_digits", True),
            "strip_diacritics": norm_kwargs.get("strip_diacritics", True),
        },
    }


# ---------------------------------------------------------------------------
# BIM — line-item quantity error
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class BimLineItem:
    ifc_class: str
    quantity: float
    unit: str


def _bim_match_key(item: BimLineItem) -> tuple[str, str]:
    """Match predictions to truth by (ifc_class, unit). Case-folded.

    IFC class names are already case-sensitive by the standard, but a few
    extractors uppercase them. We fold here so a mismatch of case is not
    misreported as a missing line item.
    """
    return (item.ifc_class.strip().upper(), item.unit.strip().lower())


def score_bim(
    predictions: list[BimLineItem],
    truths: list[BimLineItem],
    *,
    tolerance_pct: float = 5.0,
) -> dict:
    """Score a BIM run — per-line quantity error + line coverage.

    * Mean quantity error % across matched lines (truth != 0).
    * Lines where truth = 0 are scored by absolute error and flagged.
    * A truth line with no matching prediction is counted as a 100% error
      ("missed"); a prediction with no matching truth is counted as a 100%
      error ("extra"). Both are reported separately so an evaluator can
      see "the model matched everything within tolerance, but hallucinated
      three extra beams" rather than one blended number.
    * `tolerance_pct` is informational — the per-line "within_tolerance"
      flag is set when the error is ≤ this value. The overall mean is still
      the mean; the SRS asks for the raw number, not a thresholded pass/fail.
    """
    pred_by_key: dict[tuple[str, str], BimLineItem] = {}
    for p in predictions:
        pred_by_key[_bim_match_key(p)] = p

    truth_by_key: dict[tuple[str, str], BimLineItem] = {}
    for t in truths:
        truth_by_key[_bim_match_key(t)] = t

    lines: list[dict] = []
    matched_pct_errors: list[float] = []

    seen_keys: set[tuple[str, str]] = set()
    for key, t in truth_by_key.items():
        seen_keys.add(key)
        p = pred_by_key.get(key)
        if p is None:
            lines.append(
                {
                    "ifc_class": t.ifc_class,
                    "unit": t.unit,
                    "truth": t.quantity,
                    "prediction": None,
                    "abs_error": t.quantity,
                    "pct_error": 100.0,
                    "within_tolerance": False,
                    "status": "missed",
                }
            )
            matched_pct_errors.append(100.0)
            continue
        abs_err = abs(p.quantity - t.quantity)
        if t.quantity == 0:
            pct_err = math.inf if p.quantity != 0 else 0.0
            lines.append(
                {
                    "ifc_class": t.ifc_class,
                    "unit": t.unit,
                    "truth": t.quantity,
                    "prediction": p.quantity,
                    "abs_error": abs_err,
                    "pct_error": pct_err,
                    "within_tolerance": pct_err == 0.0,
                    "status": "zero_truth",
                }
            )
            continue
        pct_err = (abs_err / t.quantity) * 100.0
        lines.append(
            {
                "ifc_class": t.ifc_class,
                "unit": t.unit,
                "truth": t.quantity,
                "prediction": p.quantity,
                "abs_error": abs_err,
                "pct_error": pct_err,
                "within_tolerance": pct_err <= tolerance_pct,
                "status": "matched",
            }
        )
        matched_pct_errors.append(pct_err)

    for key, p in pred_by_key.items():
        if key in seen_keys:
            continue
        lines.append(
            {
                "ifc_class": p.ifc_class,
                "unit": p.unit,
                "truth": None,
                "prediction": p.quantity,
                "abs_error": p.quantity,
                "pct_error": 100.0,
                "within_tolerance": False,
                "status": "extra",
            }
        )
        matched_pct_errors.append(100.0)

    mean_pct_error = sum(matched_pct_errors) / len(matched_pct_errors) if matched_pct_errors else 0.0

    return {
        "lines": lines,
        "overall": {
            "mean_quantity_error_pct": mean_pct_error,
            "num_truth_lines": len(truths),
            "num_predicted_lines": len(predictions),
            "num_matched": sum(1 for l in lines if l["status"] == "matched"),
            "num_missed": sum(1 for l in lines if l["status"] == "missed"),
            "num_extra": sum(1 for l in lines if l["status"] == "extra"),
            "num_zero_truth": sum(1 for l in lines if l["status"] == "zero_truth"),
            "num_within_tolerance": sum(1 for l in lines if l["within_tolerance"]),
            "tolerance_pct": tolerance_pct,
        },
    }

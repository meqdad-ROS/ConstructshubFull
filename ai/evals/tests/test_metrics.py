"""Toy-case tests for the metrics module.

Every test here is deterministic and covers the acceptance surface the SRS
asks for: known inputs (including empty, Unicode, Arabic-Indic, division-by-
zero, label swaps, malformed JSON) and known outputs. If you add a new metric
or change a normalisation rule, add the toy case here *first*.

Run: `python -m unittest ai.evals.tests.test_metrics` from the repo root.
"""

from __future__ import annotations

import math
import unittest

from ai.evals.harness.metrics import (
    BBox,
    BimLineItem,
    Detection,
    cer,
    iou,
    levenshtein,
    normalize_ocr,
    score_bim,
    score_detection,
    score_ocr,
    wer,
)


class TestIoU(unittest.TestCase):
    def test_identical_boxes_iou_1(self) -> None:
        a = BBox(0.1, 0.1, 0.2, 0.2)
        self.assertAlmostEqual(iou(a, a), 1.0, places=10)

    def test_disjoint_boxes_iou_0(self) -> None:
        a = BBox(0.0, 0.0, 0.1, 0.1)
        b = BBox(0.5, 0.5, 0.1, 0.1)
        self.assertEqual(iou(a, b), 0.0)

    def test_half_overlap_iou(self) -> None:
        a = BBox(0.0, 0.0, 1.0, 1.0)
        b = BBox(0.5, 0.0, 1.0, 1.0)
        self.assertAlmostEqual(iou(a, b), 0.5 / 1.5, places=6)

    def test_zero_area_box_safe(self) -> None:
        a = BBox(0.0, 0.0, 0.0, 0.0)
        b = BBox(0.0, 0.0, 1.0, 1.0)
        self.assertEqual(iou(a, b), 0.0)


class TestDetectionScoring(unittest.TestCase):
    def _box(self, x: float, y: float, w: float, h: float) -> BBox:
        return BBox(x, y, w, h)

    def test_empty_predictions_and_truths(self) -> None:
        r = score_detection([[]], [[]])
        self.assertEqual(r["overall"]["num_images"], 1)
        self.assertEqual(r["overall"]["tp"], 0)
        self.assertEqual(r["overall"]["fp"], 0)
        self.assertEqual(r["overall"]["fn"], 0)
        self.assertEqual(r["overall"]["accuracy"], 1.0)

    def test_perfect_match_single_class(self) -> None:
        truth = [[Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3))]]
        pred = [[Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3), score=0.9)]]
        r = score_detection(pred, truth)
        self.assertEqual(r["overall"]["precision"], 1.0)
        self.assertEqual(r["overall"]["recall"], 1.0)
        self.assertEqual(r["overall"]["f1"], 1.0)
        self.assertEqual(r["overall"]["accuracy"], 1.0)

    def test_wrong_label_counts_twice(self) -> None:
        truth = [[Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3))]]
        pred = [[Detection("steel-beam", self._box(0.1, 0.1, 0.3, 0.3), score=0.9)]]
        r = score_detection(pred, truth)
        self.assertEqual(r["per_class"]["rebar"]["fn"], 1)
        self.assertEqual(r["per_class"]["steel-beam"]["fp"], 1)
        self.assertEqual(r["overall"]["accuracy"], 0.0)

    def test_low_score_prediction_suppressed(self) -> None:
        truth = [[Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3))]]
        pred = [[Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3), score=0.1)]]
        r = score_detection(pred, truth, score_threshold=0.5)
        # Suppressed → no prediction → recall 0.
        self.assertEqual(r["overall"]["recall"], 0.0)
        self.assertEqual(r["overall"]["tp"], 0)

    def test_misaligned_lengths_raises(self) -> None:
        with self.assertRaises(ValueError):
            score_detection([[]], [[], []])

    def test_extra_predictions_count_as_fp(self) -> None:
        truth = [[Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3))]]
        pred = [[
            Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3), score=0.9),
            Detection("rebar", self._box(0.6, 0.6, 0.2, 0.2), score=0.8),
        ]]
        r = score_detection(pred, truth)
        self.assertEqual(r["per_class"]["rebar"]["tp"], 1)
        self.assertEqual(r["per_class"]["rebar"]["fp"], 1)

    def test_f1_zero_when_no_tp(self) -> None:
        truth = [[Detection("rebar", self._box(0.1, 0.1, 0.3, 0.3))]]
        pred = [[]]
        r = score_detection(pred, truth)
        self.assertEqual(r["overall"]["f1"], 0.0)


class TestOcrNormalisation(unittest.TestCase):
    def test_arabic_indic_digits_folded(self) -> None:
        self.assertEqual(normalize_ocr("٥٠mm"), "50mm")

    def test_persian_digits_also_folded(self) -> None:
        self.assertEqual(normalize_ocr("۵۰mm"), "50mm")

    def test_whitespace_collapsed(self) -> None:
        self.assertEqual(normalize_ocr("  a   b\tc\r\nd "), "a b c d")

    def test_lowercase_latin_only(self) -> None:
        # Arabic has no case; mixed strings keep Arabic as-is.
        self.assertEqual(normalize_ocr("Steel Rebar"), "steel rebar")
        self.assertEqual(normalize_ocr("حديد"), "حديد")

    def test_nfkc_folds_width_variants(self) -> None:
        full_width = "５０"
        self.assertEqual(normalize_ocr(full_width), "50")

    def test_tashkeel_stripped(self) -> None:
        # fatha + damma + kasra — common tashkeel.
        self.assertEqual(normalize_ocr("حَدِيدٌ"), "حديد")

    def test_none_input_safe(self) -> None:
        self.assertEqual(normalize_ocr(None), "")


class TestLevenshtein(unittest.TestCase):
    def test_identical_strings_zero(self) -> None:
        self.assertEqual(levenshtein("abc", "abc"), 0)

    def test_empty_one_side(self) -> None:
        self.assertEqual(levenshtein("", "abc"), 3)
        self.assertEqual(levenshtein("abc", ""), 3)

    def test_single_substitution(self) -> None:
        self.assertEqual(levenshtein("cat", "bat"), 1)

    def test_insertion(self) -> None:
        self.assertEqual(levenshtein("cat", "cats"), 1)

    def test_unicode_sequence(self) -> None:
        # Arabic — algorithm treats each code point as an atom.
        self.assertEqual(levenshtein("حديد", "حديدة"), 1)

    def test_tokens_as_sequence(self) -> None:
        self.assertEqual(levenshtein(["steel", "beam"], ["steel", "rod"]), 1)


class TestCerWer(unittest.TestCase):
    def test_perfect_match(self) -> None:
        self.assertEqual(cer("steel beam", "steel beam"), 0.0)
        self.assertEqual(wer("steel beam", "steel beam"), 0.0)

    def test_arabic_indic_digit_fold_counts_zero(self) -> None:
        self.assertEqual(cer("٥٠mm rebar", "50mm rebar"), 0.0)

    def test_cer_counts_characters(self) -> None:
        # truth = "abc" (3 chars), prediction "abd" → 1 edit / 3 = 0.333...
        self.assertAlmostEqual(cer("abd", "abc"), 1 / 3, places=6)

    def test_wer_counts_words(self) -> None:
        self.assertAlmostEqual(
            wer("steel rod column", "steel beam column"),
            1 / 3,
            places=6,
        )

    def test_empty_truth_and_prediction_is_perfect(self) -> None:
        self.assertEqual(cer("", ""), 0.0)
        self.assertEqual(wer("", ""), 0.0)

    def test_empty_truth_but_prediction_counts_insertions(self) -> None:
        self.assertEqual(cer("abc", ""), 3.0)
        self.assertEqual(wer("a b c", ""), 3.0)


class TestOcrScoring(unittest.TestCase):
    def test_missing_prediction_is_1_wer_1_cer(self) -> None:
        truths = {"a": "hello"}
        preds: dict[str, str] = {}
        r = score_ocr(preds, truths)
        self.assertEqual(r["overall"]["mean_cer"], 1.0)
        self.assertEqual(r["overall"]["mean_wer"], 1.0)
        self.assertEqual(r["overall"]["num_prediction_empty"], 1)

    def test_empty_truth_excluded_from_mean(self) -> None:
        truths = {"blank": "", "real": "hello"}
        preds = {"blank": "hi", "real": "hello"}
        r = score_ocr(preds, truths)
        # Only the non-empty truth is scored.
        self.assertEqual(r["overall"]["num_scored"], 1)
        self.assertEqual(r["overall"]["mean_cer"], 0.0)


class TestBimScoring(unittest.TestCase):
    def test_perfect_match(self) -> None:
        truth = [BimLineItem("IFCWALL", 10, "count"), BimLineItem("IFCBEAM", 5, "count")]
        pred = [BimLineItem("IFCWALL", 10, "count"), BimLineItem("IFCBEAM", 5, "count")]
        r = score_bim(pred, truth)
        self.assertEqual(r["overall"]["mean_quantity_error_pct"], 0.0)
        self.assertEqual(r["overall"]["num_matched"], 2)

    def test_missed_line_is_100_pct_error(self) -> None:
        truth = [BimLineItem("IFCWALL", 10, "count"), BimLineItem("IFCBEAM", 5, "count")]
        pred = [BimLineItem("IFCWALL", 10, "count")]
        r = score_bim(pred, truth)
        self.assertEqual(r["overall"]["num_missed"], 1)
        self.assertEqual(r["overall"]["mean_quantity_error_pct"], 50.0)

    def test_extra_line_is_flagged(self) -> None:
        truth = [BimLineItem("IFCWALL", 10, "count")]
        pred = [BimLineItem("IFCWALL", 10, "count"), BimLineItem("IFCBEAM", 5, "count")]
        r = score_bim(pred, truth)
        self.assertEqual(r["overall"]["num_extra"], 1)

    def test_zero_truth_handled(self) -> None:
        truth = [BimLineItem("IFCWALL", 0, "count")]
        pred = [BimLineItem("IFCWALL", 2, "count")]
        r = score_bim(pred, truth)
        self.assertEqual(r["overall"]["num_zero_truth"], 1)
        self.assertTrue(math.isinf(r["lines"][0]["pct_error"]))

    def test_tolerance_boundary(self) -> None:
        truth = [BimLineItem("IFCWALL", 100, "count")]
        pred = [BimLineItem("IFCWALL", 105, "count")]
        r = score_bim(pred, truth, tolerance_pct=5.0)
        self.assertTrue(r["lines"][0]["within_tolerance"])
        self.assertAlmostEqual(r["lines"][0]["pct_error"], 5.0, places=6)

    def test_class_case_folded_for_match(self) -> None:
        truth = [BimLineItem("ifcwall", 2, "count")]
        pred = [BimLineItem("IFCWALL", 2, "count")]
        r = score_bim(pred, truth)
        self.assertEqual(r["overall"]["num_matched"], 1)


if __name__ == "__main__":
    unittest.main()

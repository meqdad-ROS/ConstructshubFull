"""End-to-end runner tests.

Exercises the runner against the shipped datasets with no external services
(so the detection track scores against the offline-zero baseline and the OCR
track reports "no service"). The point is to prove the runner is
deterministic and produces a valid markdown report.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[3]


class TestRunnerIntegration(unittest.TestCase):
    def _run(self, extra_args: list[str]) -> tuple[int, Path, str]:
        with TemporaryDirectory() as td:
            out = Path(td) / "report.md"
            # Make sure we don't accidentally pick up a local OCR server.
            env = os.environ.copy()
            env.pop("OCR_ENDPOINT", None)
            env.pop("IMAGE_ENDPOINT", None)
            env.pop("BIM_ENDPOINT", None)
            proc = subprocess.run(
                [sys.executable, "-m", "ai.evals.runner", "--out", str(out), *extra_args],
                cwd=str(ROOT),
                env=env,
                capture_output=True,
                text=True,
                timeout=120,
            )
            text = out.read_text(encoding="utf-8") if out.exists() else ""
            return proc.returncode, out, text

    def test_bim_track_runs_clean(self) -> None:
        rc, _, text = self._run(["--track", "bim"])
        self.assertEqual(rc, 0)
        self.assertIn("## BIM — IFC quantity extraction", text)
        self.assertIn("mean quantity error | 0% |", text)
        self.assertIn("matched / missed / extra | 20 / 0 / 0 |", text)

    def test_detection_offline_baseline_reports_zero(self) -> None:
        rc, _, text = self._run(["--track", "detection"])
        self.assertEqual(rc, 0)
        self.assertIn("## Detection — construction-material imagery", text)
        # Offline baseline returns zero detections → recall = 0.
        self.assertRegex(text, r"\| recall \| 0\.00%")
        self.assertIn("offline-zero", text)

    def test_smoke_run_produces_report(self) -> None:
        rc, _, text = self._run(["--smoke"])
        self.assertEqual(rc, 0)
        for header in (
            "## Detection — construction-material imagery",
            "## OCR — document scans & handwritten Arabic",
            "## BIM — IFC quantity extraction",
        ):
            self.assertIn(header, text)
        # Smoke manifests cap at 10 included samples.
        included = re.search(r"\((\d+) included, \d+ skipped\)", text)
        self.assertIsNotNone(included)
        self.assertLessEqual(int(included.group(1)), 10)

    def test_bad_dataset_path_exits_nonzero(self) -> None:
        rc, _, _ = self._run(["--track", "bim", "--dataset", "no-such-manifest.json"])
        self.assertEqual(rc, 2)


if __name__ == "__main__":
    unittest.main()

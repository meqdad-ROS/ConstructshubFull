"""Manifest loader tests.

Covers rejection paths (schema version, missing keys, path traversal, missing
sample files on disk) and the staged-acquisition path (`included: false`).
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from ai.evals.harness.datasets import ManifestError, SCHEMA_VERSION, load_manifest


def _write(root: Path, name: str, text: str) -> Path:
    p = root / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    return p


class TestLoadManifest(unittest.TestCase):
    def test_loads_valid_bim_manifest(self) -> None:
        with TemporaryDirectory() as td:
            root = Path(td)
            _write(root, "samples/x.ifc", "ISO-10303-21;DATA;ENDSEC;END-ISO-10303-21;")
            manifest = {
                "schema_version": SCHEMA_VERSION,
                "kind": "bim",
                "name": "t",
                "version": "0.1",
                "samples": [
                    {
                        "sample_id": "x",
                        "file": "samples/x.ifc",
                        "included": True,
                        "expected": [{"ifc_class": "IFCWALL", "quantity": 1, "unit": "count"}],
                    }
                ],
            }
            mp = _write(root, "manifest.json", json.dumps(manifest))
            ds = load_manifest(mp)
            self.assertEqual(ds.kind, "bim")
            self.assertEqual(len(ds.samples), 1)
            self.assertEqual(ds.samples[0].expected[0]["ifc_class"], "IFCWALL")
            self.assertEqual(len(ds.samples[0].sha256), 64)

    def test_rejects_bad_schema_version(self) -> None:
        with TemporaryDirectory() as td:
            mp = _write(Path(td), "manifest.json", json.dumps({
                "schema_version": 999, "kind": "bim", "name": "t",
                "version": "0.1", "samples": [],
            }))
            with self.assertRaises(ManifestError):
                load_manifest(mp)

    def test_rejects_unknown_kind(self) -> None:
        with TemporaryDirectory() as td:
            mp = _write(Path(td), "manifest.json", json.dumps({
                "schema_version": SCHEMA_VERSION, "kind": "mystery",
                "name": "t", "version": "0.1", "samples": [],
            }))
            with self.assertRaises(ManifestError):
                load_manifest(mp)

    def test_missing_sample_file_raises(self) -> None:
        with TemporaryDirectory() as td:
            mp = _write(Path(td), "manifest.json", json.dumps({
                "schema_version": SCHEMA_VERSION, "kind": "ocr",
                "name": "t", "version": "0.1",
                "samples": [{"sample_id": "x", "file": "samples/missing.png", "included": True, "transcript": "x"}],
            }))
            with self.assertRaises(ManifestError):
                load_manifest(mp)

    def test_staged_acquisition_sample_goes_to_skipped(self) -> None:
        with TemporaryDirectory() as td:
            mp = _write(Path(td), "manifest.json", json.dumps({
                "schema_version": SCHEMA_VERSION, "kind": "ocr",
                "name": "t", "version": "0.1",
                "samples": [{
                    "sample_id": "future",
                    "included": False,
                    "reason": "awaiting licensed source",
                    "provenance": {"source": "pending"},
                }],
            }))
            ds = load_manifest(mp)
            self.assertEqual(len(ds.samples), 0)
            self.assertEqual(len(ds.skipped), 1)
            self.assertEqual(ds.skipped[0]["sample_id"], "future")

    def test_bad_bbox_shape_rejected(self) -> None:
        with TemporaryDirectory() as td:
            root = Path(td)
            _write(root, "samples/x.png", "x")
            mp = _write(root, "manifest.json", json.dumps({
                "schema_version": SCHEMA_VERSION, "kind": "detection",
                "name": "t", "version": "0.1",
                "samples": [{
                    "sample_id": "x", "file": "samples/x.png", "included": True,
                    "objects": [{"label": "A", "bbox": [0.1, 0.1, 0.1]}],  # 3-wide
                }],
            }))
            with self.assertRaises(ManifestError):
                load_manifest(mp)

    def test_invalid_json_is_a_manifest_error(self) -> None:
        with TemporaryDirectory() as td:
            mp = _write(Path(td), "manifest.json", "not json {")
            with self.assertRaises(ManifestError):
                load_manifest(mp)

    def test_path_traversal_rejected(self) -> None:
        with TemporaryDirectory() as td:
            root = Path(td) / "nest"
            root.mkdir()
            # Put the "sample" outside root so a `..` reference would be the
            # only way to reach it.
            outside = Path(td) / "outside.png"
            outside.write_text("x", encoding="utf-8")
            mp = _write(root, "manifest.json", json.dumps({
                "schema_version": SCHEMA_VERSION, "kind": "detection",
                "name": "t", "version": "0.1",
                "samples": [{
                    "sample_id": "x", "file": "../outside.png", "included": True,
                    "objects": [{"label": "A", "bbox": [0.1, 0.1, 0.1, 0.1]}],
                }],
            }))
            with self.assertRaises(ManifestError):
                load_manifest(mp)


if __name__ == "__main__":
    unittest.main()

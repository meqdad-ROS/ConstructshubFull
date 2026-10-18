"""Parser smoke test.

We don't require ifcopenshell to be installed to run the module-level imports;
when it isn't, `analyze_ifc_file` raises a clear RuntimeError. The dim-mapping
helpers are pure Python and tested here regardless.
"""

from __future__ import annotations

import pytest

from app import parser


def test_humanise_strips_ifc_prefix_and_adds_spaces():
    assert parser._humanise("IfcWallStandardCase") == "wall standard case"
    assert parser._humanise("IfcSlab") == "slab"


@pytest.mark.parametrize(
    "name, expected",
    [
        ("NetVolume", "volume"),
        ("GrossSideArea", "area"),
        ("Length", "length"),
        ("Count", "count"),
        ("TotalWeight", "weight"),
        ("Height", "length"),
        ("GrossArea", "area"),
    ],
)
def test_dimension_for_qto_name(name: str, expected: str):
    assert parser._dimension_for_qto_name(name) == expected


def test_dimension_for_qto_name_unknown():
    assert parser._dimension_for_qto_name("Shape") is None


def test_elementquantity_filters_non_numeric_and_zero():
    rows = parser._elementquantity_from_pset(
        {"id": 1, "NetVolume": 8.5, "Shape": "box", "Zero": 0, "Length": "oops"}
    )
    # id, Shape, Zero, Length (non-numeric) are all skipped; only NetVolume survives.
    assert rows == [("NetVolume", 8.5)]


def test_analyze_ifc_file_without_ifcopenshell_raises_runtimeerror(monkeypatch: pytest.MonkeyPatch, tmp_path):
    monkeypatch.setattr(parser, "ifcopenshell", None)
    monkeypatch.setattr(parser, "ios_element", None)
    fake = tmp_path / "demo.ifc"
    fake.write_text("ISO-10303-21;")
    with pytest.raises(RuntimeError, match="ifcopenshell is not installed"):
        parser.analyze_ifc_file(fake)

"""Response schemas. Mirrors the TypeScript IfcAnalysis in lib/search/ifc.ts so
the Next.js caller gets exactly the same shape whether it ran the Python
parser or the text fallback.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Dimension = Literal["volume", "area", "length", "count", "weight"]


class IfcLineItem(BaseModel):
    description: str
    ifcClass: str
    quantity: float
    unit: str
    dimension: Dimension
    source: Literal["IfcElementQuantity", "instance-count"]
    sampleNames: list[str] | None = Field(default=None)


class IfcAnalysis(BaseModel):
    schema: str = Field(default="IFC4")
    description: str | None = None
    author: str | None = None
    organisation: str | None = None
    entityCounts: dict[str, int] = Field(default_factory=dict)
    lineItems: list[IfcLineItem] = Field(default_factory=list)
    rawTextSummary: str


class HealthResponse(BaseModel):
    ok: bool
    version: str
    ifcopenshell: str | None = None

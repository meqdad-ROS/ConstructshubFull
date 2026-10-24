"""Image-detection service adapter.

Today's "service" is the OCR-word-box baseline documented in
`waquor/lib/search/image.ts` — the public endpoint returns word bounding boxes
and marks `detectorKind: "ocr-words"` so the UI can show "OCR-only". This
adapter is honest about that: it calls the same endpoint, but the metrics
module scores *mapped class* behavior, not pixel-aligned bounding boxes a word
box can't carry. The baseline report explains this plainly.

When a real detector lands (D2), we add a sibling adapter that returns real
`Detection` objects with real `score`s; the metric module needs no change.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from ..metrics import BBox, Detection
from . import ServiceContractError, ServiceUnavailable


@dataclass
class ImageSearchResponse:
    sample_id: str
    detector_kind: str          # "ocr-words" | "object-detection"
    regions: list[dict]         # raw regions as the service returned
    detections: list[Detection] # normalised for the metric module
    latency_ms: int


def _build_multipart(file_path: Path) -> tuple[bytes, str]:
    boundary = "----ConstructHubEvalBoundary"
    with file_path.open("rb") as fh:
        content = fh.read()
    mime = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }.get(file_path.suffix.lstrip(".").lower(), "application/octet-stream")
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode("utf-8")
    body += content
    body += f"\r\n--{boundary}--\r\n".encode("utf-8")
    return body, f"multipart/form-data; boundary={boundary}"


def _normalise_regions_to_detections(
    width: int,
    height: int,
    regions: list[dict],
) -> list[Detection]:
    """Convert the service's region list into `Detection`s for scoring.

    The service returns pixel-space bboxes under `region.bbox` and a parsed
    search query under `query`. We treat the top matched hit's category — or
    the parsed `query.category` — as the predicted class, falling back to the
    raw OCR text when none exists. Scores default to the OCR confidence.

    An absent `topHits` list means "we read a word but mapped it to nothing";
    we drop the region rather than invent a class. This is the honest shape
    the baseline supports.
    """
    out: list[Detection] = []
    if width <= 0 or height <= 0:
        return out
    for r in regions:
        region = r.get("region") or {}
        pixel_bbox = region.get("bbox") or {}
        try:
            x = float(pixel_bbox.get("x", 0)) / width
            y = float(pixel_bbox.get("y", 0)) / height
            w = float(pixel_bbox.get("width", 0)) / width
            h = float(pixel_bbox.get("height", 0)) / height
        except (TypeError, ValueError):
            continue
        label: str | None = None
        top_hits = r.get("topHits") or []
        if top_hits and isinstance(top_hits, list):
            first = top_hits[0] or {}
            label = first.get("category") or first.get("title")
        if label is None:
            # Try the parsed query itself (ontology → category).
            label = (r.get("query") or {}).get("category") if isinstance(r.get("query"), dict) else None
        if label is None:
            continue
        score = float(region.get("confidence", 0.5))
        out.append(
            Detection(
                label=str(label),
                bbox=BBox(x=x, y=y, w=w, h=h),
                score=score,
            )
        )
    return out


def call_waquor_image(file_path: Path, endpoint: str, timeout: float = 60.0) -> ImageSearchResponse:
    body, content_type = _build_multipart(file_path)
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": content_type, "Accept": "application/json"},
        method="POST",
    )
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        raise ServiceUnavailable(f"waquor image search unreachable at {endpoint}: {e}") from e
    latency_ms = int((time.monotonic() - t0) * 1000)
    if not isinstance(payload, dict):
        raise ServiceContractError("waquor image response is not an object")
    result = payload.get("result") if "result" in payload else payload
    if not isinstance(result, dict):
        raise ServiceContractError("waquor image response missing 'result'")
    width = int(result.get("width", 0))
    height = int(result.get("height", 0))
    regions = result.get("regions") or []
    detector_kind = str(result.get("detectorKind", "unknown"))
    detections = _normalise_regions_to_detections(width, height, regions)
    return ImageSearchResponse(
        sample_id=file_path.stem,
        detector_kind=detector_kind,
        regions=regions,
        detections=detections,
        latency_ms=latency_ms,
    )


def call_offline_baseline(file_path: Path) -> ImageSearchResponse:
    """Offline degenerate baseline — zero detections.

    Used when $IMAGE_ENDPOINT is unset. Returning zero detections for every
    sample is a legitimate baseline (recall=0, precision undefined, F1=0)
    and the report says exactly that. We never fabricate detections.
    """
    return ImageSearchResponse(
        sample_id=file_path.stem,
        detector_kind="offline-zero",
        regions=[],
        detections=[],
        latency_ms=0,
    )


def best_available_image(file_path: Path, endpoint: str | None = None) -> ImageSearchResponse:
    ep = endpoint or os.environ.get("IMAGE_ENDPOINT")
    if ep:
        try:
            return call_waquor_image(file_path, ep)
        except (ServiceUnavailable, ServiceContractError):
            pass
    return call_offline_baseline(file_path)

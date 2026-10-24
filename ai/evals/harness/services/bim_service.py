"""BIM service adapter.

The in-repo IFC parser `lib/bsdd.ts::parseIfc` does a surprising amount of
real work without ifcopenshell: it reads the STEP header, counts IFC entity
occurrences, and extracts product names. For the baseline we re-implement
the same entity-counting logic in Python (ten lines of regex over STEP text)
so the harness can score the current-live behavior on fixtures with no live
service running. The ground truth is the same thing a correct STEP parser
would count, so a passing in-tree baseline + a passing ifcopenshell-based
service is the acceptance target.

If `BIM_ENDPOINT` is set, we POST the raw file to the sandboxed BIM service
(services/bim) with the same signed request the Next.js side uses. Signing is
HMAC-SHA256 per the service's README; the token comes from BIM_SERVICE_TOKEN.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from ..metrics import BimLineItem
from . import ServiceContractError, ServiceUnavailable


_STEP_ENTITY = re.compile(r"=\s*(IFC[A-Z0-9_]+)\s*\(", re.IGNORECASE)


def _count_step_entities(step_text: str) -> dict[str, int]:
    """Count IFC entity occurrences in a STEP file.

    IFC STEP (ISO-10303-21) encodes each entity as `#42=IFCWALL(...)`; the
    regex captures the class name on the right of `=`. We ignore the file
    header block entirely — entities outside DATA are declarations, not
    objects. The baseline parser only needs the DATA section.
    """
    try:
        data_section = step_text.split("DATA;", 1)[1]
    except IndexError:
        return {}
    counts: dict[str, int] = {}
    for match in _STEP_ENTITY.finditer(data_section):
        name = match.group(1).upper()
        counts[name] = counts.get(name, 0) + 1
    return counts


@dataclass
class BimResult:
    sample_id: str
    line_items: list[BimLineItem]
    provider: str
    latency_ms: int


def parse_locally(file_path: Path) -> BimResult:
    """Offline STEP entity count — matches lib/bsdd.ts::parseIfc behavior."""
    t0 = time.monotonic()
    text = file_path.read_text(encoding="utf-8", errors="replace")
    counts = _count_step_entities(text)
    items = [
        BimLineItem(ifc_class=k, quantity=float(v), unit="count")
        for k, v in sorted(counts.items())
    ]
    return BimResult(
        sample_id=file_path.stem,
        line_items=items,
        provider="local-step",
        latency_ms=int((time.monotonic() - t0) * 1000),
    )


def _sign_request(token: str, body: bytes) -> tuple[str, str]:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    body_hash = hashlib.sha256(body).hexdigest()
    msg = f"{ts}.{body_hash}".encode("utf-8")
    sig = hmac.new(token.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return ts, sig


def call_bim_service(file_path: Path, endpoint: str, token: str, timeout: float = 60.0) -> BimResult:
    with file_path.open("rb") as fh:
        body = fh.read()
    ts, sig = _sign_request(token, body)
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": "application/octet-stream",
            "X-BIM-Timestamp": ts,
            "X-BIM-Signature": sig,
            "Accept": "application/json",
        },
        method="POST",
    )
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        raise ServiceUnavailable(f"BIM service unreachable at {endpoint}: {e}") from e
    latency_ms = int((time.monotonic() - t0) * 1000)
    line_items_raw = payload.get("lineItems") if isinstance(payload, dict) else None
    if not isinstance(line_items_raw, list):
        # Service may return entityCounts instead; synthesize line items.
        counts = (payload or {}).get("entityCounts") if isinstance(payload, dict) else None
        if not isinstance(counts, dict):
            raise ServiceContractError("BIM response missing lineItems and entityCounts")
        items = [
            BimLineItem(ifc_class=k, quantity=float(v), unit="count")
            for k, v in sorted(counts.items())
        ]
    else:
        items = []
        for li in line_items_raw:
            items.append(
                BimLineItem(
                    ifc_class=str(li["ifcClass"]),
                    quantity=float(li["quantity"]),
                    unit=str(li["unit"]),
                )
            )
    return BimResult(
        sample_id=file_path.stem,
        line_items=items,
        provider="bim-service",
        latency_ms=latency_ms,
    )


def best_available_bim(file_path: Path, endpoint: str | None = None) -> BimResult:
    ep = endpoint or os.environ.get("BIM_ENDPOINT")
    tok = os.environ.get("BIM_SERVICE_TOKEN")
    if ep and tok:
        try:
            return call_bim_service(file_path, ep, tok)
        except (ServiceUnavailable, ServiceContractError):
            pass
    return parse_locally(file_path)

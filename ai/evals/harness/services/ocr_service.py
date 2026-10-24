"""OCR service adapter.

Primary mode: POST the sample bytes to the running Next.js `/api/search/ocr`
route and extract the `text` field from the JSON response. The route already
runs tesseract.js and is the "today's service" the SRS asks us to measure.

Fallback mode: when no OCR_ENDPOINT is set and no OCR_CMD is wired, we return
a verifiable "no service" marker rather than a fake transcript. The runner
reports this clearly in the output so a reader cannot mistake "no service"
for "service perfect".

HTTP: urllib.request only — no new deps. multipart/form-data assembled by
hand (small, well-documented), because `requests` is not approved here.
"""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from . import ServiceContractError, ServiceUnavailable


@dataclass
class OcrResult:
    sample_id: str
    text: str
    mode: str              # "image-ocr", "pdf", … (what the route reported)
    latency_ms: int
    provider: str          # "waquor-next" | "tesseract-cli" | "none"


def _build_multipart(file_path: Path, field_name: str = "file") -> tuple[bytes, str]:
    """Minimal multipart/form-data body + content-type header value."""
    boundary = "----ConstructHubEvalBoundary"
    name = file_path.name
    with file_path.open("rb") as fh:
        content = fh.read()
    ext = file_path.suffix.lstrip(".").lower()
    mime = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "gif": "image/gif",
        "pdf": "application/pdf",
        "txt": "text/plain",
        "ifc": "application/octet-stream",
    }.get(ext, "application/octet-stream")

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field_name}"; filename="{name}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode("utf-8")
    body += content
    body += f"\r\n--{boundary}--\r\n".encode("utf-8")
    return body, f"multipart/form-data; boundary={boundary}"


def call_waquor_ocr(file_path: Path, endpoint: str, timeout: float = 60.0) -> OcrResult:
    """POST the file to the running Next.js /api/search/ocr endpoint."""
    body, content_type = _build_multipart(file_path)
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": content_type, "Accept": "application/json"},
        method="POST",
    )
    import time
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        raise ServiceUnavailable(f"waquor OCR unreachable at {endpoint}: {e}") from e
    latency_ms = int((time.monotonic() - t0) * 1000)
    if not isinstance(payload, dict) or not payload.get("success"):
        err = (payload or {}).get("error") if isinstance(payload, dict) else "unknown"
        raise ServiceContractError(f"waquor OCR error: {err}")
    text = payload.get("text")
    if not isinstance(text, str):
        raise ServiceContractError("waquor OCR response missing 'text' field")
    return OcrResult(
        sample_id=file_path.stem,
        text=text,
        mode=str(payload.get("mode", "unknown")),
        latency_ms=latency_ms,
        provider="waquor-next",
    )


def call_tesseract_cli(file_path: Path, langs: str = "eng+ara", timeout: float = 60.0) -> OcrResult:
    """Invoke `tesseract` as a subprocess, if present on the system."""
    import time
    t0 = time.monotonic()
    try:
        proc = subprocess.run(
            ["tesseract", str(file_path), "-", "-l", langs],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        raise ServiceUnavailable(f"tesseract CLI unavailable: {e}") from e
    if proc.returncode != 0:
        raise ServiceContractError(f"tesseract exit {proc.returncode}: {proc.stderr.strip()[:200]}")
    latency_ms = int((time.monotonic() - t0) * 1000)
    return OcrResult(
        sample_id=file_path.stem,
        text=proc.stdout,
        mode="tesseract-cli",
        latency_ms=latency_ms,
        provider="tesseract-cli",
    )


def call_tesseract_js(file_path: Path, langs: str = "eng+ara", timeout: float = 120.0) -> OcrResult:
    """Invoke the Node-side tesseract.js the same way `/api/search/ocr` does.

    This is "today's service" for the OCR word-box baseline — the SRS asks us
    to score the shipping OCR behaviour, and the shipping behaviour is
    tesseract.js from `waquor/node_modules`. Running it via a small Node
    runner (see `tesseract_js_runner.js`) avoids spinning up a full Next.js
    dev server for the eval.
    """
    import time
    runner = Path(__file__).parent / "tesseract_js_runner.js"
    if not runner.is_file():
        raise ServiceUnavailable(f"tesseract.js runner missing at {runner}")
    env = os.environ.copy()
    env["OCR_LANGS"] = langs
    t0 = time.monotonic()
    try:
        proc = subprocess.run(
            ["node", str(runner), str(file_path)],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
            env=env,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        raise ServiceUnavailable(f"tesseract.js runner unavailable: {e}") from e
    if proc.returncode != 0:
        raise ServiceContractError(
            f"tesseract.js exit {proc.returncode}: {proc.stderr.strip()[:400]}"
        )
    latency_ms = int((time.monotonic() - t0) * 1000)
    return OcrResult(
        sample_id=file_path.stem,
        text=proc.stdout,
        mode="tesseract-js",
        latency_ms=latency_ms,
        provider="tesseract-js",
    )


def best_available_ocr(file_path: Path, endpoint: str | None = None) -> OcrResult:
    """Try waquor route → tesseract.js → tesseract CLI → ServiceUnavailable.

    `endpoint` or $OCR_ENDPOINT points at a running Next.js dev server (eg
    http://127.0.0.1:3000/api/search/ocr). When no mode is available the
    caller gets ServiceUnavailable and the runner reports "no service".

    The tesseract.js runner is the same model the shipping `/api/search/ocr`
    endpoint uses, so scoring against it is scoring "today's OCR service"
    without starting a Next.js dev server. Set OCR_PROVIDER=cli to force the
    system tesseract binary (if installed) and OCR_PROVIDER=js to force the
    Node runner.
    """
    ep = endpoint or os.environ.get("OCR_ENDPOINT")
    forced = os.environ.get("OCR_PROVIDER", "").lower()
    errors = []
    if ep:
        try:
            return call_waquor_ocr(file_path, ep)
        except (ServiceUnavailable, ServiceContractError) as e:
            errors.append(f"waquor: {e}")
    if forced == "cli":
        return call_tesseract_cli(file_path)
    if forced == "js":
        return call_tesseract_js(file_path)
    try:
        return call_tesseract_js(file_path)
    except (ServiceUnavailable, ServiceContractError) as e:
        errors.append(f"tesseract.js: {e}")
    try:
        return call_tesseract_cli(file_path)
    except (ServiceUnavailable, ServiceContractError) as e:
        errors.append(f"tesseract-cli: {e}")
    raise ServiceUnavailable("; ".join(errors) or "no OCR provider available")

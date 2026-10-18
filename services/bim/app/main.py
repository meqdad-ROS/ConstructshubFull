"""FastAPI entry point."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from . import __version__
from .models import HealthResponse, IfcAnalysis
from .parser import analyze_ifc_file
from .security import SignatureError, verify

MAX_BYTES = int(os.environ.get("BIM_MAX_UPLOAD_BYTES", str(2 * 1024 * 1024 * 1024)))  # 2 GB per SRS §6.5
UPLOAD_DIR = Path(os.environ.get("BIM_UPLOAD_DIR", "/uploads"))

app = FastAPI(
    title="ConstructsHub BIM",
    version=__version__,
    docs_url=None,  # No public docs — this is an internal service.
    redoc_url=None,
)


def _ifcopenshell_version() -> str | None:
    try:
        import ifcopenshell  # type: ignore[import-not-found]
        return getattr(ifcopenshell, "version", None) or getattr(ifcopenshell, "__version__", None)
    except Exception:  # pragma: no cover
        return None


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True, version=__version__, ifcopenshell=_ifcopenshell_version())


@app.post("/parse", response_model=IfcAnalysis)
async def parse(req: Request) -> IfcAnalysis:
    body = await req.body()
    if len(body) == 0:
        raise HTTPException(status_code=400, detail="empty body")
    if len(body) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="file too large")
    try:
        verify(body, req.headers.get("X-BIM-Timestamp"), req.headers.get("X-BIM-Signature"))
    except SignatureError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    # Save to a scratch file under the tmpfs-mounted /uploads dir. Everything
    # is deleted when the parse returns, success or failure.
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        prefix="ifc-",
        suffix=".ifc",
        dir=str(UPLOAD_DIR),
        delete=False,
    ) as fh:
        fh.write(body)
        tmp_path = fh.name
    try:
        analysis = analyze_ifc_file(tmp_path)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover — parse errors
        raise HTTPException(status_code=400, detail=f"ifc parse failed: {exc!r}") from exc
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
    return analysis


@app.exception_handler(HTTPException)
async def _generic_error(_req: Request, exc: HTTPException) -> JSONResponse:
    # Keep errors terse — this service is internal.
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code)

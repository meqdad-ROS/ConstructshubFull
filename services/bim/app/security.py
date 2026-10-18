"""HMAC-SHA256 request signing between Next.js and this service.

The scheme is intentionally simple:

  X-BIM-Timestamp: 2026-10-10T13:14:15Z          (ISO-8601 UTC, from the caller)
  X-BIM-Signature: hex(hmac_sha256(secret, timestamp || "." || sha256(body)))

A ±300s skew window is allowed. Replays within the window are impossible to
detect without a nonce cache; we rely on the short window + TLS for that.
"""

from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone


class SignatureError(Exception):
    """Raised when the signature cannot be verified."""


def _get_secret() -> bytes:
    secret = os.environ.get("BIM_SERVICE_TOKEN", "")
    if not secret:
        raise SignatureError("BIM_SERVICE_TOKEN not set on the server")
    return secret.encode("utf-8")


def sign(body: bytes, timestamp: str, secret: bytes | None = None) -> str:
    """Build the hex signature for a payload + timestamp."""
    key = secret or _get_secret()
    body_hash = hashlib.sha256(body).hexdigest()
    msg = f"{timestamp}.{body_hash}".encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def verify(body: bytes, timestamp: str | None, signature: str | None, *, skew_seconds: int = 300) -> None:
    """Raise SignatureError if the request isn't a valid, recent, signed one."""
    if not timestamp:
        raise SignatureError("missing X-BIM-Timestamp")
    if not signature:
        raise SignatureError("missing X-BIM-Signature")
    try:
        ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError as exc:
        raise SignatureError(f"invalid timestamp: {exc}") from exc
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if abs((now - ts).total_seconds()) > skew_seconds:
        raise SignatureError("timestamp outside allowed skew")
    expected = sign(body, timestamp)
    if not hmac.compare_digest(expected, signature):
        raise SignatureError("bad signature")


def iso_now() -> str:
    """Caller helper — ISO-8601 UTC with a Z suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


__all__ = ["SignatureError", "sign", "verify", "iso_now"]

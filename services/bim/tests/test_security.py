"""Signature + replay-window tests. These exercise the pure crypto layer and
run without any heavy dependencies.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import pytest

from app import security


def test_sign_is_deterministic_for_same_body_and_timestamp():
    secret = b"test-secret"
    sig1 = security.sign(b"hello", "2026-10-10T12:00:00Z", secret)
    sig2 = security.sign(b"hello", "2026-10-10T12:00:00Z", secret)
    assert sig1 == sig2


def test_sign_changes_when_body_changes():
    secret = b"test-secret"
    a = security.sign(b"hello", "2026-10-10T12:00:00Z", secret)
    b = security.sign(b"hellO", "2026-10-10T12:00:00Z", secret)
    assert a != b


def test_sign_changes_when_timestamp_changes():
    secret = b"test-secret"
    a = security.sign(b"hello", "2026-10-10T12:00:00Z", secret)
    b = security.sign(b"hello", "2026-10-10T12:00:01Z", secret)
    assert a != b


def test_verify_accepts_valid_signature(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("BIM_SERVICE_TOKEN", "test-secret")
    body = b"<IFC body>"
    ts = security.iso_now()
    sig = security.sign(body, ts)
    security.verify(body, ts, sig)  # does not raise


def test_verify_rejects_bad_signature(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("BIM_SERVICE_TOKEN", "test-secret")
    body = b"<IFC body>"
    ts = security.iso_now()
    with pytest.raises(security.SignatureError):
        security.verify(body, ts, "deadbeef" * 8)


def test_verify_rejects_tampered_body(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("BIM_SERVICE_TOKEN", "test-secret")
    body = b"<IFC body>"
    ts = security.iso_now()
    sig = security.sign(body, ts)
    with pytest.raises(security.SignatureError):
        security.verify(b"<tampered>", ts, sig)


def test_verify_rejects_old_timestamp(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("BIM_SERVICE_TOKEN", "test-secret")
    body = b"<IFC body>"
    old = (datetime.now(timezone.utc) - timedelta(seconds=600)).strftime("%Y-%m-%dT%H:%M:%SZ")
    sig = security.sign(body, old)
    with pytest.raises(security.SignatureError):
        security.verify(body, old, sig)


def test_verify_rejects_missing_headers(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("BIM_SERVICE_TOKEN", "test-secret")
    with pytest.raises(security.SignatureError):
        security.verify(b"", None, "sig")
    with pytest.raises(security.SignatureError):
        security.verify(b"", "2026-10-10T12:00:00Z", None)


def test_verify_requires_secret(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("BIM_SERVICE_TOKEN", raising=False)
    with pytest.raises(security.SignatureError):
        security.verify(b"", "2026-10-10T12:00:00Z", "deadbeef")

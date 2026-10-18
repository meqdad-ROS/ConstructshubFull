# ConstructsHub BIM service

Sandboxed [IfcOpenShell](https://ifcopenshell.org/) parser for SRS §6.5. Owns a
single capability: given an IFC (.ifc) file, return a structured analysis the
Next.js side can consume — same shape as `lib/search/ifc.ts` `IfcAnalysis`.

## Why a separate service

SRS NFR-SEC-11 requires IFC/DWG/PDF parsing to happen in a *sandboxed container
without network access*. IFC files are untrusted user input; a buffer-overflow
or ReDoS inside the parser must not have reach to the rest of the stack.

## Running locally

```bash
# in /services/bim
export BIM_SERVICE_TOKEN=$(openssl rand -hex 32)
docker compose up --build
# POST http://localhost:8081/parse  (requires X-BIM-Timestamp + X-BIM-Signature)
```

Set the same `BIM_SERVICE_TOKEN` on the Next.js side plus `BIM_SERVICE_URL=http://localhost:8081`.

## Request signing

Caller sends:

```
POST /parse  HTTP/1.1
Content-Type: application/octet-stream
X-BIM-Timestamp: 2026-10-10T13:14:15Z
X-BIM-Signature: hex( HMAC-SHA256(BIM_SERVICE_TOKEN, timestamp "." sha256(body)) )

<IFC file bytes>
```

The service refuses requests older than 300s, with a bad signature, or over
`BIM_MAX_UPLOAD_BYTES` (default 2 GB, matching SRS §6.5 C-07).

## Response

Pydantic model `IfcAnalysis` (see `app/models.py`), identical in shape to the
TypeScript interface in `lib/search/ifc.ts`.

## Tests

```bash
cd services/bim
pip install -e '.[dev]'
pytest -q
```

## Deploying

Production hardening in `docker-compose.yml`:

- `read_only: true`
- `tmpfs /uploads` (RAM-backed, no persistence)
- `cap_drop: [ALL]`
- `no-new-privileges`
- `networks.bim-internal` with `internal: true` → **no outbound internet**
- 4 GB mem limit, 256 PID limit

For Kubernetes, mirror these as a `securityContext` + a `NetworkPolicy` that
denies egress. Mount `/uploads` as `emptyDir: {medium: Memory}`.

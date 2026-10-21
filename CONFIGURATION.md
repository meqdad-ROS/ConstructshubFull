# BanahBuild / ConstructsHub — launch procedure

This is the single document a developer uses to go from a clean machine to a
working stack: web app, Postgres, optional BIM sandbox, optional mobile app.

Everything that only applies at *production* is called out as **(prod only)**.
For first-time local dev you can skip every (prod only) step and still reach a
working marketplace in ~10 minutes.

---

## 0 · Project layout

```
Construct-Hub_Project/
├── waquor/           ← Next.js 15 web app  (where you spend 95% of the time)
├── mobile/           ← Expo React Native app (opt-in)
├── services/bim/     ← Python/FastAPI sandboxed IfcOpenShell service (opt-in)
├── CONFIGURATION.md  ← you are here
└── NoteToDeveloper.md
```

---

## 1 · Prerequisites

| Tool | Min version | How to check |
|---|---|---|
| Node | 20.x or 24.x | `node -v` |
| pnpm *or* npm | pnpm 9+ / npm 10+ | `pnpm -v` / `npm -v` |
| PostgreSQL | 14+ | `psql -V` |
| openssl | any recent | `openssl version` |
| ffmpeg | 6.x+ (needed for `/api/search/video`) | `ffmpeg -version` |
| Docker + docker compose | **(for BIM sandbox only)** | `docker version` |
| Python | 3.11+ **(BIM sandbox only, when running outside Docker)** | `python3 --version` |
| Expo CLI | optional, `npx expo` works | `npx expo --version` |

Verify ffmpeg + openssl are on PATH:

```bash
command -v ffmpeg openssl
```

---

## 2 · Database (Postgres)

### 2.1 Create the database

Pick ONE of:

**Local Postgres**

```bash
sudo -u postgres psql <<'SQL'
CREATE USER constructhub WITH PASSWORD 'change-me-strong';
CREATE DATABASE constructhub OWNER constructhub;
GRANT ALL PRIVILEGES ON DATABASE constructhub TO constructhub;
SQL
```

**Docker Postgres (faster for first run)**

```bash
docker run -d --name ch-pg \
  -e POSTGRES_USER=constructhub \
  -e POSTGRES_PASSWORD=change-me-strong \
  -e POSTGRES_DB=constructhub \
  -p 5432:5432 \
  postgres:16
```

### 2.2 Enable the two extensions the search module needs

```bash
psql postgresql://constructhub:change-me-strong@localhost:5432/constructhub -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

(`pgcrypto` is not required; AES is done in Node.)

---

## 3 · Web app `waquor/`

### 3.1 Install deps

```bash
cd waquor
pnpm install              # or `npm install`
```

### 3.2 Configure `.env`

```bash
cp .env.example .env
```

Then edit `.env` and set the **minimum** block (everything else can stay empty — the code is written so missing providers no-op gracefully):

```
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# 32-byte random secrets — generate once:
#   openssl rand -base64 32
NEXTAUTH_SECRET=paste-random-base64-32-here
FIELD_ENC_KEY=paste-another-random-base64-32-here

DATABASE_URL=postgresql://constructhub:change-me-strong@localhost:5432/constructhub?schema=public

ALLOWED_ORIGINS=http://localhost:3000
PAYMENT_DEFAULT_GATEWAY=MOCK
MOCK_PAYMENT_SIGNING_KEY=paste-openssl-rand-hex-32-here

ZATCA_SELLER_NAME=ConstructsHub (dev)
ZATCA_SELLER_VAT=300000000000003
ZATCA_ENV=sandbox

SEARCH_ENGINE=postgres
AI_ESTIMATOR_FREE_PER_MONTH=2
```

Generate secrets quickly:

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "FIELD_ENC_KEY=$(openssl rand -base64 32)"
echo "MOCK_PAYMENT_SIGNING_KEY=$(openssl rand -hex 32)"
```

### 3.3 Apply Prisma schema + search indexes

```bash
pnpm exec prisma generate
pnpm exec prisma db push
psql "$DATABASE_URL" -f prisma/migrations/20260401000000_search_indexes/migration.sql
```

The `db push` is destructive-safe for a fresh DB; for an existing prod DB use
`prisma migrate deploy` instead and run the search-indexes SQL file manually.

### 3.4 (optional) Seed demo data

```bash
pnpm exec tsx prisma/seed.ts
```

### 3.5 Start dev server

```bash
pnpm dev
```

Open http://localhost:3000. First-time visit:

1. Click **Register**, create a `Just Normal User` account (password: 10+ chars, mixed case + digit + symbol).
2. Click **Login** → you land on `/dashboard/casual`.

### 3.6 Build + run for production

```bash
pnpm build
pnpm start
```

### 3.7 Run the tests

```bash
pnpm exec tsc --noEmit                      # type-check (should print nothing)
node --import tsx --test tests/*.test.ts    # 93 unit tests, ~1.5s
```

---

## 4 · BIM sandbox `services/bim/` **(opt-in, needed for real IFC parsing)**

Without this, `/api/search/ifc` falls back to the Node text-level parser (clear
response header `X-IFC-Parser: text-fallback`). The sandbox gives you real
IfcOpenShell parsing + NFR-SEC-11 compliance.

### 4.1 Set the shared secret

Generate the same secret for both sides:

```bash
export BIM_SERVICE_TOKEN=$(openssl rand -hex 32)
```

Add it to `waquor/.env`:

```
BIM_SERVICE_URL=http://localhost:8081
BIM_SERVICE_TOKEN=<paste the same value>
```

### 4.2 Launch with Docker (recommended)

```bash
cd services/bim
BIM_SERVICE_TOKEN=$BIM_SERVICE_TOKEN docker compose up --build
```

Enforces: `read_only` root FS, `tmpfs /uploads`, `cap_drop ALL`, no outbound
internet (`networks.bim-internal: internal: true`), 4 GB memory, 256 PIDs.

### 4.3 Smoke-test the sandbox directly

```bash
# From the host, through the exposed reverse proxy on 127.0.0.1:8081
curl -s http://127.0.0.1:8081/health
# { "ok": true, "version": "0.1.0", "ifcopenshell": "0.8.1" }
```

### 4.4 Launch without Docker (dev convenience only, no sandboxing)

```bash
cd services/bim
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
BIM_SERVICE_TOKEN=$BIM_SERVICE_TOKEN uvicorn app.main:app --host 127.0.0.1 --port 8081
```

### 4.5 Run the Python tests

```bash
cd services/bim
pip install -e '.[dev]'
pytest -q
```

---

## 5 · Mobile app `mobile/` **(opt-in)**

### 5.1 Install

```bash
cd mobile
npm install
```

### 5.2 Point it at your dev web app

Edit `mobile/app.json` → `expo.extra.apiBaseUrl` to one of:

- Device + web app on the same machine → `"http://localhost:3000"`
- Device over LAN → `"http://192.168.X.X:3000"` (your Mac/PC IP)
- Expo Go on your phone → use `expo start --tunnel` and the ngrok URL

### 5.3 Start

```bash
npx expo start
```

Press `i` for iOS Simulator, `a` for Android emulator, or scan the QR with Expo Go.

### 5.4 Test the pure-logic suite

```bash
cd mobile
npm test
```

Runs 6 unit tests against `lib/pure.ts` (VAT math, line totals, relative-time
formatter). No Expo bootstrap required.

### 5.5 What's in the box

| Feature | Where |
|---|---|
| Credentials sign-in | `app/(auth)/login.tsx` |
| Biometric lock + 5-min re-lock | `lib/biometric.ts`, wired in `app/_layout.tsx` |
| Deep links `constructhub://*` | `app/_layout.tsx` → `Linking.addEventListener` |
| Arabic ↔ English + RTL | `lib/i18n.ts`, `i18n/{en,ar}.json`, Settings tab |
| Marketplace + voice + image search | `app/(tabs)/marketplace.tsx` |
| Cart (local SQLite) → Checkout → Order detail with timeline | `app/cart`, `app/checkout`, `app/orders/[id]` |
| Messages: thread list + optimistic chat | `app/(tabs)/messages.tsx`, `app/messages/[threadId].tsx` |
| Worker jobs feed + apply | `app/(tabs)/jobs.tsx` |
| Driver trips inbox + GPS pings | `app/(tabs)/trips.tsx` |
| Contractor tenders + bid submit | `app/(tabs)/tenders.tsx`, `app/tenders/[id].tsx` |
| IFC / PDF / Word / Excel → priced estimate | `app/estimator.tsx` |
| Wallet + estimator quota | `app/(tabs)/profile.tsx` |
| Settings: locale, biometric, notifications | `app/(tabs)/settings.tsx` |
| Offline outbox (durable, FIFO, auto-drains) | `lib/outbox.ts` |
| Error boundary + toast | `components/error-boundary.tsx`, `components/toast.tsx` |

### 5.6 Permissions requested

iOS (`app.json → ios.infoPlist`): Face ID, Camera, Microphone, Location-when-in-use.
Android: `USE_BIOMETRIC`, `CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`.

### 5.7 Deep link URLs

- `constructhub://orders/<id>` → order detail
- `constructhub://messages/<threadId>` → chat
- `constructhub://tenders/<id>` → tender detail
- `constructhub://product/<id>` → product detail

On Android, universal links can be served via `https://constructhub.sa/app/*`
(see `app.json → android.intentFilters`).

---

## 6 · Smoke-test checklist (end-to-end)

Everything below assumes the web app is running on `http://localhost:3000`.

### 6.1 Register + login

```bash
# Register
curl -s -X POST http://localhost:3000/api/register \
  -F 'userType=Just Normal User' \
  -F 'fullName=Smoke Tester' \
  -F 'email=smoke@example.com' \
  -F 'password=Correct!Horse-Battery-9' \
  | jq .

# Login (NextAuth credentials endpoint)
curl -s -c /tmp/ch-cookie.txt -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'email=smoke@example.com&password=Correct!Horse-Battery-9&redirect=false&json=true' \
  http://localhost:3000/api/auth/callback/credentials
```

### 6.2 Search

```bash
curl -s "http://localhost:3000/api/search?q=cement&kinds=PRODUCT" | jq '.total,.tookMs,.hits[0]'

curl -s "http://localhost:3000/api/search/autocomplete?q=cem" | jq '.hits,.tookMs'
```

Response headers include `X-Search-Engine: POSTGRES` and `Server-Timing: search;dur=NN`.

### 6.3 Clarify an ambiguous query

```bash
curl -s -X POST http://localhost:3000/api/search/clarify \
  -H 'Content-Type: application/json' \
  -d '{"q":"something for my roof"}' | jq .
```

Returns up to 3 clarifying questions.

### 6.4 IFC upload → priced estimate (uses sandbox when configured)

```bash
curl -s -b /tmp/ch-cookie.txt -X POST \
  "http://localhost:3000/api/search/ifc" \
  -F "file=@/path/to/your.ifc" \
  | jq '.analysis.schema, .analysis.entityCounts, .estimate.totals'
```

Watch the `X-IFC-Parser` header: `bim-service` if the sandbox is reachable, `text-fallback` otherwise.

### 6.5 Document upload (PDF/Excel/Word)

```bash
curl -s -b /tmp/ch-cookie.txt -X POST \
  "http://localhost:3000/api/search/document" \
  -F "file=@/path/to/boq.xlsx" \
  | jq '.analysis.kind, .analysis.lineCount, .estimate.totals'
```

### 6.6 ZATCA Phase-1 invoice

Place a dummy order then:

```bash
curl -s -b /tmp/ch-cookie.txt \
  "http://localhost:3000/api/orders/<order-id>/invoice?format=json" | jq .qr
```

### 6.7 Mock payment simulation (admin only)

```bash
# As an admin, after creating a MOCK-gateway payment:
curl -s -b /tmp/ch-cookie.txt -X POST \
  http://localhost:3000/api/payments/mock/simulate \
  -H 'Content-Type: application/json' \
  -d '{"orderId":"<order-id>","outcome":"succeeded"}'
```

### 6.8 BIM sandbox health (admin only)

```bash
curl -s -b /tmp/ch-cookie.txt http://localhost:3000/api/admin/bim/health | jq .
```

### 6.9 AI Estimator quota

```bash
curl -s -b /tmp/ch-cookie.txt http://localhost:3000/api/me/estimator-quota | jq .
```

After the 3rd estimate request a non-subscriber gets:

```
HTTP/1.1 402 Payment Required
{"error":"AI Estimator free quota exhausted this month","quota":{...},"upgrade":{...}}
```

---

## 7 · Optional integrations (set env, restart)

Each is independently optional. Leave blank → that provider no-ops.

| Capability | Env vars | Doc |
|---|---|---|
| **SendGrid email** | `SENDGRID_API_KEY`, `MAIL_FROM`, `MAIL_FROM_NAME` | [SendGrid v3](https://docs.sendgrid.com/api-reference/mail-send/mail-send) |
| **Twilio SMS** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` or `TWILIO_MESSAGING_SERVICE_SID` | [Twilio SMS](https://www.twilio.com/docs/sms) |
| **FCM push** | `FCM_SERVICE_ACCOUNT_JSON` **or** `FCM_SERVICE_ACCOUNT_FILE` | [FCM HTTP v1](https://firebase.google.com/docs/cloud-messaging) |
| **OpenAI Whisper (voice)** | `OPENAI_API_KEY`, optional `OPENAI_STT_MODEL=whisper-1` | — |
| **Deepgram (voice)** | `DEEPGRAM_API_KEY` | — |
| **Local whisper.cpp (voice)** | `WHISPER_LOCAL_URL=http://host:8080/inference` | — |
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; webhook → `POST /api/webhooks/STRIPE` | — |
| **Polar.sh** | `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`; webhook → `POST /api/webhooks/POLAR` | — |
| **OpenSearch** | `SEARCH_ENGINE=opensearch` (or `dual`), `OPENSEARCH_URL`, optional `OPENSEARCH_USER`/`OPENSEARCH_PASSWORD` | — |
| **BIM sandbox** | `BIM_SERVICE_URL`, `BIM_SERVICE_TOKEN` | §4 |
| **Social connectors** | `X_CLIENT_ID`/SECRET, `LINKEDIN_CLIENT_ID`/SECRET, `FACEBOOK_APP_ID`/SECRET, `TIKTOK_CLIENT_KEY`/SECRET | — |
| **ZATCA Phase-2** | `ZATCA_ENV`, `ZATCA_SELLER_NAME`, `ZATCA_SELLER_VAT`, `CRON_DISPATCH_SECRET`, `FIELD_ENC_KEY` | §7.1 below |

### 7.1 ZATCA Phase-2 (Fatoora) — the complete env matrix

The Phase-2 pipeline (`lib/zatca/signing.ts` + `lib/zatca/fatoora.ts` + `lib/zatca/csid.ts` + `lib/zatca/persist.ts`) reads the following env vars. Any key the code uses but you leave unset degrades gracefully — never fatally — in the direction documented below.

| Env var | Required when | Default | Used by |
|---|---|---|---|
| `ZATCA_ENV` | always (prod + staging) | `sandbox` | `lib/zatca/fatoora.ts fatooraBase()` — picks `developer-portal` / `simulation` / `core` on `gw-fatoora.zatca.gov.sa`. |
| `ZATCA_SELLER_NAME` | fallback when no vendor name is on the Order | `ConstructsHub` | Phase-1 QR + Phase-2 invoice body. |
| `ZATCA_SELLER_VAT` | fallback when the vendor has no `licenseNumber` on their profile | `300000000000003` | Phase-1 QR + Phase-2 invoice body. |
| `FIELD_ENC_KEY` | **required** for Phase-2 (device private keys are AES-GCM encrypted at rest via `lib/crypto-field.ts`) | — | `lib/zatca/csid.ts encryptPrivateKey`. Without it, Phase-2 is unavailable and the invoice route silently falls back to Phase-1. |
| `CRON_DISPATCH_SECRET` | required to arm the hourly `POST /api/cron/dispatch-zatca` CronJob | — | `src/app/api/cron/dispatch-zatca/route.ts verifySecret()`. Compared constant-time against the `x-cron-secret` request header. |

Device credentials — compliance CSID + production CSID — are NOT env vars. They are issued by the Fatoora portal and stored in the `FatooraDeviceCredential` table after you walk the onboarding flow:

1. `POST /api/admin/zatca/onboard` with `{ stage: 'CSR', deviceName, commonName, organisationName, vatNumber, businessCategory, solutionName, env }` → generates the EC secp256k1 key + CSR, persists the private key encrypted.
2. `POST /api/admin/zatca/onboard` with `{ stage: 'COMPLIANCE', deviceId, otp }` where `otp` is the one-time password you grab from the Fatoora developer portal → returns the `complianceCertB64` + `complianceSecret` and advances the device to `COMPLIANCE`.
3. (Later, after your compliance submissions clear) `POST /api/admin/zatca/onboard` with `{ stage: 'PRODUCTION', deviceId, requestId }` → swaps the compliance CSID for a production CSID.

The signed-invoice path (`src/app/api/orders/[orderId]/invoice/route.ts`) picks the `PRODUCTION` device if available, falls back to the `COMPLIANCE` device on `sandbox`/`simulation`, and finally falls back to Phase-1 if no device credential exists. The response header `X-ZATCA-Phase` reports which path ran.

### 7.2 Dry-run script `scripts/zatca-dryrun.ts`

Exercises the full Phase-2 pipeline (sign → submit → persist → QR decode) end-to-end against either a mocked Fatoora or the real sandbox:

```bash
# Mock mode (default) — safe, no network traffic. Generates a one-off key +
# self-signed cert, builds + signs one standard-01 + one simplified-02
# invoice, intercepts the Fatoora POST, writes decoded QRs + submission
# outcomes to scripts/.dryrun-output/{standard-01,simplified-02}.json
cd waquor
ZATCA_DRYRUN_MODE=mock npx tsx scripts/zatca-dryrun.ts

# Sandbox mode — requires real Fatoora developer-portal credentials.
# ZATCA_CSID_TOKEN_B64        — binarySecurityToken from the compliance CSID
# ZATCA_CSID_SECRET           — password half of the Basic auth
# ZATCA_CSID_CERT_PEM         — PEM form of the compliance certificate
# ZATCA_DEVICE_PRIVATE_KEY_PEM — EC secp256k1 PKCS#8 PEM (device key)
# ZATCA_DEVICE_PUBLIC_KEY_PEM  — EC secp256k1 SPKI PEM (device key)
ZATCA_DRYRUN_MODE=sandbox ZATCA_ENV=sandbox \
  ZATCA_CSID_TOKEN_B64=… ZATCA_CSID_SECRET=… ZATCA_CSID_CERT_PEM="$(cat cert.pem)" \
  ZATCA_DEVICE_PRIVATE_KEY_PEM="$(cat key.pem)" \
  ZATCA_DEVICE_PUBLIC_KEY_PEM="$(cat pub.pem)" \
  npx tsx scripts/zatca-dryrun.ts
```

The script never writes to the DB. In sandbox mode it does make real HTTPS requests to `gw-fatoora.zatca.gov.sa` with the credentials from env, so run it with care.

---

## 8 · Admin bootstrap (prod only)

The register endpoint cannot create an admin. In production, promote your first
user manually:

```bash
psql "$DATABASE_URL" -c "UPDATE \"User\" SET \"userType\" = 'Platform Admin' WHERE email = 'you@company.com';"
```

Dashboards gated behind `role === 'USR_ADMIN'`:

- `/dashboard/admin` (KPIs)
- `/dashboard/admin/users`, `/verifications`, `/disputes`, `/audit`, `/support`
- `/dashboard/admin/config` (feature flags + commission)
- `/dashboard/admin/search` (query analytics + synonym editor)

---

## 9 · Operations

### 9.1 Scheduled jobs you must wire externally

The code assumes a cron will hit these (none are built-in):

| Interval | Call | Why |
|---|---|---|
| every 15 min | `GET /api/admin/* `(internal reconciliation TBD) | 72-h escrow auto-release (SRS C-16) + daily ZATCA reporting |
| every hour | — | Cleanup expired `DeviceToken` + stale `SearchSynonym` cache refresh |
| nightly | `pnpm exec tsx scripts/reindex.ts` (TODO) | Full search reindex |

A thin cron file lives in `NoteToDeveloper.md` P0.6 — follow-up.

### 9.2 Health probes

| URL | Purpose |
|---|---|
| `GET /api/admin/search/health` | Postgres + OpenSearch health |
| `GET /api/admin/bim/health` | BIM sandbox health |
| `GET /api/notifications/test` | Which notification providers are configured |

### 9.3 Logs

- Node structured logs go to stdout (`[audit] {...}` lines).
- The `AuditEvent` Prisma table stores sign-in failures, permission denials,
  money movements, and search slow queries. Expose it to Loki/CloudWatch in
  prod.

---

## 10 · Troubleshooting cheat-sheet

| Symptom | Fix |
|---|---|
| `pnpm dev` says `NEXTAUTH_SECRET must be set in production` | You set `NODE_ENV=production` but no secret — either lift `NODE_ENV` or set a real secret. |
| Autocomplete returns empty | Confirm `CREATE EXTENSION pg_trgm` ran + `prisma/migrations/20260401000000_search_indexes/migration.sql` was applied. |
| `/api/search/ifc` says `503 ifcopenshell is not installed` | Either start the Docker sandbox (§4.2), or set no `BIM_SERVICE_URL` so the Node text parser handles it. |
| `/api/search/voice` returns 500 "No STT provider configured" | Set at least one of `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `WHISPER_LOCAL_URL`. |
| `402 Payment Required` on IFC/doc estimate | Expected — you hit the `AI_ESTIMATOR_FREE_PER_MONTH` cap. Raise it in `.env` or subscribe the user to the `AI_ESTIMATOR` plan. |
| `/api/webhooks/STRIPE` → 503 | Set `STRIPE_WEBHOOK_SECRET`. |
| ZATCA Phase-2 unused (header shows `X-ZATCA-Phase: 1`) | Nothing wrong — no `FatooraDeviceCredential` has reached `COMPLIANCE` or `PRODUCTION` stage yet. Call `POST /api/admin/zatca/onboard` to do that. |
| Mobile app can't reach API from a real phone | Use `expo start --tunnel` or set a LAN IP in `app.json → expo.extra.apiBaseUrl`. |
| `prisma db push` warns about data loss | A model field changed types; back up first, then confirm. |
| `next build` → "Dynamic server usage" errors | Something you added uses `cookies()`/`headers()` in a static route; add `export const dynamic = 'force-dynamic'`. |

---

## 11 · Minimum viable "launch tomorrow" checklist

Non-negotiables before production traffic:

- [ ] `NEXTAUTH_SECRET`, `FIELD_ENC_KEY`, `MOCK_PAYMENT_SIGNING_KEY` are real 32-byte values in a secret manager (not in `.env`)
- [ ] Postgres is in-region per NFR-CMP-02
- [ ] `PAYMENT_DEFAULT_GATEWAY` is set to a licensed Saudi gateway (not `MOCK`)
- [ ] `ALLOW_MOCK_PAYMENTS_IN_PROD` is **unset**
- [ ] ZATCA device onboarded to `PRODUCTION` stage
- [ ] At least one admin user created (see §8)
- [ ] HTTPS termination in front of the Node process (HSTS header is set in `middleware.ts` when `NODE_ENV=production`)
- [ ] Reverse proxy forwards `X-Forwarded-For` (used by `lib/security.ts getClientIp`)
- [ ] Backups configured — daily full + continuous WAL
- [ ] Pen test closed (NFR-SEC-14)

The remaining items are in `NoteToDeveloper.md`.

---

Good hunting.

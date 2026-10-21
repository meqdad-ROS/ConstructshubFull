# WAF Rule Set — Construct-Hub Edge Protection

**Owner:** platform-security
**Target vendor-neutral:** Cloudflare WAF / AWS WAFv2 / Azure Front Door /
Fastly / Akamai — rules below are expressed as `IF <match> THEN <action>` so
any ModSecurity-shaped engine or managed-ruleset vendor can translate them.
**Status at 2026-10-21:** no WAF deployed yet. This file is the review target
when a WAF is wired. SRS §13 (Security) + NFR-SEC-05, SEC-06, SEC-09, SEC-14.
**Last reviewed:** 2026-10-21

The in-app `middleware.ts` already handles CSP / HSTS / HSTS-preload / Origin
checks / auth gating. What this document covers is the edge layer we DO NOT
have yet — the one that stops bad traffic BEFORE it reaches the origin and
burns our Prisma connection budget. The ordering is deliberate: the rules
near the top are the cheapest for the edge to evaluate and reject.

## How to read the table

Each rule names:

- **Rule** — a short slug.
- **Match** — the attacker request shape, phrased in CRS/ModSec vocabulary.
- **Action** — one of **BLOCK 403**, **BLOCK 429**, **CHALLENGE** (interactive
  JavaScript challenge or managed captcha), **LOG**.
- **Scope** — the URL path(s) this rule gates. A rule that applies to the
  whole origin says `*`.
- **Signal source** — the symptom we expect to see in our observability if
  this rule starts firing legitimately (so we know to tune it down, not up).

Every rule has a per-IP exemption lane for the `/api/webhooks/[gateway]`
family — payment providers egress from stable prefixes we allowlist by name,
and signed-request verification already runs in-app, so an edge rule that
blocks their egress IPs is a worse outcome than letting a signed webhook
through. See **Rule WAF-10**.

---

## The 10 rules

### WAF-1 — Rate limit per IP (anti-abuse, anti-brute-force)

- **Match:** more than **120 req/min** or **12 req/sec** per source IP, any
  path, any method.
- **Stricter path overrides:**
  - `/api/auth/*` → **10 req/min** per IP (credential stuffing).
  - `/api/register` → **5 req/5 min** per IP (sign-up spam).
  - `/api/payments/*` → **30 req/min** per authenticated user (payment flood,
    carding — see WAF-5 for the pattern layer).
  - `/api/trips/*/ping` → bypass this global limit (the mobile outbox batches
    every second; the in-app `rateLimit()` is the real cap).
- **Action:** **BLOCK 429** with a `Retry-After` header. Above 1000 req/min
  the edge adds the source IP to a 15-minute **CHALLENGE** list.
- **Scope:** `*` (with overrides above).
- **Signal source:** `/metrics` route-latency 429 count per route; also
  `AnalyticsEvent{event:'auth.login_failed'}` spike for the auth override.

### WAF-2 — Country / ASN posture

- **Match:** source country not in **{SA, JO, AE, BH, KW, OM, QA, EG, PS, LB,
  US, GB, DE, SG}** AND path begins with `/dashboard/admin*` OR
  `/api/admin/*` OR `/api/cron/*`.
- **Action:** **BLOCK 403**. Everything else from "unexpected" geographies
  gets **CHALLENGE** instead of block (regular users may travel).
- **Scope:** admin + cron prefixes.
- **Signal source:** our admin user roster is small; a legitimate admin
  logging in from an untracked country should file an exception, not route
  around this rule. Pair with **WAF-3** (cron secret).

### WAF-3 — Cron endpoints require a shared secret

- **Match:** path is `/api/cron/*` AND the `x-cron-secret` header is missing
  OR the client IP is not on the k8s CronJob egress NAT allowlist.
- **Action:** **BLOCK 403**.
- **Scope:** `/api/cron/*`.
- **Signal source:** these routes are also guarded in-app by
  `constantTimeEqual(provided, CRON_DISPATCH_SECRET)` — the edge rule is
  defence-in-depth. If this rule starts logging, someone's scanning for an
  unauthenticated cron. Match that against the cron job logs.

### WAF-4 — SQL injection + NoSQL injection patterns

- **Match:** classic Core-Rule-Set SQLi + MongoDB payload shapes in any
  request header, query string, or (where parseable) JSON body:
  - `(?i)(?:union\s+select|'[\s]+or[\s]+'1'='1|/\*!50000)`
  - `(?i)(\$where|\$ne|\$gt|\$regex)\s*:` in a JSON value
  - `(?i)(?:xp_cmdshell|exec\s*\(|char\s*\(0x)`
- **Action:** **BLOCK 403** with the matched pattern name logged for triage.
- **Scope:** `*`. Zod validates request bodies in-app for most routes, but
  not all headers (and never query strings) are schema-checked.
- **Signal source:** CRS matches should round to zero against legitimate
  Construct-Hub traffic — construction search terms don't look like SQL.
  A rising rate here is pen-test traffic or an active exploit campaign.

### WAF-5 — Payment-abuse detection (anti-carding)

- **Match:** `POST /api/payments` AND one of:
  - More than **5 declined payments** for the same user in 10 minutes
    (declines are reported via `payment.failed` webhooks — surfaced through
    the WAF via a trailing-counter / managed-rules "financial" bucket).
  - More than **20 distinct `providerRef` values** created by the same user
    in 1 hour.
  - `User-Agent` is on the known-carding bot list (CRS 920350 managed set).
- **Action:** **CHALLENGE** on the first trigger, **BLOCK 403** on the
  second within a 1-hour window.
- **Scope:** `/api/payments*`, `/api/webhooks/*` (log-only — webhooks are
  the SIGNAL for this rule, not its subject).
- **Signal source:** `AnalyticsEvent{event:'payment.failed'}` and
  `payment.amount_mismatch` audit entries both climb when carding starts.

### WAF-6 — File upload size, type, and extension gates

- **Match:** `POST` or `PUT` to any route whose `Content-Type` is
  `multipart/form-data`:
  - `Content-Length > 25 MB` for `/api/search/*` (document/image search).
  - `Content-Length > 100 MB` for `/api/bim/*` (IFC upload).
  - `Content-Length > 5 MB` for all other upload routes (fallback cap).
  - **Reject on extension** by the filename in the `Content-Disposition`
    header: deny `.exe .com .bat .cmd .scr .ps1 .vbs .msi .msp .msu .cpl
    .dll .so .jar .war .ear .php .phtml .py .rb .pl .asp .aspx .jsp .cgi`.
  - **Reject on magic bytes** (vendor-managed set) for executable formats
    even if the extension is spoofed.
- **Action:** **BLOCK 403**. The response body is a plain string, not JSON,
  so an exploit cannot distinguish a WAF block from a 404.
- **Scope:** `/api/search/*`, `/api/bim/*`, `/api/*` (fallback).
- **Signal source:** `RouteMetric{status: 413}` spike; also the server-side
  Zod schemas on `multipart/form-data` already reject most of these.

### WAF-7 — Prompt-injection surface for LLM endpoints

- **Match:** `POST` to `/api/search/clarify`, `/api/search/unified`,
  `/api/search/ocr`, OR a future `/api/assistant/*` AND the request body
  contains ≥ 2 of:
  - Markdown tool-call shapes: `<tool_call`, `<function_call`,
    `{"tool_name":`.
  - Known injection phrases (English + Arabic): `ignore (previous|all)
    instructions`, `disregard system`, `you are now (DAN|unfiltered)`,
    `print all (env|secrets|api keys)`, `تجاهل .{0,40}التعليمات`.
  - Zero-width characters (`​`–`‏`, `﻿`) in a text field.
- **Action:** **LOG** at first (don't break legitimate queries that happen
  to contain one of these phrases — see `lib/llm-guard.ts`
  `detectInjectionPatterns`). Promote to **CHALLENGE** when the same IP
  trips the rule 3× in 10 minutes.
- **Scope:** LLM-touching routes.
- **Signal source:** `[llm.interpret] prompt-injection signals: [...]`
  structured log lines. The in-app guard already fences every user string
  in `<untrusted_input>` tags and rejects tool-call-shaped output — this
  edge rule is one layer earlier so the model never has to spend tokens
  resolving an obvious attack.

### WAF-8 — Credential and PII in URL / query string / log stream

- **Match:** request URL or query string contains any of:
  - 15-digit VAT numbers → `/\b\d{15}\b/`
  - 24-digit Saudi IBANs → `/\bSA\d{22}\b/i`
  - 11-digit Jordan IBANs with the JO prefix → `/\bJO\d{2}[A-Z]{4}\d{22}\b/i`
  - 16-digit PAN candidates → `/\b(?:\d[ -]*?){13,19}\b/` **and** passes a
    Luhn checksum.
  - A `password=` or `access_token=` query parameter.
- **Action:** **BLOCK 403** with the matched kind in the edge log line
  (never the matched value — the WAF log itself must not become a PII sink).
- **Scope:** `*`. GETs with PII in the URL are either a client bug or an
  attacker trying to log-poison us. Our server routes never accept PII in a
  query string.
- **Signal source:** The in-app `safeError()` strips Prisma stack traces,
  but it cannot strip a URL that reached the HTTP log. This rule stops the
  URL ever landing in the log in the first place.

### WAF-9 — Path traversal, open redirect, SSRF-shaped parameters

- **Match:** any of:
  - URL-decoded path or query contains `..%2f`, `..%5c`, `%252e%252e`.
  - Any query parameter named `url`, `redirect`, `return_to`,
    `continue`, `callback`, `next` whose value points at a host OTHER than
    `*.constructhub.sa`, `*.constructhub.jo`, our dev domains, or an
    allowlisted payment-provider domain (`*.stripe.com`, `*.moyasar.com`,
    `*.polar.sh`).
  - Any query parameter whose value is an IP in `10.0.0.0/8`,
    `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16`.
- **Action:** **BLOCK 403**.
- **Scope:** `*`. The in-app `isSafeExternalUrl()` in `lib/security.ts`
  catches SSRF on the server side; this is defence-in-depth at the edge.
- **Signal source:** `[security.isSafeExternalUrl] blocked ...` log entries
  should round to zero when this rule is live.

### WAF-10 — Payment-provider webhook allowlist

- **Match:** `POST /api/webhooks/{gateway}` AND the source IP is NOT in the
  vendor's published IP range for `{gateway}`:
  - `STRIPE` → `api.stripe.com` egress ranges published monthly.
  - `MOYASAR` → `api.moyasar.com` ingress ranges from merchant docs.
  - `POLAR` → `webhook.polar.sh` ranges.
  - `MOCK` → BLOCK except from `127.0.0.0/8` AND
    `NODE_ENV !== 'production'`.
- **Action:** **BLOCK 403** for mismatched (gateway, IP) pairs.
- **Scope:** `/api/webhooks/*`.
- **Signal source:** the HMAC verification in each provider's
  `verifyWebhook()` is the ground truth — an edge block is a cheaper NO,
  not a replacement for the cryptographic check. If the vendor rotates
  their egress range faster than we update this allowlist, we fall back
  to HMAC and surface a `[webhook] source-ip-not-in-allowlist` warning so
  ops can push a config change.

---

## Rules we considered but did NOT include

- **Managed OWASP CRS at paranoia 3+**: the false-positive rate against
  construction search queries ("4x8 steel pipes", "excavator for rent")
  is too high. Keep paranoia at 1 and add targeted rules above instead.
- **Device fingerprinting (JA3/JA4)**: valuable for anti-fraud but requires
  a vendor signal (Cloudflare Bot Management, Shape, Datadome). File a
  separate decision when a vendor is chosen.
- **Geolocation block for Jordan during Saudi-first rollout**: no — the
  marketplace is dual-region by SRS §1 scope. See WAF-2 for the geofence
  that IS acceptable (admin paths only).

## Rollout plan

1. Deploy all 10 rules in **LOG-only** mode for 7 days against staging + 25%
   of production traffic.
2. Review the `AnalyticsEvent{event:'waf.hit'}` + edge logs for false
   positives per rule. Tune the per-path overrides.
3. Promote to BLOCK rule-by-rule in the order **WAF-10 → WAF-3 → WAF-4 →
   WAF-8 → WAF-9 → WAF-6 → WAF-1 → WAF-5 → WAF-7 → WAF-2**. Rules with the
   smallest false-positive risk go live first.
4. Target end-state: all 10 rules in BLOCK or CHALLENGE mode within 21 days
   of the vendor sign-up.

## Who edits this file

Any change to the rule set lands as a PR that:

1. Updates this document.
2. Attaches the sibling vendor-specific YAML / Terraform manifest in the
   same PR (one file per vendor; the exact filename lives next to this one
   once a vendor is chosen).
3. Lists the operational playbook change in the ops runbook.

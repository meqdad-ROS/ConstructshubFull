# BanahBuild / ConstructsHub — Project Progress & Handoff

> **Audience:** any AI agent (or human developer) picking up this project with no prior conversation context.
> **Last updated:** 2026-10-18
> **Latest commit on `main`:** `36e72b1 full project before vacation complete`

Read this file first. It is self-contained: every claim about the codebase is anchored to a path, a model, or a verifiable command. Nothing here depends on earlier conversation turns.

---

## 1. What this project is

A dual-marketplace + project-management platform for the construction sector in **Saudi Arabia + Jordan**. One account can play six roles that the capability matrix (SRS §4.3) gates: **Casual buyer, Owner, Consultant, Contractor, Supplier, Worker, Driver, Admin** (plus `USR_` codes in `lib/roles.ts`). Everything flows through the SRS Master v2.0 (`ConstructsHub-Requirements/To-keep/ConstructsHub_SRS_v1.0.*`), which is the source of truth for scope and section numbering (`§6.3 search`, `§8.6 ZATCA`, `§9.3 notifications`, `§15.4 mobile`, etc.).

The repo lives at `/home/meqdad/My-Projects/Construct-Hub_Project` and has three deployable surfaces:

| Surface | Path | Stack | Status |
|---|---|---|---|
| **Web app** | `waquor/` | Next.js 15 App Router, Prisma 6, TypeScript, Zod, TanStack Query, Tailwind | **80 pages · 82 API routes · 74 Prisma models · 117 passing tests** |
| **Mobile app** | `mobile/` | Expo SDK 52, Expo Router 4, React Native 0.76, TanStack Query, expo-sqlite, biometric gate, FCM/APNs push | **~32 screens · 6 passing pure-logic tests · needs `npm install` locally** |
| **BIM service** | `services/bim/` | Python FastAPI + IfcOpenShell, HMAC-signed, Docker-sandboxed (read-only root, tmpfs, `cap_drop ALL`, no outbound network) | **FastAPI + 11 pytest cases · Docker image + compose complete** |

Four other things live at the repo root:
- `ConstructsHub-Requirements/` — SRS, scenarios, "to keep" vs "to not use". Do not delete the deleted files you see in `git status`; the user is cleaning up the old folder.
- `CONFIGURATION.md` — runbook for env vars, provider onboarding, feature flags.
- `NoteToDeveloper.md` — the running P0/P1/P2 punch list (not yet in the current status file).
- `.claude/` — session scratch; ignore.

---

## 2. Where things stand today — the honest table

Columns are **Done % · Done so far · Still open**. Percentages are my own best-effort estimate against the SRS checklist, not a measured burn-up.

### 2.1 Backend / data

| Area | Done % | Done so far | Still open |
|---|---:|---|---|
| Prisma data model (SRS §14.3) | 95 | 74 models in `waquor/prisma/schema.prisma` — users, orgs, catalogue, orders, projects, tenders+bids, jobs+applications, trips+vehicles+pings, escrow+ledger+payouts+wallet, invoices (ZATCA PIH chain), BIM jobs, estimator usage, social accounts/posts, deviceTokens, notifications+prefs, searchEvent, auditEvent, **AnalyticsEvent, RouteMetric** (added this session) | Multi-tier Category hierarchy; versioned `PriceBook` with JOD+SAR; SKU variants; bulk CSV import model; sealed-bid cryptography fields |
| REST API surface (SRS §14.2) | 83 | 82 route files under `waquor/src/app/api/**` — orders, projects, tenders+bids+award, rfqs, quotations, messages+threads, trips, vehicles, bookings, deliveries, addresses, auth, admin (search console, verifications, audit, config, disputes, support), payments (Stripe + Polar + Mock), wallet, escrow, payouts, ZATCA onboard+clearance+report, BIM upload+status, search (unified, autocomplete, image, voice, document, ifc, ocr, clarify), social (accounts, callback, posts), notifications (list, prefs, devices, test), analytics (events, me, admin/routes, admin/events), **`POST /api/trips/[tripId]/ping`** + **`GET /api/health`** (2026-10-18, 17 tests green) | trip PATCH `/api/trips/[id]` (mobile calls it); finance-console admin APIs; consent-event listing |
| Scheduler / cron | 10 | None wired yet. Fields present (`EscrowHold.releaseAfter`, `scheduledFor` on `SocialPost`, 24-h ZATCA reporting trigger) | All of it — need any cron (BullMQ / `node-cron` / platform CronCreate). First three jobs: 72-h auto-release of escrow, 24-h ZATCA reporting, scheduled social posts |

### 2.2 Dashboards & analytics (this is the slice just finished)

| Area | Done % | Done so far | Still open |
|---|---:|---|---|
| **Web role dashboards** | 100 | Admin, Casual, Consultant, Contractor, Driver, Owner, Supplier, Worker — each is now wired to real Prisma data (`waquor/src/app/dashboard/*/page.tsx`) | — |
| **Per-role analytics pages (web)** | 100 | `/dashboard/{casual,owner,contractor,supplier,worker,driver,admin}/analytics` — supplier existed; the other six were built this session using the shared `components/dashboard/AnalyticsBoard.tsx`. Each page shows tiles tailored to the role (orders, spend, bids, win rate, applications, trips, earnings, etc.) + a "Unread notifications" tile linking to `/dashboard/notifications` + a "Top events" + "Recent events" feed sourced from `AnalyticsEvent` | — |
| **Admin platform analytics** | 100 | `/dashboard/admin/analytics` is a client page with (a) **Route latency board** — p50/p95/p99/avg/errors/count per route, 1 h / 24 h / 7 d / 30 d window, p95 cell goes red above the 500 ms NFR-PER-02 budget; (b) **Product events board** — top events, by-role breakdown, DAU rows, firehose last 50 events | — |
| **Event pipeline (SRS §15.6 ANL)** | 90 | `lib/analytics.ts` — `trackEvent`, `recordRouteMetric`, `withMetrics` wrapper, `percentile`, `summariseDurations`, `templateRoute`, `hashSession`. **Ingestion:** `POST /api/analytics/events` (batched, up to 50 events/call, used by both web and mobile). **Query:** `GET /api/analytics/me?days=N`, `GET /api/admin/analytics/routes?hours=N`, `GET /api/admin/analytics/events?days=N`. Fire-and-forget writes — analytics outages never break traffic. PII guard: sessionId is a 32-char SHA-256 hash so PDPL erasure drops user link without losing aggregates | Instrumenting the remaining routes with `withMetrics` so RouteMetric fills from more than just manual calls; a cron that aggregates RouteMetric older than 30 d and drops rows; a cron that aggregates AnalyticsEvent older than 90 d (PDPL NFR-CMP-07) |
| **p95 Grafana / Datadog export** | 20 | Internal p95 is on the admin page. No external exporter yet | OpenMetrics `/metrics` endpoint; or wire Datadog agent / Grafana Loki scraper to tail the `RouteMetric` table. Dashboards configured externally |
| **Mobile analytics screen** | 100 | `mobile/app/analytics.tsx` — role-aware tiles (same 6 role shapes), unread-notifications tile, event activity, recent events. Reached from Profile tab under "Analytics" | — |
| **Mobile notifications screen** | 100 | `mobile/app/notifications.tsx` — list, mark-read (per item), mark-all-read, unread accent border. Reached from Profile tab under "Notifications" | — |

### 2.3 Event-driven notifications (this is the other slice just finished)

| Event | Trigger | Fan-out (channels) | Code path |
|---|---|---|---|
| **Order placed** | `POST /api/orders` | Buyer: email + push + in-app · Vendor (supplier): email + push + in-app | `lib/notify-events.ts → orderPlaced` |
| **Order status change** | (future `PATCH /api/orders/[orderId]`) | Buyer: email + push + in-app; **SMS added on SHIPPED/DELIVERED** · Vendor on CANCELLED | `orderStatusChanged` (helper live, caller still to wire into PATCH route) |
| **Project launched** | `POST /api/projects` | Owner: email + push + in-app. **If project is public:** broadcasts push + in-app to up to 500 Contractors/Consultants | `projectCreated` |
| **Tender published** | `POST /api/tenders` | Broadcasts push + in-app to up to 1000 Contractors/Consultants/Suppliers | `tenderPublished` |
| **Bid received** | `POST /api/tenders/[tenderId]/bids` | Tender owner: email + push + in-app | `bidSubmitted` |
| **RFQ created** | `POST /api/rfqs` | Broadcasts push + in-app to up to 500 Suppliers | `rfqCreated` |
| **Message received** | `POST /api/messages/threads/[threadId]` | Recipient(s): push + in-app, with sender name resolved from `Profile.fullName` | `messageReceived` |
| **Search matched** | `GET /api/search` top-10 hits | **Signal only** — `AnalyticsEvent{event:'search.matched', ownerId}` is recorded. Powers the Supplier "Search impressions" tile and a future daily digest | `searchMatched` |
| **Milestone approved** | (helper live; caller not yet wired) | Payee: email + push + in-app | `milestoneApproved` |
| **Dispute opened** | (helper live; caller not yet wired) | Counterparty: email + push + in-app · All platform admins: in-app | `disputeOpened` |

Every helper also writes an `AnalyticsEvent` row so the dashboard tiles light up without extra wiring. Notifications ride the pre-existing multi-channel pipe (`lib/notifications.ts` → SendGrid + Twilio + FCM; respects `NotificationPref` and `DeviceToken.active`). Any provider that is unconfigured is a silent skip, logged — never fatal.

### 2.4 The rest of the SRS at a glance

| Area | Done % | Still open — the actionable bits |
|---|---:|---|
| **🔎 Search text/autocomplete (§6.3)** | 85 | buildingSMART bSDD full import; load-test to prove P95 ≤ 500 ms at 1 M rows; geo-boost with real haversine distance |
| **🧠 Search NLP / clarify (FR-SRCH-10)** | 75 | Full LLM clarifying dialog beyond the 9-topic heuristic |
| **🗣️ Voice search (FR-SRCH-07)** | 85 | In-app recorder UX (today upload-only); Arabic dialect test corpus |
| **🖼️ Image search (FR-SRCH-08)** | 65 | Real object detector (YOLOv8 via transformers.js or Google Vision) — OCR-only today |
| **🎥 Video search (FR-SRCH-12)** | 70 | Mobile overlay with per-frame boxes |
| **📄 Doc search PDF/DOCX/XLSX (FR-SRCH-09)** | 85 | 2 GB resumable upload; LLM per-row classification; LibreOffice headless for `.doc`/`.ppt` |
| **📐 IFC file search (§6.5)** | 80 | Real IFC fixture integration test in the Docker image; DWG / gbXML parsers; k8s manifest mirroring compose hardening |
| **🧾 ZATCA e-invoicing (§8.6)** | 85 | Fatoora **sandbox dry-run** + production CSID; wire X.509 cert digest into `<ds:Signature>` once CSID is issued; swap approximate c14n for strict XML C14N 1.1 |
| **💳 Payments (§8)** | 70 | Saudi-licensed adapter (Moyasar / HyperPay / PayTabs); BNPL (Tabby/Tamara); refund workflow outside disputes; chargeback webhook per gateway |
| **📱 Mobile app (§15.4)** | 70 | EAS Update signed OTAs; native FCM/APNs tokens in a bare build; message attachments; supplier + owner role screens; Sentry/Bugsnag; per-component RTL polish; push → deep-link handler |
| **🔔 Notifications (§9.3)** | 80 | APNs provider; Twilio status-callback + SendGrid event webhooks persisting delivery state |
| **🗳️ Tendering (§7.3)** | 75 | Sealed-bid cryptography; subcontract package visibility; Gantt |
| **🤝 Trust / disputes (§7.6)** | 55 | Evidence upload with signed URLs; SLA timers + reminders; chargeback integration |
| **🔧 Workforce (§7.4)** | 55 | Time-tracking UI; attendance geofence; worker contract e-sign |
| **🚚 Logistics (§7.5)** | 60 | **`POST /api/trips/[tripId]/ping` ✅ done** (2026-10-18) — auth-gated (`USR_DRIVER` 403 before rate-limit/DB), 1 req/s rate limit, Zod validation (`lat`/`latitude`, `lng`/`longitude`, nullish `accuracyM`/`accuracy`), writes `WorkerLocationPing`, `withMetrics` + `trackEvent('driver.ping')`, returns `{ ok, success, tripStatus, pingId, receivedAt }`; 17 tests. | **`PATCH /api/trips/[tripId]`** still missing (mobile accept/start/complete buttons 404 → outbox). dispatch algorithm; fleet sub-accounts; maps/routing; GPS aggregator |
| **📣 Social connectors (§9.1)** | 70 | Instagram + TikTok publish are stubs returning `ok:true` without hitting real endpoints. Also: LinkedIn URN resolver; Facebook Page-token exchange via `/me/accounts`; X PKCE plain → S256; refresh-token rotation; scheduled-post cron |
| **🤖 AI assistant (§9.4)** | 10 | Entire module |
| **🔐 Security (NFR-SEC)** | 85 | Independent pen test; AI prompt-injection defences; WAF; SBOM + dep-scan in CI |
| **📜 PDPL / compliance (NFR-CMP)** | 55 | Legal registration; in-region hosting; breach playbook; counsel sign-off; 90-d location-data aggregation job |
| **🌐 i18n + Arabic RTL (§12.5)** | 55 | Per-component RTL audit; full catalogue expansion |
| **♿ WCAG 2.1 AA (§12.6)** | 25 | Full audit; keyboard-only flows; screen-reader labels |
| **⚙️ DevOps (§15.5)** | 10 | CI pipeline (GH Actions); web Dockerfile; k8s manifests; blue/green; DR runbook |
| **🧪 Testing** | 30 | Integration tests, E2E (Playwright), load (NFR-SCL-01 10k/50k sessions), OpenAPI contract gen for mobile — all at 0 % |

---

## 3. Repo map an agent needs

```
Construct-Hub_Project/
├── waquor/                                   Next.js 15 app
│   ├── prisma/schema.prisma                  74 models — SOURCE OF TRUTH for data
│   ├── lib/
│   │   ├── analytics.ts                      (NEW) trackEvent, recordRouteMetric, percentile, withMetrics
│   │   ├── notify-events.ts                  (NEW) orderPlaced, projectCreated, bidSubmitted, …
│   │   ├── notifications.ts                  Multi-channel notification orchestrator (SendGrid+Twilio+FCM)
│   │   ├── notifications/{email-sendgrid,sms-twilio,push-fcm}.ts
│   │   ├── permissions.ts                    getSessionUser / requireAuth / role gates
│   │   ├── roles.ts                          RoleCode enum ("USR_*")
│   │   ├── prisma.ts                         Prisma singleton
│   │   ├── search/                           budgets, engine, sync, ontology
│   │   ├── payments/                         Stripe + Polar + Mock adapters
│   │   ├── social/                           5 provider adapters + registry
│   │   ├── zatca.ts, zatca/                  Phase 1 complete + Phase 2 pipeline
│   │   ├── bim/, bsdd.ts
│   │   ├── crypto-field.ts                   AES-GCM for token at rest
│   │   ├── sanctions.ts, llm.ts, i18n.ts, idem.ts, ledger.ts, security.ts, safe-fetch.ts
│   ├── src/app/
│   │   ├── api/analytics/                    (NEW) events, me, admin/routes, admin/events
│   │   ├── api/notifications/                existing GET+PATCH{action: read|read-all|delete|delete-all}
│   │   ├── api/orders, projects, tenders, rfqs, trips, …
│   │   ├── dashboard/
│   │   │   ├── admin/analytics/              (NEW) client page — route p95 + event firehose
│   │   │   ├── casual/analytics/             (NEW)
│   │   │   ├── contractor/analytics/         (NEW)
│   │   │   ├── driver/analytics/             (NEW)
│   │   │   ├── owner/analytics/              (NEW)
│   │   │   ├── worker/analytics/             (NEW)
│   │   │   └── supplier/analytics/           pre-existing
│   │   └── (other dashboards + marketplace + checkout + …)
│   ├── components/dashboard/
│   │   ├── AnalyticsBoard.tsx                (NEW) shared tiles + event feeds
│   │   ├── StatCard.tsx, PageHeader.tsx, DashboardShell.tsx, DataTable.tsx, StatusBadge.tsx
│   ├── middleware.ts                         CSP, HSTS, HMAC, auth gate for /dashboard and /dashboard/admin
│   └── tests/
│       ├── analytics.test.ts                 (NEW) 7 cases — percentile, summariseDurations, templateRoute, hashSession
│       ├── trips-ping.test.ts                (NEW) 17 cases — processPing, role gate, rateLimit, Zod schema, live server
│       └── 19 other suites — 117 passing total
├── mobile/
│   ├── app/
│   │   ├── analytics.tsx                     (NEW) role-aware tiles + event activity
│   │   ├── notifications.tsx                 (NEW) list + mark-read + mark-all
│   │   ├── (tabs)/{marketplace, orders, messages, tenders, jobs, trips, profile, settings}.tsx
│   │   ├── (auth)/login.tsx
│   │   ├── product/[slug].tsx, cart/, checkout/, orders/[id].tsx, messages/[threadId].tsx,
│   │   ├── tenders/[id].tsx, estimator.tsx
│   ├── lib/queries.ts                        (updated) + useAnalyticsMe + useNotificationList
│   ├── lib/{api, session, outbox, cart, biometric, push, i18n, money, pure, theme}.ts
│   ├── components/{ui, toast, error-boundary}.tsx
│   ├── tests/pure.test.ts                    6 passing
│   └── README.md
├── services/bim/                             FastAPI + IfcOpenShell sandbox, Dockerfile + compose
└── ConstructsHub-Requirements/               SRS Master v2.0 + scenarios
```

---

## 4. How to run / verify

From `waquor/`:
```bash
npm install                    # once
npm run typecheck              # tsc --noEmit → should be clean
npm test                       # 117 passing
npx next build                 # 115 pages, 82 API routes, no errors
npx next dev                   # http://localhost:3000
```

From `mobile/`:
```bash
npm install                    # REQUIRED — baseline typecheck fails without it
npm run typecheck              # should be clean after install
npm test                       # 6 passing (pure helpers)
npx expo start                 # press i / a / w
```

From `services/bim/`:
```bash
cd services/bim
docker compose up --build      # sandbox listens on :8000; HMAC headers required
pytest                         # 11 passing
```

Env vars that gate behaviour (full list in `CONFIGURATION.md`):
- `NEXTAUTH_SECRET`, `DATABASE_URL`
- `FIELD_ENC_KEY` — 32-byte base64 for AES-GCM field encryption
- `SENDGRID_API_KEY`, `TWILIO_*`, `FCM_SERVICE_ACCOUNT_JSON` — notification providers (silent-skip if absent)
- `STRIPE_*`, `POLAR_*`, `PAYMENT_PROVIDER` — payment router
- `ZATCA_*` — e-invoicing phase 2 (not yet live)
- `BIM_SERVICE_URL`, `BIM_HMAC_SECRET` — BIM sandbox
- `NEXT_PUBLIC_BASE_URL` — used by `lib/notify-events.ts` to build absolute links in email/push

---

## 5. Gaps — split by owner

### 5.1 Blocks a public launch — someone must do this before paid traffic hits
1. **Saudi-licensed payment adapter** — the Pluggable gateway is ready; a Moyasar / HyperPay / PayTabs implementation needs a merchant account and a provider class in `lib/payments/`.
2. **ZATCA Phase 2 sandbox dry-run** — pipeline is built; need Fatoora sandbox credentials to prove the full flow and finish the xAdES cert digest wire-up.
3. **PDPL registration + in-region hosting** — legal + ops task.
4. **Independent pen test** (NFR-SEC-14).
5. **CI pipeline + web Dockerfile + k8s manifests** — DevOps is at 10 %.
6. **Scheduler** — 72-h auto-release of escrow, 24-h ZATCA reporting, scheduled social posts. Pick a cron substrate first (BullMQ vs platform cron) — none exists yet.

### 5.2 The agent (that is me, next session) can start immediately
These are concrete code tasks with no external dependency:

| # | Task | Where | Why |
|---|---|---|---|
| 1 | ✅ **`POST /api/trips/[tripId]/ping`** — done 2026-10-18. `lib/trips/ping.ts` (testable core) + `withMetrics`-instrumented route handler + `trackEvent('driver.ping')`. Explicit `USR_DRIVER` 403 gate before rate-limit/DB, rate-limit 1 req/s per driver, Zod validation (`lat`/`latitude`, `lng`/`longitude`, nullish `accuracyM`/`accuracy`), writes `WorkerLocationPing`, returns `{ ok, success, tripStatus, pingId, receivedAt }`. 17/17 tests, tsc clean, next build clean. | `waquor/src/app/api/trips/[tripId]/ping/route.ts`, `waquor/lib/trips/ping.ts`, `waquor/tests/trips-ping.test.ts` | Mobile driver GPS outbox queue now drains correctly. |
| 2 | **Build `PATCH /api/trips/[tripId]`** with a state-machine guard (REQUESTED→ACCEPTED→IN_PROGRESS→COMPLETED), role-gated to driver + requester | new file `waquor/src/app/api/trips/[tripId]/route.ts` | Mobile Trip detail screen's accept/start/complete buttons call this today — also 404. |
| 3 | **Instrument top ~15 API routes with `withMetrics`** from `lib/analytics.ts` | `waquor/src/app/api/{orders,search,projects,tenders,bids,wallet,escrow,messages,…}/route.ts` | Without this the `RouteMetric` table only fills from manually tagged routes. The admin p95 board renders empty today. |
| 4 | **Wire `orderStatusChanged`** into the order PATCH route | `waquor/src/app/api/orders/[orderId]/route.ts` | Helper is live; caller is not. |
| 5 | **Wire `milestoneApproved`** into the milestone approve action | `waquor/src/app/api/milestones/[id]/approve/route.ts` (find or create) | Helper live; caller not. |
| 6 | **Wire `disputeOpened`** into dispute POST | `waquor/src/app/api/disputes/route.ts` | Helper live; caller not. |
| 7 | **Haversine `lib/geo.ts`** + geo-boost consumer in `lib/search/engine.ts` | Enables SRCH-13 geo ranking against the lat/lng already in `Address` and `Vendor`. |
| 8 | **Scheduled-post cron reader** — reads `SocialPost where status='SCHEDULED' AND scheduledFor <= now()` and dispatches via the matching adapter | A single `/api/cron/dispatch-social` route guarded by a shared secret, until a cron substrate is picked. |
| 9 | **Instagram + TikTok adapter publish paths** — today they return `ok:true` without calling the real APIs | `lib/social/providers/{instagram,tiktok}.ts` | Admin UI already posts; adapter is the only gap. |
| 10 | **Finance console UI** (SRS §10.12) — payouts queue, reconciliation, chargeback log | `waquor/src/app/dashboard/admin/finance/` | APIs exist; UI is empty. |

### 5.3 Depends on the user — I cannot do these alone
- **Credentials:** Saudi payment merchant creds, ZATCA CSID, Twilio A2P 10DLC approval, SendGrid domain auth, FCM/APNs cert signing, bSDD API token, Google Vision / YOLOv8n hosting, Mapbox or Google Maps tile licence, Sentry/Bugsnag project DSN.
- **Legal:** PDPL data-controller registration, breach-notification playbook sign-off, counsel review of the right-to-work schema.
- **Operational:** cloud region for in-region hosting (Riyadh zone), pen-test vendor selection, EAS code-signing certs for mobile OTAs, merchant bank account for payouts.
- **Scope decisions:** whether AI assistant (§9.4) ships in v1 or v2; whether the Fatoora prod cutover is same-day or staged.

---

## 6. Conventions worth knowing before you edit anything

- **Role field name is a trap.** The Prisma `User` model has `userType` (string). `getSessionUser()` normalises it to `user.role` with type `RoleCode`. Use `role` in session logic, use `userType` in Prisma `where` clauses.
- **No `prisma.userProfile`.** The model is `Profile` → `prisma.profile`.
- **Tender ownership is `ownerId`, not `publishedById`.** `ProjectAssignment` uses `userId`, not `assigneeId`. `TimeLog` is `checkIn`/`checkOut` DateTimes — compute minutes manually.
- **Analytics calls are fire-and-forget.** `void trackEvent(...)` and `void orderPlaced(...)` — never `await` them in a request handler. The analytics table write catches internally so an outage never breaks product traffic.
- **Notifications respect `NotificationPref`.** If `prefs.email === false`, the SendGrid channel is skipped for that user. If a provider env var is missing, the channel logs `[notify.*:skip]` and continues — this is intentional.
- **PII in events.** `AnalyticsEvent.sessionId` is a SHA-256-truncated-32 hex. Never log raw email, token, IBAN, phone — the field encryption helper `lib/crypto-field.ts` is used for storage; same discipline applies to events.
- **Route metric templates strip IDs.** `templateRoute('/api/orders/<uuid>/ship')` → `/api/orders/[id]/ship`. If a new ID shape appears (very long opaque codes), the helper already collapses them to `/[opaque]`.
- **CSP + security headers.** `middleware.ts` sets CSP, HSTS, X-Frame-Options, Referrer-Policy on every request; auth-gates `/dashboard/*` and admin-gates `/dashboard/admin/*`.
- **Mobile outbox swallows network failures.** Mutations that catch `ApiError{status:0}` enqueue to SQLite and drain on reconnect. **This means a server endpoint that returns 404 will not fail the UI loudly** — the request just sits in the outbox retrying. If you see mobile buttons that "work but do nothing", check the server has the route.

---

## 7. One-line task graph for the next session

```
P0  ✅(1) ping endpoint  →  (2) trip PATCH   →  mobile driver stack unblocks
P0  (3) withMetrics on top 15 routes       →  admin p95 board gets data
P1  (4,5,6) status/milestone/dispute wires →  full event-driven notify loop closed
P1  (7) geo helper + search boost          →  SRCH-13 unlocks
P2  (8) scheduled-post cron reader         →  social scheduler lights up
P2  (9) IG + TikTok real publish calls     →  social fan-out ships
P2  (10) Finance console UI                →  admin set complete
```

After these ten, the next natural chunks are the Saudi payment adapter (needs merchant creds), the ZATCA sandbox dry-run (needs CSID), and the scheduler substrate decision.

---

**Totals, verifiable with grep:**

```
waquor/prisma/schema.prisma            74 models
waquor/src/app/api/**/route.ts         82 API routes
waquor/src/app                         80 pages (115 after Next.js split points)
waquor/tests/*.test.ts                 117 passing cases
mobile/app/**/*.tsx                    ~32 screens
mobile/tests/pure.test.ts              6 passing cases
services/bim/                          11 pytest cases, FastAPI + IfcOpenShell + Docker
```

That is the whole picture. Pick an item from §5.2 and start.

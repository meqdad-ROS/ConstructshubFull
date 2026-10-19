# BanahBuild / ConstructsHub — Health Status & What Is Missing

> **Last updated:** 2026-10-20
> **Detailed Admin Audit:** [`docs/reviews/admin-console-audit.md`](docs/reviews/admin-console-audit.md)
> **Screenshots:** [`docs/reviews/screenshots/`](docs/reviews/screenshots)

**Short answer:** **The core platform and backend are healthy, but the Admin Web Console is not healthy yet.**

---

## 1. What IS working healthily

- **Build, TypeScript & Test Suite:** 100% green (`npm run typecheck` clean, `242/242` tests passing across 7 suites, `npx next build` compiles all 81 pages and 84 API routes cleanly).
- **Customer & Role Dashboards (Web):** Login, middleware RBAC, and the 7 non-admin role dashboards (`Owner`, `Contractor`, `Supplier`, `Consultant`, `Casual`, `Driver`, `Worker`) + their per-role analytics pages load and query real PostgreSQL data.
- **Core Backend & APIs:** Search (with Haversine geo-boost and synonym management at [`waquor/src/app/dashboard/admin/search/page.tsx`](waquor/src/app/dashboard/admin/search/page.tsx)), orders, tenders/bids, milestone approvals, ZATCA Phase 1/2 XML signing, event-driven notifications, Instagram/TikTok publishing, and route latency/event telemetry ([`waquor/src/app/dashboard/admin/analytics/page.tsx`](waquor/src/app/dashboard/admin/analytics/page.tsx)) all work.
- **Mobile App ([`mobile/`](mobile)):** The mobile screens, offline SQLite outbox, analytics, notifications, and driver trip/GPS flows now have working backend routes ([`waquor/src/app/api/trips/[tripId]/ping/route.ts`](waquor/src/app/api/trips/[tripId]/ping/route.ts) and [`waquor/src/app/api/trips/[tripId]/route.ts`](waquor/src/app/api/trips/[tripId]/route.ts)). *(Note: `mobile/` just needs `npm install` run locally before launching Expo).*

---

## 2. What is NOT healthy (Admin Console issues found in [admin-console-audit.md](docs/reviews/admin-console-audit.md))

- **2 Admin Pages Crash as Soon as Real Data Arrives:**
  1. **Verifications ([`/dashboard/admin/verifications`](waquor/src/app/dashboard/admin/verifications/page.tsx)):** Looks fine when empty, but **crashes with a 500 Server Error** (`Event handlers cannot be passed to Client Component props`) the moment an unverified user exists because `Approve`/`Reject` pass `onClick={() => {}}` inside a Server Component (`lines 81–92`).
  2. **Finance ([`/dashboard/admin/finance`](waquor/src/app/dashboard/admin/finance/page.tsx)):** Looks fine when empty (aside from rendering **two sidebars side-by-side** via a duplicate `<DashboardShell>` + hardcoded `dir="rtl"` at `lines 425–434`), but **crashes in the browser** (`Objects are not valid as a React child`) the moment a `Payout` or refunded `EscrowHold` exists because [`GET /api/payouts`](waquor/src/app/api/payouts/route.ts) (`lines 64–69`) returns a nested `User` object (including `passwordHash`) where the UI expects a string (`lines 217–271`), and [`GET /api/admin/finance/chargebacks`](waquor/src/app/api/admin/finance/chargebacks/route.ts) omits `status` on `refundedEscrows` while returning `raisedBy`/`recipient`/`payer` + `failureReason`/`frozenReason` + `requestedAt`/`refundedAt` instead of `party`/`reason`/`createdAt`.
- **Dead Links & Dead Buttons in Admin:**
  - Clicking `View →` on [Users](waquor/src/app/dashboard/admin/users/page.tsx) (`line 71` → `/dashboard/admin/users/[id]`), `Review →` on [Disputes](waquor/src/app/dashboard/admin/disputes/page.tsx) (`line 73` → `/dashboard/admin/disputes/[id]`), or `Open →` on [Support](waquor/src/app/dashboard/admin/support/page.tsx) (`line 75` → `/dashboard/admin/support/[id]`) leads to **404 Not Found**.
  - `Approve` and `Reject` buttons on [`/dashboard/admin/verifications`](waquor/src/app/dashboard/admin/verifications/page.tsx) (`lines 83–91`) are literal no-ops (`onClick={() => {}}`).
  - **Audit Log ([`/dashboard/admin/audit`](waquor/src/app/dashboard/admin/audit/page.tsx))** (`lines 14–18`) and Overview Audit Trail always show 0 rows because they query `prisma.auditLog` while [`auditLog()`](waquor/lib/security.ts) (`lines 102–120`) writes to `prisma.auditEvent` (which has 21+ rows).
  - **Feature Flags ([`/dashboard/admin/config`](waquor/src/app/dashboard/admin/config/page.tsx))** (`lines 31–45`) renders blank because fallback flags sit inside `.catch()`, which never fires when `GET /api/admin/config` returns `200 OK` with `flags: []`; Platform Settings on the same page are 6 static text rows.
  - **Missing Sidebar Links & Missing Moderation Console:** `Finance` (`/dashboard/admin/finance`), `Analytics` (`/dashboard/admin/analytics`), and `Search Console` (`/dashboard/admin/search`) have no links in the admin sidebar ([`waquor/components/dashboard/DashboardShell.tsx`](waquor/components/dashboard/DashboardShell.tsx) `lines 103–112`), and SRS §10.13 Content & Moderation (`/dashboard/admin/moderation`) is unbuilt (**404 Not Found**).

---

## 3. Prioritized Remediation Backlog (Admin Consoles — SRS §10.9–10.13)

| Priority | Task | Target Files |
|---|---|---|
| **P0** | Sanitize `GET /api/payouts` (remove `passwordHash` leak using Prisma `select`) and normalize `recipient` in Finance Console UI so Payouts Queue does not crash | `waquor/src/app/api/payouts/route.ts`, `waquor/src/app/dashboard/admin/finance/page.tsx` |
| **P0** | Normalize `GET /api/admin/finance/chargebacks` items to `{ id, type, amount, status, party, reason, createdAt }` and wire `dateFrom`/`dateTo` filtering | `waquor/src/app/api/admin/finance/chargebacks/route.ts`, `waquor/src/app/dashboard/admin/finance/page.tsx` |
| **P0** | Fix `/dashboard/admin/verifications` RSC `onClick` crash and wire `Approve`/`Reject` buttons to `PATCH /api/verifications/[caseId]` and `POST /api/admin/dashboard` | `waquor/src/app/dashboard/admin/verifications/page.tsx` |
| **P1** | Remove duplicate nested `<DashboardShell>` and hardcoded `dir="rtl"` from `/dashboard/admin/finance` | `waquor/src/app/dashboard/admin/finance/page.tsx` |
| **P1** | Add `Finance`, `Analytics`, and `Search Console` links to `NAV_BY_ROLE.USR_ADMIN` and fix exact-match active state for `/dashboard/admin` | `waquor/components/dashboard/DashboardShell.tsx` |
| **P1** | Point `/dashboard/admin/audit`, `/dashboard/admin`, and `GET /api/admin/audit` at `prisma.auditEvent` | `waquor/src/app/dashboard/admin/audit/page.tsx`, `waquor/src/app/dashboard/admin/page.tsx`, `waquor/src/app/api/admin/audit/route.ts` |
| **P1** | Populate default feature flags when `d.flags.length === 0` on `/dashboard/admin/config` | `waquor/src/app/dashboard/admin/config/page.tsx` |
| **P1** | Build detail routes for `/dashboard/admin/users/[id]`, `/dashboard/admin/disputes/[id]` (wired to `PATCH /api/disputes/[disputeId]`), and `/dashboard/admin/support/[id]` | `waquor/src/app/dashboard/admin/{users,disputes,support}/[id]/page.tsx` |
| **P2** | Build `/dashboard/admin/moderation` (SRS §10.13: flagged content queue, taxonomy manager, announcement/banner CRUD) | `waquor/src/app/dashboard/admin/moderation/page.tsx` |
| **P2** | Expand `/dashboard/admin/config` for `FR-CFG-01..07` (bounds validation, effective dating, change reason + dual-control approval, version history + rollback, scoped overrides) | `waquor/src/app/dashboard/admin/config/page.tsx`, `waquor/src/app/api/admin/config/route.ts` |
| **P2** | Add Month-End Close Period Lock & CSV/XLSX financial exports (`FR-FIN-01`) + ZATCA compliance monitor to `/dashboard/admin/finance` | `waquor/src/app/dashboard/admin/finance/page.tsx` |

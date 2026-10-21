# RBAC Audit — Admin / Finance / Escrow Endpoints

**Owner:** platform-security
**Last reviewed:** 2026-10-21 (launch-blocker §5.1-4-4, pen-test prep)
**Scope:** every tracked route file under
`waquor/src/app/api/admin/**`, `waquor/src/app/api/escrow/**`,
`waquor/src/app/api/payouts/*`, `waquor/src/app/api/wallet/*`,
`waquor/src/app/api/payments/**`, `waquor/src/app/api/milestones/**`,
`waquor/src/app/api/disputes/**`, `waquor/src/app/api/cron/**`,
`waquor/src/app/api/webhooks/**` — 26 route files, 36 HTTP methods.
**Methodology:** for each HTTP method on each route file, assert that the
handler either (a) requires an authenticated session, (b) narrows by
`user.role === 'USR_ADMIN'` where the resource is admin-only, (c) owns the
resource (compares `user.id` to the resource's `ownerId` / `payerId` /
`recipientId` / etc.), or (d) requires a shared-secret / HMAC for machine-to-
machine traffic (cron, webhooks). Routes that mix roles must enforce the
specific permission for each role (e.g. a consultant may act on their own
projects, not every project).

Convention used throughout: `getSessionUser()` returns a `SessionUser` with
`role` as a `RoleCode` string ("USR_*"). Prisma `where` clauses use
`userType` (the stored column). See `waquor/CLAUDE.md`.

---

## Audit progression

| Pass | Missing / weak guards | Note |
|---:|---:|---|
| 1 (before any fix) | **1** | `/api/milestones/[id]/approve` — any user with `USR_CONSULT` could approve ANY project's milestone, releasing escrow. Needed: assignment check. |
| 2 (after fix in commit linked below) | **0** | All 36 HTTP methods carry an appropriate guard. |

Fix: `src/app/api/milestones/[milestoneId]/approve/route.ts` now checks
`prisma.projectAssignment.findFirst({ where: { projectId, userId, roleOnProject: 'CONSULTANT' } })`
before honouring a `USR_CONSULT` approver. Owner + admin paths unchanged.
Tests cover the three new rejection branches: unassigned consultant, wrong
project-role on the assignment, assignment to a different project.

---

## Legend

| Column | Meaning |
|---|---|
| **Guard** | What the handler enforces. `AUTH` = any logged-in user, `ADMIN` = `user.role === 'USR_ADMIN'`, `OWNER` = resource-level ownership match, `CRON` = `x-cron-secret` constant-time compare, `HMAC` = gateway-level signature verification. |
| **Verdict** | PASS / FAIL. FAIL fixed in the same commit as this document. |

---

## 1. `admin/*` (12 route files)

| Method | Path | Guard | Verdict | Code anchor |
|---|---|---|---|---|
| GET  | `/api/admin/analytics/events`  | ADMIN | PASS | [`src/app/api/admin/analytics/events/route.ts:9`](../../waquor/src/app/api/admin/analytics/events/route.ts#L9) |
| GET  | `/api/admin/analytics/routes`  | ADMIN | PASS | [`src/app/api/admin/analytics/routes/route.ts:12`](../../waquor/src/app/api/admin/analytics/routes/route.ts#L12) |
| GET  | `/api/admin/bim/health`        | ADMIN | PASS | [`src/app/api/admin/bim/health/route.ts:7`](../../waquor/src/app/api/admin/bim/health/route.ts#L7) |
| GET  | `/api/admin/config`            | ADMIN | PASS | [`src/app/api/admin/config/route.ts:5`](../../waquor/src/app/api/admin/config/route.ts#L5) |
| POST | `/api/admin/config`            | ADMIN | PASS | [`src/app/api/admin/config/route.ts:19`](../../waquor/src/app/api/admin/config/route.ts#L19) |
| GET  | `/api/admin/dashboard`         | ADMIN | PASS | [`src/app/api/admin/dashboard/route.ts:24`](../../waquor/src/app/api/admin/dashboard/route.ts#L24) |
| POST | `/api/admin/dashboard`         | ADMIN | PASS | [`src/app/api/admin/dashboard/route.ts:159`](../../waquor/src/app/api/admin/dashboard/route.ts#L159) |
| GET  | `/api/admin/finance/chargebacks`      | ADMIN | PASS | [`src/app/api/admin/finance/chargebacks/route.ts:5`](../../waquor/src/app/api/admin/finance/chargebacks/route.ts#L5) |
| GET  | `/api/admin/finance/reconciliation`   | ADMIN | PASS | [`src/app/api/admin/finance/reconciliation/route.ts:6`](../../waquor/src/app/api/admin/finance/reconciliation/route.ts#L6) |
| GET  | `/api/admin/pdpl/breach`       | ADMIN | PASS | [`src/app/api/admin/pdpl/breach/route.ts:54`](../../waquor/src/app/api/admin/pdpl/breach/route.ts#L54) |
| POST | `/api/admin/pdpl/breach`       | ADMIN | PASS | [`src/app/api/admin/pdpl/breach/route.ts:92`](../../waquor/src/app/api/admin/pdpl/breach/route.ts#L92) |
| PATCH| `/api/admin/pdpl/breach`       | ADMIN | PASS | [`src/app/api/admin/pdpl/breach/route.ts:130`](../../waquor/src/app/api/admin/pdpl/breach/route.ts#L130) |
| GET  | `/api/admin/search/analytics`  | ADMIN | PASS | [`src/app/api/admin/search/analytics/route.ts:10`](../../waquor/src/app/api/admin/search/analytics/route.ts#L10) |
| GET  | `/api/admin/search/health`     | ADMIN | PASS | [`src/app/api/admin/search/health/route.ts:10`](../../waquor/src/app/api/admin/search/health/route.ts#L10) |
| GET  | `/api/admin/search/synonyms`   | ADMIN (via `requireAdmin()`) | PASS | [`src/app/api/admin/search/synonyms/route.ts:27`](../../waquor/src/app/api/admin/search/synonyms/route.ts#L27) |
| POST | `/api/admin/search/synonyms`   | ADMIN | PASS | [`src/app/api/admin/search/synonyms/route.ts:34`](../../waquor/src/app/api/admin/search/synonyms/route.ts#L34) |
| DELETE | `/api/admin/search/synonyms` | ADMIN | PASS | [`src/app/api/admin/search/synonyms/route.ts:63`](../../waquor/src/app/api/admin/search/synonyms/route.ts#L63) |
| GET  | `/api/admin/zatca/onboard`     | ADMIN | PASS | [`src/app/api/admin/zatca/onboard/route.ts:42`](../../waquor/src/app/api/admin/zatca/onboard/route.ts#L42) |
| POST | `/api/admin/zatca/onboard`     | ADMIN | PASS | [`src/app/api/admin/zatca/onboard/route.ts:61`](../../waquor/src/app/api/admin/zatca/onboard/route.ts#L61) |

## 2. `escrow/*` (2 route files)

| Method | Path | Guard | Verdict | Code anchor |
|---|---|---|---|---|
| POST | `/api/escrow/[holdId]/refund`  | ADMIN                 | PASS | [`src/app/api/escrow/[holdId]/refund/route.ts:19`](../../waquor/src/app/api/escrow/[holdId]/refund/route.ts#L19) |
| POST | `/api/escrow/[holdId]/release` | OWNER (payer) OR ADMIN | PASS | [`src/app/api/escrow/[holdId]/release/route.ts:20`](../../waquor/src/app/api/escrow/[holdId]/release/route.ts#L20) |

## 3. Finance surface — `payouts`, `wallet`, `payments` (5 route files)

| Method | Path | Guard | Verdict | Code anchor |
|---|---|---|---|---|
| GET  | `/api/payouts` | AUTH; `where.recipientId = user.id` for non-admin (admin sees all) | PASS | [`src/app/api/payouts/route.ts:40`](../../waquor/src/app/api/payouts/route.ts#L40) |
| POST | `/api/payouts` | AUTH + KYC gate (`BANK_ACCOUNT` verification APPROVED) + rate-limit 5/h/ip | PASS | [`src/app/api/payouts/route.ts:95`](../../waquor/src/app/api/payouts/route.ts#L95) |
| PATCH| `/api/payouts` | ADMIN | PASS | [`src/app/api/payouts/route.ts:187`](../../waquor/src/app/api/payouts/route.ts#L187) |
| GET  | `/api/wallet`  | AUTH; always `getOrCreateWallet(user.id)` | PASS | [`src/app/api/wallet/route.ts:7`](../../waquor/src/app/api/wallet/route.ts#L7) |
| GET  | `/api/payments` | AUTH; filter `order.userId === user.id` | PASS | [`src/app/api/payments/route.ts:25`](../../waquor/src/app/api/payments/route.ts#L25) |
| POST | `/api/payments` | AUTH + rate-limit 20/min/user + server-side amount vs `order.totalAmount` + `order.userId === user.id` | PASS | [`src/app/api/payments/route.ts:52`](../../waquor/src/app/api/payments/route.ts#L52) |
| POST | `/api/payments/mock/simulate` | ADMIN + env flag (`NODE_ENV !== 'production'` unless `ALLOW_MOCK_PAYMENTS_IN_PROD=1`) | PASS | [`src/app/api/payments/mock/simulate/route.ts:20`](../../waquor/src/app/api/payments/mock/simulate/route.ts#L20) |

## 4. Milestones / disputes (3 route files — escrow-releasing)

| Method | Path | Guard | Verdict | Code anchor |
|---|---|---|---|---|
| POST  | `/api/milestones/[id]/approve` | OWNER (project.ownerId) OR ADMIN OR **CONSULT assigned via `ProjectAssignment.roleOnProject = 'CONSULTANT'`** | **PASS after fix** — see below | [`src/app/api/milestones/[milestoneId]/approve/route.ts:29`](../../waquor/src/app/api/milestones/[milestoneId]/approve/route.ts#L29) |
| GET   | `/api/disputes`               | AUTH; non-admin sees only `raisedById === user.id OR counterpartyId === user.id` | PASS | [`src/app/api/disputes/route.ts:19`](../../waquor/src/app/api/disputes/route.ts#L19) |
| POST  | `/api/disputes`               | AUTH + for order disputes verifies `order.userId === user.id` + the escrow-freeze path only runs when `hold.payerId === user.id OR hold.payeeId === user.id` | PASS | [`src/app/api/disputes/route.ts:38`](../../waquor/src/app/api/disputes/route.ts#L38) |
| PATCH | `/api/disputes/[id]`          | ADMIN | PASS | [`src/app/api/disputes/[disputeId]/route.ts:14`](../../waquor/src/app/api/disputes/[disputeId]/route.ts#L14) |

## 5. Cron (6 route files, machine-to-machine)

| Method | Path | Guard | Verdict | Code anchor |
|---|---|---|---|---|
| POST | `/api/cron/aggregate-events`   | CRON (`x-cron-secret`, constant-time compare) | PASS | [`src/app/api/cron/aggregate-events/route.ts:19`](../../waquor/src/app/api/cron/aggregate-events/route.ts#L19) |
| POST | `/api/cron/aggregate-location` | CRON | PASS | [`src/app/api/cron/aggregate-location/route.ts:33`](../../waquor/src/app/api/cron/aggregate-location/route.ts#L33) |
| POST | `/api/cron/aggregate-routes`   | CRON | PASS | [`src/app/api/cron/aggregate-routes/route.ts:19`](../../waquor/src/app/api/cron/aggregate-routes/route.ts#L19) |
| POST | `/api/cron/dispatch-social`    | CRON | PASS | [`src/app/api/cron/dispatch-social/route.ts:8`](../../waquor/src/app/api/cron/dispatch-social/route.ts#L8) |
| POST | `/api/cron/dispatch-zatca`     | CRON | PASS | [`src/app/api/cron/dispatch-zatca/route.ts:33`](../../waquor/src/app/api/cron/dispatch-zatca/route.ts#L33) |
| POST | `/api/cron/release-escrow`     | CRON | PASS | [`src/app/api/cron/release-escrow/route.ts:32`](../../waquor/src/app/api/cron/release-escrow/route.ts#L32) |

## 6. Webhooks (1 route file, 5 gateways)

| Method | Path | Guard | Verdict | Code anchor |
|---|---|---|---|---|
| POST | `/api/webhooks/[gateway]` | HMAC (per-gateway `verifyWebhookSignature` in `handleWebhook`; `!result.ok` returns 400/401 before any Prisma write) | PASS | [`src/app/api/webhooks/[gateway]/route.ts:15`](../../waquor/src/app/api/webhooks/[gateway]/route.ts#L15) |

Gateways with HMAC enforcement: STRIPE, MOYASAR, POLAR, MOCK. Edge-level
source-IP allowlist is **WAF-10** in [`waf-rules.md`](waf-rules.md).

---

## Finding P-1 — fixed in this commit

**Where:** [`src/app/api/milestones/[milestoneId]/approve/route.ts`](../../waquor/src/app/api/milestones/[milestoneId]/approve/route.ts)
**Severity:** HIGH (direct escrow release path)
**Observed guard (before):**

```ts
const canApprove =
  milestone.project.ownerId === user.id ||
  user.role === 'USR_ADMIN' ||
  user.role === 'USR_CONSULT';   // ← too broad
```

**Impact:** Any user with the `USR_CONSULT` role could approve ANY milestone
on ANY project they were not assigned to, triggering
`releaseEscrowHold(milestone.escrowHold.id)` and transferring funds from the
project owner's escrow to the milestone payee. SRS §7.3 specifies that
consultants certify milestones **on projects they are assigned to**, not
globally.

**Fix:** The handler now requires an active `ProjectAssignment` with
`roleOnProject = 'CONSULTANT'` tying the consultant user to the milestone's
`projectId`. Owner and admin paths are unchanged. Rejection cases:

- Unassigned consultant → 403 Forbidden.
- Consultant assigned to a different project → 403 Forbidden.
- Consultant assigned to this project but with a non-`CONSULTANT`
  `roleOnProject` (e.g. a user who is also a contractor on this project in
  a different capacity) → 403 Forbidden.

**Tests:** `tests/milestones-approve-rbac.test.ts` covers the three
rejection paths plus the three positive paths (owner approves, admin
approves, properly-assigned consultant approves).

**Audit progression:** 1 missing → 0 missing.

---

## Scope boundary — what is explicitly OUT of this audit

- Non-admin, non-finance, non-escrow routes (search, trips, tenders, …). Their
  RBAC posture is tracked in the ongoing feature work, not here.
- Row-level security for business tables (orders, projects, tenders). The
  SRS §13.4 model gates by resource ownership + role, and those routes
  implement it, but this document focuses on the launch-blocker §5.1-4
  surface.
- Mobile outbox `ApiError{status:0}` handling. If a mobile route 404s,
  build the server route — that is a mobile-UX concern, not an RBAC gap.

## How this document is kept green

Any PR that adds a route under the scoped prefixes must:

1. Add a row to the right table above.
2. Keep the "Audit progression" summary at **0 missing** or document and
   fix the gap in the same PR.

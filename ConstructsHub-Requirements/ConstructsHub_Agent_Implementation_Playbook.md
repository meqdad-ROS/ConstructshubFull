# ConstructsHub / BanahBuild — Multi-Agent Implementation Playbook

**Prepared:** 23 October 2026  
**Purpose:** execution-ready, copy/paste prompts for Claude Code, OpenCode (Nemotron Ultra 3 or DeepSeek), and Antigravity; controlled implementation, verification, and integration of the remaining scope.  
**Scope authority:** SRS Master v2.0 under `ConstructsHub-Requirements/`; the current repository and its tests are the code truth; `PROGRESS.md` is the handoff/status baseline; `BanahBuild ConstructsHub screens.pdf` is a visual/workflow reference, not proof that those journeys work.

## Contents

- [1. Executive recommendation](#1-executive-recommendation)
- [2. Execution stages and dependency order](#2-execution-stages-and-dependency-order)
- [3. Universal Git and repository safety contract](#3-universal-git-and-repository-safety-contract)
- [4. Non-negotiable project conventions](#4-non-negotiable-project-conventions)
- [5. Common Definition of Done](#5-common-definition-of-done)
- [6. Copy/paste prompt pack](#6-copypaste-prompt-pack)
- [C10 mobile closeout](#c10--mobile-app-154-parity-closeout-verification-first-not-a-rewrite)
- [7. AI foundation and search](#7-stage-4--ai-foundation-and-search-completion)
- [8. Search/document/BIM foundations](#8-d5--remaining-search-document-and-bim-foundations)
- [9. Contract tests and E2E](#9-stage-5--contract-tests-financial-tests-and-end-to-end-journeys)
- [10. i18n and RTL](#10-e2--internationalization-and-arabic-rtl-one-feature-branch-at-a-time)
- [11. Accessibility](#11-e3--wcag-21-aa-accessibility)
- [12. Performance and operational metrics](#12-e4--performance-operational-metrics-and-deployment-hardening)
- [13. Content operations and admin consoles](#13-e5e6--content-operations-and-remaining-admin-consoles)
- [14. Other open SRS modules](#14-other-open-srs-modules-found-in-the-handoff-not-covered-by-de-alone)
- [15. Final integration and release gates](#15-final-integration-and-release-gates)
- [16. Execution order and merge protocol](#16-execution-order-merge-protocol-and-who-runs-what)
- [17. Owner-only decisions and credentials](#17-owner-only-decisions-credentials-and-operational-gates)
- [18. Engineering references](#18-engineering-references-to-use-as-implementation-checks)
- [19. Model/agent routing](#19-model-and-agent-routing)
- [20. Minimum merge checklist](#20-minimum-merge-checklist-copy-into-each-pr-free-local-review)
- [21. Prompt inventory](#21-prompt-inventory)
- [22. Final operating principle](#22-final-operating-principle)

---

## 1. Executive recommendation

Treat ConstructsHub as an existing production-oriented codebase that needs controlled completion and launch hardening—not as a greenfield application. The latest supplied handoff (23 October 2026) records substantial functionality across web, mobile, BIM, notifications, payment adapters, finance, workforce, logistics, catalogue, and disputes. It also identifies high-severity admin console defects, unfinished AI capability, low integration/E2E coverage, incomplete Arabic/RTL and accessibility work, missing performance evidence, and several external onboarding gates. The progress percentages are estimates, not measured acceptance results.

**Do not run every prompt at once.** Start with baseline reconciliation and P0 defects, then build the AI evaluation harness before accepting AI features, then complete automated integration/E2E, RTL/accessibility, performance, and final cross-system validation. Use isolated worktrees and one feature branch per task. Merge one green branch at a time; rebase only after the user has merged prerequisite changes. Do not let every branch edit `PROGRESS.md`; feature branches must provide an evidence report and proposed status text, while the integration owner updates the shared progress file after merge.

### Status reconciliation that matters

- **Mobile C10 is closeout, not a rewrite.** The supplied progress report says supplier/owner role screens, message attachments, env-gated Sentry, RTL helpers, push deep-link handling, worker shift/contract screens and organisations were implemented. Verify those paths and fix demonstrable gaps; do not re-create them blindly.
- **The counts conflict.** The file's overview, tables and run instructions report different model/route/test totals. The first task must establish actual counts and record the commands/results observed in the checked-out repository.
- **Admin P0 defects should precede feature expansion.** The report calls out verification and finance crashes, a `passwordHash` exposure through payouts, incorrect audit source data, dead links, missing navigation, and a missing moderation screen.
- **Migration history is a launch-risk item.** The handoff mentions `prisma migrate deploy` failing because a search-index migration references `SearchDocument` before its creation migration. This must be reproduced safely on a disposable database and corrected without destructive reset or blind `db push`.
- **Some deliverables require owner-side credentials or decisions.** Agents must document these as blocked; they must not fabricate credentials, claim live provider verification, or weaken secure gates.

## 2. Execution stages and dependency order

| Stage | IDs | Purpose / exit gate | Primary owner |
|---|---|---|---|
| 0. Reality check | `P00` | Canonical SRS discovery, clean baseline, reconcile counts and branch state | Claude Code |
| 1. Release blockers | `P01`, `P02`, `P03`, `C10` | Admin P0 security/crashes fixed; migration sequence safe; mobile parity evidenced | Claude for platform/data, OpenCode for UI checks, Antigravity for review |
| 2. Evaluation foundation | `D1` | Repeatable AI golden datasets + truthful baseline report + CI smoke | Claude Code; Antigravity audit |
| 3. AI/search completion | `D2`, `D3`, `D4`, `D5-*` | Measurable image, assistant decision, OCR, bSDD, voice, resumable upload, office conversion, XLSX, BIM/search tests | Claude for AI/security/core; OpenCode for UX/bulk; Antigravity validates |
| 4. Test/contract foundation | `E1-*` | API drift fails CI; real money-path integration tests; six user journeys pass | Claude for money/core; OpenCode for contracts and journeys; Antigravity checks visible browser outcomes |
| 5. Internationalization and accessibility | `E2-*`, `E3-*` | Feature-by-feature Arabic/English and RTL; keyboard/screen reader/contrast/axe evidence | OpenCode; Antigravity audit |
| 6. Performance/operations | `E4`, `E4-BIM`, `E4-DEVOPS` | Measured before/after performance, metrics export, BIM sandbox test and deployment evidence | Claude Code; Antigravity reviews evidence |
| 7. Product modules not covered by original D/E list | `R-CATALOGUE`, `R-BILLING`, `R-TENDER`, `R-DISPUTES`, `R-WORKFORCE`, `R-LOGISTICS`, `R-SOCIAL`, `R-MESSAGING` | Remaining SRS-listed feature gaps close without regressions | Split by risk: Claude for security, money, schema; OpenCode for isolated UI |
| 8. Final integration | `I1`, `I2` | Full evidence-based SRS audit, honest status ledger, go/no-go report | Claude + Antigravity, user controls merges and release |

**Parallelism rule:** parallel work is allowed only for non-overlapping code ownership in separate worktrees. Do not run two dev servers against the same database/file, and do not run Prisma migrations from two worktrees. Feature prompts state their ownership. If an unexpected shared-file conflict appears, stop and report; do not “fix” another agent's work.

## 3. Universal Git and repository safety contract

These rules are repeated in each individual prompt so every prompt is independently copy/pasteable.

1. Work only in the named worktree and on the task branch specified in the prompt. Inspect `git status --short --branch` first. If the initial tree is dirty, or if the expected local base branch is missing, **stop and report**; never `stash`, `reset`, `clean`, or discard changes to make the task proceed.
2. Use a local `main` as the base only after required earlier task branches have been merged by the user. Do **not** run `git pull`, push, create a PR, merge into `main`, or rewrite shared history. Do not access the remote unless the user explicitly authorizes it.
3. Preferred isolation command, run from the canonical repository root when the tree is clean and `main` exists:
   ```bash
   git worktree add ../Construct-Hub-<task-slug> -b task-<task-id>-<task-slug> main
   cd ../Construct-Hub-<task-slug>
   git status --short --branch
   ```
   Replace `<task-slug>` and `<task-id>` with the literal values in that task prompt. If a task branch/worktree already exists, inspect it and report; do not overwrite it. If worktrees are unavailable, stop and ask the owner before using a shared working directory.
4. Do not edit `.env` or copy secrets into logs/reports. Do not add dependencies, binary tools, external hosted services, API keys, or schema migrations without the approvals expressly stated in the task. Existing repository lockfiles and patterns take precedence.
5. Read `waquor/prisma/schema.prisma` before using any Prisma field, model, relation or enum. Schema changes and Prisma migrations are owned only by the specifically assigned Claude task. Never use `prisma migrate reset` or a production `prisma db push` workaround.
6. Never falsify a result, use a successful stub (`return true`), leave TODO placeholders, or label a mock response as a real provider/model output. Test doubles must be identified as test doubles and must not be displayed as live output in the product.
7. Do not change scope silently. If the task needs a user decision or an external credential, implement only safe, verifiable work that does not require it, then mark the exact blocker and how to unblock it.
8. After implementing a green slice, make a focused commit locally, do not merge or push, and report the branch name, commit SHA, changed files, commands with exit codes, and any remaining blockers. If a required command fails, diagnose/fix within scope and rerun it; never claim green from a partial command.

## 4. Non-negotiable project conventions

- SRS Master v2.0 in `ConstructsHub-Requirements/` is the scope authority. Discover the exact canonical SRS filename, distinguish “to keep” from “not to use,” and cite real section/requirement IDs in reports. Do not invent FR/NFR identifiers.
- Prisma source of truth is `waquor/prisma/schema.prisma`. `User.userType` is the DB field; `getSessionUser()` yields `user.role` (`RoleCode`, `USR_*`). Use `role` for session checks and `userType` in Prisma filters. There is `Profile`/`prisma.profile`, not `prisma.userProfile`. Tender owner is `ownerId`, `ProjectAssignment` uses `userId`, and `TimeLog` uses `checkIn`/`checkOut` `DateTime`s—compute duration explicitly.
- Analytics and notification event handlers are fire-and-forget: use `void trackEvent(...)`, `void orderPlaced(...)`, or equivalent; do not `await` them in request handlers. Provider absence is an intentionally non-fatal, logged skip. Respect `NotificationPref` and active device tokens.
- Do not log raw email addresses, phone numbers, IBANs, auth tokens, credentials, uploaded document content, or complete prompts that may contain PII. `AnalyticsEvent.sessionId` is a truncated 32-character SHA-256 hash. Use the existing `lib/crypto-field.ts` / established encryption contracts.
- Preserve route metric privacy via `templateRoute()`; retain existing CSP/HSTS/auth gates in `waquor/middleware.ts`. Every new admin endpoint and page must enforce server-side authorization and least privilege, not only hide client links.
- Mobile outbox handles `ApiError{status:0}` by queueing/retrying. A missing route returning 404 can appear to the user as a no-op: verify mobile mutation URLs against real server routes and test response handling.
- Baseline web acceptance commands are `npm run typecheck`, `npm test`, `npx next build` from `waquor/`. Mobile uses its actual `package.json` scripts from `mobile/`; the handoff says `npm install` is required before `npm run typecheck`, but do not alter dependency manifests without owner approval. BIM verification is from `services/bim/` using its documented Docker Compose and pytest commands.
- Do not edit `PROGRESS.md` in feature branches. Put evidence under `docs/reviews/task-reports/` and include proposed status delta. The integration task updates `PROGRESS.md` only after merge and only against reproducible evidence.

## 5. Common Definition of Done

Each task must finish with a truthfully completed report covering:

- [ ] Requirement IDs/sections traced to SRS and observable acceptance criteria.
- [ ] Implementation is real, secure, role-gated, appropriately localized, and handles failure states.
- [ ] Unit/component/integration tests added where relevant; regression tests for the bug/gap itself.
- [ ] Web: `npm run typecheck`, `npm test`, and `npx next build` all pass if the branch touches web code. Mobile and BIM checks run too when applicable. Record exact output/exit code, not “passed” without evidence.
- [ ] Relevant UI is exercised in a browser/device simulator or, if unavailable, the limitation is stated. Do not claim a native-device push test if only mocked/unit tested.
- [ ] Evidence report written under `docs/reviews/task-reports/` (or a more specific report path explicitly requested by the task), with baseline/result comparisons and any known blockers.
- [ ] Focused local commit created. No merge, push, or PR.
- [ ] Task-specific `PROGRESS.md` status proposal is included in the handoff, but the feature branch does not change the shared file.

**Evidence standard:** no task is accepted based on the agent’s assertion alone. Ask for actual test output, generated evaluation reports, screenshots, query results, API traces with secrets removed, or measured benchmark output as appropriate.

---

# 6. Copy/paste prompt pack

Each fenced block below is a standalone prompt for one agent. Copy the entire block into the named tool. Each includes the project contract and the Git rules; do not combine simultaneous agents in one terminal.

## P00 — Repository reality check, SRS map, and baseline capture

### P00-A — Claude Code: baseline auditor (run first)

```text
You are Claude Code acting as the lead staff software engineer for ConstructsHub. Task ID P00-A. Work only on the task branch `task-p00-baseline-audit`. The purpose is to establish the repository truth before implementation agents start; do not make product feature changes.

PROJECT: Construct-Hub / BanahBuild ConstructsHub, Saudi Arabia + Jordan construction marketplace. Root repository is `Construct-Hub_Project`. Web `waquor/` = Next.js 15 App Router, Prisma 6, strict TypeScript, Zod, TanStack Query, Tailwind. Mobile `mobile/` = Expo SDK 52, Expo Router 4, React Native 0.76, TanStack Query, expo-sqlite/offline outbox, FCM/APNs, Sentry. BIM `services/bim/` = FastAPI + IfcOpenShell in a hardened Docker sandbox. The SRS Master v2.0 under `ConstructsHub-Requirements/` is the scope authority; identify the exact canonical “to keep” SRS and do not base scope on files marked “not to use.”

GIT SAFETY: inspect `git status --short --branch` and confirm the current local `main` exists and the source tree is clean before creating a worktree. If dirty or missing, stop and report; never stash/reset/clean. From the canonical repo root, create `git worktree add ../Construct-Hub-p00-baseline-audit -b task-p00-baseline-audit main`, then work only inside it. Do not pull, push, merge, create a PR, edit `.env`, or edit `PROGRESS.md`. Do not add dependencies. Commit a report only when checks relevant to the report are complete; do not commit unverified source edits.

CONVENTIONS: Read `waquor/prisma/schema.prisma` before stating any model/field names. `User.userType` is the Prisma field; `getSessionUser()` exposes `user.role` (`USR_*`). Model is `Profile`, client `prisma.profile`; tender owner is `ownerId`; ProjectAssignment field is `userId`; TimeLog uses `checkIn`/`checkOut`. Analytics/notification calls stay fire-and-forget; providers absent in env must skip non-fatally; never log PII/secrets. Mobile outbox can swallow status 0 and retry missing routes. CSP/HSTS/auth are in `waquor/middleware.ts` and must be preserved. No destructive Prisma reset or production `db push`.

TASK:
1. Capture Git truth: current branch, local `main` SHA, worktree status, recent relevant commits, unmerged local branches/worktrees (read-only only; do not touch them).
2. Discover and read the canonical SRS, its version/title, the current `PROGRESS.md`, `CONFIGURATION.md`, `NoteToDeveloper.md`, root package files, web/mobile/BIM manifests, CI workflows, and migration history. Record exact paths; clearly identify obsolete SRS files.
3. Run baseline checks using the commands actually present in package scripts. At minimum, web: `npm run typecheck`, `npm test`, `npx next build`; mobile: typecheck/tests using `mobile/package.json`; BIM: documented pytest / Docker check only if Docker is available. Do not modify dependency files or run migrations against a shared database. If env, services, or package installation is absent, report `BLOCKED` with the exact evidence.
4. Reconcile all contradictory totals in the report (routes, API routes, Prisma models, tests, mobile screens). Obtain actual counts from the checked-out tree or commands. Do not repeat prior report counts unless re-verified.
5. Inspect and reproduce safely the known migration failure: search-index migration references `SearchDocument` before its creation migration. Do NOT repair in this task, do not reset any database; use read-only migration-file inspection and, if safe and available, a uniquely named disposable local database only with no real data. Record `prisma migrate status` only if its target database is confirmed disposable/local.
6. Create `docs/reviews/task-reports/P00-baseline.md` with: current commit/branch, exact SRS file + version, actual counts, baseline command/exit-code/output summaries, known P0/P1 defects, migration failure evidence, all open task IDs mapped to SRS sections, external blockers, and a dependency graph. Distinguish verified facts, report claims, and unknowns. Do not claim tests passed if the command did not run to completion.
7. Commit only the report, e.g. `docs: record ConstructsHub verified baseline`. Do not change production source, Prisma schema/migrations, `.env`, or `PROGRESS.md`.

ACCEPTANCE: report is specific enough for a new developer to pick up the repo; includes exact observed outputs/exit codes; SRS filenames are grounded; contradictions are explained; no source code changes; local focused commit made; branch and SHA reported. If unable to finish some command, show the precise failure, not an invented outcome. Stop after reporting; do not merge/push.
```

### P00-B — Antigravity: independent SRS and screen-to-route audit (review only)

```text
You are Antigravity acting as an independent reviewer, not a code author. Task ID P00-B. Audit the current ConstructsHub repository against the canonical SRS Master v2.0 and the supplied `BanahBuild ConstructsHub screens.pdf`. Do not implement code, change configuration, install packages, or touch migrations.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-p00-srs-audit -b review-p00-b-p00-srs-audit main`, then `cd ../Construct-Hub-review-p00-srs-audit`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

PROJECT CONTRACT: repo root `Construct-Hub_Project`; web is `waquor/` Next.js 15 + Prisma 6; mobile is `mobile/` Expo SDK 52/RN 0.76; BIM service is `services/bim/` FastAPI/IfcOpenShell. The canonical SRS under `ConstructsHub-Requirements/` is the scope authority. Inspect `PROGRESS.md`, the verified baseline report if merged/available, route/page files, `waquor/prisma/schema.prisma`, and tests. Read schema before interpreting model names. Session auth uses `user.role`; Prisma filter uses `userType`; `Profile` maps to `prisma.profile`; `ownerId` and `ProjectAssignment.userId` are canonical field names. Preserve privacy: do not include PII or secrets in reports.

TASK: map each of the 17 PDF screens to its visible user journey, actor/role, route/page, API endpoints, underlying data writes, and test evidence. Screens include order tracking/receipt, RFQ comparison, owner/supplier/contractor/consultant/worker/driver, admin fee configuration, support/dispute ruling, registration, tender creation and award, milestones/escrow, verification, finance reconciliation and moderation. Treat displayed example values as illustrative UI content, not live data. Identify which controls have no action, lead to 404s, use static/mocked data, or lack server authorization. Check Arabic/RTL views where accessible. Do not infer functionality solely from a screenshot.

Produce `docs/reviews/task-reports/P00-screen-and-srs-audit.md` (or report findings in the tool if files are unavailable) with: (1) source path/section citations, (2) route-to-screen matrix, (3) P0 security/data-loss findings, P1 core workflow failures, P2 polish, (4) reproducible evidence and screenshots where possible, (5) discrepancies versus `PROGRESS.md`, (6) no-go items before a paid production launch. For each finding include severity, role, route, observed result, expected result, and reproduction steps. Do not edit or repair anything. Separate verified failures from inferred gaps. Report missing access/provider credential blockers. Finish with concise ranked findings and all inspected URLs/screens; never claim a browser test you did not actually execute.
```

## P01 — Admin console launch blockers and sensitive-data exposure

### P01-A — Claude Code: fix server crashes, no-op actions, auth/data hygiene

```text
You are Claude Code, owner of security-sensitive web/backend fixes for ConstructsHub. Task ID P01-A. Implement only the admin blockers listed below and tests. Do not broaden scope into unrelated redesign.

PROJECT: Next.js 15 App Router web app is `waquor/`; Prisma 6; TypeScript strict; Zod; existing auth helpers, shared admin dashboard components and middleware. SRS Master v2.0 is the authority, especially admin console sections §10.9–§10.13 and security NFRs. Supplied screen PDF pages 5, 6, 15, 16, 17 are visual workflow references.

GIT: create isolated worktree `../Construct-Hub-p01-admin-fixes`, branch `task-p01-admin-fixes`, from clean local `main` after P00. If not clean/base missing, stop. Do not pull/push/merge/PR, edit `.env` or `PROGRESS.md`, add packages, or edit Prisma schema/migrations without specific approval. Commit only when green.

NON-NEGOTIABLE CONTRACT: read `waquor/prisma/schema.prisma` before field names. Use `user.role` for session gates and DB `userType` in Prisma `where`; `Profile` means `prisma.profile`; never include passwordHash or secrets in API DTOs. Analytics/notification calls stay fire-and-forget (`void`). Missing providers are non-fatal. Never log raw email, phone, IBAN, token, message body, or credentials. Preserve middleware CSP/HSTS/auth gates. No success stubs, no TODO placeholders, no production-looking mock data.

KNOWN ISSUES TO reproduce before fixing:
1. `/dashboard/admin/verifications` crashes when unverified users exist due to passing event handlers from a Server Component, and Approve/Reject are no-op buttons.
2. `/dashboard/admin/finance` crashes when `r.recipient` object is rendered as a React child; inspect response shapes rather than suppressing the error.
3. `GET /api/payouts` exposes nested user data including `passwordHash`; reduce to an explicit safe DTO/selection and test that secrets never serialize.
4. Chargeback Log crashes when code expects `refundedEscrows.status` that is absent or named differently; trace authoritative schema and response contract.
5. `/dashboard/admin/users/[id]`, `/dashboard/admin/disputes/[id]`, `/dashboard/admin/support/[id]` links lead to 404 (verify actual paths before changing).
6. Admin audit view reads `AuditLog` although actual `auditLog()` writes `AuditEvent`; align with actual schema/data source and tests.
7. Feature Flags card renders blank when `flags: []` is a successful response; explicit empty state and correct fallback/config source, no fake flags.
8. Finance page has duplicated nested `DashboardShell` / accidental `dir="rtl"`; fix direction through the shared locale mechanism without regressions.
9. Add valid sidebar links for existing finance, analytics, search, and moderation/admin pages without introducing duplicate links or leaking admin paths to other roles.

IMPLEMENTATION RULES: examine the schema, permissions utilities, routes and page boundaries first. Keep database access in server code, pass serializable data/props to Client Components, and place click handlers only in client components. For approve/reject, use a real guarded server action/API route, input validation, audit event, confirmation/feedback and rejection reason if required by SRS. Use idempotent status transitions and return proper error status codes. Do not bypass permission helpers. Do not render raw ORM entities to clients; map explicit allowlisted DTOs. Ensure admin-only APIs and pages are server-gated and unauthorized users receive a safe denial. Audit decisions in `AuditEvent` with minimal non-PII metadata.

TESTS: add targeted regression tests for each fixed crash/no-op/secret exposure where the existing framework permits. Specifically prove the payout response contains no `passwordHash`/token/IBAN; non-admin access is denied; valid approve/reject updates persisted status with audit evidence; invalid transition and rejection-without-reason are handled according to SRS; audit list reads persisted `AuditEvent`; empty flags is deliberate UI; chargeback list handles refunded and non-refunded rows. Do not rely only on HTTP 200.

VERIFY in `waquor/`: `npm run typecheck`, `npm test`, `npx next build`; run relevant browser test/screenshots if browser tooling is available. Record exact output. Write `docs/reviews/task-reports/P01-admin-fixes.md` with requirement references, root causes, files changed, regression test evidence and screenshots/URLs. Do not edit `PROGRESS.md`; include suggested status text. Make one focused commit and report branch, SHA, outputs, known blockers. Do not merge/push.
```

### P01-B — Antigravity: browser acceptance review after P01 merges

```text
Act as Antigravity QA reviewer for task P01-B. Review the merged implementation of task P01-A; do not edit source code. Project root is `Construct-Hub_Project`, web app `waquor/`, SRS Master v2.0 in `ConstructsHub-Requirements/`. The relevant supplied UI references are the verification, finance, super-admin fees, support/dispute, and content moderation screens in `BanahBuild ConstructsHub screens.pdf`.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-p01-admin-browser -b review-p01-b-p01-admin-browser main`, then `cd ../Construct-Hub-review-p01-admin-browser`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Do not pull, push, merge, create a PR, change `.env`, install packages, or modify Prisma schema. Preserve all PII: use test fixtures and redact identifying values. Inspect the P01 branch/commit already merged by the owner and confirm there is no unmerged dependency before testing.

Use the browser to test as an authorized admin, an ordinary user, and an unauthenticated user where test accounts exist. Visit `/dashboard/admin/verifications`, `/dashboard/admin/finance`, `/dashboard/admin/audit`, `/dashboard/admin/config`, `/dashboard/admin/analytics`, `/dashboard/admin/search`, all previously broken detail destinations, and `/dashboard/admin/moderation` if present. Seed/create records only through the documented test fixture mechanism; never manipulate production data. Verify pages render with zero, one, and multiple rows; approve and reject really persist; rejection requires a reason if SRS specifies it; finance renders nested values safely; audit events are visible; feature flags render a purposeful empty/unavailable state; links are admin gated; browser console/network contains no uncaught errors. Capture before/after screenshots where possible.

Write `docs/reviews/task-reports/P01-antigravity-review.md` with environment, commit SHA, user role, URL, actions, actual visible outcome, expected outcome, console/network errors, screenshots and severity-ranked defects. Cite exact SRS IDs discovered in canonical SRS. Do not claim a check you couldn't run; list blockers explicitly. Final result must be PASS, PASS WITH DEFECTS, or BLOCKED, with an evidence index.
```

## P02 — Prisma migration history: SearchDocument dependency / deploy safety

### P02-A — Claude Code: safe migration ordering remediation

```text
You are Claude Code, the sole schema/migration owner for task P02-A. Goal: fix the documented deploy failure in which a migration under `waquor/prisma/migrations` references `SearchDocument` before the migration that creates it. Keep the fix additive and safe for already-deployed databases.

PROJECT: Construct-Hub; Next.js 15 + Prisma 6 in `waquor/`. SRS Master v2.0 and current Prisma schema/migrations define persistence truth. Work only on `waquor/prisma/schema.prisma`, migration files, migration tests/scripts and this task's evidence report. No feature/UI changes.

GIT: clean local `main` and prerequisite merges are required. Create worktree `../Construct-Hub-p02-migration-repair`, branch `task-p02-migration-repair`. If worktree creation fails or tree is dirty, stop. No pull/push/merge/PR, no `.env`, no `PROGRESS.md`, no `prisma migrate reset`, no destructive repair, no `db push` presented as a migration solution. No new dependency without approval.

SAFETY PROCEDURE:
1. Inspect full schema, migration history, `migration_lock.toml`, migration deploy scripts, CI and the exact SQL of the migration reported to fail. Determine whether the SearchDocument create migration is later, absent, renamed, or dependent on a migration not shipped. Do not infer.
2. Decide correct remediation based on whether affected migrations may already be applied in any shared environment. If the implicated migration has shipped/applied, do not rewrite its SQL. Prefer a new corrective migration or a properly documented baseline/reorder strategy. If it is provably unreleased and unapplied everywhere, justify any historical repair and document the evidence. Never assume a developer laptop is the only database.
3. Build a throwaway isolated PostgreSQL database/container or use existing project test infrastructure that contains no user data. Ensure database name is unmistakably disposable and credentials are not printed. Test clean `prisma migrate deploy` from the full checked-in migration history; confirm target schema matches expected models. If Docker/DB is unavailable, don't improvise a dangerous substitute—report BLOCKED and provide exact safe next steps.
4. Add regression verification so the migration-order problem is detected in CI or script. Do not mask failure by skipping a migration, marking it applied without justification, or editing the source schema alone.
5. Verify existing schema/client generation workflow per repository convention and test migration idempotency as appropriate. Record exact Prisma version and migration IDs.

DOC: write `docs/reviews/task-reports/P02-migration-repair.md` including root cause, whether historical files were touched and why, migration IDs, disposable database identity (no secret values), exact commands/output, schema/client validation, rollback considerations, and deployment order. No `PROGRESS.md` edit. Only commit after safe validation; if safety can't be established, commit only a report that explains the blocker and asks owner for deployment-history confirmation rather than a risky migration change. Report branch/SHA and don't merge/push.
```

### P02-B — Antigravity: migration/DevOps evidence review

```text
You are Antigravity reviewing task P02-B. This is a READ-ONLY deployment-safety audit; do not edit code, migration SQL, environment files, or databases. Inspect P02's report and branch diff and verify claims against the repository.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-p02-migration-review -b review-p02-b-p02-migration-review main`, then `cd ../Construct-Hub-review-p02-migration-review`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Check that no destructive reset, unsafe `db push`, skipped migration, secret disclosure, or unsupported “mark as applied” is introduced; confirm the remediation accounts for pre-existing deployments. Inspect `waquor/prisma/migrations` ordering and CI's invocation of Prisma. If a disposable database test exists, inspect the captured output and confirm it covers the complete migration history, not only the last migration. If no reproducible evidence exists, mark the task BLOCKED, not PASS.

Write `docs/reviews/task-reports/P02-antigravity-review.md` with exact findings, migration IDs, whether an existing deployed DB requires a separate operator runbook, and a clear PASS / PASS WITH DEFECTS / BLOCKED verdict. Do not merge or push. Do not include credential values.
```

## P03 — Shared integration and progress keeper

### P03-A — Claude Code: one-branch-at-a-time integration gate (use after a feature is merged)

```text
Act as the ConstructsHub integration engineer, task P03-A. This task must be run from the owner's canonical repository after the owner has merged exactly one approved feature branch into local `main`. Never merge branches yourself.

PROJECT: `Construct-Hub_Project`, web `waquor/` (Next.js 15, Prisma 6, strict TS), mobile `mobile/` (Expo SDK 52/RN 0.76), BIM `services/bim/` (FastAPI + IfcOpenShell). SRS Master v2.0 is scope authority. Read current `PROGRESS.md`, the task evidence report, git history, and `waquor/prisma/schema.prisma` before interpreting model names. Session role and Prisma convention: `user.role` vs DB `userType`, `Profile`/`prisma.profile`, `ownerId`, `ProjectAssignment.userId`, TimeLog `checkIn`/`checkOut`. Analytics/notifications are fire-and-forget. No PII/secrets in logs. Do not touch `.env`, add dependencies, push, or create a PR.

GIT RULE: inspect `git status --short --branch`. The canonical repository must be clean and on local `main`, with the target feature already merged by the owner; if not, stop and report. From that clean main, create the dedicated integration worktree `git worktree add ../Construct-Hub-p03-integrator -b task-p03-integration-progress main`, then `cd ../Construct-Hub-p03-integrator`. Do not pull or merge in the task worktree. Run all integration checks against this snapshot. Do not push or open a PR; the owner may merge the documentation-only status branch after reviewing the evidence.

INTEGRATION PROCEDURE:
1. Verify exactly one target feature commit is now on `main`; inspect its diff against the parent and its task report. Confirm it did not modify `.env` or unrelated scope. Check whether there are schema/migration changes and run the authorized migration validation against a disposable DB only.
2. Run relevant web commands `npm run typecheck`, `npm test`, `npx next build`. Run `mobile` checks if mobile changed; run BIM pytest/container check if BIM changed. Capture exact exit codes and condensed output. Do not say “green” if any command is missing or failed. If a test fails because of merge integration, isolate and fix only if clearly in scope; otherwise report a blocking follow-up branch task and do not change unrelated code.
3. Inspect the corresponding evidence report, ensure its screenshots/eval report are generated by the checked-out revision and contain no PII or credentials.
4. Update `PROGRESS.md` tables and task ledger for this one merged task only. Replace estimated percentages only when there is a traceable evidence basis; otherwise state “implemented; acceptance not yet independently verified.” Resolve stale counts with actual command output, retaining date/stamp and source notes. Do not erase open external blockers.
5. Add a concise integration record under `docs/reviews/task-reports/integration-<task-id>.md` with commit SHA, exact checks, report paths and remaining issue. Commit only `PROGRESS.md` and this integration record in a separate focused commit, e.g. `docs: record <task-id> integration evidence`.
6. Report the feature SHA, evidence, tests, progress change, any external owner action required, and the next task IDs now unblocked. No push/PR.

Acceptance: the user can independently identify what merged, what ran, what is verified versus merely implemented, and why the next task can start. Never call a blocked or partially checked task “Done.”
```

## C10 — Mobile app §15.4 parity closeout (verification first, not a rewrite)

### C10-A — OpenCode: mobile parity audit and fixes for current implemented scope

```text
You are OpenCode taking ownership of mobile closeout task C10-A for ConstructsHub. The supplied `PROGRESS.md` dated 23 October 2026 already says these features landed: Supplier and Owner dashboard tabs and role gates, message attachment picker/signed-URL upload, environment-gated Sentry with PII-scrubbing `beforeSend`, RTL spacing/position/flex/text helpers, push-tap deep-link listener, Worker shift/contract screens, Organisations tab. Do not rebuild them from scratch. Verify what exists, close real defects, and separately report external/native verification gates.

PROJECT: root `Construct-Hub_Project`; mobile `mobile/` = Expo SDK 52, Expo Router 4, React Native 0.76, TanStack Query, SQLite/offline outbox, FCM/APNs and Sentry. Web/API in `waquor/`. SRS Master v2.0 §15.4 is scope authority. Read `mobile/lib/session.ts` role handling first, then `mobile/lib/api.ts`, outbox, push, Sentry, i18n/theme, router layouts, existing screens, mobile manifest/scripts, and the current server API paths. Read `waquor/prisma/schema.prisma` before field assumptions. In session logic use `user.role` (`USR_*`); Prisma filters use `userType`. Missing mobile endpoints must be built by a separately owned Claude backend task, not patched with fake mobile results.

GIT: after P00 baseline is captured and prerequisites have been merged, create clean worktree `../Construct-Hub-c10-mobile-closeout`, branch `task-c10-mobile-closeout` from local main. If tree is dirty or main missing, stop. No pull/push/merge/PR, `.env`, dependency additions, schema/migrations, or `PROGRESS.md` edits. Do not run more than one Expo dev server against shared services.

AUDIT AND FIX:
1. Verify role selection/session parsing and deep-link destination mapping for all roles that the SRS actually supports. Use the session helper—not ad hoc string checks. Test supplier and owner tabs, worker shift/contracts, organisation tab, messages/attachments, push-tap routing and RTL helpers. Check routes do not expose the wrong role dashboard after login, logout or role switch.
2. Check attachment picker/upload against the real signed-URL API for content type/size, progress, retry, cancellation, expiry and safe error messages. Verify the matching web/server endpoints exist. Mobile outbox can silently swallow `ApiError{status:0}`; if any action hangs or appears successful, inspect the actual route/method and report or build a separately approved server-route ticket.
3. Verify Sentry is genuinely env-gated and no-ops safely when absent; `beforeSend` must scrub email, phone, tokens, IBAN, message text, uploaded document text/URLs and user-identifying breadcrumbs. No DSN should be written to app source; `.env` remains untouched.
4. Run per-component Arabic RTL checks for carousels, charts, pickers, modals, numeric currency, maps/coordinates, and direction-sensitive icons; use existing helper functions rather than duplicating logic. Add screenshots for the worst issues if simulator/browser is available.
5. Verify push handler routes the correct allowed deep link after cold start and foreground/background tap; malformed/unknown links must fail safely. Do not claim native FCM/APNs token delivery unless tested with an actual supported device build and configured certificate. Unit mocks prove parsing only, not push delivery.
6. Check offline outbox retries real available mobile mutation routes, especially workforce check-in/out and trip ping. For missing routes, do not paper over API 404 with local success; coordinate a separate server task.
7. Use `npm ci` if the lockfile exists and package installation is needed; otherwise follow the manifest's current installation method. Do not add packages. Run the actual mobile typecheck and test scripts, static route checks and web typecheck/test/build only if shared files changed.
8. Update no shared status table directly. Write `docs/reviews/task-reports/C10-mobile-closeout.md` with screen→SRS→API mapping, real tests, screenshots, remaining known gaps (EAS signing cert, native FCM/APNs validation, any API outbox route, PDF/contract scope), and proposed status text. Never claim native verification absent device/provider access.

ACCEPTANCE: every implemented claim has a test/output/screenshot; role gates and deep links are safe; Sentry scrub is tested; UI RTL checked; no missing route disguised as a working button; test output shown. Commit focused fixes/report, report branch/SHA, no merge/push.
```

### C10-B — Antigravity: mobile screen parity and RTL review

```text
You are Antigravity independently auditing mobile task C10-B for ConstructsHub. Do not implement mobile changes or report a screen as complete only because the corresponding file exists.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-c10-mobile-parity -b review-c10-b-c10-mobile-parity main`, then `cd ../Construct-Hub-review-c10-mobile-parity`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

PROJECT `Construct-Hub_Project`; mobile `mobile/` Expo SDK 52/RN 0.76, web `waquor/`, canonical SRS §15.4, `PROGRESS.md`, and supplied 17-page screen PDF. Use current app screens/routes and server API routes as evidence. Read `mobile/lib/session.ts` role handling and current i18n/theme/push/attachments before assessing. Do not touch `.env`, schema or migrations; no pull/push/merge/PR.

Compare applicable mobile/web flows for owner, supplier, worker, driver, messaging/attachments, notifications, analytics, organisation, sign-in/role handling and push deep links. Confirm the web counterpart actually exists and do not assume screen deck content is backend truth. Switch locale to Arabic and capture screenshots of the worst three screens; inspect carousels, charts, pickers, safe areas, button direction, mixed Arabic/Latin IDs, SAR/JOD values and navigation. Check screen actions call actual API routes, especially any API 404 hidden by the offline outbox. Verify empty/error/offline/loading states and permission gates. Inspect Sentry config/filter behavior but never output secrets.

For every gap, classify as P0 security/data integrity, P1 blocked journey, P2 usability, or P3 polish; record screen, corresponding SRS clause, exact reproduction, expected/actual, and evidence. Distinguish code-path unit test from simulator and native-device push evidence. Write `docs/reviews/task-reports/C10-antigravity-mobile-parity.md`; return PASS/PASS WITH DEFECTS/BLOCKED. No implementation, merge or push.
```


# 7. Stage 4 — AI foundation and search completion

## D1 — AI evaluation harness (must precede acceptance of D2–D5)

### D1-A — Claude Code: build the measurable evaluation harness

```text
You are Claude Code and own the AI evaluation foundation for ConstructsHub, task D1-A. This task must land before accepting the real image detector, assistant, OCR/handwriting, and related AI search changes.

PROJECT: repository `Construct-Hub_Project`; SRS Master v2.0 under `ConstructsHub-Requirements/`. Web services and AI routes live in `waquor/`; BIM is `services/bim/`. First read the canonical SRS, `PROGRESS.md`, current AI/OCR/image/IFC implementations, package manifests, test conventions, CI workflows, and `waquor/prisma/schema.prisma` before using database names or fields.

GIT: clean local `main` only, then worktree `../Construct-Hub-d1-eval-harness`, branch `task-d1-eval-harness`. If dirty or missing dependencies/base, stop. Do not pull/push/merge/PR; never edit `.env` or `PROGRESS.md`; no dependency install/change without explicit approval. Commit only your task files and evidence report.

SECURITY/DATA CONTRACT: do not collect or commit real customer documents, personal data, internal tenders, credentials, or proprietary uploaded models. Use publicly licensed datasets only after verifying and recording the licence/attribution and any redistribution limits. For Arabic handwriting, synthetic samples are acceptable for harness mechanics but must be labeled synthetic and must not be claimed as real-world model-accuracy evidence. Never present model-generated labels/transcripts as independent ground truth. Do not expose raw user data in logs.

IMPLEMENT:
1. Add `ai/evals/` at repo root with a documented, repeatable CLI runner. Define a versioned dataset manifest and record dataset provenance/licence/source URL, language, class labels, split, annotation version, and whether each sample is real/public, synthetic, or an external fixture not included in Git. Do not commit large datasets if licensing/size disallows; provide reproducible download or user-supplied-data instructions with checksums.
2. Provide separate evaluation tracks: (a) construction-material object detection/classification with 50+ gold-labeled photos or a clearly documented staged acquisition plan if legal licensed samples are unavailable; (b) 30+ document scans including a dedicated Arabic handwriting subset with independently verified transcripts; (c) IFC fixtures with expected quantities and explicit units/tolerance. Include representative Arabic/English, Arabic-Indic and western numerals, punctuation/diacritics, RTL/mixed-direction lines, stamps/signature regions, and cases with low image quality. Do not invent the gold annotation.
3. Implement a Python runner that calls the *real existing service interface* rather than duplicating the model logic. Support detection precision/recall/F1 and per-class confusion analysis; OCR CER/WER and per-field exact match where field labels exist; BIM per-quantity absolute and percentage error with unit normalization and clear handling of expected zero quantities. Preserve raw sample IDs only when non-identifying; never print source content or PII.
4. Generate a Markdown report with dataset/model/config/commit/version, sample counts, ignored/error cases, per-class and aggregate metrics, timing/P50/P95, and a clear baseline-vs-candidate table. Report `NOT MEASURED` when the service cannot run. Never manufacture results or claim improvements based on synthetic-only samples.
5. Run a baseline against today's actual OCR-word-box image-search behavior and current OCR/BIM implementations where callable. Save the exact report under `ai/evals/reports/baseline-<UTC-date>.md` and a review copy/reference under `docs/reviews/task-reports/D1-eval-baseline.md`. If current code returns word boxes only, score only the measurable baseline (e.g. mapped class/detection behavior) and explain limitations; do not relabel word boxes as object detections.
6. Add a CI smoke job for a deterministic 10-sample small set on AI-service-related changes. CI should fail for crashes, malformed output, evaluation runner regression, and hard acceptance thresholds explicitly configured for a model. Do not make CI green by lowering thresholds without documenting an evidence-based reason. Full 50/30/IFC evaluation can be a manual/release job if runtime is too large.
7. Add no new package without approval. Inspect current Python/runtime dependency availability; if a needed evaluator library is missing, either implement the metric in a tested minimal form using approved existing runtime or report the approval needed, with no manifest change.

TESTS/OUTPUT: test metric calculations with known toy cases (including empty predictions, Arabic Unicode, whitespace normalization policy, unit conversion, division by zero, and malformed outputs); test deterministic repeatability; run the baseline service; run the 10-sample CI command locally if available. Add `ai/evals/README.md` explaining how to invoke, update, license, split, and interpret the suite. Report exact commands/output and data caveats. Do not edit `PROGRESS.md`; include a suggested status line. Commit focused changes as `test(ai): add reproducible evaluation harness` and report branch/SHA. Do not merge/push.
```

### D1-B — Antigravity: independently review evaluation validity

```text
You are Antigravity acting as an independent evaluation-methodology auditor for ConstructsHub task D1-B. Do not implement model features, edit test labels, lower thresholds, or alter the evaluation runner.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-d1-eval-audit -b review-d1-b-d1-eval-audit main`, then `cd ../Construct-Hub-review-d1-eval-audit`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

PROJECT/CONVENTIONS: repository `Construct-Hub_Project`, canonical SRS Master v2.0 under `ConstructsHub-Requirements/`, AI eval harness at root `ai/evals/`. Inspect the D1 branch/commit supplied by the owner. Do not pull/push/merge/PR, touch `.env`, install packages, or edit `PROGRESS.md`. Never put personal data, secrets, or proprietary documents into screenshots/reports.

AUDIT:
1. Confirm the data manifest links every sample/dataset to a source and licence, and that synthetic data is clearly separated from real/public gold test data.
2. Check gold labels/transcripts are independent, splits are reproducible and avoid leakage, the 10-sample CI set is deterministic, and dataset version/checksum are recorded.
3. Manually inspect metric calculations using the known toy fixtures: precision/recall/F1 definitions, CER/WER Unicode normalization, RTL/diacritics policy, unit-normalized BIM quantity error, empty/invalid service output, and no-prediction edge cases.
4. Verify the “baseline” report actually runs the checked-out services and does not convert OCR word boxes into detections or invent metrics. Rerun the short command if environment allows; capture stdout/exit code.
5. Evaluate whether reports specify model/commit/config, data limitations, P50/P95 timing, sample counts, and actual acceptance gates.

Write `docs/reviews/task-reports/D1-antigravity-eval-audit.md` with file/line evidence, commands independently run, discrepancies, and PASS / PASS WITH DEFECTS / BLOCKED. If the real golden data cannot be lawfully acquired, recommend precisely what can be accepted now and what must remain blocked. Do not claim the dataset meets minimum counts without verifying its manifest.
```

## D2 — Real construction-material image detector

### D2-A — Claude Code: detector service + catalogue mapping

```text
You are Claude Code, owner of the backend/model integration for ConstructsHub task D2-A. Replace the current OCR-word-box image-search heuristic with an actual object detection/classification path, gated on D1's accepted evaluation harness. This is a technical and security-sensitive task; do not substitute a heuristic and call it a detector.

PROJECT: `Construct-Hub_Project`; SRS Master v2.0, FR-SRCH-08, relevant video/image-search requirements (including FR-SRCH-12 where the canonical SRS confirms them), and performance NFRs. Web `waquor/`; current image-search API and search ontology are authoritative integration points. Read actual SRS IDs and existing endpoint/service/client contracts before coding. Read Prisma schema for any model access.

GIT: create clean worktree `../Construct-Hub-d2-detector`, branch `task-d2-image-detector` from local `main` after D1 has merged. No dirty tree, no pull/push/merge/PR, no `.env`, no `PROGRESS.md`, no dependency/model-weight download or package addition without owner approval. If D1 is not merged with a reproducible harness, stop with a blocker report rather than coding without acceptance measurements.

SECURITY/REALITY: do not expose uploaded image URLs or bytes in telemetry; validate type/size and treat files as untrusted. Do not log image contents or user identity. Preserve authentication/rate limits/storage policies. Model weights must have a compatible licence and supply-chain provenance. Do not introduce Google Vision calls unless a real credential and explicit owner approval exist. Do not add `transformers.js`, YOLO, native binaries, model weights, or a network dependency without asking. First inspect installed/approved options. If no genuine detector can run under the existing dependency policy, implement only a clearly labeled, non-production adapter boundary + a documented approval request and mark detector acceptance BLOCKED—do not claim completion.

IMPLEMENT when an approved actual detector is available:
1. Create a clear detector adapter with request/result types, model/version identity, bounding-box coordinate convention, normalized confidence, per-image bounds, error types, timeout/cancellation, and deterministic test injection. It must return real bounding boxes and class predictions from the model, not OCR token rectangles.
2. Map detector classes to the existing catalogue/search ontology and then catalogue products using the current search engine/embedding similarity if available. Inspect existing embedding implementation; do not invent a new vector column, use schema modifications, or add pgvector if the repo doesn't already support it. If ontology/product mapping is ambiguous, return a suggestion list with calibrated confidence and explanation rather than a confident wrong SKU.
3. Enforce configurable confidence thresholds. Below threshold, present search suggestions/review rather than wrong labels. Include “unknown/unsupported object” outcome, no-detection result, multiple detections and partial failures. Preserve Arabic/English class aliases and units where defined.
4. Preserve endpoint access checks, upload limits, rate limits, anti-abuse safeguards and existing result schema compatibility. Avoid blocking a request on unnecessary external providers. Add latency instrumentation compatible with `templateRoute()`.
5. Produce a real before/after D1 evaluation report; include per-class precision/recall/F1, false positive/negative examples, P50/P95 request latency, hardware/runtime, and exact commit/model. Acceptance target is measurable improvement over OCR-word-box baseline without fabricated comparison. Image-search P95 target is under 4 s per the SRS/NFR plan; explain benchmark dataset/device and report if target fails.

TESTS: unit tests for boxes/clipping, normalized coordinates, confidence gating, ontology miss, mapping ambiguity, empty results, corrupt/oversized file rejection, timeout/provider-unavailable path, authorization, Arabic labels, and metrics privacy. Run full `waquor/` typecheck/test/build. Save `docs/reviews/task-reports/D2-detector-eval.md`. No `PROGRESS.md` edit. Commit source and tests only when actual model path is legal and functional; otherwise commit the honest blocker/architecture report without misleading production code. Report branch/SHA and no merge/push.
```

### D2-B — OpenCode (Nemotron Ultra 3 or DeepSeek): image-search web/mobile UX

```text
You are OpenCode implementing the isolated image-search user experience for ConstructsHub task D2-B. Do not implement or fake the detector/model. Consume the agreed typed endpoint contract from D2-A only; if it has not been merged or its actual response schema is unknown, stop and report the exact dependency rather than inventing a client contract.

PROJECT: web `waquor/` (Next.js 15, TypeScript strict, Tailwind, existing component patterns) and mobile `mobile/` (Expo SDK 52/Expo Router 4/RN 0.76). SRS Master v2.0 image-search requirements, visual references and existing locale/i18n components are authoritative. Read existing screen/components/API utilities first. Read `waquor/prisma/schema.prisma` before interpreting any product fields. Use `user.role` for session gates and DB `userType` only in Prisma queries. Do not reveal PII or uploaded image URLs in analytics.

GIT: after D2-A endpoint schema is agreed/merged, create worktree `../Construct-Hub-d2-image-ux`, branch `task-d2-image-ux` from local `main`. Tree must be clean. No pull/push/merge/PR, `.env`, dependency additions, schema/migration changes, or `PROGRESS.md` edits. Do not alter shared API contract files unless the prompt's endpoint owner explicitly assigns them to you.

IMPLEMENT real UX in web and mobile according to existing design patterns:
- allow capture/upload through approved current platform APIs, show progress, cancel/retry, validate supported image type/size on client without relying on client validation for security;
- submit via actual API utility and show loading, network error, timeout, unsupported format, no detection, detector unavailable, and low-confidence “check suggested items” states;
- render bounding boxes overlayed correctly on the original image, with stable coordinate scaling across resize/orientation and a list of each detection's label, confidence and matched catalogue item(s);
- include one-tap add-to-cart only where a unique match and permission are valid; do not auto-add low-confidence suggestions. Reuse existing cart mutations and product availability/price contracts instead of inventing prices or product data;
- include a “report incorrect label” feedback action that posts to an existing real feedback route if one exists; if not, identify the missing endpoint dependency and implement no fake success. Ensure privacy-safe payload minimization and appropriate abuse limits;
- support keyboard accessibility, screen-reader labels, Arabic/English copy and RTL; screenshot mirror testing in Arabic; correct touch targets and safe-area placement on mobile;
- never use fixture detections in production. Component tests may mock detection API responses only as explicit test fixtures.

Add component tests for upload/capture affordances, resize/box alignment, one/many/zero detections, threshold states, add-to-cart success/failure, user correction reporting, Arabic RTL and provider errors. Run web `npm run typecheck`, `npm test`, `npx next build`; run mobile's actual typecheck/tests if mobile changed. Write `docs/reviews/task-reports/D2-image-ux.md` with screenshots, routes, test output and any API blocker. Commit focused changes only, report branch/SHA and do not merge/push.
```

### D2-C — Antigravity: real detector and UX acceptance audit

```text
You are Antigravity independently verifying ConstructsHub task D2-C after D2-A and D2-B are merged. Do not code, train a model, edit thresholds, or alter benchmark data. SRS Master v2.0 image-search and video-search requirements govern acceptance.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-d2-detector-audit -b review-d2-c-d2-detector-audit main`, then `cd ../Construct-Hub-review-d2-detector-audit`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Inspect the D1 golden set, detector integration report, actual model/runtime/config, and web/mobile UI. Run the approved evaluation command if possible; confirm baseline and candidate use the same held-out samples, the reported detector outputs real bounding boxes, labels are catalogue mapped, uncertainty/low-confidence results fall back to suggestions, and image-search p95 is measured rather than asserted. Inspect for false confidence, unsupported products, non-working correction reports, add-to-cart UI that does not call a real mutation, and user-upload data leaking into logs.

Browser/device review: test camera/upload, progress/cancel/retry, overlapping and multiple boxes, image resize/orientation, no detections, ambiguous catalogue mapping, low-confidence state, API timeout, add-to-cart result and correction flow. Switch to Arabic and inspect labels, box geometry, logical padding and text direction. Do not use mocked results as proof of production model performance; mocks are allowed only for component test coverage.

Write `docs/reviews/task-reports/D2-antigravity-acceptance.md` with dataset + model commit, exact metrics, screens, screenshots, reproduction steps and PASS/PASS WITH DEFECTS/BLOCKED. If dependency approval/model weights/credentials are missing or golden set isn't valid, mark the actual detector requirement BLOCKED and explain the single action needed to unblock it.
```

### D2-D — OpenCode: mobile video search per-frame detection overlay

```text
You are OpenCode completing the video-search UX slice for ConstructsHub task D2-D. Scope: FR-SRCH-12's remaining mobile per-frame bounding-box overlay. Do not substitute a single static image overlay or mocked coordinates for a real frame result.

PROJECT: `Construct-Hub_Project`, `mobile/` Expo SDK 52/Expo Router 4/RN 0.76, existing video-search API and `waquor/` backend. SRS Master v2.0 is authoritative; inspect exact FR-SRCH-12 wording, existing video upload/processing response contract, detection result coordinate system and image detector integration. Do not invent frame fields or polling state. Read Prisma schema if model data is involved.

GIT: only after D2-A detector and D1 eval are merged. Create clean worktree `../Construct-Hub-d2-video-overlay`, branch `task-d2-video-overlay`. No pull/push/merge/PR, `.env`, new dependency, schema/migration, or PROGRESS.md edit. Do not install a camera/video library without explicit approval.

IMPLEMENT:
- Use the existing video capture/upload path if present; validate maximum duration/file size on client and rely on server validation for trust. Show progress, cancel, retry, accepted/processing/complete/failed states.
- Render a synchronized frame preview/timeline and its real returned detections, with per-frame boxes and labels using the response coordinate contract. Handle aspect-ratio conversion, rotation, thumbnail size, time/frame mapping and seeking without boxes drifting away from objects. Clearly indicate frames with no detections and confidence below threshold. If the service only supports single images today, stop the per-frame result claim and write the precise backend API requirement; do not fabricate a video prediction response.
- Avoid sending every decoded frame at full frame rate unless the service and SRS explicitly support it. Follow the current API's bounded sampling strategy or propose one with explicit maximum FPS, frames/video, duration and resource cost. Show the user the sampling policy honestly if UI-visible. Ensure cancellation actually cancels/invalidates processing when contract supports it.
- Correction feedback must attach to an actual frame timestamp/frame identifier + detection ID and invoke a real endpoint; if no endpoint exists, clearly mark it as a dependency rather than making a successful toast.
- Support Arabic RTL, accessible controls, playback controls, low-confidence state and safe error messages. Do not log video bytes/URLs or personally identifying media metadata.

Tests: actual frame response with multiple detections, no detection, low confidence, landscape/portrait scaling, rotated media, seek/scrub, cancelled job, upload failure, malformed coordinates, long video, unsupported server contract and Arabic RTL. Component mocks are acceptable in tests only. Run mobile typecheck/tests and web checks if shared API contracts are edited (shared server endpoint changes are not in your ownership). Write `docs/reviews/task-reports/D2-video-overlay.md`, commit focused UI/tests, report branch/SHA and do not merge/push.
```


## D3 — AI assistant v1/v2 scope gate, then implementation only if approved

### D3-GATE — Claude Code: resolve the written scope decision without guessing

```text
You are Claude Code handling a product-scope gate, task D3-GATE. Do not start the AI assistant feature implementation until the source of truth contains an explicit scope decision.

PROJECT: ConstructsHub; canonical SRS Master v2.0 under `ConstructsHub-Requirements/`, with §5.3 and §9.4 to inspect. Existing LLM integration may be in `waquor/lib/llm.ts`; permission checks in `waquor/lib/permissions.ts`; search stack/catalogue/tenders/projects/help content are existing sources. Read actual file locations and do not assume implementation details.

GIT: create clean worktree `../Construct-Hub-d3-assistant-gate`, branch `task-d3-assistant-gate` from local main. No pull/push/merge/PR, `.env`, dependency additions, schema/migrations or `PROGRESS.md` edits. No secret handling.

TASK: inspect SRS, roadmap, ADRs, feature flags and current product decisions for an explicit “AI assistant in v1 or v2” decision. If found, cite exact file/path/date/decision and provide a concise implementation acceptance checklist tied to §9.4. If no decision is documented, create `docs/decisions/ai-assistant-release-scope.md` with (a) unresolved decision, (b) trade-offs, (c) minimum safe release criteria, (d) a recommendation to treat the feature as v2/defer public enablement until the evaluation harness, permission-filtered RAG, audit logging and red-team tests pass, and (e) the exact owner approval required. This is a recommendation, not a unilateral scope change.

Do not build, scaffold, or add an exposed AI assistant route/UI. Do not put in a fake mode. You may inspect dependencies and write the decision record only. Report whether D3 is GO or HOLD. Commit the decision record only if its wording faithfully reflects the decision still needing owner approval. Do not merge/push.
```

### D3-A — Claude Code: secure RAG/tool-calling assistant backend (only after D3-GATE is GO)

```text
You are Claude Code implementing the security- and data-sensitive backend of ConstructsHub task D3-A. Proceed only if `docs/decisions/ai-assistant-release-scope.md` or another canonical ADR explicitly authorizes AI assistant v1 scope. If the scope is v2 or unresolved, do not implement the user-facing module; stop and report the gate.

PROJECT: repo `Construct-Hub_Project`; SRS Master v2.0 §9.4, §5.3, NFR-SEC-12 and permission/privacy requirements. Existing LLM plumbing is `waquor/lib/llm.ts` (verify actual path), permissions are in `waquor/lib/permissions.ts`, search engine/index/ontology already exist, Prisma schema is authoritative. Read every source and use current conventions; do not invent model/provider settings.

GIT: D1 evaluation harness and scope GO must already be merged to local `main`. Create clean worktree `../Construct-Hub-d3-assistant-backend`, branch `task-d3-assistant-backend`. Do not pull/push/merge/PR, edit `.env`, install new dependencies without approval, or edit `PROGRESS.md`. Claude owns auth/security/schema/money-sensitive logic. Only modify Prisma schema/migrations if the need is justified, task is explicitly approved, and migration safety rules are followed.

REQUIRED BUILD:
1. Hybrid RAG over current catalogue, tenders, projects and help content with Arabic and English chunking, source-level access control, tenant/project confidentiality, content freshness/deletion, and evidence citations (retrieved source IDs/titles/updated time where allowed). Never retrieve confidential tender bids across owner/role gates. Use existing search primitives first; don't add `pgvector` or an embedding store without approval. If no suitable current embedding/retrieval dependency exists, document the approval gate and don't pretend hybrid retrieval is live.
2. Strict allowlist of typed functions exactly for: search products, create cart/quote, check order status, draft tender, fetch invoice, escalate to human. Every call must go through `waquor/lib/permissions.ts` or its authoritative equivalent and validate actor, role, resource ownership, tenant, currency and input using Zod. Never let the model execute arbitrary SQL, HTTP, shell or arbitrary tool names. Side-effecting calls require explicit user intent/confirmation and idempotency; drafting is distinct from publishing/placing an order.
3. Prompt-injection defenses: clear instruction/data boundaries; treat catalogue text, attached documents, user messages and retrieved sources as untrusted data; ignore embedded instructions; enforce tool allowlist server-side; prevent source text from altering policy; bound tokens/recursion/timeout; filter secrets and unsafe HTML; no raw tool output forwarded unchecked.
4. Complete, structured, tamper-evident-enough audit of each tool call: tool name/version, allowlisted resource IDs, parameter schema, decision outcome, redacted/minimized inputs/output summary, user/role in controlled identifiers, correlation ID, timestamps. Do not store raw PII, secrets, full uploaded docs or hidden chain-of-thought. Keep audit access restricted and retention documented.
5. Streaming responses with cancellation/timeouts/backpressure and a typed error protocol; handle provider unavailable, malformed output, tool denied, no retrieval, and handoff. Provider absence must not produce fake answers.
6. Add 50 golden assistant questions with expected permitted tool calls and source/access assertions to `ai/evals/` and run through D1 harness. Cases include Saudi/Jordan market currency, Arabic/English, injection attacks, cross-tenant request, invoice/order ownership, tender confidentiality, and tool denial. Use synthetic IDs/data and no actual customer documents. Require 100% on hard permission/secret leakage tests; define realistic grounded answer/citation quality thresholds before reporting success.
7. Feature flag controls exposure; disabled by default until authorized release. Preserve route auth/middleware/rate limits and privacy-safe observability.

TEST: unit/integration/contract tests for every allowlisted tool, every role/resource denial, cross-tenant retrieval, injection string in retrieved text, secret/PII filtering, audit event fields, streaming disconnect, provider timeout and no-context answer. Use real repository test patterns, mocked LLM only in tests; don't present those tests as live model performance. Run web typecheck/test/build and D1 evaluation with exact results. Write `docs/reviews/task-reports/D3-assistant-backend.md` plus eval report. Do not update PROGRESS.md. Commit only when the feature is authorized and tests meet gates; report SHA/no merge/push.
```

### D3-B — OpenCode: assistant UI and streaming experience (only after backend contract is merged and scope GO)

```text
You are OpenCode implementing only the user interface for ConstructsHub task D3-B. Do not build an AI backend, permissions system, retrieval pipeline or model adapter. Work only after D3-GATE is GO and D3-A's real, typed API/streaming contract is merged. If not, stop and report the dependency; do not invent a fake stream or mock data outside tests.

PROJECT: web `waquor/` (Next.js 15/TypeScript/Tailwind) and mobile `mobile/` (Expo SDK 52/RN 0.76) if the agreed SRS scope includes both. Canonical SRS §9.4, current i18n and component conventions apply. Read API utility/session handling first. Use `user.role` for session logic, read Prisma schema before discussing fields, and never expose PII in analytics or traces.

GIT: create clean worktree `../Construct-Hub-d3-assistant-ui`, branch `task-d3-assistant-ui` from local main after backend contract merge. No pull/push/merge/PR, `.env`, dependency addition, schema/migration changes or `PROGRESS.md` editing. Shared API contract/backend files are owned by Claude.

BUILD:
- Web assistant widget and mobile assistant screen (only if release scope includes mobile); stream incremental tokens using the actual streaming response contract, cancel safely, recover/retry appropriately, and render explicit loading/error/no-result/provider-unavailable states.
- Tool-call progress cards such as “Searching products” and results preview must render server-returned, permission-filtered results only. Never fabricate result cards. Show citations/source links only when returned by backend contract and the current user may access them.
- Add suggested prompts that reflect page context without transmitting unrelated page data; handoff-to-human path must call a real existing endpoint or be visibly disabled with a reported API dependency. Draft tender/cart actions must require confirmation and present the consequences before a side effect.
- Use safe Markdown rendering with sanitized links/content, no unsanitized HTML. Handle long messages, code, Arabic/English mixed content, correct RTL layout, accessible live regions, reduced motion, and mobile keyboard/safe-area behavior.
- All button states must work; don't swallow route 404s as successful actions. Keep LLM test fixtures strictly in component tests.

TESTS: component tests for streamed chunks, stream interruption, multiple tool cards, no citation, error and retry, handoff, confirmation, safe Markdown, Arabic RTL and screen-reader semantics. Run web typecheck/test/build and mobile checks when changed. Write `docs/reviews/task-reports/D3-assistant-ui.md` with screenshots and test evidence; no PROGRESS.md edit. Commit focused changes; report SHA/no merge/push.
```

### D3-C — Antigravity: prompt-injection, permissions, and UI red-team review

```text
Act as Antigravity security reviewer for ConstructsHub task D3-C. Review only a scope-authorized, merged AI assistant. Do not change prompts, guardrails, test thresholds or code. SRS §9.4, NFR-SEC-12 and the decision ADR are controlling.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-d3-ai-redteam -b review-d3-c-d3-ai-redteam main`, then `cd ../Construct-Hub-review-d3-ai-redteam`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Test a matrix of roles and owners against product search, order status, invoice fetch, cart/quote creation, tender drafting and human handoff. Attempt prompt injection in user messages, retrieved catalogue/product descriptions, tender text, help content and attached document snippets. Verify server-side denial of unauthorized tools/resource IDs, confidentiality between tenants and competing tender bidders, that the model cannot select arbitrary tools/SQL/URLs, audit records are useful but do not leak PII/secrets, unsafe Markdown/links are neutralized, and side effects require clear confirmation. Verify disabled feature flag actually disables access even when the UI URL is visited directly.

Use synthetic/test accounts only. Do not include hidden chain-of-thought or full sensitive prompts in report. Collect screenshots and redacted API response/assertion evidence. Rerun the approved 50-question D1 golden suite and record exact revision and scores. Report every failure with attack input category (sanitize personal content), role, expected/observed, impact, severity and reproduction steps in `docs/reviews/task-reports/D3-antigravity-redteam.md`. Verdict PASS/PASS WITH DEFECTS/BLOCKED. A permission bypass or secret/cross-tenant leak is a release blocker regardless of average quality score.
```

## D4 — Arabic OCR, handwriting, receipts, and human-review queue

### D4-A — Claude Code: OCR and extraction quality

```text
You are Claude Code implementing the real OCR/handwriting backend for ConstructsHub task D4-A. The D1 evaluation harness must already be merged and runnable. Scope source: canonical SRS Master v2.0 §6.4, plus data-protection and access-control requirements.

PROJECT: `Construct-Hub_Project`, web/API in `waquor/`; any model service must follow repository boundaries and security constraints. First inspect current OCR/document search pipeline, current model choices/dependencies, upload infrastructure, `lib/llm.ts` where relevant, and `waquor/prisma/schema.prisma` before selecting fields. Do not assume a handwriting model or document table exists.

GIT: create clean worktree `../Construct-Hub-d4-ocr-backend`, branch `task-d4-ocr-backend` after D1 merge. No pull/push/merge/PR, `.env`, dependency changes/large model weights without approval, or `PROGRESS.md` edit. Schema/migration changes are allowed only if genuinely required and should be isolated and validated via the safe migration process; no other agent edits schema concurrently.

REQUIREMENTS:
1. Measure the current baseline first on the D1 golden set. Implement genuine Arabic OCR tuning/recognition (not merely post-formatting word boxes), covering diacritics, Arabic-Indic and Western numerals, mixed LTR/RTL, line ordering, punctuation, low resolution/skew, and Arabic-English fields. Include a real handwriting recognizer for delivery notes and daily reports only if an approved/licensed model is available; otherwise report model/weight approval needed and do not claim handwriting support.
2. Specialized extraction for receipts and stamped documents: identify probable stamp/signature zones and exclude them from text extraction when appropriate; retain an explainable mask/region and confidence instead of silently discarding content. Do not treat signature recognition as identity verification.
3. Return field-level confidence and provenance/page/bounding-box where supportable; enforce a configurable low-confidence threshold that routes to human review. Confidence must be calibrated or labeled heuristic; do not present an arbitrary score as probability.
4. Maintain extraction schema/version, idempotence, file access checks, timeouts and file limits. Treat original files and OCR text as sensitive untrusted input. No raw OCR content in application logs or analytics. Do not send documents to external providers unless owner approved and data-residency/PDPL posture is documented.
5. Run the same D1 set before/after. Report aggregate and subset CER/WER, field exact-match/precision, confidence calibration or bin behavior, stamp/signature contamination cases, latency P50/P95 and failure counts. Claim improvement only with same held-out data and a reproducible report; do not tune against the final test split and call it independent validation.
6. Add regression cases for Arabic RTL, diacritics normalization, numbers/currency, mixed-direction text, blank/noisy scan, rotated page, handwriting, stamps, signatures, multi-page file and low confidence. Use actual gold labels and separately flag synthetic fixtures.

Verify web typecheck/tests/build and D1 suite. Save `docs/reviews/task-reports/D4-ocr-eval.md`, and if practical machine-readable JSON results under `ai/evals/reports/`. No PROGRESS.md edit. If a model or legal data prerequisite blocks full acceptance, commit only truthful code/report that is usable without claiming the unimplemented capability. Report branch/SHA and no merge/push.
```

### D4-B — OpenCode: document review queue UI

```text
You are OpenCode implementing the web document-review experience for ConstructsHub task D4-B. The actual OCR extraction and low-confidence API contract must exist and be merged; if absent, stop and report it rather than creating static rows or a fake endpoint.

PROJECT: `waquor/` Next.js 15, TypeScript strict, existing dashboard component patterns, SRS Master v2.0 §6.4, supplied UI references, and existing locale framework. Use current role/permission components; any document-review route must be gated server-side. Read `waquor/prisma/schema.prisma` before assuming review models/fields. Use `user.role` for sessions and never `prisma.userProfile`.

GIT: worktree `../Construct-Hub-d4-ocr-review-ui`, branch `task-d4-ocr-review-ui`, from clean local `main` only after backend contract merge. No pull/push/merge/PR, `.env`, new dependencies, schema changes, or `PROGRESS.md` edits.

BUILD a real review queue for documents/extractions below the backend confidence threshold. Include paginated/status-filtered list, safe side-by-side original-document viewer and extracted fields, region/box overlays where data exists, inline correction, approve/reprocess actions, loading/empty/error/permission states, audit visibility, and correction-rate statistics by field. A user correction must call a real guarded API, validate type/range and persist a versioned correction; approve/reprocess must return an observable result and not silently succeed. Protect access to originals with the existing signed URL/storage approach; do not create public permanent document URLs. Redact filenames or extracted text from logs and analytics. Make Arabic RTL and mixed-direction field labels legible and controls accessible.

Use component tests with explicit fake API fixture data only in tests. Test low-confidence vs accepted fields, correction persistence/error, unauthorized users, expired URL, huge page count, Arabic numbers/text, and queue empty state. Run `npm run typecheck`, `npm test`, `npx next build`. Capture screenshots and write `docs/reviews/task-reports/D4-review-ui.md`. Do not edit PROGRESS.md; commit and report branch/SHA without merge/push.
```

### D4-C — Antigravity: OCR accuracy and human-review audit

```text
Act as Antigravity independent QA for D4-C; do not code or alter gold labels. Review the merged OCR implementation and D1-compatible before/after report under SRS §6.4.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-d4-ocr-audit -b review-d4-c-d4-ocr-audit main`, then `cd ../Construct-Hub-review-d4-ocr-audit`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Verify evaluation runs on the same held-out documents for baseline and candidate; independently check a representative sample of Arabic handwritten and printed outputs, Arabic-Indic/Western numbers, diacritics, mixed RTL lines, currency/unit fields, stamps and signatures. Confirm confidence thresholds trigger real human review, review corrections persist, and original documents are not exposed to unauthorized roles or public links. Ensure only synthetic/public licensed data appears in evidence.

Capture redacted screenshots of the review queue and a few representative OCR comparisons. Record exact command, report version/hash, CER/WER and field-level deltas. If handwriting-model availability is missing, show that it is marked unsupported/blocked rather than silently treated as printed OCR. Write `docs/reviews/task-reports/D4-antigravity-ocr-audit.md` with PASS/PASS WITH DEFECTS/BLOCKED and a severity-ranked defect list; no branch merge/push.
```

# 8. D5 — Remaining search, document and BIM foundations

## D5-A — OpenCode: full buildingSMART bSDD import and ontology enrichment

```text
You are OpenCode implementing the bSDD dictionary import feature for ConstructsHub task D5-A. Work only on the import/job/ontology slice; do not redesign unrelated search pages or touch Prisma schema/migrations.

PROJECT: repo `Construct-Hub_Project`; search/catalogue SRS §6.2/§6.3/§6.5 and source-confirmed FR-SRCH IDs. Existing `waquor/lib/bsdd.ts`, search ontology, catalogue and current seed import are starting points—inspect before coding. `waquor/prisma/schema.prisma` is the data authority; use `user.role` for session auth, `userType` for DB filters, `Profile`→`prisma.profile`. Do not guess field names.

GIT: prerequisites are P00 baseline and approved D1 where relevant. Create clean worktree `../Construct-Hub-d5-bsdd-import`, branch `task-d5-bsdd-import` from local main. No pull/push/merge/PR, `.env`, dependency additions, schema/migration changes, or `PROGRESS.md` edits. The bSDD API token is an owner-side gate: never request or print the token in a report; use existing env-key name only after confirming it in `CONFIGURATION.md`.

IMPLEMENT:
1. Inspect the official buildingSMART Data Dictionary API documentation and the repository's existing `bsdd.ts`. Import the complete dictionary according to API pagination, versioning and rate-limit behavior; don't assume a fixed number of pages or language. If a token is absent, implement/test the import against recorded public fixtures or official test environment where legally permitted, and mark live import BLOCKED—never claim production import completed.
2. Make the import resumable, idempotent and observable: job status/counts, cursor/page, last successful checkpoint, created/updated/skipped/failed count, retryable transient failures, bounded concurrency, cancellation if architecture supports it, clear permanent vs transient errors, and source/version timestamp. A retry must not create duplicate ontology entries.
3. Preserve source identifiers, language labels, definitions, concept/parent relations, units/terms and deprecations when exposed by the API. Normalize into the existing ontology mapping rather than inventing a parallel classification system. Never overwrite curated catalogue fields or seller price/stock information. Store source provenance and deterministic mappings.
4. Enforce a safe request budget, timeouts, rate limits and a maximum memory footprint; do not fetch arbitrary URLs from remote payloads (SSRF). No API token in output, URL logging or client payload. Admin-triggering permissions must be checked server-side; status API must not disclose details to regular users.
5. Enrich/search-sync existing catalogue records only through existing search-sync mechanisms after inspecting consistency and idempotency behavior. Avoid a full catalogue reindex on every batch; record metrics and resumable checkpoints.
6. Add unit tests for pagination/cursor, duplicate/retry, 429/backoff, 5xx, timeout, malformed record, deleted/deprecated concepts, Arabic/English labels, permission gate, secret redaction and partial job recovery. Use fixture responses identified as fixtures.

Run web typecheck/test/build. Write `docs/reviews/task-reports/D5-bsdd-import.md` with API docs URL, licence/terms, observed official endpoint behavior, fixture/live distinction, exact test output, imported counts only if actually measured, and remaining token/volume limitation. Do not update PROGRESS.md. Commit focused changes and report SHA, branch, no merge/push.
```

## D5-B — OpenCode: mobile voice recorder UX

```text
You are OpenCode implementing the mobile voice-search recorder UX for ConstructsHub task D5-B. Only build the user workflow and integration with a real existing voice-search API. Do not implement speech recognition/model service or fabricate results.

PROJECT: `mobile/` Expo SDK 52, Expo Router 4, React Native 0.76, offline outbox; web API under `waquor/src/app/api/search/` or the actual path found during inspection. SRS §6.3 and the canonical FR-SRCH-07 voice-search requirement apply. Inspect `mobile/lib/api.ts`, permissions, locale strings, existing upload-only voice path and native permissions. Do not assume a particular recording package exists.

GIT: create clean worktree `../Construct-Hub-d5-voice-ui`, branch `task-d5-voice-ui` from local main. No pull/push/merge/PR, `.env`, dependency additions, schema/migration changes, or `PROGRESS.md` edits. If recording APIs require an unapproved dependency, stop and report its exact package/permission trade-off for owner approval rather than adding it.

IMPLEMENT:
- In-app record/start/pause/stop/cancel/re-record flow with explicit microphone permission rationale, clear recording timer and visual indicator, accessible controls, supported maximum duration/size, file validation, upload progress and cancellation.
- Send actual captured audio through the existing documented API contract. Show typed states for permission denied, no speech, unsupported audio, Arabic/English speech, network interruption, server timeout/provider missing and retry. Do not silently enqueue a media upload to an API that only accepts documents; verify server contract and create an explicit dependency if it is missing.
- Preserve locale, RTL layout, safe-area/keyboard behavior and privacy. Never log audio, transcript text or PII. Include a concise consent notice if audio leaves the device or is retained, following the SRS/privacy policy.
- Avoid pretending transcription works when backend returns upload receipt only; display actual transcript/search response fields.

TEST with component tests and any existing Expo test harness: permission grant/deny, stop/cancel, zero-length recording, upload failure, retry, Arabic RTL, no-result and unsupported API response. Run the actual mobile typecheck/test scripts. If a simulator or native build is unavailable, explicitly mark native capture unverified and do not claim device validation. Write `docs/reviews/task-reports/D5-mobile-voice-ui.md` with screenshots/output; do not edit PROGRESS.md. Commit only the voice UX and tests, report SHA/no merge/push.
```

## D5-C — Claude Code: Arabic dialect voice test corpus and API contract checks

```text
You are Claude Code owning the backend/integration test work for task D5-C. Build a privacy-safe Arabic dialect test corpus and validate the real voice-search route; do not add a new speech provider without approval.

PROJECT: ConstructsHub SRS §6.3 and FR-SRCH-07. First inspect the current voice-search API and provider adapter, request schema, locale behavior, error responses, and mobile upload-only flow. Read schema before DB assumptions. Repo root `Construct-Hub_Project`, web under `waquor/`.

GIT: create clean worktree `../Construct-Hub-d5-voice-corpus`, branch `task-d5-voice-corpus` after P00. No pull/push/merge/PR, `.env`, new dependencies/provider costs, Prisma schema changes or PROGRESS.md edits.

IMPLEMENT: create a versioned Arabic voice-search test manifest covering Modern Standard Arabic and carefully selected, locally natural Saudi/Jordanian colloquial construction-material phrases, code-switching Arabic/English, brand/model/size names, Arabic-Indic/Western numerals, units/currency and common speech transcription confusions. Use original author-written utterance text or appropriately licensed public audio, label synthetic authored phrases accurately, and do not create fake “real speaker” recordings. If no real audio is available, separate text/contract tests from audio accuracy claims. Include transcription normalization policy and expected search intent/product classes without inventing catalogue SKUs.

Add automated contract tests for accepted MIME types/sizes, auth/role gates, no audio path in logs, file upload/cancel/retry semantics, transcript no-speech/error, Arabic RTL response, wrong method/404 handling, timeout and provider-unconfigured behavior. Mobile's outbox can swallow status 0; assert route exists and returns a clear result. If current route accepts only uploaded files but does not transcribe, the report must say so and should not claim voice search acceptance.

Run web typecheck/test/build. Save corpus manifest and `docs/reviews/task-reports/D5-voice-contract-tests.md`. Keep any audio out of Git unless licensing and size expressly permit; note sources/licences. No PROGRESS.md change. Commit and report branch/SHA/output; no merge/push.
```

## D5-D — Claude Code: 2 GB resumable document/IFC upload protocol

```text
You are Claude Code implementing the security-critical server/storage protocol for task D5-D. The requirement is resumable uploads up to 2 GB for document and IFC search; do not implement a single 2 GB memory-buffered Next.js request.

PROJECT: Construct-Hub, Next.js 15 in `waquor/`, current S3-compatible storage abstraction, document/IFC search routes, auth and rate-limit helpers, BIM service sandbox. Confirm exact API and storage implementation first; read `waquor/prisma/schema.prisma` before any fields. SRS §6.5/FR-SRCH-09 and NFR security/performance requirements apply.

GIT: clean local main, D1 may be a prerequisite for AI evaluation but not for raw upload. Create worktree `../Construct-Hub-d5-resumable-upload`, branch `task-d5-resumable-upload`. No pull/push/merge/PR, `.env`, dependency addition, schema/migration edits unless separately authorized, or PROGRESS.md edits. Do not add the `tus` dependency/service or modify storage infra without asking if not already available; inspect first and report a concrete choice.

IMPLEMENT a resumable, bounded protocol compatible with the existing S3-compatible backend (tus-style behavior or multipart upload, chosen only after inspecting current storage contract):
1. Authenticated upload-session creation with declared size, checksum, media class and owner; server maximum 2 GiB in bytes, per-user quota/concurrency, expiry, idempotency, and ownership isolation.
2. Chunk/part upload without buffering the whole file in Next.js memory; validate sequence/offset or part number, part size, file size, per-part checksum, duplicate retries and out-of-order requests explicitly. Protect against path traversal, arbitrary object keys, SSRF and client-controlled destination metadata.
3. Resume/recover status after app reload/network drop, bounded retries, completion verification (total length/checksum), abort/delete, expiry cleanup, orphan cleanup, and server-side type/magic-byte verification after assembly. MIME/type is not trusted from client.
4. Incomplete uploads must not enter search or BIM processing. Completed uploads must be private and accessed only by signed short-lived URLs / existing access checks; do not generate public URLs. No permanent token in telemetry.
5. Hard limits/timeouts/quotas and storage lifecycle documented. Avoid a new schema field/table unless necessary; if a migration is required, justify it and follow P02 migration safety. Ensure upload objects and signed URLs are tied to resource owner/permission and cannot be reused across users.
6. Add tests for 0 bytes, maximum boundary, over-limit, part duplicate, lost response retry, invalid order/offset, checksum mismatch, abort, unauthorized resume, cross-user session access, incomplete-file processing denial, content type spoof, expiry cleanup, and provider failure. Do not use 2 GB fixtures; use a simulated stream/storage test and prove bounded memory via implementation/streaming test or instrumentation.

If S3-compatible credentials are not available, use a test adapter only in automated tests and state live backend upload is unverified. Run web typecheck/test/build. Write `docs/reviews/task-reports/D5-resumable-upload.md` with protocol choice, security model, limits and exact tests. No PROGRESS.md edit. Commit focused changes and report SHA/no merge/push.
```

## D5-E — OpenCode: resumable upload web/mobile UX wiring

```text
You are OpenCode implementing the UI/client side of ConstructsHub task D5-E. Use only the agreed resumable upload API contract from Claude's D5-D after it is merged. If server contract or route URLs are missing, stop and report rather than guessing.

PROJECT: `waquor/` Next.js 15 and `mobile/` Expo SDK 52/RN 0.76, SRS document and IFC search requirements §6.5/FR-SRCH-09 and the visual tender document-uploader reference in `BanahBuild ConstructsHub screens.pdf` page 12. Read the existing file upload surfaces and API utility first; do not touch the schema, new dependency declarations or shared server API implementation.

GIT: clean local main after D5-D contract merge, worktree `../Construct-Hub-d5-upload-ui`, branch `task-d5-upload-ui`. No pull/push/merge/PR, `.env`, package changes, schema/migrations or `PROGRESS.md` edits.

IMPLEMENT upload widgets supporting very large (up to 2 GiB server limit) docs/IFC without reading the whole file into JS memory: selection/camera/library where relevant, file name/size/format display, progress, pause/resume if API supports it, cancel/abort, retry/resume after reload using a server session rather than local secret, per-file and aggregate errors, completion status, checksum/failure state and safe removal. Use actual API contract; progress must reflect transferred bytes, not pretend to be a time estimate. When completed, submit a real search/process action and display the actual server job ID/status; never report “uploaded/processed” before server confirmation. Prevent accidental submission of incomplete or failed files. Support screen-reader announcements, keyboard controls, responsive layout, Arabic RTL and mixed numeric filenames. Don't include sensitive filenames in logs/analytics.

Tests: chunk retry and resume UX, cancellation, network offline, over-limit file, corrupt/unsupported type, API 404, expired session, app restart/resume and successful completion with test-only fixtures. Run web typecheck/test/build and mobile checks when each surface is changed. Write `docs/reviews/task-reports/D5-upload-ui.md`; no PROGRESS.md edit. Commit, report SHA/no merge/push.
```

## D5-F — Claude Code: safe LibreOffice conversion for legacy office files

```text
You are Claude Code handling document pipeline and sandbox security for task D5-F. Add support for legacy `.doc` and `.ppt` conversion only if a safe, approved LibreOffice headless runtime is available or the owner explicitly approves installing/including it.

PROJECT: ConstructsHub SRS §6.3/§6.5 document search; `waquor/` search/doc pipeline; BIM service sandbox practices can inform isolation but do not silently reuse a privileged container. Read current file type handling, Dockerfiles/compose, deployment manifests and tests before selecting placement.

GIT: create worktree `../Construct-Hub-d5-libreoffice`, branch `task-d5-libreoffice` from clean local main. No pull/push/merge/PR, `.env`, dependency/binary additions, CI image expansion or `PROGRESS.md` editing without explicit approval. If LibreOffice is absent, make no installation; write a decision note naming runtime/size/security implications and stop the implementation at an explicit unsupported-type error.

SECURITY/IMPLEMENTATION:
- Conversion runs in an isolated low-privilege process/container with read-only base filesystem, capped writable tmpfs/output directory, strict CPU/memory/time/page/output-size limits, no network, no ambient credentials, no capabilities, and input/output path isolation. Never execute shell with untrusted filenames; use argument arrays, generated internal names and timeouts.
- Verify file magic, not extension alone. Reject macros/unsupported or malformed input safely; LibreOffice must run with macro execution disabled and a constrained temporary profile. Delete temporary source/output files in finally paths and log only safe status/type/request IDs, no full document content or PII.
- Convert only supported legacy formats into an explicitly supported intermediate format used by current extraction pipeline (e.g. PDF or text, based on actual pipeline). Handle multiple pages/slides, non-ASCII text and conversion failure. The converted output is untrusted too.
- Do not silently replace original files or make converted output publicly accessible. Existing auth/storage/signed-URL boundaries remain.
- Add tests for corrupt file, spoofed extension, path traversal filename, oversized input/output, timeout, macro-like document, Arabic text, multi-page result, missing converter and cleanup on failure. Provide container-level security test where possible; never say sandboxed unless actual runtime settings prove it.

Run relevant unit tests + web typecheck/test/build and inspect compose/k8s if changed. Write `docs/reviews/task-reports/D5-libreoffice-security.md` with exact commands, sandbox restrictions and approval status. No PROGRESS.md edit. Commit only when approved runtime and safe conversion are verified; otherwise commit the blocker report. No merge/push.
```

## D5-G — Claude Code: rate-limited per-row XLSX LLM classification

```text
You are Claude Code implementing per-row XLSX classification in ConstructsHub task D5-G. The task uses existing `waquor/lib/llm.ts`; do not add another model provider or dependency without owner approval.

PROJECT: SRS Master v2.0 document/search requirements §6.3/§6.5 and any FR-SRCH-09 requirement found in canonical SRS. Inspect current XLSX extraction and import pipeline, `lib/llm.ts`, rate limiter, job status patterns, `prisma/schema.prisma`, and permission helpers first. Current DB schema is authoritative. No assumption about new models/field names.

GIT: clean local main; create worktree `../Construct-Hub-d5-xlsx-classifier`, branch `task-d5-xlsx-classifier`. No pull/push/merge/PR, `.env`, dependency addition, `PROGRESS.md` edits, or schema/migration changes without justified approval.

IMPLEMENT:
- Classify each extracted row using the existing LLM adapter and a strict, versioned response schema. Outputs should identify categories/material concepts/units only as supported by source; preserve original cell coordinates/text for correction but keep document contents out of logs. Treat spreadsheet cells as untrusted data and explicitly defend against prompt injection in cells/formulas/comments.
- Processing is a persisted, resumable asynchronous job rather than an unbounded synchronous request. Use the existing background/cron/job pattern where available. Bound rows/file size, concurrency, per-user/model rate, total tokens/cost and timeout; use backpressure and retry only transient failures. Every failure is visible and retryable; do not block the request awaiting all LLM rows unless architecture and size limits explicitly justify it.
- Output includes confidence calibrated only if defensible; label heuristic/model confidence accurately. Low-confidence/malformed output goes to review, not a fabricated catalogue mapping. No automatic catalogue write unless explicit authorized business rules and confirmation exist.
- Keep idempotent row processing and job accounting: total/done/failed/pending, provider/model/version, retry counts and safe timestamps. If provider configuration is absent, mark job/provider as unavailable/blocked without fake classifications.
- Add adversarial cells that ask the model to leak instructions/secrets, invalid JSON, wrong unit/currency, duplicate rows, formulas, blank row, huge cells, Arabic/English, numeric conversion, rate limit and provider outage.

Run the D1 eval where relevant, web typecheck/test/build. Write `docs/reviews/task-reports/D5-xlsx-llm-classification.md` with cost/rate controls, output examples using synthetic data, exact test results and provider limitation. No PROGRESS.md edit. Commit, report SHA/no merge/push.
```

## D5-H — Claude Code: BIM fixture integration and sandbox proof

```text
You are Claude Code owning the IFC/BIM integration test for ConstructsHub task D5-H. Use a real, small, lawfully licensed or authored IFC fixture with known quantities. The test must run inside the actual `services/bim/` Docker image, not only on the host.

PROJECT: `services/bim/` FastAPI + IfcOpenShell; hardened sandbox contract: read-only root, bounded tmpfs, `cap_drop ALL`, no outbound network, HMAC-signed requests. Canonical SRS §6.5 and BIM requirements apply. Read Dockerfile, compose, k8s manifest, auth/HMAC, quantity extraction and current pytest suite first. Read Prisma schema if tracing a database field. Do not weaken security settings for a passing test.

GIT: clean local main; create worktree `../Construct-Hub-d5-ifc-integration`, branch `task-d5-ifc-integration`. No pull/push/merge/PR, `.env`, dependency changes/IFC fixture licenses without approval, or PROGRESS.md changes.

IMPLEMENT:
1. Add a real IFC sample containing identifiable entities and known quantities, with a checksum/licence/source and a compact reference output (expected quantities, units, tolerance). Prefer hand-authored/simple IFC or a permissively licensed sample; do not commit a proprietary building model.
2. Add a container-level integration test that builds/uses the project BIM Docker image, uploads/submits the IFC using the real HMAC/auth contract, extracts expected quantities, checks units/error tolerance, and verifies response schema/error semantics. No calling host Python’s IfcOpenShell and claiming in-container coverage.
3. Prove sandbox restrictions from effective container config and negative checks: root filesystem read-only, tmpfs bounds, zero added capabilities/cap_drop ALL, network disabled, non-root if supported/configured, input/output paths isolated, request timeout/file size cap. Tests should show network egress blocked where practical without making production internet calls. Do not loosen no-network for dependency download during execution; image build dependencies should be pinned through approved build process.
4. Test malformed IFC, unsupported schema, oversized input, timeout, unauthorized/bad HMAC, directory traversal, no quantities, zero quantities and unit normalization. Ensure temporary uploads are cleaned and output doesn't contain local paths/secrets.
5. If tests reveal the `ifcopenshell` wheel isn't inside the built container or the deployment manifests do not mirror compose hardening, correct only within task scope and with dependency approval rules. If dependency addition requires approval, stop and report rather than mutating requirements.

Run `pytest` and exact Docker build/compose test commands where available. Produce `docs/reviews/task-reports/D5-ifc-container-integration.md` with checksum/licence, image digest, security checks and outputs. Do not edit `PROGRESS.md`. Commit and report branch/SHA; no merge/push.
```

## D5-I — Claude Code: search latency/load test at the specified scale

```text
You are Claude Code implementing the reproducible search performance test for ConstructsHub task D5-I. This is a measurement task first, optimization task second. Do not fabricate latency numbers or use a tiny test to claim million-row performance.

PROJECT: `waquor/` unified search/autocomplete and engine adapters (Postgres/OpenSearch if enabled), SRS §6.3 and NFR-PER-02. Progress target: autocomplete P95 ≤150 ms at 1 million rows and unified search P95 ≤500 ms at 1 million rows. Inspect current routing, indexing, cache, DB/schema and existing `withMetrics`/`RouteMetric`. Read schema before field names.

GIT: create clean worktree `../Construct-Hub-d5-search-load`, branch `task-d5-search-load`. No pull/push/merge/PR, `.env`, new load-test package or infrastructure edits without approval; do not touch production data or run stress tests against production; no `PROGRESS.md` edits.

IMPLEMENT:
1. Build a reproducible data seeder/load script creating up to one million synthetic, clearly tagged products/search documents with realistic field cardinality and Arabic/English terms, price/currency/unit variation, geodata and duplicate/noisy terms; synthetic records must not be mistaken for real catalogue inventory. Protect any destructive cleanup with explicit database-name guard and transaction/fixture isolation.
2. Build an open-source/repo-approved load runner using existing package/tools. Test autocomplete and unified search independently, with warm/cold cache states, concurrency, p50/p95/p99, throughput, error rate and response correctness. Do not print PII/tokens. Record environment/CPU/RAM/DB/index config, dataset size, query distribution, sample count and commit hash.
3. Define success thresholds matching source NFRs (autocomplete 150 ms; unified search 500 ms P95 at 1M records) and fail the benchmark on violations. Include a small CI smoke not requiring million rows; keep the full benchmark as an opt-in/staging operation.
4. First record baseline without changing ranking; then identify actual top bottlenecks. Any optimization should be isolated and show before/after with identical workload and semantics. Relevance changes must have ranking tests; do not boost synthetic data to make performance pass. If expected engine/service isn't operational, report BLOCKED.
5. Keep D2 detector P95 <4 s a separate endpoint metric; don't conflate it with text search latency.

Run the benchmark only in an isolated local/staging environment. Save scripts under `waquor/scripts/` or existing performance-test directory and `docs/reviews/task-reports/D5-search-load.md` with exact outputs and threshold verdict. Web typecheck/test/build. No PROGRESS.md edit. Commit and report SHA/no merge/push.
```


# 9. Stage 5 — Contract tests, financial tests, and end-to-end journeys

## E1-A — OpenCode: OpenAPI contract generation and mobile drift gate

```text
You are OpenCode implementing contract generation and drift prevention for ConstructsHub task E1-A. Goal: generate OpenAPI from the actual web API surface and use it in mobile so API drift fails CI. Do not create a manually maintained “pretty spec” that is unrelated to implementation.

PROJECT: `waquor/` Next.js 15 App Router APIs; `mobile/lib/api.ts`; SRS REST/API conventions §14.2 and the current CI. Inspect existing route handlers, Zod request/response schemas, auth/error formats, package scripts and CI before choosing an OpenAPI generation approach. Read `waquor/prisma/schema.prisma` before interpreting fields. Avoid leaking internal/admin-only routes, sensitive schema details, credentials, or PII into a public spec.

GIT: after P00 baseline, create clean worktree `../Construct-Hub-e1-openapi-contract`, branch `task-e1-openapi-contract`. No pull/push/merge/PR, `.env`, dependency additions without owner approval, Prisma schema/migrations or `PROGRESS.md` edits. Claude owns core money/security API behavior; if a route schema needs a backend change, record the dependency and do not alter it silently.

IMPLEMENT:
1. Produce deterministic OpenAPI from real route/validation definitions where feasible. If Next.js route handlers cannot be introspected safely, use explicit typed/Zod contract modules referenced by the route handlers themselves—avoid duplicate hand-written schemas that drift. Document routes that are not yet expressible and don't invent undocumented request/response fields.
2. Include method/path, auth requirements, request params/body, successful responses, error responses, pagination, nullable fields, enums, content types, upload semantics and versioning. Make public vs authenticated vs admin route boundaries explicit. Do not leak stack traces, secret names/values, database internals or private admin surfaces into public clients.
3. Generate a committed machine-readable spec and typed mobile contract/client inputs in an established code-gen directory. Existing `mobile/lib/api.ts` remains a compatibility boundary; consume the generated types/client so a contract mismatch fails typecheck/CI. Avoid duplicated network code or an uncontrolled mass rewrite.
4. Add a CI job that regenerates spec/types and fails when generated artifacts are stale or incompatible. Deterministic order/sorting and pinned tool versions must avoid flaky diffs. No new dependency or tool install without approval; if one is required, stop with the specific proposed package, licence, size and alternative.
5. Add representative contract tests for mobile-used endpoints including trip ping/status, notifications, messages/attachments, owner/supplier dashboards, search and checkout. Distinguish unsupported endpoints as failures; mobile outbox must not hide a missing route.

Run typecheck/tests/build from `waquor/`, mobile typecheck/tests and contract CI locally if possible. Save `docs/reviews/task-reports/E1-openapi-contract.md` including the generated route counts from actual output, drift-demo evidence (introduce mismatch in test fixture or validator then show it fails; do not leave source broken), and limitations. Do not edit PROGRESS.md. Commit, report SHA/no merge/push.
```

## E1-B — Claude Code: financial critical-path integration tests

```text
You are Claude Code responsible for money-path correctness for ConstructsHub task E1-B. Add integration tests—not just mocked function unit tests—for escrow release, wallet transfers, payout processing and invoice status transitions. Use test-only databases and gateway fakes; no real money or provider credentials.

PROJECT: `waquor/` Prisma 6/Next.js 15; canonical SRS sections on billing/payments/escrow/wallet/payouts/ZATCA, including §3.1 and §8.6, govern. Read `waquor/prisma/schema.prisma`, transaction/service code (`lib/ledger.ts`, payments, escrow, payouts, invoice/ZATCA paths) and idempotency helpers before tests. Schema is authoritative; only you own schema and migrations during this branch. Session auth uses `user.role`; Prisma filter uses `userType`; don't use invalid field assumptions. Never expose user password hashes or financial identifiers.

GIT: create clean worktree `../Construct-Hub-e1-money-integration`, branch `task-e1-money-integration` from local main. No pull/push/merge/PR, `.env`, dependency additions, or PROGRESS.md edits. If integration test infrastructure is missing, use existing repo tooling first; ask before adding a dependency/database container.

TEST THE REAL SERVICE/ROUTE PATHS where possible for:
1. Escrow hold, release eligibility/time, release approval, concurrent release, duplicate webhook/retry, transaction failure between ledger/wallet legs, insufficient/negative amount, invalid currency, frozen dispute/chargeback and idempotency keys.
2. Wallet movements with balanced ledger entries, ownership/role gate, no double-credit/debit, failure rollback, arithmetic precision and SAR/JOD decimal/currency handling.
3. Payout creation/processing/retry/failure/reconciliation, invalid or missing destination data, provider response mapping, role/ownership and redaction of bank/IBAN/PII. Verify API responses never serialize passwordHash/tokens.
4. Invoice lifecycle (draft/issued/submitted/reported/cleared/rejected or the *actual schema-supported* states), duplicate submission, ZATCA provider unavailable, warning persistence, retry and status transitions; do not invent states absent from schema/SRS.
5. Webhook HMAC invalid/valid paths, replay/idempotency, event deduplication and chargeback freeze. All provider calls are test doubles, clearly marked; use no network to production.

Use disposable database isolation and migrations via standard workflow. Do not run reset against any shared DB. Include parallel-race tests where practical and confirm transactions leave no partial ledger state. Ensure alerts/analytics remain fire-and-forget and provider absence nonfatal where contract says so.

Run web typecheck/test/build and the integration suite with real captured output. Write `docs/reviews/task-reports/E1-money-integration.md` with test database identity but no credentials, exact failure cases, invariants, and gaps requiring sandbox credentials. Do not edit PROGRESS.md. Commit focused changes; report branch/SHA and do not merge/push.
```

## E1-C — OpenCode: six Playwright end-to-end user journeys

```text
You are OpenCode implementing the Playwright E2E suite for ConstructsHub task E1-C. The suite must prove visible user outcomes across the real app and APIs, not merely assert that requests return HTTP 200.

PROJECT: `waquor/` Next.js 15, current CI, seed/fixture patterns and canonical SRS Master v2.0. The required journeys are: (1) register → organisation invite; (2) catalogue → cart → checkout; (3) tender → bid → award → milestone; (4) workforce job → assign → complete; (5) trip → ping → complete; (6) dispute → evidence → decision. Use current real routes/models after inspecting SRS and `waquor/prisma/schema.prisma` before field names. Protect finance, authentication and access control.

GIT: create clean worktree `../Construct-Hub-e1-playwright-e2e`, branch `task-e1-playwright-e2e`. No pull/push/merge/PR, `.env`, dependency additions without owner approval, schema/migration edits or PROGRESS.md changes. If Playwright isn't already available, report the missing dependency and request approval instead of adding it silently.

IMPLEMENT:
- deterministic journey-specific seed fixtures and cleanup isolated from production; use synthetic test users, products, tenders, projects, workers, trips and disputes. Explicitly prevent accidental production database execution by checking an allowlisted test database name/URL classification without printing secret values.
- real browser paths and role-appropriate login/authorization. For each journey assert visible states/text, enabled/disabled action, persisted record/status change, expected redirects/notifications where feasible, and correct denial for invalid role/state. HTTP 200 alone never passes.
- Journey 1 verifies invite generation/use, one-time/expiry behavior and unauthorized invite use if defined by SRS.
- Journey 2 verifies product/price display, cart line quantities, currency, totals, validation failures and checkout/provider-unavailable path without charging real money. Use a named test gateway fake/controlled local sandbox and label it as test, not a real payment.
- Journey 3 verifies tender visibility/qualification, bid submission, sealed-bid confidentiality/state, award, contract/project/milestone result and unauthorized bidder denial.
- Journey 4 verifies job/applicant assignment, on-site/off-site attendance policy as specified, work completion and approval—not just a toast.
- Journey 5 verifies driver permissions, valid/invalid GPS ping, trip state machine and completed state; account for rate limits without sleeping arbitrarily.
- Journey 6 verifies dispute open, evidence upload through signed-url/magic-byte path, role-gated review/decision and audit state; no access to other users' evidence.
- Add screenshots/traces on failure but redact cookies, tokens, user PII, request bodies and financial account data. CI should upload safe artifacts only; do not enable verbose auth/network logging.

Create CI config using existing patterns, stable selectors/accessible labels, bounded retries only for known transient infra (no retries masking product flakiness), and test tags. Run every journey locally against the isolated test stack; capture counts and output. Write `docs/reviews/task-reports/E1-playwright-journeys.md`. Do not edit PROGRESS.md. Commit and report branch/SHA/no merge/push.
```

## E1-D — Antigravity: browser review of journey 2 and journey 3

```text
You are Antigravity performing independent real-browser validation for ConstructsHub task E1-D after the E1-C suite is merged. Do not edit app code or tests. Verify only in the safe test environment using test accounts and synthetic catalogue/tender data.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-e1-browser-e2e -b review-e1-d-e1-browser-e2e main`, then `cd ../Construct-Hub-review-e1-browser-e2e`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Scope: canonical SRS journey for catalogue → cart → checkout and tender → bid → award → milestone. Also compare against supplied PDF screens showing quotation comparison, tender creation, bids and owner milestone/escrow approval. Do not assume the screenshot values are current backend data.

Use normal user interactions: click through each step as a real buyer/owner/supplier/contractor as appropriate, take screenshots of the visible result, refresh at safe points to test persistence, and inspect console/network for errors. Attempt a prohibited role/action to ensure server authorization holds. Check that price totals/currency and line quantities stay consistent, tender documents do not leak to unauthorized bidders, award produces expected project/milestone state and there is no unexpected reload or button that only looks interactive. Never enter or charge a real payment method. Redact cookies/tokens, user details and financial IDs in screenshots/logs.

Save `docs/reviews/e2e-browser-report.md` (or append this review if it already exists) with environment/commit, account roles, exact URLs, step-by-step visible outcomes, screenshot index, error details and severity. Verdict PASS/PASS WITH DEFECTS/BLOCKED. If the browser or test user isn't available, list the blocker and do not claim the path was verified. Do not merge or push.
```

# 10. E2 — Internationalization and Arabic RTL (one feature branch at a time)

**Coordination rule for E2:** run these slices serially and merge each before beginning the next. They may touch common message dictionaries, locale helpers and route layouts, so do not run two E2 agents concurrently. Use existing locale/i18n conventions, not a new framework. Keep product meaning consistent in English and Arabic; do not machine-translate legal/financial language without a review note. Include Saudi/Jordanian currency/unit display where the screen already supports them, but do not hard-code country-specific values into shared strings.

### E2-BASE — OpenCode: establish locale extraction conventions and inventory

```text
You are OpenCode establishing the i18n foundation for ConstructsHub task E2-BASE. Make only the reusable locale conventions, inventory/report and a safe progressive literal audit; do not translate the entire product in this task.

PROJECT: web `waquor/` Next.js 15 and mobile `mobile/` Expo/RN 0.76; SRS Master v2.0 §12.5. Inspect existing `lib/i18n.ts`, mobile locale helpers, message file shape, locale selection, number/date/currency formatting and RTL direction handling before changes. Read the canonical SRS and `PROGRESS.md`. Do not introduce a second i18n provider or replace the current locale mechanism without a documented necessity.

GIT: clean local main only, worktree `../Construct-Hub-e2-i18n-base`, branch `task-e2-i18n-base`. No pull/push/merge/PR, `.env`, dependency additions, Prisma schema/migrations or `PROGRESS.md` edits. Read Prisma schema if any data field is involved.

TASK: inventory visible literal strings in web and mobile components by feature area (auth, catalogue, search, orders, tenders, workforce, logistics, disputes, finance, admin, notifications, assistant). Separate user-visible copy from legitimate literals (IDs, API fields, code, test fixtures, technical enum values, numerical formats, schema names, non-rendered logs). Define translation key naming/namespaces consistent with existing message files, fallback behavior for missing key, locale selector and direction propagation. Build an audit script or adapt existing lint/script that reports hard-coded user-facing strings, with an explicit allowlist only for justified literal types and a staged feature allowlist until other slices are migrated. It must eventually support strict zero-unapproved-literals CI; do not make CI fail on the entire unconverted repo yet unless the suite is already ready. Add script tests including false positives/negatives.

Verify web typecheck/test/build and mobile typecheck/test if changed. Create `docs/reviews/task-reports/E2-i18n-inventory.md` with feature counts and exact audit command; do not claim zero until actually zero. Commit focused changes and report SHA/no merge/push.
```

### E2-A — OpenCode: Authentication and registration strings

```text
You are OpenCode implementing the Auth i18n slice E2-A in ConstructsHub. Work only on login, registration, verification, invitation, password/account recovery, auth errors and role-selection copy (where the actual existing routes/components support them). Use the existing i18n contract from E2-BASE if merged.

Repo `Construct-Hub_Project`; web `waquor/` Next.js 15; mobile `mobile/` Expo/RN 0.76. SRS §12.5 and role-selection visual reference in the supplied screen PDF apply. Read existing locale/message setup and session route code before changing. Prisma session contract: `user.role` for auth checks, DB filter `userType`; do not invent role codes. Never translate API field names or status tokens.

GIT: create clean worktree `../Construct-Hub-e2-i18n-auth`, branch `task-e2-i18n-auth` from local main after E2-BASE merges. No pull/push/merge/PR, `.env`, new packages, schema/migrations or `PROGRESS.md` edits; no parallel E2 branches.

Move visible hardcoded strings to existing English/Arabic message files, preserve validation meaning, expose clear translated permission/provider errors and correct RTL form flow, icon alignment, logical padding, focus order and phone/code inputs. Keep brand/product names as designed; do not machine-translate technical/legal consent without noting review needs. Add tests proving locale switching, fallback behavior, Arabic RTL and that validation/role selection logic is unchanged. Run web typecheck/test/build and mobile checks if touched. Report literal-audit delta + screenshots in `docs/reviews/task-reports/E2-auth-i18n.md`, commit focused changes, report SHA/no merge/push.
```

### E2-B — OpenCode: Catalogue and product-detail i18n

```text
You are OpenCode implementing only the catalogue/product-detail i18n slice E2-B for ConstructsHub. Scope includes categories, product attributes, availability, variants, certifications, price books, units, inventory and price display where visible in existing components.

PROJECT `Construct-Hub_Project`, web `waquor/`, mobile `mobile/`; SRS §6.2 and §12.5. Inspect current message files, catalogue components and `waquor/prisma/schema.prisma` first. Use existing `Product`, `SkuVariant`, `PriceBook`, `PriceEntry`, `Certification` names only if confirmed in current schema. Do not confuse currency formatting with conversion or alter product/price values.

GIT: clean local main, worktree `../Construct-Hub-e2-i18n-catalogue`, branch `task-e2-i18n-catalogue`, after E2-A merge. No pull/push/merge/PR, `.env`, new dependencies, schema/migrations, or PROGRESS.md; one E2 branch at a time.

Extract hardcoded visible copy to existing EN/AR message structure. Preserve units, numbers, SAR/JOD formatting rules and correct bidi isolation for SKU/barcode/model values; Arabic should use natural construction terminology. Do not translate merchant-entered catalogue content automatically; user data is content, not UI copy. Ensure variant labels, no-price/out-of-stock/certification expiry states, loading/empty/error states and import errors render correctly in both locales. Test RTL tables/cards/carousels/images, sort/filter controls and unit/price formatting. Run web typecheck/test/build and mobile checks if applicable. Write `docs/reviews/task-reports/E2-catalogue-i18n.md` with audit delta and screenshots; commit/report SHA, no merge/push.
```

### E2-C — OpenCode: Search, voice, image, document and IFC i18n

```text
You are OpenCode implementing the Search i18n slice E2-C for ConstructsHub. Include unified search, suggestions/autocomplete, filters, clarifying prompts, voice capture, image detection states, document upload and IFC analysis UI only where those flows exist in the current branch.

Project root `Construct-Hub_Project`; web `waquor/`, mobile `mobile/`, SRS §6.3/§6.4/§6.5 and §12.5. Read current search API/UI contract and locale setup. Avoid changing backend behavior or adding dependencies. Use schema as authority and never log user queries/documents unnecessarily.

GIT: clean main; worktree `../Construct-Hub-e2-i18n-search`, branch `task-e2-i18n-search` after E2-B merge. No pull/push/merge/PR, `.env`, dependencies, Prisma changes or PROGRESS.md; E2 branches sequential.

Move visible UI strings to EN/AR messages; translate empty/no result/low-confidence/provider unavailable/upload limit/retry/permission states, while technical formats, file extensions, identifiers and user-entered queries remain data. Test mixed Arabic-English keywords, Arabic-Indic digits, RTL order of query chips and carousel navigation, detection box labels, recorder controls, progress, file error messages and keyboard/screen reader announcements. Do not imply recognition/detection succeeded when backend did not return it. Run web typecheck/test/build and mobile scripts if changed. Report `docs/reviews/task-reports/E2-search-i18n.md`, exact audit delta and screenshots; commit, SHA/no merge/push.
```

### E2-D — OpenCode: Orders, cart, checkout, receipt and delivery i18n

```text
You are OpenCode implementing E2-D, the Orders/Cart/Checkout/Delivery i18n slice. Repo `Construct-Hub_Project`, web `waquor/`, mobile `mobile/`; SRS sections for orders/payment/delivery and §12.5 are authoritative. Inspect current API types and `waquor/prisma/schema.prisma` before using field/status names. Monetary logic is explicitly outside your ownership; do not modify money calculations or server states.

GIT: create clean worktree `../Construct-Hub-e2-i18n-orders`, branch `task-e2-i18n-orders` from local main after E2-C merges. Tree must be clean. No pull/push/merge/PR, `.env`, package additions, schema/migrations, PROGRESS.md edits, or parallel E2 tasks.

Extract visible strings for cart lines, quantity, subtotal/tax/fees/total, delivery tracking, held/released labels, payment failures, delivery codes, invoice download, confirm receipt/report problem and retry/errors. Preserve SAR/JOD and decimals as returned by backend; locale-format only, never convert or recompute payment amounts. Use proper pluralization and date/time formatting without changing underlying timestamps. Keep security/PII and invoice identifiers out of logs. Verify RTL order timeline, right-aligned numeric amounts without digit/currency confusion, progress steps, tables and confirmation dialogs. Add tests for EN/AR locale, pluralization, currency formatting, empty cart, checkout failure and delivered/held state labels. Run web typecheck/test/build and mobile checks where appropriate. Write `docs/reviews/task-reports/E2-orders-i18n.md`, commit/report SHA; no merge/push.
```

### E2-E — OpenCode: Tenders, bids, RFQs and quotations i18n

```text
You are OpenCode implementing only E2-E (Tendering/RFQ/Quotation i18n) for ConstructsHub. SRS §7.3 and §12.5 govern. Work in `waquor/` and/or `mobile/` only where current tender/search screens exist. Read `waquor/prisma/schema.prisma`, route contracts and sealed-bid authorization before referencing fields; owner field is `ownerId`, not `publishedById`.

GIT: clean local main; worktree `../Construct-Hub-e2-i18n-tenders`, branch `task-e2-i18n-tenders` after E2-D merge. No pull/push/merge/PR, `.env`, new packages, schema/migrations, PROGRESS.md edits or parallel E2 branches.

Extract all visible user-facing copy for tender creation/review, upload/qualification/schedule/bonds, bids, compare/counter-offer/award/reject, RFQs, line-level quote comparison, lead times, validity and status messages. Keep sealed-bid boundaries: don't expose other bidders' confidential values at the wrong lifecycle state. Localize labels, errors and confirmation warnings; preserve quantity/unit/currency data and date semantics. Test RTL comparison grids, table column order, lowest-price badges, mixed numeric strings, upload progress, validation errors, sealed-bid role view and Arabic/English switching. Do not create fake bid/price rows to make UI look complete. Run web typecheck/test/build and mobile checks if touched. Record audit delta/screenshots in `docs/reviews/task-reports/E2-tenders-i18n.md`, commit and report SHA/no merge/push.
```

### E2-F — OpenCode: Workforce, jobs, assignments and attendance i18n

```text
You are OpenCode implementing the Workforce i18n slice E2-F for ConstructsHub. Project root `Construct-Hub_Project`; surfaces `waquor/` and `mobile/`; SRS §7.4, §15.4, §12.5. Inspect existing job, worker contract, time-log and geofence flows. Prisma contract: `TimeLog.checkIn` and `checkOut` are DateTimes; duration is computed explicitly; `ProjectAssignment.userId` is the assigned user field. Do not alter attendance/payment logic.

GIT: clean main, worktree `../Construct-Hub-e2-i18n-workforce`, branch `task-e2-i18n-workforce` after E2-E merge. No pull/push/merge/PR, `.env`, dependencies, schema/migrations, PROGRESS.md changes; run E2 branches sequentially.

Localize jobs nearby, apply/assignment, contracts, shift status, check-in/out, geofence/off-site flagged states, approvals/rejections, e-sign prompts, earnings/held funds and all empty/error states. Translate `offSite`/approval states into clear labels without implying an off-site check-in was rejected if policy only flags it. Format date/time/duration locally; do not infer minutes incorrectly or change earned balances. Handle Arabic worker names, map/location references, form direction, e-sign canvas layout and large-text accessibility. Add unit/component tests for state labels and RTL; run web and mobile checks. Report audit counts + screenshots to `docs/reviews/task-reports/E2-workforce-i18n.md`; commit/SHA/no merge/push.
```

### E2-G — OpenCode: Logistics, trips, vehicles and deliveries i18n

```text
You are OpenCode implementing the Logistics i18n slice E2-G for ConstructsHub. SRS §7.5 and §12.5 are the scope authority. Inspect trip, vehicle, delivery, route/ping, booking and driver screens in web/mobile. Read current server API contracts and Prisma schema before field references.

GIT: clean main, worktree `../Construct-Hub-e2-i18n-logistics`, branch `task-e2-i18n-logistics` after E2-F merges. No pull/push/merge/PR, `.env`, dependencies, schema/migrations, PROGRESS.md edits or parallel E2 tasks.

Translate pickup/drop-off, vehicle class/capacity, trip state, driver acceptance/rejection, maps/geolocation permissions, ETA/time windows, cargo units, quote/cost breakdown, delivery completion, proof/evidence and network/offline retry messages. Do not translate technical IDs or coordinate values. Ensure Arabic RTL does not reverse map coordinates, GPS lat/lng, license plates, delivery codes or IDs; use bidi isolation as needed. Verify the mobile offline outbox and server route errors remain visible enough to diagnose missing routes—don't change error handling to silent success. Test state transitions, permission denied, no GPS, offline ping queued, API 404, Arabic RTL and responsive controls. Run web/mobile tests/typecheck/build as applicable. Write `docs/reviews/task-reports/E2-logistics-i18n.md`; commit, report SHA/no merge/push.
```

### E2-H — OpenCode: Disputes, evidence, support and rulings i18n

```text
You are OpenCode implementing the Disputes/Support i18n slice E2-H for ConstructsHub. SRS §7.6, support requirements and §12.5 apply. Scope is UI strings and layout only; dispute adjudication, escrow, chargeback, legal status and permissions stay under Claude's ownership.

GIT: clean main; worktree `../Construct-Hub-e2-i18n-disputes`, branch `task-e2-i18n-disputes` after E2-G merge. No pull/push/merge/PR, `.env`, new packages, schema/migrations, PROGRESS.md edits or parallel E2 branches.

Localize dispute open/status, evidence upload/viewer, review/response, SLA timers, support notes, escalation, release/freeze amounts, ruling reason, appeals/errors and notification labels. Financial labels must reflect server values exactly; never translate a UI label into an altered legal outcome. Mask PII and signed URL tokens. Test RTL evidence thumbnails/viewer, Arabic multiline comments, dialog direction, rejection reasons, read-only support view and role denial. Run web typecheck/test/build and relevant mobile checks if that surface contains dispute flows. Capture screenshots and report `docs/reviews/task-reports/E2-disputes-i18n.md`; commit and report SHA/no merge/push.
```

### E2-I — OpenCode: Finance, wallet, invoices, payout and reconciliation i18n

```text
You are OpenCode implementing only the Finance i18n UI slice E2-I for ConstructsHub. SRS billing/payment/ZATCA sections and §12.5 apply. Money/ledger calculation, state machine, DB access and permissions are Claude-owned; inspect `waquor/prisma/schema.prisma` and API response types but don't alter them.

GIT: clean local main; worktree `../Construct-Hub-e2-i18n-finance`, branch `task-e2-i18n-finance` after E2-H merge. No pull/push/merge/PR, `.env`, dependencies, schema/migrations, PROGRESS.md edits; no parallel E2 task.

Translate wallet, held/released, fees, tax/VAT/ZATCA statuses, invoices, payout, IBAN validation, refund/chargeback, reconciliation, unmatched transfers, month-end close and error states. Currency and amount formatting is display-only; never convert currency or change rounding. Render recipient/account objects via explicit display DTO fields; never expose raw bank account numbers, tokens, password hashes or entire ORM objects. Correct RTL alignment for SAR/JOD numbers, minus signs, percentages, table actions and invoice references. Add tests for currency display, negative/zero amount, date/status labels, missing fields, empty state, Arabic labels and safe redaction. Run web typecheck/test/build. Write `docs/reviews/task-reports/E2-finance-i18n.md`; commit/report SHA/no merge/push.
```

### E2-J — OpenCode: Admin and moderation i18n

```text
You are OpenCode implementing the Admin/Moderation i18n slice E2-J for ConstructsHub. Follow canonical SRS §10.9–§10.13 and §12.5. Work only on visible strings/layout and use existing admin components; do not invent settings/feature flags or bypass admin authorization. Read actual locale framework, routes and `waquor/prisma/schema.prisma` first.

GIT: clean main; worktree `../Construct-Hub-e2-i18n-admin`, branch `task-e2-i18n-admin` after E2-I merge. No pull/push/merge/PR, `.env`, new dependencies, schema/migrations, PROGRESS.md edits or parallel E2 task.

Extract visible strings for overview, verification, audit, config, fees/rewards, feature flags, finance/search/analytics consoles, support/moderation queues, approve/reject/ask-for-info, policy/reason, pagination/filtering, error/empty/loading states and confirmation dialogs. Ensure Arabic RTL does not break navigation/sidebar, tables, dialog buttons, numbers and evidence viewer; locale is not an authorization control. Do not localize DB state tokens or API keys. Test admin-only rendering and unauthorized server denial unaffected, EN/AR switch, empty/error tables, focus order and audit feedback. Run web typecheck/test/build. Include screenshots and the literal audit delta in `docs/reviews/task-reports/E2-admin-i18n.md`; commit/report SHA/no merge/push.
```

### E2-K — OpenCode: Notifications, messaging and push i18n

```text
You are OpenCode implementing Notifications and Messaging i18n task E2-K. Project `Construct-Hub_Project`, web `waquor/`, mobile `mobile/`; SRS §9.2/§9.3 and §12.5. Existing push/deep-link and attachment contracts are authoritative. Do not touch provider secrets or change encryption/access controls.

GIT: clean main; worktree `../Construct-Hub-e2-i18n-notify`, branch `task-e2-i18n-notify` after E2-J merges. No pull/push/merge/PR, `.env`, package/dependency changes, schema/migrations or PROGRESS.md edits; no parallel E2 branch.

Localize notification category/title/body presentation only where safely client-formatted, unread/read/all-read/delete, delivery/provider unavailable state, message threads, attachment upload/download/expired link, push preferences and permission instructions. Backend-originated message text is user content and must not be automatically translated as UI strings. Ensure in-app push tap/deep-links retain correct path and do not reverse identifiers or encoded URLs in RTL. Keep notification preferences and silent-unconfigured-provider behavior unchanged. Add tests for list empty/error states, Arabic RTL, unread state, attachment failure, safe URL display and no PII logged. Run web/mobile checks as appropriate. Write `docs/reviews/task-reports/E2-notifications-i18n.md`; commit/report SHA/no merge/push.
```

### E2-L — OpenCode: AI assistant i18n (only if D3 scope decision is GO)

```text
You are OpenCode implementing AI assistant UI i18n task E2-L for ConstructsHub. Proceed only if the signed-off SRS/ADR authorizes the assistant surface and the actual D3 backend/UI is merged; otherwise stop and report “not applicable / scope gate not approved.” Never create the feature as a side effect of translating strings.

PROJECT `Construct-Hub_Project`, web `waquor/`, mobile only if approved; SRS §9.4/§12.5 and existing locale framework. Use backend response schema; never fake answer/tool states or translate user/document data automatically.

GIT: clean local main; worktree `../Construct-Hub-e2-i18n-assistant`, branch `task-e2-i18n-assistant`. No pull/push/merge/PR, `.env`, dependency additions, schema/migrations, PROGRESS.md edits or parallel E2 branch.

Translate assistant headings, suggested prompts, streaming/loading/retry states, search/product tool cards, citation labels, confirmation, human handoff, permission denial and provider unavailable errors. Arabic RTL safe Markdown must preserve LTR code, numbers, URLs and identifiers; sanitize links and keep content/source citations permission gated. Add component tests using mocked streams only in tests, including Arabic locale, interrupted stream, escaped HTML and tool denial. Run web/mobile checks as applicable. Report scope gate, audit delta and screenshots in `docs/reviews/task-reports/E2-assistant-i18n.md`; commit only if feature is authorized, no merge/push.
```

### E2-M — OpenCode: close strict hardcoded-string audit

```text
You are OpenCode closing i18n enforcement for ConstructsHub task E2-M. All E2 feature slices that apply must already be merged. Do not bulk-auto-translate unreviewed strings or suppress the checker to get a green result.

PROJECT `Construct-Hub_Project`; web `waquor/`, mobile `mobile/`; SRS §12.5. Read `docs/reviews/task-reports/E2-i18n-inventory.md`, the current audit tool and all feature reports. Inspect the live source; do not trust only the reports.

GIT: clean main; worktree `../Construct-Hub-e2-i18n-gate`, branch `task-e2-i18n-gate`. No pull/push/merge/PR, `.env`, new packages, schema/migrations or PROGRESS.md edits.

Run the hardcoded string audit across web + mobile. Classify every finding as visible UI copy needing a stable EN/AR key or a justified allowlist item (technical enum, test fixture, machine code, user-generated content, schema/API literal, etc.). Do not permit blanket file/directory exemptions. Extract all remaining user-facing strings, add Arabic/English values, test missing-key behavior and locale fallback, and then make CI fail on newly introduced unapproved UI string literals. Ensure no broad locale key namespace collision, dead keys introduced by migration, or visible raw key names. Add checker unit tests and an intentionally bad fixture proving CI fails. Run web and mobile typecheck/test, `npx next build` if web changes. Write `docs/reviews/task-reports/E2-i18n-gate.md` with exact zero/unresolved counts; zero only means zero unapproved literals. Commit/report SHA; no merge/push.
```

### E2-N — Antigravity: cross-product Arabic/English RTL audit

```text
You are Antigravity performing the final independent i18n/RTL audit for ConstructsHub task E2-N. Do not code. Canonical SRS §12.5, current EN/AR message files and the supplied screen PDF guide the audit.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-e2-rtl-audit -b review-e2-n-e2-rtl-audit main`, then `cd ../Construct-Hub-review-e2-rtl-audit`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

After E2 changes have merged, switch locale throughout web and mobile. Review auth, catalogue, search/image upload, order tracking/checkout, tender comparisons/award, workforce, logistics, dispute evidence, finance/amount tables, admin screens, notifications/messaging and assistant only if in approved scope. Capture screenshots of at least the three worst RTL screens and the high-risk numeric/financial screens. Check text direction, logical margin/padding, icon direction where semantic, chart/table order, dropdowns/date pickers, carousels and overlays, number/date/currency display, focus order, truncation and mixed Arabic-English IDs. Verify user content isn't mistranslated and that UI localization does not change business state/permissions.

Run or inspect the hardcoded string audit output from E2-M and compare against reports. Write `docs/reviews/task-reports/E2-antigravity-rtl-audit.md` with screenshots, URL/device/viewport/locale, actual defect, severity, expected correction and SRS reference. Verdict PASS/PASS WITH DEFECTS/BLOCKED. Do not claim device coverage if you tested only web. No merge/push.
```

# 11. E3 — WCAG 2.1 AA accessibility

## E3-A — OpenCode: keyboard-only checkout, dispute, and settings journeys

```text
You are OpenCode implementing task E3-A, keyboard operability and focus management in ConstructsHub web UI. Do not make only cosmetic fixes; the entire target workflow must be usable without a pointer.

PROJECT: web `waquor/` Next.js 15, shared dashboard/form/dialog components, canonical SRS §12.6 and WCAG 2.1 AA. Review current design tokens and existing controls before editing. Do not add an accessibility library unless owner approval is obtained.

GIT: create clean worktree `../Construct-Hub-e3-keyboard`, branch `task-e3-keyboard-access`. No pull/push/merge/PR, `.env`, dependency additions, Prisma schema/migrations or `PROGRESS.md` edits. Read Prisma schema if needed; use `user.role` in session gates and respect the server authorization model.

TARGET FLOWS: complete catalogue → cart → checkout using a safe test provider; open/submit a dispute with evidence; update settings/preferences. Use keyboard alone (Tab, Shift+Tab, Enter, Space, Escape, arrows when native pattern calls for them). Ensure visible focus styles against theme tokens, logical tab order, focus movement into modals and back to invoking control, no focus traps except purposeful modal containment, correct focus on async validation errors, and no positive action hidden behind hover. All icon-only buttons need accessible names; disabled actions must expose the reason where relevant. Fix only underlying shared component if it repairs the targeted flows without causing unrelated regressions.

Add component/E2E tests for tab order, modal focus/close, invalid form focus, async error announcement, dropdown/menu keyboard behavior and escape/restore. Test actual rendered UI, not merely ARIA strings in source. Run `npm run typecheck`, `npm test`, `npx next build` plus related Playwright tests already present. Record real output and screenshots/focus-path notes in `docs/reviews/task-reports/E3-keyboard-access.md`. Do not edit PROGRESS.md. Commit focused changes; report SHA/no merge/push.
```

## E3-B — OpenCode: screen-reader labels, dashboard widgets, and contrast

```text
You are OpenCode implementing task E3-B, screen-reader and theme-contrast improvements for ConstructsHub. Follow SRS §12.6 and WCAG 2.1 AA; do not invent numerical compliance from visual intuition alone.

PROJECT `Construct-Hub_Project`; web in `waquor/`, mobile only for existing applicable widgets. Inspect the shared dashboard widget/chart/table components and theme color tokens before editing. Read existing accessible-label and localization conventions first.

GIT: clean local main; worktree `../Construct-Hub-e3-labels-contrast`, branch `task-e3-labels-contrast`. No pull/push/merge/PR, `.env`, unapproved dependency additions, schema/migrations or PROGRESS.md edits.

IMPLEMENT:
- semantic headings/landmarks, meaningful `aria-label`/`aria-labelledby`, table header associations, chart title/summary/accessible data alternative, meaningful status announcements, correct live-region behavior and labels for icon-only controls across dashboard widgets;
- color contrast fixes at design-token level where safe, including text, disabled/placeholder text, borders needed to identify controls, focus rings, badges and chart states. Preserve semantic distinctions without color alone. Use the existing theme tokens and calculate ratios against actual rendered colors;
- avoid duplicating announcements where screen-reader-visible text already exists; don't put values/PII into hidden aria strings. Ensure locale/RTL behavior remains correct and not one-off patches per page where shared components suffice.

Add tests for required names/roles/state, chart fallback/table alternative, status announcements, and contrast token pairs. Run typecheck/test/build. Include a contrast table with token names, foreground/background values, calculated ratio, applicable WCAG threshold, fix and any exceptions in `docs/reviews/task-reports/E3-labels-contrast.md`. No PROGRESS.md edit. Commit/report SHA; no merge/push.
```

## E3-C — OpenCode: add axe-core to existing Playwright suite (approval gated)

```text
You are OpenCode implementing the automated accessibility CI gate for ConstructsHub task E3-C. Inspect current Playwright and dependency manifests first. If axe-core or an equivalent approved tool is absent, do not install it without owner approval. In that case, commit a decision/report specifying exact proposed package, licence, size, existing alternative, CI effect and stop here.

PROJECT web `waquor/` Next.js 15; SRS §12.6; current E1 Playwright journeys. The suite must not test production data and must avoid secrets/PII in artifacts.

GIT: create clean worktree `../Construct-Hub-e3-axe-ci`, branch `task-e3-axe-ci` from local main after E1 Playwright is merged. No pull/push/merge/PR, `.env`, new dependency without explicit approval, schema/migrations, or PROGRESS.md edit.

IMPLEMENT if the dependency is already available or expressly approved: integrate automated axe checks into the existing Playwright E2E harness for critical screens and six journeys, with WCAG 2.1 AA rules selected appropriately. CI should fail on critical/serious violations according to an explicit baseline policy. If there are legacy violations, produce a checked-in baseline/allowance only for specifically named, ticketed, time-bounded existing issues—not blanket suppressions; newly introduced critical issues must fail. Do not disable rules broadly to make build green. Ensure tests run on rendered pages with meaningful app data and correct locale/auth roles. Include RTL sample screens and admin-only gates. Keep screenshot/trace artifacts redacted.

Run E2E+axe suite and prove the gate catches a deliberately invalid fixture/component in a test-only path, then remove the fixture from production. Report rule names, actual violations and exclusions. Write `docs/reviews/task-reports/E3-axe-ci.md`, run web typecheck/test/build, commit if verified, report SHA/no merge/push.
```

## E3-D — Antigravity: full accessibility walkthrough

```text
You are Antigravity performing an independent accessibility walkthrough for ConstructsHub task E3-D. Do not code. SRS §12.6 and WCAG 2.1 AA are the acceptance basis.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-e3-accessibility-audit -b review-e3-d-e3-accessibility-audit main`, then `cd ../Construct-Hub-review-e3-accessibility-audit`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

In a safe test environment, traverse the full purchase journey keyboard-only; repeat key checkout/dispute/settings paths at 200% zoom and in high-contrast/forced-color conditions. Include at least one Arabic RTL run. Inspect focus visibility and order, dialogs, form errors, keyboard traps, touch targets, semantic labels, chart alternatives, status announcements where assistive tech is available, and text/control contrast. Use the existing axe suite report as evidence but don't assume an automated pass proves keyboard or screen-reader usability. Capture screenshots of focus paths and severe defects without PII.

Write `docs/reviews/a11y-report.md` with date, commit, browser/platform, viewport, locale, exact steps, screenshots, severity, WCAG criterion mapping, expected fix and whether reproducible. Distinguish a fully tested path from an untested device/screen-reader environment. Verdict PASS/PASS WITH DEFECTS/BLOCKED. Do not modify code, merge or push.
```

# 12. E4 — Performance, operational metrics, and deployment hardening

## E4-A — Claude Code: end-to-end load test and performance remediation

```text
You are Claude Code owning performance measurement for ConstructsHub task E4-A. The goal is actual before/after numbers, not generic optimization. Do not stress production or claim 10k/50k scale from a local toy workload.

PROJECT: `waquor/` Next.js 15, Prisma 6, current Docker Compose stack, `RouteMetric` / `withMetrics` instrumentation, SRS NFR-PER/NFR-SCL. Progress calls for 10k/50k sessions. Search performance has its own test in D5-I. Read deployment files and repository scripts first. Read schema before DB field use.

GIT: create clean worktree `../Construct-Hub-e4-performance`, branch `task-e4-performance` from local main after E1 contract/E2 baseline if those changes affect test tooling. No pull/push/merge/PR, `.env`, new dependencies, `.env` edits, or PROGRESS.md change. Use existing k6 or approved load tool; if k6 isn't installed/approved, report before installing. Never target production; require an explicit local/staging host allowlist.

MEASURE AND IMPROVE:
1. Build reproducible scripts for specified 10k and 50k session/concurrency workload under SRS NFR-SCL-01, defining whether the metric is virtual users, authenticated sessions, arrival rate, or connections—follow the exact NFR wording and do not mislabel them. Include realistic mix of search, catalogue, orders, dashboards, notifications and authenticated/unauthenticated paths, but no real user credentials/data.
2. Capture baseline: test environment/hardware, container resources, DB size, workload duration/ramp, p50/p95/p99, throughput, error rate, CPU/memory, saturation, route latency, and failed requests. If host can't sustain the full target, prove the runner scripts and report the highest tested load plus limitation; mark target unverified.
3. Identify top five bottlenecks from traces/profiles/DB plans. Fix only measured issues; candidates include missing indexes, N+1 Prisma queries, unpaginated lists, cold AI worker starts or repeated cache misses, but verify before editing. Preserve data isolation, authorization, result semantics and transaction correctness. Any schema index migration must follow P02 policy and use a separate safe migration branch if one is already active.
4. Repeat the identical workload and publish before/after comparison with no hidden workload change. Include regression threshold/failure-rate gates and repeatability guidance. Search targets are separate: autocomplete P95 ≤150 ms and unified search P95 ≤500 ms at 1M rows (D5-I); image search budget <4 s per request; report separately.
5. Provide CDN/image optimization recommendations and a measurement procedure for mobile cold start ≤2.5 s; don't claim CDN provisioning/device cold-start measurements when the environment cannot provide them.
6. Add no high-cardinality route/user/session labels to metrics. Don't expose business/PII data in load traces.

Run web typecheck/test/build. Save scripts and `docs/reviews/task-reports/E4-performance-before-after.md` with raw summary output, scenario config and bottleneck evidence. No PROGRESS.md edit. Commit and report branch/SHA; no merge/push.
```

## E4-B — Claude Code: OpenMetrics `/metrics` endpoint and decision record

```text
You are Claude Code implementing the lightweight operational metrics export for ConstructsHub task E4-B. Prefer a small OpenMetrics-compatible endpoint fed by the existing `RouteMetric`/internal instrumentation over introducing a heavy monitoring stack unless the codebase's actual needs justify otherwise.

PROJECT `Construct-Hub_Project`, web `waquor/`, current `lib/analytics.ts`, admin route-latency board, `RouteMetric` schema and deployment manifests. SRS NFR-PER/NFR-SEC/NFR-CMP apply. Read schema first.

GIT: clean main, worktree `../Construct-Hub-e4-openmetrics`, branch `task-e4-openmetrics`. No pull/push/merge/PR, `.env`, dependencies, schema/migrations or PROGRESS.md edits unless separately approved. Keep metrics export scoped to this task.

IMPLEMENT:
- `/metrics` or the agreed route emits standards-compliant OpenMetrics/Prometheus text format (correct content type, metric type/help, escaping and EOF marker if required by chosen standard) from existing safe aggregates—not a full dump of raw route rows. Include count/duration histogram or quantiles that can be computed correctly from the current data; do not pretend precomputed p95 samples form a full histogram.
- Metrics access must be internal-only / authentication or network-restricted per deployment architecture, never publicly scrapeable without an approved access model. Do not allow arbitrary expensive unbounded date-window queries.
- Route labels must use `templateRoute()` so IDs are stripped. No email, IDs, tokens, project names, arbitrary URL query strings or high-cardinality user/session labels. Keep aggregation windows and retention consistent with PDPL cleanup/rollup; use read-only bounded queries and reasonable timeouts.
- Add health/metrics output tests, label escaping tests, ID stripping regression tests, auth-denial test, empty DB state and query failure behavior. Metrics endpoint failure must not affect business request handlers. Do not `await trackEvent` in other handlers.
- Write `docs/decisions/metrics-export.md` comparing OpenMetrics against Datadog agent/exporter and justify the lighter option with operational prerequisites and security. Document scrape interval, labels, units, deployment network exposure, sample config (no secrets), and Grafana dashboard responsibility (external dashboard setup is not claimed done).

Run typecheck/test/build; if any instrumentation routes require changes, keep them bounded. Save `docs/reviews/task-reports/E4-openmetrics.md`. No PROGRESS.md edit. Commit focused implementation/tests/decision record and report SHA/no merge/push.
```

## E4-C — Claude Code: instrumentation coverage and analytics retention verification

```text
You are Claude Code handling observability consistency task E4-C for ConstructsHub. Audit the current implementation first: progress indicates most-used API routes are instrumented, while remaining `withMetrics` coverage and aggregation/retention may be open or stale. Do not duplicate jobs already present.

PROJECT `waquor/` Next.js 15; `lib/analytics.ts`, `templateRoute`, `RouteMetric`, `AnalyticsEvent`, cron routes and PDPL §NFR-CMP-07. Read the canonical SRS and schema before field names. Analytics must remain fire-and-forget and non-blocking.

GIT: clean local main, worktree `../Construct-Hub-e4-metrics-coverage`, branch `task-e4-metrics-coverage`. No pull/push/merge/PR, `.env`, new dependencies, schema/migrations, or PROGRESS.md edits.

TASK: compare every actual `waquor/src/app/api/**/route.ts` against the metrics wrapper and identify routes missing instrumentation. Wrap the highest-value missing routes with `withMetrics` in a way that preserves all request semantics and dynamic route IDs become canonical templates. Do not instrument health/metrics endpoints in a way that causes recursive metric writes. Verify the documented PDPL retention crons exist, are wired in k8s/scheduler and aggregate before deleting raw rows according to actual policy; do not add duplicate cron jobs if already present. Confirm aggregation is idempotent and safe on retry, age cutoffs are timezone-safe, no raw user identifiers or PII are exported, and cleanup is transactionally safe enough under failure. Run tests that exercise success, handler error and metric-write failure (the business result must be preserved). Test route template collapse on UUID, slug/opaque ID and query values.

Run typecheck/test/build and relevant cron/instrumentation tests. Write `docs/reviews/task-reports/E4-metrics-coverage.md` with routes instrumented/missing, cron status, exact output and confirmed/uncertain items. No PROGRESS.md changes. Commit focused changes and report branch/SHA; no merge/push.
```

## E4-D — Antigravity: production-readiness performance review

```text
You are Antigravity independently reviewing task E4-D after E4 branches have merged. Do not patch code or create false load test output.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-e4-performance-review -b review-e4-d-e4-performance-review main`, then `cd ../Construct-Hub-review-e4-performance-review`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Inspect the load reports and verify workload definition, environment, repeated-run consistency, P50/P95/P99/error-rate evidence and before/after comparability. Verify targets under NFR-SCL-01, text search P95 targets, image-search budget and mobile cold-start plan are either met with evidence or explicitly open. Inspect `/metrics` access control, cardinality/privacy, route-template labels and whether external dashboards are actually deployed versus merely documented. Verify there are no public load endpoints or accidental production stress-test configurations.

Where permitted, rerun a small smoke workload against a safe staging/test environment and capture commands/output; do not initiate the 50k stress test independently. Review the Grafana/OpenMetrics decision record and existing CI. Write `docs/reviews/task-reports/E4-antigravity-performance-audit.md` with verified metrics, environmental caveats and PASS/PASS WITH DEFECTS/BLOCKED. No merge/push.
```

## E4-E — Claude Code: BIM deployment manifest hardening parity

```text
You are Claude Code auditing and closing the remaining BIM deployment consistency task E4-E. Scope: `services/bim/` Docker/Compose/kubernetes manifests and integration tests only. Do not weaken the hardened container to make processing easier.

PROJECT: FastAPI + IfcOpenShell service; SRS §6.5 and NFR-SEC-11. The handoff states the Docker sandbox should be read-only root, bounded tmpfs, `cap_drop ALL`, no outbound network and HMAC-signed. Inspect actual current Dockerfile, compose, k8s YAML, service HMAC middleware and health probes.

GIT: clean main, worktree `../Construct-Hub-e4-bim-hardening`, branch `task-e4-bim-hardening`. No pull/push/merge/PR, `.env`, dependency changes without approval, no production cluster commands, no PROGRESS.md edit.

Compare Docker Compose runtime restrictions against every Kubernetes manifest/Job/CronJob using the BIM image. Align securityContext equivalents (runAsNonRoot where supported, readOnlyRootFilesystem, allowPrivilegeEscalation false, capabilities drop ALL, resource requests/limits, bounded writable temp volume, seccomp where compatible, explicit egress/network policy if the repo's cluster model supports it). Ensure HMAC secret is mounted/injected using existing configuration and never written into a manifest. Add/verify liveness/readiness endpoints and sane timeouts. Avoid claiming that Kubernetes NetworkPolicy works unless there is an explicit cluster enforcement mechanism; document operational prerequisites. Add YAML/static manifest checks or tests for mandatory hardening fields and rerun the IFC test from D5-H in a built image if available.

Run pytest, Docker/Compose tests and manifest lint/CI tools already approved. Write `docs/reviews/task-reports/E4-bim-deployment-parity.md` with exact manifests/fields, real test output and cluster-side prerequisites. No PROGRESS.md edit; commit/report SHA, no merge/push.
```

# 13. E5/E6 — Content operations and remaining admin consoles

## E5-A — Claude Code: announcements lifecycle API and campaign reporting data

```text
You are Claude Code implementing the content/marketing backend for ConstructsHub task E5-A. User-facing lifecycle is create → review → schedule → run → report, with paid announcements, moderation queue, and campaign metrics derived from the real `AnalyticsEvent` stream. Do not invent campaign impressions/conversions or assume a provider has published content without a verified callback/state transition.

PROJECT `Construct-Hub_Project`; SRS Master v2.0 §9.5 and admin §10.13; web `waquor/`; existing social provider modules and analytics pipeline are starting points. Inspect the actual Prisma schema, current social/content model, cron substrate, notification patterns, permissions and AuditEvent before coding. Schema/migrations are Claude-only; make no schema migration unless required, justified and safe under P02. Use `user.role` for auth, `userType` for DB filters. Analytics and notifications remain fire-and-forget, respecting NotificationPref; unconfigured providers must skip non-fatally. Never log PII, full provider tokens or post/document content.

GIT: clean main, create worktree `../Construct-Hub-e5-content-backend`, branch `task-e5-content-backend`. No pull/push/merge/PR, `.env`, new dependencies, or PROGRESS.md edits.

IMPLEMENT:
1. Inspect existing `SocialPost`, `scheduledFor`, status handling and cron dispatch before adding lifecycle. Reuse the existing scheduled-post cron/POSTING atomic claim if suitable; do not create a duplicate scheduler. Paid announcement state machine must define valid transitions, role gates and audit trail: draft/create, submit for moderation/review, approve/reject with reason, schedule/cancel, publish/run, completed/failed, and report. Use only the states supported by actual schema or introduce additive migration if essential and approved.
2. Ensure only authorized org/account owners can create/edit their own campaigns; only appropriate moderators/admins can review; scheduling cannot publish before approval; time-zone handling is explicit; duplicate cron invocation cannot double-publish/charge; provider errors and expired tokens are recoverable and visible.
3. Monetization must use existing approved billing/entitlement mechanism. Do not charge for a paid announcement until pricing/FR-BIL-08 is decided and authoritative billing logic is merged. If billing module isn't ready, build lifecycle with payment-gated publish action that truthfully reports “billing configuration required”; do not issue fake invoices or pretend a charge happened. Coordinate with R-BILLING before a live paid campaign is accepted.
4. Campaign reporting should derive reach, clicks and conversions from actual AnalyticsEvent/event contract and provider metrics where available. Define attribution, deduplicate repeated events, respect the retention/anonymization policy, handle zero denominator/null and explain provider limitations. No fabricated reach or conversion values. If the current event schema is insufficient, write the proposed contract and ask before changing schema.
5. Add API/worker tests for authorization, bad transitions, reason-required rejection, approval-required schedule, timezone boundary, duplicate scheduler claim, provider-unavailable, billing gate, metric aggregation, zero-event campaign, event dedupe and safe audit metadata.

Run web typecheck/test/build. Write `docs/reviews/task-reports/E5-content-backend.md` with transition diagram, endpoint contract, metric definitions and true provider/billing limitations. No PROGRESS.md edit. Commit only implemented scope and tests, report SHA/no merge/push.
```

## E5-B — OpenCode: paid announcements, moderation, and campaign ops UI

```text
You are OpenCode implementing the content operations admin UI for ConstructsHub task E5-B. Proceed against real endpoints/contracts only. Duplicating an admin moderation screen already implemented by another merged branch is not acceptable; inspect current state and reuse shared components.

PROJECT `waquor/` Next.js 15, dashboard shared components, SRS §9.5 and §10.13, and the supplied PDF moderation screen (page 17). Schema truth is `waquor/prisma/schema.prisma`. Server-side admin authorization is mandatory; frontend-only hide/show is insufficient.

GIT: after the E5-A backend contract is merged, create clean worktree `../Construct-Hub-e5-content-ui`, branch `task-e5-content-ui` from local main. No pull/push/merge/PR, `.env`, unapproved dependency, schema/migrations or PROGRESS.md changes.

BUILD admin screens matching the existing design system for: (1) listing/content moderation queue with submitted/pending/reported items, real status filters and details; (2) listing/review approve/reject/ask supplier actions, with required rejection reason and observable persisted outcome; (3) paid announcement creation/edit/review/schedule/cancel/run/report lifecycle according to actual state machine; (4) content calendar and review queue; (5) campaign reporting with real reach/click/conversion values, source/time window and empty/unavailable states. No fake charts or hardcoded marketing totals. If a provider doesn't offer a metric, show “not available from provider,” not zero or invented value. All errors, permission denial, expired credentials and billing-not-configured states must be explicit.

Use current locale/i18n and RTL patterns, accessible tables/forms/confirmation dialogs, pagination, loading/empty states, safe image/file URLs, and audit confirmation. A moderator's decision must call the real API and refresh based on response. Add component tests with fixture data only in tests for each lifecycle state, rejection reason, failed publish, no reports, Arabic RTL and role denial. Run `npm run typecheck`, `npm test`, `npx next build`. Capture browser screenshots and write `docs/reviews/task-reports/E5-content-ui.md`. No PROGRESS.md edit. Commit, report SHA/no merge/push.
```

## E6-A — Claude Code: admin API readiness, verification and consent audit

```text
You are Claude Code handling the backend/API readiness audit for the remaining ConstructsHub admin consoles, task E6-A. First inspect what P01 and E5 actually merged; do not recreate functioning API routes. This task covers verification action contracts, config registry decisions D-09/D-17, consent-event read-only API and any missing server-side gates needed by the UI.

PROJECT: `waquor/` Next.js 15 + Prisma 6. Canonical SRS §10.9–§10.13, decisions D-09/D-17 (read them in the canonical SRS/decision files), privacy/PDPL and security NFRs. Read `waquor/prisma/schema.prisma` before field names and check exact model presence for consent events and verification records. Schema migrations only on this Claude branch and only if necessary.

GIT: clean local main; create worktree `../Construct-Hub-e6-admin-api-audit`, branch `task-e6-admin-api-audit`. No pull/push/merge/PR, `.env`, unapproved dependencies, PROGRESS.md edits, or schema changes without justification/approval. Do not make up configuration keys for D-09/D-17.

TASK:
1. Audit currently merged APIs/page actions for verification queue, content moderation, Super Admin config registry and consent events. Return an endpoint/model inventory and identify existing vs missing behavior before changing code.
2. Verification approve/request-info/reject must be real guarded, validated, auditable state changes. Follow SRS rules for required reason, re-review states, expired documents, request retry and user notification. Never approve based on a UI event alone or skip evidence validation.
3. Config registry must use the exact schema/keys/risk classifications/two-person approval requirements in SRS D-09/D-17. If the SRS references unresolved fields or product decisions, stop and document rather than inventing a generic configuration that could change security/billing. Enforce role gates and second approval server-side, record reason/version/actor, prevent past-transaction retroactive fee changes, and make high-risk settings require the defined second approval.
4. Consent-event endpoint is read-only, admin-gated, paginated, time/filter bounded and only returns fields allowed by PDPL/SRS. Use explicit DTOs, no raw consent document or sensitive PII unless SRS expressly authorizes it. Test permission denial, sort/filter, pagination, empty results and data minimization. If the schema/model/retention contract is missing, write a proposed schema/API decision for user approval before a migration.
5. Every admin API validates Zod input, checks ownership/roles, returns correct status/errors and writes the existing audit-event model. No endpoint returns entire Prisma records or `passwordHash`, tokens, IBAN or private profile fields.

Run web typecheck/test/build and relevant integration tests. Write `docs/reviews/task-reports/E6-admin-api-audit.md` including exact SRS D-09/D-17 text references, endpoint matrix, tests and any schema/decision blocker. Do not edit PROGRESS.md. Commit verified work, report SHA/no merge/push.
```

## E6-B — OpenCode: verification console, config registry, consent and admin navigation

```text
You are OpenCode implementing the remaining admin console UIs for ConstructsHub task E6-B. Required screens: verification console (use existing API after validating its contract), full Super Admin config registry UI per SRS decisions D-09/D-17, consent-event listing, and navigation fixes. Content moderation should reuse the actual E5 moderation page if it already exists; do not create a duplicate route.

PROJECT web `waquor/` Next.js 15; SRS §10.9–§10.13 plus D-09/D-17; supplied PDF verification screen (page 15), super admin fees/config (page 5), finance (page 16) and moderation (page 17) as visual/flow references. Read `waquor/prisma/schema.prisma`, shared dashboard components, role authorization and current API contracts first.

GIT: clean local main after E6-A and E5 relevant contracts are merged; create worktree `../Construct-Hub-e6-admin-ui`, branch `task-e6-admin-ui`. No pull/push/merge/PR, `.env`, dependency additions, schema/migrations, or PROGRESS.md changes. If API isn't ready, stop on the affected screen and report the dependency rather than hardcoding mock rows.

IMPLEMENT:
- Verification queue with list/search/filter/SLA/expiry visibility, secure document preview or signed URL, rotate/zoom if existing viewer supports it, checklist, notes, request-more-info, approve, reject with required reason, persisted status and success/error feedback. Only authorized admins can see/use it; role gates are also server-enforced.
- Configuration registry with actual entries from the approved D-09/D-17 registry, grouped by domain/risk, current value and effective scope, change reason, diff/preview, approval queue and two-person approval where SRS defines it. Do not invent settings or render raw secrets; mask credential-like values. Fee/config changes must show effective dates and explicitly preserve past transaction calculations.
- Consent events listing with bounded filters/pagination/status/date and minimal permitted metadata. No unnecessary personal data or raw tokens, and no broad export unless SRS authorizes it.
- Repair admin navigation to link existing finance/analytics/search/moderation pages without duplicate nested `DashboardShell`, role leakage or hard-coded `dir="rtl"`. Use shared locale direction.
- Every visible action must call a real API and respond visibly; no `onClick={() => {}}`, unimplemented buttons or fake success notifications.

Add component tests for no results, 1/many rows, request info, rejected reason, approval queue, two-person review, role gates, masked secret values, Arabic RTL and API errors. Run `npm run typecheck`, `npm test`, `npx next build`; capture admin screenshots. Write `docs/reviews/task-reports/E6-admin-console-ui.md`; no PROGRESS.md edits. Commit/report SHA/no merge/push.
```

## E6-C — Antigravity: admin console visual/function audit

```text
You are Antigravity reviewing the merged admin consoles for ConstructsHub task E6-C. Do not code. Compare verified pages against canonical SRS §10.9–§10.13 and supplied screen references (super admin fees page 5, verification page 15, finance page 16, moderation page 17).
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-e6-admin-audit -b review-e6-c-e6-admin-audit main`, then `cd ../Construct-Hub-review-e6-admin-audit`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Navigate as admin and ordinary user where safe. Verify verification approval/rejection/request-info persists and requires appropriate reasons; the config registry uses only approved D-09/D-17 fields and implements second approval where required; past transactions remain unaffected by new fee changes; consent list is read-only/minimized/paginated; moderation lifecycle works; admin-only APIs are actually blocked server-side; finance/audit pages render without errors; no menu links are broken; and RTL is consistent. Inspect console/network and test empty/pending/multiple-row states. Never operate against production data or expose secret values in screenshots.

Write `docs/reviews/task-reports/E6-antigravity-admin-audit.md` with URLs, role, commit, steps, screenshots, SRS IDs and severity. Verdict PASS/PASS WITH DEFECTS/BLOCKED. Do not merge/push.
```

# 14. Other open SRS modules found in the handoff (not covered by D/E alone)

These are important because the supplied progress report lists them as incomplete. Run them only after P00 has established which gaps are still real. If a later merged commit already closed a gap, the agent must report it as already satisfied and avoid duplicating implementation.

## R-CATALOGUE-A — Claude Code: catalogue-to-search sync and expiry alert backend

```text
You are Claude Code implementing the backend consistency slice R-CATALOGUE-A for ConstructsHub. First verify whether these gaps remain after current branch merges: catalogue changes not synchronizing with SearchDocument, and certification expiry dashboard's 7/30/90-day alert data/scheduler. Do not rebuild existing catalogue CRUD/import APIs.

PROJECT `Construct-Hub_Project`; canonical SRS §6.2/§6.3, current `waquor/prisma/schema.prisma`, catalogue route handlers and `waquor/lib/search/sync`/ontology/job patterns are authority. Existing model families reported include Category, Product, PriceBook, PriceEntry, SkuVariant, Certification, CatalogueImport and ImportRow; verify actual schema. Read before field names. `user.role` is session field; DB filter `userType`. Notifications respect `NotificationPref` and missing providers skip non-fatally. Analytics/notification dispatch must be fire-and-forget.

GIT: create clean worktree `../Construct-Hub-r-catalogue-backend`, branch `task-r-catalogue-backend` from local main after P00; no pull/push/merge/PR, `.env`, new dependencies or `PROGRESS.md` edits. Only Claude may change schema/migrations and only if required; don't touch schema if current models suffice.

IMPLEMENT:
1. Confirm every create/update/archive/import path that changes searchable catalogue data triggers idempotent SearchDocument/index synchronization through the existing shared writer, without creating duplicates or doing a full blocking reindex per row. Define consistency/retry behavior if index is unavailable. Search should not expose private/draft listings or unapproved products. Track safe operational status and retry failed syncs.
2. Preserve source truth: search document fields derive from actual allowed catalogue fields and the current ontology, language aliases and category hierarchy. Do not infer price/stock/certification validity from prose. Use existing geo boost and search ranking without changing behavior outside documented tests.
3. Implement or verify server-side certification expiry query logic for due soon/past due windows (7/30/90 days per current report), status and issuer filtering, and scheduled reminders if SRS requires them. Avoid sending duplicated notices per run; respect user/org notification preferences; audit the reminder decision. If schema lacks sent-state/idempotency, propose an additive schema change and migration evidence instead of doing an unapproved migration.
4. Test catalogue create/edit/archive/import row retry, failed index sync and eventual retry, duplicate jobs, unapproved listing visibility, expired certificates, exact 7/30/90-day boundaries, already-expired records, timezone boundaries, missing provider and NotificationPref false. Ensure no raw PII or sensitive supplier banking information leaks to index/documents.

Use actual test framework; run web typecheck/test/build and approved disposable migration validation if schema changed. Write `docs/reviews/task-reports/R-catalogue-backend.md`, including gaps verified/closed, retry semantics and test output. Do not edit `PROGRESS.md`. Commit focused code/tests; report branch/SHA/no merge/push.
```

## R-CATALOGUE-B — OpenCode: PriceBook versioning, SKU matrix and certification UI

```text
You are OpenCode implementing the remaining catalogue admin UI for ConstructsHub task R-CATALOGUE-B. Do not rebuild catalogue CRUD/import; add the missing operator workflows after checking actual API contracts.

PROJECT web `waquor/` Next.js 15, shared admin components, SRS §6.2/§12.5, existing catalogue models and API; supplied supplier screen (PDF page 4) is a workflow reference. Read `waquor/prisma/schema.prisma`, existing catalogue API response types and locale/theme first. Never assume a field name based on this prompt; use actual schema. `user.role` for session gate, DB `userType`; admin gates server-side.

GIT: after R-CATALOGUE-A/actual APIs are merged, create clean worktree `../Construct-Hub-r-catalogue-ui`, branch `task-r-catalogue-ui`. No pull/push/merge/PR, `.env`, dependencies, schema/migrations or `PROGRESS.md` edits. No fake catalogue values or hardcoded example price books.

BUILD:
1. Admin PriceBook versioning interface: list current/previous version, currency (SAR/JOD), effective dates, status, diff/preview, version activate/archive controls and clear warning that new versions do not retroactively reprice historical transactions. Call real APIs and enforce the actual authorization contract.
2. SKU variant matrix: display and edit supported variant attributes, barcode, weight/dimensions and available fields, with row-level validation, conflict feedback and no unintended deletion of child variants. Respect server schema/uniqueness/units; do not put JSON technical internals directly into normal user UI if a structured editor is feasible.
3. Certification expiry dashboard: filter by valid/expiring in 7/30/90 days/expired and issuer/status/entity; show actual certificate expiry and owner, navigate to authorized detail, report real alert state. Do not infer “valid” from absence of expiry data.
4. Add empty/loading/error/permission-denied states, pagination and confirmation for destructive changes. RTL must work across tabular matrices, numeric identifiers, barcode and expiry/date fields. Reuse shared table/badges/forms and current i18n files.
5. Tests for version diff/effective date UI, SAR/JOD formatting without conversion, variant validation and duplicate barcode response, expiry boundaries, empty states and non-admin denial. Use mocked responses only in component tests, never as production screen data.

Run `npm run typecheck`, `npm test`, `npx next build`; capture browser screenshots. Write `docs/reviews/task-reports/R-catalogue-ui.md`; don't edit PROGRESS.md. Commit and report branch/SHA; no merge/push.
```

## R-BILLING-A — Claude Code: cumulative tiers, bundles, retry/dunning and JOD comparator

```text
You are Claude Code, the only implementation owner for billing/commission financial logic in ConstructsHub task R-BILLING-A. This is high risk. Implement only rules explicitly defined by the canonical SRS; do not invent a commercial policy from a table fragment or UI screenshot.

PROJECT `Construct-Hub_Project`, `waquor/` Prisma 6/Next.js 15. Canonical SRS §3.1, FR-BIL-19/20/21 (cumulative-tier commission), FR-BIL-08 (paid announcement bundles), and other relevant billing/finance NFRs are authoritative. Existing FR-BIL-22 comparator, FR-BIL-10 free periods, reach boost predicate and `lib/billing/estimator-quota.ts` should be inspected first. Read `waquor/prisma/schema.prisma`, ledger/idempotency, fee schedule, currency/FX policy, payment adapter and billing tests before edits.

GIT: clean local main after P00/P02; create worktree `../Construct-Hub-r-billing-core`, branch `task-r-billing-core`. No pull/push/merge/PR, `.env`, new dependencies, or `PROGRESS.md` edits. Only this Claude branch touches schema/migrations for these financial changes; don't overlap with another migration branch.

REQUIRED DELIVERABLES if fully specified by SRS:
1. Implement cumulative-tier fee calculation for the exact user/service/transaction classes and tier boundaries defined in FR-BIL-19/20/21. Use integer minor units or the existing approved decimal-money abstraction—never JavaScript floating-point for monetary calculations. Define exact inclusive/exclusive boundary, minimum/maximum fee, rounding order, refund/reversal, free period, negotiated rate and tier reset period from SRS. If any are not specified, stop that rule behind a documented ADR needing owner approval; don't infer business policy.
2. Paid announcement bundles under FR-BIL-08: price/entitlement validation and billing integration must be compatible with E5 campaign state machine. Avoid charging until campaign can be published/eligible; handle cancellation/refund and idempotency based on written SRS. E5 may not activate paid campaign until this is merged and tested.
3. Dunning and payment-failure retry: implement bounded, time-spaced retry schedule and state transitions using existing payment adapters/webhook/idempotency patterns. Never re-charge indefinitely or assume network timeout means failure/success. Use idempotency keys and reconcile uncertain result before retry. Respect user/org notification preferences and avoid exposing payment secrets in messages/logs. Make provider unconfigured a clear nonfatal unavailable state, not a fake successful retry.
4. FX-aware fee comparator for JOD order cases: use only an authoritative existing FX source/config/record with timestamp, quote ID, rounding and stale-rate policy. Do not invent a live exchange rate or silently use an arbitrary conversion. If there is no approved FX source, produce an explicit blocked ADR requiring owner-selected source and policy; never present SAR conversion as exact current value.
5. Keep historical billed transactions immutable under later commission/rule changes; persist version/snapshot of applied rule, effective time, currency and calculation inputs safely. No retroactive repricing. Use transactions and unique idempotency keys for settlement/ledger changes.
6. Add boundary/property tests for tier boundary amounts, cumulative vs flat behavior, SAR/JOD, rounding, refunds, free period, canceled subscriptions, overlapping ANY resolver, duplicate webhook, racing invocations, provider timeout, dunning ceiling and unchanged past transactions. Include integration tests with isolated DB and fake providers, never real money.

Run web typecheck/test/build and D1 or E1 money-path tests relevant to billing. Write `docs/reviews/task-reports/R-billing-core.md` with SRS rule-to-code map, calculations on synthetic cases, idempotency/race evidence and all policy blockers. No PROGRESS.md edits. Commit focused code/tests only after semantics and migration are safe; report branch/SHA/no merge/push.
```

## R-BILLING-B — Antigravity: financial rules and UI consistency audit

```text
You are Antigravity acting as independent finance/ledger reviewer for ConstructsHub task R-BILLING-B. Do not change code or calculate expected values from a guessed policy. Use the canonical SRS FR-BIL-08, FR-BIL-19/20/21/22 and §3.1, task report, and approved ADRs.
GIT/ISOLATION (REQUIRED): Before inspecting or saving the review, run `git status --short --branch` and confirm local `main` exists. Create a dedicated review worktree with `git worktree add ../Construct-Hub-review-r-billing-review -b review-r-billing-b-r-billing-review main`, then `cd ../Construct-Hub-review-r-billing-review`. If the source tree is dirty, `main` is missing, or worktree creation fails, stop filesystem changes and return findings without writing into the shared tree. Source code is read-only; you may create and locally commit only this task's report/screenshots. Do not pull, push, merge, open a PR, edit `.env`, install packages, change schema/migrations, or edit `PROGRESS.md`. Never share the same working directory with a coding agent.

Build independent hand-calculations for synthetic transactions at tier boundaries, just below/at/above a threshold, free-period, cancellation, refunds, JOD/SAR and rounding. Compare to automated tests and reported ledger deltas. Confirm applied rule version is preserved for historical transactions; duplicate requests/webhooks don't double charge; timeout behavior doesn't blindly retry a possibly successful payment; dunning is bounded; fee comparator uses an approved dated FX quote and reports when none is available. Inspect that front-end tables/cards display actual persisted result instead of hardcoded or mocked values, and no full IBAN/token/passwordHash is exposed.

Review migration safety and test outputs; distinguish what you personally reran versus read from reports. Write `docs/reviews/task-reports/R-billing-antigravity-audit.md` with examples, discrepancies, SRS traceability, severity, and PASS/PASS WITH DEFECTS/BLOCKED. Any amount mismatch, double charge, unbalanced ledger or unauthorized refund is a release blocker. Do not merge/push.
```

## R-TENDER — OpenCode: interactive Gantt schedule UI

```text
You are OpenCode implementing the missing interactive Gantt chart for ConstructsHub task R-TENDER. First verify the canonical SRS §7.3 and the current project/tender schedule models and API endpoints. This is a visual client feature, but it must operate on actual persisted schedule data.

PROJECT `Construct-Hub_Project`, web `waquor/` Next.js 15 and any mobile use only if explicitly demanded by SRS. Read `waquor/prisma/schema.prisma` before field assumptions. Use existing project/milestone/tasks API and shared dashboard charts where available. Do not invent task dates, dependencies or project progress; do not add a charting dependency without owner approval.

GIT: clean main, worktree `../Construct-Hub-r-tender-gantt`, branch `task-r-tender-gantt`. No pull/push/merge/PR, `.env`, new package, schema/migrations or PROGRESS.md edits.

IMPLEMENT an accessible interactive Gantt with real task/milestone dates and durations, dependency links where modeled, progress/state labels, zoom or time-scale selection if practical, hover/focus detail, scroll/keyboard navigation, and empty/invalid-date/error state. Changes are saved using a real authorized API; if scheduling mutation endpoints are absent, create no false-saving UI—report exact backend dependency. Validate start/end ordering, conflict feedback, permissions and optimistic update rollback. Keep tender-private bidder data out of project schedule views. Use SRS date/time zone semantics. RTL should preserve timeline order/chronology (do not mirror time into a misleading reversed sequence) while labels/side panels align correctly.

Add component/integration tests for date boundaries, no dates, long schedule, status/progress, save failure, unauthorized edit and Arabic locale. Run web typecheck/test/build. Write `docs/reviews/task-reports/R-tender-gantt.md` with screenshots and real API contract evidence. No PROGRESS.md edit. Commit/report SHA/no merge/push.
```

## R-DISPUTES-A — OpenCode: in-app evidence viewer

```text
You are OpenCode implementing the dispute evidence viewer UI for ConstructsHub task R-DISPUTES-A. The backend signed-URL/magic-byte evidence flow is reported as implemented; inspect actual merged API contract before UI work. Do not make evidence public or invent a storage URL.

PROJECT `waquor/` Next.js 15, SRS §7.6 and support/admin requirements; visual reference is supplied screen PDF page 6. Read the current dispute detail/evidence routes, permission helpers, attachment contract and schema before using fields. A user may view evidence only if the server authorizes their participation or the documented current support-view gate; signed URLs are short-lived and secret.

GIT: clean local main; worktree `../Construct-Hub-r-dispute-evidence-ui`, branch `task-r-dispute-evidence-ui`. No pull/push/merge/PR, `.env`, dependencies, schema/migrations, or PROGRESS.md changes.

BUILD real evidence panel with list/type/date/verified upload metadata only as returned, authorized signed-view/download, image preview and safe document fallback for supported content, multi-file navigation, loading/expired-link/retry/not-found/access-denied states, and audit-friendly view events only where the existing API supports them. Support photos, weighbridge tickets, dispatch notes and chat attachments only as the backend supports. Do not execute or embed PDFs/HTML as active content; sanitize file names and render untrusted media safely. Do not put the signed URL into analytics/logs or persistent browser storage. Include evidence checksum only if contract returns it and policy permits display. UI must not adjudicate a dispute or release funds by opening evidence.

Test authorized raiser/counterparty/support view-only gate, unrelated user denial, closed dispute restrictions, expired URL, image/PDF preview, unsupported file, very large file and Arabic RTL. Run web typecheck/test/build and capture browser evidence. Write `docs/reviews/task-reports/R-dispute-evidence-ui.md`. No PROGRESS.md edit. Commit/report SHA/no merge/push.
```

## R-DISPUTES-B — Claude Code: chargeback-WON reconciliation behavior

```text
You are Claude Code implementing task R-DISPUTES-B for chargeback outcome handling. Financial/dispute core logic belongs to Claude. The current handoff lists “auto-ruling-on-chargeback-WON” as still open; verify the SRS actually requires the exact behavior before implementing it.

PROJECT `waquor/` Prisma 6, current chargeback webhook/service, Dispute SLA, EscrowHold, ledger and webhook idempotency code. Read SRS §7.6, §8, schema and actual payment provider event contract. Existing chargeback ingestion reportedly creates/links a Dispute and freezes EscrowHold; don't duplicate or override it.

GIT: clean main; worktree `../Construct-Hub-r-chargeback-won`, branch `task-r-chargeback-won`. No pull/push/merge/PR, `.env`, dependency addition, PROGRESS.md edits, or concurrent schema migration.

IMPLEMENT only if the SRS/provider semantics are explicit:
- map a verified final chargeback “won” event to the documented dispute/escrow/ledger outcome, using event identity and idempotency to prevent duplicate decisions;
- distinguish final won/lost/reversed/inquiry/in-progress provider states using actual event contract; reject unknown/transient statuses without releasing funds;
- verify webhook signature, handle replay/out-of-order event delivery, persist raw provider event only under existing retention/PII policy, and maintain audit event with safe metadata;
- prevent double-release or inconsistent wallet/escrow values, and do not issue an automatic ruling that conflicts with a human adjudication or another dispute state; all monetary moves use a transaction and unique ledger idempotency keys;
- if product/legal policy on which party is paid, appeal and interaction with open dispute is unclear, write `docs/decisions/chargeback-won-policy.md` and stop before releasing money.

Add isolated DB and service tests for final won, final lost, duplicate, malformed, invalid HMAC, out-of-order reversal, existing human ruling, frozen escrow and transaction rollback. Run web typecheck/test/build plus E1 money integration. Write `docs/reviews/task-reports/R-chargeback-won.md`; never use a live provider. No PROGRESS.md. Commit only safe, specified behavior; report SHA/no merge/push.
```


## R-WORKFORCE-A — Claude Code: mobile outbox/API reliability and signed contract export

```text
You are Claude Code responsible for workforce API correctness and signed-contract export for ConstructsHub task R-WORKFORCE-A. This is a persistence/privacy task, not a UI rewrite. Verify the current status first; don't recreate existing endpoints.

PROJECT `Construct-Hub_Project`, `waquor/` Prisma 6/Next.js and `mobile/` Expo outbox. SRS §7.4/§15.4 and PDPL requirements. Current handoff says attendance geofence/time-log/e-sign exists, with off-site check-ins flagged rather than rejected; total earned is credited only on employer approval. It also lists remaining mobile outbox check-in/out wiring, worker-contract list/create UX and signed-contract PDF export. Read schema and actual `POST /api/worker/time-logs?action=check-in|check-out`, employer time-log approval route, contract model and signing payload before field names. `TimeLog.checkIn/checkOut` are DateTimes; compute duration explicitly. Do not change the off-site human-factors policy without SRS authorization.

GIT: clean local main; worktree `../Construct-Hub-r-workforce-core`, branch `task-r-workforce-core`. No pull/push/merge/PR, `.env`, dependency additions, PROGRESS.md edits or concurrent schema/migration work.

TASK:
1. Verify check-in/out endpoints have idempotency, auth/contract ownership checks, timestamps from trusted server where appropriate, duplicate/retry safety, malformed/out-of-range coordinates behavior, rate limits and `AuditEvent` for off-site flags. Mobile outbox may retry after timeout/status 0, so duplicate mutation must not create double entries/pay. If route already meets contract, add integration tests and document evidence rather than rewrite.
2. Verify the mobile outbox can queue/replay these two actions against real endpoints with idempotency keys and preserves event order; this may need a client branch, so provide an agreed API contract to OpenCode instead of simultaneously editing the mobile screen. Server must not infer successful write from enqueueing client-side.
3. Implement signed worker-contract PDF export only if the SRS requires PDF and a safe existing PDF renderer/library is already present. Never add a binary/dependency without owner approval. Reuse existing secure signed-contract record, signature hash/time, contract version, parties, terms and audit trail. Render only the approved contract content; immutable signed versions must not change when a later contract version is edited. Signatures are sensitive and must only be exported by permitted parties. Use short-lived authorized download, content-disposition safe filename, no public permanent URL, and preserve page numbering/Arabic text if renderer supports it. If no approved PDF engine exists, document the exact dependency/alternative (e.g. approved print-to-PDF only if SRS allows) and stop the PDF generation claim.
4. Use a test-only DB and unit/integration tests for offline replay duplicate, lost response, invalid coordinates, off-site flagged/not denied, check-out with no check-in, same event retried, worker/employer role restrictions, approval/rejection credit behavior and immutable signed PDF metadata. Don't create a paid record or alter salary/earned balance with mock data in production.

Run `waquor/` typecheck/test/build; test mobile outbox in an isolated client suite if available. Write `docs/reviews/task-reports/R-workforce-core.md` with exact API contracts and PDF dependency status. No PROGRESS.md edit. Commit verified code/tests/report, report SHA/no merge/push.
```

## R-WORKFORCE-B — OpenCode: contract list/create, outbox hookup and signed PDF UI

```text
You are OpenCode implementing the mobile Workforce completion UI for ConstructsHub task R-WORKFORCE-B. Wait until R-WORKFORCE-A specifies the real route/idempotency/PDF contract and it is merged; do not fabricate a contract record or local-success state.

PROJECT `mobile/` Expo SDK 52, Expo Router 4, React Native 0.76, SQLite/offline outbox, existing worker shift and e-sign screens; server API under `waquor/`. SRS §7.4/§15.4. Read `mobile/lib/session.ts`, `mobile/lib/api.ts`, outbox implementation, contract screens and actual route definitions first. Use `user.role` in session checks, Prisma filter convention only when discussing server work. No fake files/contracts.

GIT: after server contract merges to local main, create clean worktree `../Construct-Hub-r-workforce-mobile`, branch `task-r-workforce-mobile`. No pull/push/merge/PR, `.env`, new dependencies, schema/migrations or `PROGRESS.md` edits.

IMPLEMENT:
- Real worker-contract list/details/create/submit UX if SRS role permits, with contract status, party, dates, terms and explicit signature consent; signed versions immutable. Do not allow a worker to sign or edit another worker's contract. Use actual API endpoints and display server error/permission state.
- Hook check-in/out mutations into the existing offline outbox with unique idempotency keys, route contract and ordered replay. Show “queued/offline” distinctly from “checked in successfully”; only update confirmed state after server response, or show pending sync visibly. Outbox failures with API status 0/404 must not become apparent success; expose a safe actionable pending/failure indicator.
- Show a signed contract download action only if the actual PDF endpoint is implemented. Use authorized request and safe filename/content type; do not cache private contract PDFs in a global folder or log signed URLs.
- Support accessibility, Arabic RTL, device safe area, permission prompts and graceful network/auth expiry. If native location permission is denied, tell user what action is unavailable and do not invent coordinates.

Add mobile tests for contract list/empty/error, create/sign permissions, immutable signed state, offline queued vs server confirmed, duplicate replay, 404 handling, rejected off-site flag displayed as flagged not denied, download unavailable/error and Arabic RTL. Run actual mobile `npm run typecheck`/tests or equivalents; run web check only if shared contracts are changed. Write `docs/reviews/task-reports/R-workforce-mobile.md` with screenshots and exact outputs. Don't edit PROGRESS.md. Commit/report branch/SHA, no merge/push.
```

## R-LOGISTICS-A — Claude Code: fleet subaccounts and multi-stop quote core

```text
You are Claude Code implementing the Logistics backend/core slice R-LOGISTICS-A for ConstructsHub. Verify the reported remaining gaps first: fleet subaccounts, driver/vehicle re-assignment behavior and cost-rules engine for multi-stop quotes. Some dispatch/MapsProvider/GPS functionality already exists; do not duplicate it.

PROJECT `waquor/` Prisma 6/Next.js; SRS §7.5 and security/payment requirements. Read schema, route handlers, vehicle/driver/trip models, `lib/geo.ts`, MapsProvider, dispatch cascade and state machine. Canonical fields: session `user.role`; DB `userType`; `ProjectAssignment.userId`; TimeLog `checkIn/checkOut` only when relevant. No schema assumptions without inspection.

GIT: clean local main; worktree `../Construct-Hub-r-logistics-core`, branch `task-r-logistics-core`. No pull/push/merge/PR, `.env`, new dependencies, PROGRESS.md changes, or overlapping migration.

IMPLEMENT if SRS confirms scope:
1. Fleet subaccount authorization/model behavior: fleet owner/admin can manage only their drivers/vehicles; subaccounts cannot cross fleet/tenant boundaries; validate vehicle capacity/licence/availability and avoid simultaneous conflicting bookings. Use exact SRS semantics, not assumed company structure.
2. Driver/vehicle re-assignment with auditable reason, state transition rules, effective time, and notification to affected driver/dispatcher. Disallow reassignment after prohibited trip states and ensure the vehicle assigned to a trip meets cargo capacity/type. No direct database mutation from client.
3. Multi-stop quote cost rules: use exact SRS rates, distance/time/toll/loading policies and currency rounding. The existing `lib/geo.ts` haversine is for distance ranking; don't substitute straight-line distance for billable route distance unless SRS explicitly says so. Use the existing MapsProvider route result where available and define provider-unavailable behavior. No unapproved map API/licence. Multi-stop ordering must handle duplicate/invalid stops and same-origin/destination, route failure, quote expiry and idempotent quote IDs.
4. Financial quote output must use approved money abstraction and explicit currency; do not float round or create hidden surcharges. If tariffs or per-km/per-stop values are undefined in SRS, write ADR with the question and stop billing logic for that portion.
5. Add integration tests for tenant/fleet isolation, driver/vehicle incompatibility, concurrent booking, reassignment state gates, duplicate request, 0/1/multiple stops, invalid coordinates, map outage, route distance contract, rounding and unauthorized quote lookup.

Run web typecheck/test/build and existing route/geo tests. Write `docs/reviews/task-reports/R-logistics-core.md` with gaps, real calculations on synthetic examples and owner decisions. No PROGRESS.md edit. Commit only specified code/tests and report SHA/no merge/push.
```

## R-LOGISTICS-B — OpenCode: fleet asset/reassignment, driver chat and multistop UI

```text
You are OpenCode implementing logistics operations UI task R-LOGISTICS-B. Work only after the R-LOGISTICS-A API contract is merged, and only for endpoints that actually exist. Do not create a dummy chat or quote results.

PROJECT `waquor/` Next.js 15 (mobile only where SRS explicitly requires), SRS §7.5; current shared dashboard components, messages/threads contract, vehicle/trip endpoints and supplied driver screen (PDF page 9) are references. Read schema and API contracts first.

GIT: clean local main; worktree `../Construct-Hub-r-logistics-ui`, branch `task-r-logistics-ui`. No pull/push/merge/PR, `.env`, new dependencies, schema/migrations, or PROGRESS.md edits.

BUILD real UIs for (a) fleet subaccounts/driver assets, (b) driver↔vehicle reassignment with eligibility/current booking/status and required reason, (c) multi-stop quote builder with stop order, actual route/cost breakdown and clear provider-unavailable state, and (d) chat-with-driver using the existing authorized message-thread API. Do not show driver precise live location to roles without permission and do not include full location in analytics. The assignment action must call server and update actual trip/vehicle state; chat must create/use a real permitted thread rather than a static conversation. UI must show conflict and server validation errors, confirm changes with operational consequence, and preserve driver/vehicle history.

Use shared i18n/RTL/accessibility patterns. Test owner vs fleet admin vs driver visibility, occupied vehicle, incompatible truck capacity, stale map response, invalid stops, quote expiry, chat permission and offline/404 state. Run web typecheck/test/build; capture browser/device screenshots where actual surface exists. Write `docs/reviews/task-reports/R-logistics-ui.md`, commit/report SHA/no merge/push.
```

## R-SOCIAL — Claude Code: remaining provider OAuth/publish gaps

```text
You are Claude Code implementing remaining social-connector reliability for ConstructsHub task R-SOCIAL. Inspect existing provider adapters, tests and the current published-status/cron flow first. The progress report states Instagram/TikTok publication exists and identifies LinkedIn URN resolution, Facebook Page-token exchange, X OAuth PKCE S256, refresh-token rotation and TikTok status polling as remaining. Verify all five before coding.

PROJECT `waquor/` Next.js 15, social connectors in `waquor/lib/social/`, `SocialPost` scheduler and `crypto-field.ts`/`field encryption`. SRS §9.1. Read exact current adapter interfaces, token persistence, API versions and approved provider contracts. Don't add a dependency or perform live OAuth without user credentials/approval.

GIT: clean main; worktree `../Construct-Hub-r-social-connectors`, branch `task-r-social-connectors`. No pull/push/merge/PR, `.env`, new package, schema/migration unless justified and approved, or PROGRESS.md edits.

IMPLEMENT only verified gaps:
1. LinkedIn: resolve required organization/member URN using official API and correct permissions; handle inaccessible/missing URN and token scopes without guessed IDs.
2. Facebook: implement `/me/accounts` page-token selection/exchange using official provider response types, permission checks and page ownership; never expose long-lived Page tokens to the client.
3. X: replace PKCE plain with S256 including secure verifier/challenge generation, binding state to one-time expiring server-side/session state, constant-time state comparison, callback replay prevention and safe failure behavior. Don't log authorization code, verifier or access token.
4. Refresh-token rotation: persist new access/refresh tokens atomically, encrypt at rest with existing `crypto-field.ts`, serialize concurrent refresh attempts/idempotence, handle revoked/rotated token and re-auth requirement. Never silently retain an old invalid refresh token after provider rotates it.
5. TikTok status polling: consume official post status API, bound poll frequency/backoff/window and map provider statuses to actual SocialPost state; distinguish processing vs posted vs failed, use request IDs for operator diagnostics without token/PII.
6. All adapters return typed, sanitized provider errors from the existing error contract; handle rate limits, token expiry, container-not-ready and ambiguous response. Cron must remain idempotent and use existing atomic claim; no duplicate scheduler or publish call. Provider unconfigured must fail as a clear environment gate and skip nonfatally per product contract.

Add mocked boundary tests for each API response and negative state; do not claim live provider validation if no credentials. Add optional live sandbox command only when safe and explicitly run by owner, no default outbound tests. Run web typecheck/test/build. Write `docs/reviews/task-reports/R-social-connectors.md` with official endpoint/version/source links, provider gates and exact test evidence. No PROGRESS.md edit. Commit, report SHA/no merge/push.
```

## R-MESSAGING — Claude Code: group threads, authorized search and PDPL retention

```text
You are Claude Code implementing the remaining core messaging capabilities for ConstructsHub task R-MESSAGING. Security, encryption, access policy and data lifecycle belong to you. Existing 1:1 messaging, AES-256-GCM encryption-at-rest, support view-only gate and signed-URL attachments reportedly exist; verify these rather than rewriting them.

PROJECT `waquor/` Prisma 6, `lib/messaging-crypto.ts`, messaging thread/member/attachment APIs, PDPL deletion/export and retention cron. SRS §9.2, §15.4, NFR-CMP. Read `waquor/prisma/schema.prisma` and all messaging guards before fields. No raw message text, PII, tokens, attachment content or decrypted messages in logs/analytics.

GIT: clean local main; worktree `../Construct-Hub-r-messaging`, branch `task-r-messaging`. No pull/push/merge/PR, `.env`, unapproved dependencies or PROGRESS.md changes. Schema/migrations only in this branch if needed and after reviewing whether migrations could be active elsewhere; follow P02 safety.

IMPLEMENT according to exact SRS:
1. Group threads: multiple members, membership invites/removals, role/ownership checks, last-read tracking, adding attachments, conversation state and notifications. Define group owner/moderator only if SRS says; otherwise ask owner. Atomic membership changes and membership snapshot at send time; non-members cannot read history or reuse signed attachment URLs. Support staff view-only access remains restricted to the documented active dispute/ticket gate and never writes.
2. Message search: search only content the requesting user is currently authorized to read. Because message body is encrypted at rest, do not add a plaintext index or decrypt all messages into logs. Choose an existing approved mechanism: bounded per-participant decrypt-at-query for small datasets, an encrypted-search design reviewed explicitly, or report architecture requiring approval. Any index should disclose data retained/derived, deletion rules and threat model; do not use external search provider with private contents absent approval. Search terms must be rate-limited and not logged raw.
3. Retention windows: determine exact time windows from SRS/PDPL policy, not guess. Implement scheduled prune/archive behavior using existing cron substrate; preserve audit/legal holds for open disputes/support cases, invoices/contract retention requirements and `/api/me/export/delete` semantics. Avoid deleting evidence that has an active legal hold. Aggregation/deletion must be idempotent and safe on repeated cron calls; record counts without message content.
4. Ensure encryption versioning/legacy plaintext compatibility remains, AES-GCM authentication failures fail closed, unique nonces remain, field keys aren't newly created or printed. API DTOs never return ciphertext metadata unnecessarily or decrypted data to admins without allowed case.
5. Add tests for group membership/no-leak, removed member, role/tenant isolation, message search authorization, Unicode/Arabic encrypted round trip, encryption failure, retention boundary, legal hold, deletion export and support view-only restrictions.

Run web typecheck/test/build and safe migration/integration tests. Write `docs/reviews/task-reports/R-messaging-completion.md` and, if needed, a decision record for search/retention unresolved policy. Do not edit PROGRESS.md. Commit verified change only; report SHA/no merge/push.
```

## R-SEARCH-CLARIFY — Claude Code: evaluated LLM clarification beyond current heuristic

```text
You are Claude Code implementing the remaining natural-language search clarification task R-SEARCH-CLARIFY. The progress report estimates this at 75% and says current behavior is a 9-topic heuristic; verify exact implementation before replacing it.

PROJECT `waquor/` search endpoints, `lib/llm.ts`, search ontology/index, existing clarification route, SRS §6.3 and FR-SRCH-10 as confirmed in canonical SRS. Use D1 evaluation harness once available. Read schema and search permission gates. No added LLM provider/dependency without approval; keep user query/document PII out of logs.

GIT: clean main, worktree `../Construct-Hub-r-search-clarify`, branch `task-r-search-clarify` after D1 is merged. No pull/push/merge/PR, `.env`, new dependencies, schema/migrations or PROGRESS.md edit.

IMPLEMENT a bounded, typed clarification flow that asks a question only when missing attributes materially affect product/intent selection; otherwise return the best current search results. Inputs/outputs must use a strict structured schema for normalized query, missing attributes, candidate values and final query. Preserve Arabic/English/colloquial text and numerals; do not force a clarification loop longer than a documented max. Keep existing 9-topic behavior as regression coverage or fallback when LLM provider is absent. The fallback must be transparently identified internally and produce real indexed results—not fabricated product cards. Prevent retrieved content/query from injecting system instructions and never let model run SQL, choose arbitrary tool names or bypass permissions. Rate-limit calls and set request/token/time caps.

Add D1 golden questions and tests for ambiguous/certain queries, Arabic dialect/numerals, prompt injection, no catalogue match, provider down, invalid JSON, repeated loop, cross-tenant content and P95. Report baseline vs candidate user-correctness metrics and latency/cost only measured; if no live model is configured, distinguish contract tests from model eval. Run web typecheck/test/build and `ai/evals` suite. Write `docs/reviews/task-reports/R-search-clarify.md`, commit/report SHA/no merge/push.
```


## R-PAYMENT-CLIENT-A — Claude Code: safe payment tokenization contract and sandbox boundary

```text
You are Claude Code auditing and implementing the backend/client contract for task R-PAYMENT-CLIENT-A, Saudi payment UX completion. The reported Moyasar adapter is code-complete but browser/mobile card tokenization is still open. Do not collect or store raw card data on the Construct-Hub server.

PROJECT `waquor/` Next.js 15 + current PaymentGateway router, Moyasar provider at its actual repository path, Stripe/Polar/Mock adapters, mobile API and SRS §8. Inspect schema, existing invoice/payment/escrow/ledger flow, webhook validation and provider docs first. Do not edit `.env` or use live creds; merchant provisioning and sandbox credentials remain owner-controlled.

GIT: clean main; worktree `../Construct-Hub-r-payment-contract`, branch `task-r-payment-contract`. No pull/push/merge/PR, new SDK/dependency, `.env`, schema/migrations, or PROGRESS.md edits without necessary approval.

TASK:
1. Trace how the current checkout sends payment information, how Moyasar hosted invoices/tokens are created, how 3DS redirect is surfaced, and how signed webhooks enter ledger/escrow. Write the real typed API contract for browser and Expo tokenization, payment-intent/idempotency lifecycle, client redirect/deep-link recovery, status polling, and provider-unavailable/error states.
2. Verify no raw PAN/CVV is sent to or stored by the server; do not log sensitive payment inputs, provider token, `secret_token`, or full IBAN. Only use provider-issued token/payment identifier following official SDK/API semantics. Do not trust a client “success” redirect; server-side webhook or verified provider status is the financial source of truth.
3. Ensure retrying a checkout cannot create duplicate order/payment/ledger/escrow entries; ambiguous provider timeout must query/reconcile before retrying a charge. Validate amount/currency against server-side order or invoice and user ownership. Preserve 3DS/SCA redirect requirements where applicable and safe return URL allowlist.
4. If a new client SDK/dependency is required, do not add it without owner approval. Write a focused decision with package/version/licence/platform compatibility and storage/PII implications, and stop before modifying dependency manifests. Prefer the official existing adapter if already approved.
5. Add safe integration tests with an explicitly named mock/test gateway for token-created → payment-pending → confirmed/rejected → webhook duplicate/timeout flows. No live provider call in default tests. If test merchant credentials are absent, mark sandbox validation untested and provide exact owner-run command without printing environment values.

Run web typecheck/test/build. Write `docs/reviews/task-reports/R-payment-tokenization-contract.md` with sequence diagram, API contract, confirmed server-side trust source, security tests and missing user-side credentials. No PROGRESS.md change. Commit/report SHA/no merge/push.
```

## R-PAYMENT-CLIENT-B — OpenCode: Moyasar browser and Expo checkout tokenization UX

```text
You are OpenCode implementing the frontend tokenization UX for ConstructsHub task R-PAYMENT-CLIENT-B. Proceed only after R-PAYMENT-CLIENT-A's safe, typed contract is agreed and the required official client SDK has already been approved/installed. If not, stop and provide the exact dependency/credential blocker rather than adding a package or pretending to tokenize.

PROJECT `waquor/` Next.js 15, `mobile/` Expo SDK 52/RN 0.76, existing checkout/cart/order state, PaymentGateway adapter and SRS §8. Use official provider components for token/card entry so raw PAN/CVV remain within approved payment-provider controls. Never build a raw card form that posts unencrypted card details to Next.js.

GIT: clean local main after contract merge; worktree `../Construct-Hub-r-payment-client`, branch `task-r-payment-client`. No pull/push/merge/PR, `.env`, dependency changes, schema/migrations, PROGRESS.md edits, or provider call against production.

IMPLEMENT on web and mobile as supported by official SDK: present the real checkout form/provider UI; validate amount/currency context against server contract; handle loading, provider error, decline, cancellation, 3DS challenge/return, pending/confirmation, network drop and safe retry. Never treat client callback alone as paid. Recover by server payment status/webhook result; retain cart/order state without duplicate order creation; show explicit unavailable state if merchant configuration is absent. Do not store payment tokens in logs, analytics or insecure persistent storage. Make accessible/RTL-compatible and preserve SAR/JOD currency text as returned by server. No hardcoded “payment successful” mock states.

Tests: component tests using clearly identified SDK test-mode fixtures for success/pending/decline/3DS/cancel/error and safe retry; assert no card number/CVV reaches app API. Run web typecheck/test/build and mobile scripts. Actual sandbox smoke test requires owner credentials and consent: if unavailable, mark it not run; do not claim completion. Write `docs/reviews/task-reports/R-payment-client.md`, include screenshots and SDK version/license provenance, commit/report SHA/no merge/push.
```

## R-PAYMENT-REFUND — Claude Code: refund workflow outside dispute adjudication

```text
You are Claude Code implementing the refund workflow for ConstructsHub task R-PAYMENT-REFUND, separate from chargeback/dispute rulings. Check the exact refund requirements in canonical SRS §8 before coding; do not infer refund eligibility or create a way around escrow freezes.

PROJECT `waquor/` payments/adapters, escrow, ledger, order/invoice status, webhook routing and schema. Read `waquor/prisma/schema.prisma`, existing partial refund support in Moyasar/Stripe adapters, idempotency and chargeback/dispute freeze policy. Current report says provider adapters may support partial refunds, but a product-level refund workflow outside disputes remains open.

GIT: clean main, worktree `../Construct-Hub-r-refund-workflow`, branch `task-r-refund-workflow`. No pull/push/merge/PR, `.env`, new dependencies, PROGRESS.md edits, or concurrent migration branch.

IMPLEMENT if SRS defines policy:
- guarded refund request with role/ownership and exact order/payment/invoice association; capture reason and allowed amount/line rules; use server-computed refundable balance rather than a client-provided amount;
- enforce maximum refundable remaining amount, currency match, no double refund, partial/full rules, escrow holds/chargeback/dispute restrictions, role separation and approval thresholds as stated by SRS;
- provider refund attempt is idempotent and reconciled after ambiguous timeout before retry; provider-confirmed final state, not client callback, determines money outcome;
- ledger entries and invoice/order state are consistent, transaction-safe, audit logged with redacted identifiers, and historical invoices/transactions preserved; refund does not alter a previously issued legal invoice without the correct credit-note process defined by SRS/ZATCA rules;
- explicit state machine and UI/API error outcomes for pending/provider unavailable/rejected/confirmed/reversed. Do not hardcode a mock success when provider config is absent.

If the SRS does not specify refund policy, chargeback/dispute interaction, credit notes or approval limits, write `docs/decisions/refund-policy.md` with exact questions and stop the affected financial logic. Add real integration tests with isolated DB and test gateway for amount boundaries, duplicate, concurrency, chargeback freeze, timeout, failure rollback and ZATCA/credit-note behavior. Run typecheck/test/build and E1 financial tests. Report `docs/reviews/task-reports/R-payment-refund.md`; no PROGRESS.md edits, no real payments, focused commit/no merge/push.
```

## R-BIM-FORMATS — Claude Code: DWG and gbXML parser capability

```text
You are Claude Code evaluating and implementing any remaining DWG and gbXML search/parser requirements for ConstructsHub task R-BIM-FORMATS. First verify the canonical SRS §6.5 specifically requires these formats and inspect existing parser capability. Do not overstate unsupported/proprietary format support.

PROJECT `services/bim/` FastAPI + IfcOpenShell sandbox; web has the existing IFC/document search and HMAC-signed service integration. Read Dockerfile, compose, k8s hardening, file validation, service request auth, licensed dependency list and any existing geometry parsers.

GIT: clean local main; worktree `../Construct-Hub-r-bim-formats`, branch `task-r-bim-formats`. No pull/push/merge/PR, `.env`, unapproved parser dependency/binary, changes to sandbox isolation or PROGRESS.md edits.

TASK: produce a format support audit first. For DWG, distinguish genuine DWG support from DXF support, exported PDF, and filename detection; do not imply true DWG parsing if the only approved library supports a different format or has licensing/ODA requirements. For gbXML, inspect available parser and schemas, implement only supported geometry/space/system/quantity fields required by SRS, preserve units and schema version, and reject invalid/external-entity payloads safely. Add format-specific adapters to the established pipeline without weakening upload validation, HMAC, read-only root, tmpfs cap, `cap_drop ALL`, no outbound network, timeouts or size limits. Any parser must operate on untrusted input under resource limits.

Add small lawful/hand-authored fixtures with expected results, invalid schema, unit handling, oversized input, and sandbox security tests. Run pytest inside the actual BIM container, not only host. If DWG requires a licensed converter or package approval, deliver a clear ADR/report and an explicit unsupported result; do not code a fake parser. Write `docs/reviews/task-reports/R-bim-formats.md` with SRS requirement IDs, genuine support status, licensing/dependency decision and test output. No PROGRESS.md edit; commit only verified scope, report SHA/no merge/push.
```

## R-ANALYTICS — OpenCode: finish admin analytics display and navigation

```text
You are OpenCode implementing the small Admin Analytics presentation gap R-ANALYTICS for ConstructsHub. The handoff reports a working route latency board and product events board but says `events.dau` is fetched and not rendered. Verify this in the current code first; do not invent a DAU definition.

PROJECT `waquor/` Next.js 15, `components/dashboard/AnalyticsBoard.tsx`, `/dashboard/admin/analytics`, route/events API endpoints, `lib/analytics.ts`, SRS §15.6/ANL and NFR-CMP retention behavior. Read current API response schema and `waquor/prisma/schema.prisma`. Use `user.role` authorization and safe event outputs; route metrics must use `templateRoute()` IDs removed.

GIT: clean local main; worktree `../Construct-Hub-r-admin-analytics`, branch `task-r-admin-analytics`. No pull/push/merge/PR, `.env`, dependencies, schema/migrations or PROGRESS.md edits.

IMPLEMENT only the confirmed missing display: render DAU or active-user metric with the exact server definition/window, timezone, anonymization and retention limits. If the API's `dau` is a placeholder, absent, stale or not truly daily unique active users under the SRS definition, fix the API contract only with Claude approval; do not relabel an arbitrary event count as DAU. Use loading/empty/error/unavailable states and explain sample window. Add nav links only if P01 did not already. No raw user/session IDs or PII in UI or logs. Add component/API contract tests and Arabic RTL. Run web typecheck/test/build, capture screenshots and write `docs/reviews/task-reports/R-admin-analytics.md`. No PROGRESS.md edit. Commit/report SHA/no merge/push.
```

## R-ZATCA — Claude Code: sandbox preflight and owner-run evidence package

```text
You are Claude Code preparing the owner-run ZATCA sandbox verification for ConstructsHub task R-ZATCA. Do not call a live Fatoora endpoint by default, do not touch `.env`, and do not ask the user to paste secrets into chat or a Git issue.

PROJECT `waquor/` current ZATCA implementation, dry-run script `waquor/scripts/zatca-dryrun.ts` (verify actual path), `CONFIGURATION.md`, SRS §8.6, existing c14n/xAdES/CSID logic, status persistence and cron routes. The handoff says mock-mode dry run is already code-closed; production CSID/OTP and a real sandbox smoke are owner-side tasks. Verify actual branch before duplicating work.

GIT: clean local main; worktree `../Construct-Hub-r-zatca-preflight`, branch `task-r-zatca-preflight`. No pull/push/merge/PR, `.env` edit, dependency or schema/migration change, PROGRESS.md edit, or outbound real provider calls without explicit owner approval.

TASK: inspect the current test harness, then prepare an operator-safe preflight command/runbook in `docs/runbooks/zatca-sandbox-smoke.md`. Show exactly which environment *variable names* are required (not their values), how to obtain credentials through Fatoora's official portal, how to select sandbox mode, how to run one standard invoice and one simplified invoice, expected redacted outputs, and how to record the result. Ensure log redaction cannot print certificate/private key/CSID, authorization header, OTP, invoice PII or full signed XML. Avoid retaining raw provider response containing customer data. Never invent a successful sandbox output.

Before making any outbound call, require explicit owner confirmation that the sandbox credentials are configured, endpoint and environment are sandbox, and the owner authorizes the call. If not confirmed, leave a documented BLOCKED checklist and only run the existing mock-mode test. Verify mock dry-run tests and current typecheck/test/build. Document that same-day versus staged production cutover is a product/operations decision requiring owner sign-off. Write a review evidence report under `docs/reviews/task-reports/R-zatca-preflight.md`; no PROGRESS.md edit. Commit runbook/tests only, report SHA/no merge/push.
```


# 15. Final integration and release gates

## I1 — Claude Code: complete SRS traceability and integration release candidate

```text
You are Claude Code serving as final integration engineer for ConstructsHub task I1. This is an evidence audit and targeted integration repair, not permission to rewrite the product. The owner has merged selected feature branches into local main; you must not merge anything.

PROJECT: `Construct-Hub_Project`; canonical SRS Master v2.0 under `ConstructsHub-Requirements/`; web `waquor/`, mobile `mobile/`, BIM `services/bim/`. Read current `PROGRESS.md`, `CONFIGURATION.md`, `NoteToDeveloper.md`, all task review reports and the actual code/CI. Read `waquor/prisma/schema.prisma` before model/field claims. Honor all existing conventions: `user.role` versus DB `userType`, `Profile`/`prisma.profile`, `ownerId`, `ProjectAssignment.userId`, TimeLog `checkIn`/`checkOut`, fire-and-forget analytics/notifications, NotificationPref, PII-safe telemetry, templateRoute ID scrubbing, CSP/HSTS and server auth gates.

GIT: inspect `git status --short --branch`; must be clean on local `main`. Do not create a feature branch, pull, push, merge, rebase, PR, edit `.env`, install packages, or use live credentials. If local main isn't clean, stop. Do not use a live database or run load tests on production.

AUDIT:
1. Build a traceability table for every in-scope SRS FR/NFR: requirement ID/title, affected surface/API, code path, test path, evidence report/screenshot/benchmark, acceptance result PASS/FAIL/BLOCKED/NOT IN RELEASE. Do not include requirements/files marked “not to use.” Verify SRS text in repo.
2. Reconcile all counts in `PROGRESS.md` against current code/test commands: Prisma model count, Next routes/API routes, mobile screens, BIM pytest count, test totals and CI jobs. Explain whether counts differ because of scope/measurement method; do not “fix” counts by editing files. Keep implementation complete vs acceptance verified as separate statuses.
3. Execute clean checks: web `npm run typecheck`, `npm test`, `npx next build`; mobile actual `package.json` typecheck/tests; BIM pytest and built-container test if Docker works; AI evaluation CI smoke; Playwright E2E; i18n literal audit; axe suite if approved/available; performance smoke/load benchmark only in local/staging. Record exact command and exit code. If tests unavailable due to environment/provider/credentials, say BLOCKED.
4. Review high-risk invariants: payment amount/idempotency and ledger balance; webhook auth/replay; admin/server permission gates; no `passwordHash` or secrets in payloads; private tender bids; upload size/type/signed URL boundaries; BIM sandbox read-only/no outbound/network/capabilities; AI permission gates/prompt injection; PDPL retention/erasure/legal holds; Arabic RTL/keyboard/screen-reader outcomes.
5. Inspect `PROGRESS.md` for contradictions including old “scheduler none/117 tests/78 models/82 routes” vs actual later sections. Rewrite stale status only with command output or concrete code evidence. Keep external owner prerequisites visibly distinct from code-completed items.
6. Perform only targeted integration fixes that are straightforward and do not cross another migration/feature ownership boundary. For a major bug, money/crypto/auth issue, schema conflict or unresolved product rule, write a focused follow-up task report rather than making a broad unreviewed rewrite.
7. Produce `docs/reviews/task-reports/I1-release-candidate-audit.md` containing traceability matrix, all commands/exits, unresolved P0/P1/P2 defects, verified performance numbers, migration status, dependency lock/CI status, privacy/security evidence, external blockers and recommended go/no-go. Update `PROGRESS.md` only after evidence and record verified/implemented distinction. Do not certify launch while an unresolved P0, payment/ledger safety defect, unauthorized data exposure, unsafe migration, or required compliance gate remains.

Run no live charges, production migrations, ZATCA production submission, provider publishing, or 50k load test in this prompt. Commit only truthful report/status adjustments if the user expressly permits a docs-only integration commit in this run; otherwise leave the source tree unchanged and provide the exact diffs/recommendations. No merge/push/PR.
```

## I2 — Antigravity: independent final cross-surface acceptance review

```text
You are Antigravity performing the independent final acceptance review for ConstructsHub task I2. Do not code, change thresholds or resolve failures by editing tests. Review only after I1 identifies a candidate revision and all required branches are merged by the owner.

PROJECT: `Construct-Hub_Project`; canonical SRS Master v2.0, current `PROGRESS.md`, task reports, web app `waquor/`, mobile `mobile/`, BIM `services/bim/`, and supplied 17-page `BanahBuild ConstructsHub screens.pdf`. The PDF represents target workflows and visual intent, not proof that a code path works.

GIT/ISOLATION: create a dedicated review worktree `../Construct-Hub-i2-final-review` on branch `review-i2-final-review` from the owner's current local `main`, only if main exists and is clean. Do not modify application source, schema, migrations, `.env` or package manifests. You may create/commit only the review report/screenshots. Never pull, push, merge or open a PR. If worktree creation cannot be done safely, run read-only and return findings without altering the shared working directory.

REVIEW the real paths using role-appropriate test accounts:
- Buyer: browse/search product, cart, checkout with test-only gateway, order status, delivery receipt/invoice/dispute.
- Owner: dashboard, project/milestones, evidence review, approve/fund escrow in test DB, tender creation/award.
- Supplier: catalogue/variants/certifications, quote comparison/response, order queue and moderation feedback.
- Contractor/consultant/worker/driver: tender/bid/inspection, workforce job/attendance/e-sign, trip/vehicle/ping and completion.
- Admin/support/finance: verification, fee config/two-person approval, payouts (no secrets), audit trail, dispute evidence/ruling, content moderation, consent/config views, analytics and reconciliation.
- Search/AI only if included in the release decision: image/voice/document/IFC, AI evals, assistant permission/injection tests; use only test/public datasets.
- Mobile: role gating, outbox pending-vs-synced state, push deep links only on supported device builds, attachment signed URLs, Arabic RTL.

Check against SRS and task evidence, not screenshots alone. Test direct URL/API access with wrong roles, empty/error/offline states, refresh/persistence, numeric/financial totals, date/currency/RTL behavior, keyboard-only focus, 200% zoom/contrast, and console/network errors. No real payment, production write, real notification blast or live publishing.

Create `docs/reviews/task-reports/I2-antigravity-final-review.md` with release commit SHA, per-SRS group PASS/FAIL/BLOCKED, critical path evidence and screenshot links, tests independently rerun, discrepancies from `PROGRESS.md`, severity-ranked defects, and what could not be verified. Decision must be one of: GO for staging / NO-GO / BLOCKED ON OWNER. A GO means only the evidence-backed staging candidate passes—not that external legal/provider launch prerequisites have occurred. Do not merge/push.
```

# 16. Execution order, merge protocol, and who runs what

## Recommended exact order

1. **P00-A (Claude)** baseline/repository truth → **P00-B (Antigravity)** screen-to-SRS audit. The review may start after a snapshot is agreed, but reports should name the audited commit.
2. **P01-A (Claude)** admin P0 bugs → **P01-B (Antigravity)** browser acceptance. **P02-A (Claude)** migration history in a separate, sequential migration branch → **P02-B (Antigravity)** migration-safety review. Do not run P01 and P02 concurrently if either discovers a need to modify migrations/shared backend contracts.
3. **C10-A (OpenCode)** mobile closeout; **C10-B (Antigravity)** mobile parity/RTL review. Close server-route dependencies through Claude tasks before calling the mobile experience complete.
4. **D1-A (Claude)** harness and real baseline → **D1-B (Antigravity)** independent methodology review. Do not accept D2 or D4 accuracy claims until this gate passes.
5. Run **D2-A detector backend → D2-B image-search UX → D2-D per-frame video overlay → D2-C acceptance review**. If model/dependency approval is missing, only close the architecture/report portion and keep real-detector claims BLOCKED.
6. Run **D3-GATE** and record the explicit AI assistant release decision. Only after approved GO run **D3-A backend → D3-B UI → D3-C red-team**; otherwise leave it deferred and do not block other features.
7. Run **D4-A OCR backend → D4-B document review UI → D4-C accuracy/UX review** using the same D1 held-out set.
8. Complete D5 slices in dependency groups: `D5-A` bSDD; `D5-B` mobile recorder + `D5-C` Arabic dialect/contract tests; `D5-D` server resumable protocol → `D5-E` client UI; `D5-F` LibreOffice only after tool/dependency approval; `D5-G` XLSX classification; `D5-H` container-level IFC integration; `D5-I` million-row search load test. Do not merge a second schema/migration branch until the first migration is accepted and integrated.
9. **E1-A** OpenAPI/mobile drift gate; **E1-B** money-path integration tests (Claude); **E1-C** six Playwright journeys (OpenCode); **E1-D** independent browser run-through. E1 money tests should run early enough to gate any billing/refund/chargeback feature before user-facing rollout.
10. **R-BILLING-A** before enabling paid announcements in **E5-A/B**; **R-CATALOGUE-A** before the final catalogue UI if APIs/sync need changes; **R-WORKFORCE-A** before **R-WORKFORCE-B**; **R-LOGISTICS-A** before **R-LOGISTICS-B**; **R-PAYMENT-CLIENT-A** before **R-PAYMENT-CLIENT-B**. Schema/migration work remains sequential.
11. Complete the other SRS modules in §14 after checking current main for already-closed gaps. Do not reimplement work already merged.
12. Run **E2-BASE**, then E2-A through E2-L sequentially, then E2-M strict audit and E2-N Antigravity review. Don't run E2 branches in parallel because message dictionaries and locale helpers are shared.
13. Run **E3-A/B/C** accessibility fixes and **E3-D** independent review; follow with **E4-A/B/C/E** performance, metrics and BIM manifest checks; then **E4-D** independent performance review. Performance benchmarks run only on explicitly approved isolated local/staging resources.
14. **E6-A** admin API inventory/gaps → **E6-B** remaining admin UI → **E6-C** admin review. E5 moderation UI must be reused rather than duplicated.
15. **I1 (Claude)** final SRS/test/status reconciliation → **I2 (Antigravity)** independent cross-surface audit. User makes staging/production launch decision after external gates have been completed.

## Correct merge loop

Use one active feature branch per agent terminal. For any approved code task:

1. The agent starts from clean local `main`, creates its own task worktree, and creates a local commit after its assigned checks pass.
2. The agent stops and reports its branch name, commit SHA, touched files, test commands/output, evidence report, known gaps and whether the feature truly meets acceptance.
3. The user reviews the diff and task report. No agent merges the branch or pushes to a remote.
4. From the canonical main worktree, after confirming clean status:
   ```bash
   git switch main
   git status --short --branch
   git log -1 --oneline
   # Review the agent's diff and evidence before running the merge:
   git diff --stat main...task-<task-id>-<slug>
   git diff --check main...task-<task-id>-<slug>
   git merge --no-ff task-<task-id>-<slug>
   ```
5. Run `P03-A` integration checks/status update after each merge (or after a small, logically complete non-schema group). If merge conflicts appear, stop and resolve deliberately in the canonical integration context; never ask a second agent to edit the same conflicted files blindly.
6. Before starting the next dependent task, update its separate worktree to the new `main` only after the owner has merged and verified all prerequisites: `git -C ../Construct-Hub-<task-slug> rebase main`. If the rebase conflicts, stop and resolve or recreate that unmodified worktree safely; do not silently overwrite changes. For the progress keeper, review/merge its separate `task-p03-integration-progress` docs-only branch in the same owner-controlled manner.
7. Avoid leaving many dependent branches open. For shared schema, package lock, root CI, locale dictionaries, and `PROGRESS.md`, prefer **sequential** tasks. Antigravity works in its own review worktree and writes review artifacts only; it never repairs application code.

**Important correction to the casual “one branch per task” approach:** Git branches by themselves do not isolate working files if several terminals share the same directory. Worktrees provide physical isolation; they do not make shared API/schema changes conflict-free. The owner remains the merge/traffic controller.

## Safe parallelism matrix

| Workstream | Parallel with | Do not run in parallel with |
|---|---|---|
| Antigravity read-only audit in dedicated worktree | Most code work on a different worktree | Another reviewer editing the same review files; do not share a working directory |
| D1 evaluation runner | P01 admin fixes, C10 UI verification if working in isolated worktrees and no shared file overlap | D2/D4 acceptance against an unreviewed dataset; any simultaneous root CI/dependency change |
| D2 detector core | Independent catalog admin UI only if no shared search/index files | D2 image API/client contract edits by two coding agents; D5 search ontology/shared API changes |
| D4 OCR backend | Independent bSDD import if no common schema/worker/route files | Another Prisma migration, document upload protocol changes without API coordination |
| D5-D upload backend | Independent isolated UI work only after API contract freeze | Another storage API, shared signed-url/multipart change or schema migration |
| E1 integration tests | Independent presentation tasks in separate worktrees | Schema migration runs against same DB; live external provider calls |
| E2 localization | Only read-only Antigravity review | Other E2 branch edits; shared message files/locale helpers |
| E3 accessibility | Independent backend-only core work | Shared component/theme/locale edits at same time |
| E4 load and performance | Read-only audits | Any concurrent stress test on same service/DB; changes to measured branch during run |
| Money/ledger/billing/refund/chargeback | Read-only QA/independent written review | Any other schema/ledger/financial state-machine change or live payment test |


# 17. Owner-only decisions, credentials, and operational gates

Agents must keep these visible in reports and must never fabricate them. They cannot be completed by changing application code alone.

| Owner action / decision | Why it blocks or limits acceptance | How to record it safely |
|---|---|---|
| **AI assistant scope: v1 or v2** | D3 backend/UI work must not ship without an explicit scope authorization. Recommendation: defer public enablement until D1 evaluations, permission/red-team tests, and human handoff are green. | Approve/update `docs/decisions/ai-assistant-release-scope.md`; no credentials needed. |
| **Saudi payment merchant account / provider selection** | Determines Moyasar production merchant configuration; HyperPay/PayTabs or BNPL (Tabby/Tamara) should only be built if the approved provider/SRS demands it. | Keep secrets in the user's secret manager/deployment environment; do not paste them into prompts, source, screenshots or reports. |
| **Moyasar sandbox credentials and smoke test** | Adapter tests with fakes do not prove connection to the real sandbox. Client SDK/tokenization may need approval and merchant config. | Owner runs documented sandbox steps with test credentials; report only provider outcome, request/correlation ID after redaction. |
| **Fatoora developer portal OTP and sandbox/production CSID** | Current ZATCA code path needs real sandbox credential smoke; OTP/CSID issuance is an owner/portal task. | Set the expected environment variables locally or in the secret manager. Never commit or disclose values. |
| **Fatoora production cutover: same-day or staged** | Operational release decision affects invoice routing, rollback and compliance exposure. | Record signed owner decision/runbook and explicit rollback criteria. Agents must not select this policy. |
| **buildingSMART bSDD access/Client ID/token and permitted usage** | Full import depends on approved API scope/access and source API rules; official docs distinguish official vs test environments. | Use the buildingSMART official documentation and approved credentials; no token in Git or report. |
| **Twilio A2P onboarding / SMS sender approval** | SMS delivery may be skipped or limited until sender registration is approved. | Record status only; keep Twilio keys in secret manager. Test with approved destinations. |
| **SendGrid domain authentication** | Email delivery is not proven by unit tests or a silent provider skip. | Complete DNS/domain auth and send a safe test email from sandbox; do not include recipient addresses in screenshots/logs. |
| **FCM service account and production APNs `.p8`/key details** | Provider implementation can exist without device delivery acceptance. | Store credentials in secret manager; use development build/device test. Reports should state token/device outcome, never key contents. |
| **EAS code-signing / update certificates and bare-device build** | Signed OTA and native FCM/APNs paths require the actual Apple/Google/EAS settings. | Owner performs official credentials setup and records build IDs only; never commit certificates/private keys. |
| **Sentry DSN / project setup** | Sentry integration may be env-gated yet have no destination; native symbol/source-map upload needs release configuration. | Configure DSN outside source; verify redaction with a test exception; don't publish the DSN in reports. |
| **Maps tile/route provider licence** | Fleet route/cost and map UX cannot claim real map/route functionality without an approved licensed provider and configured credentials. | Select provider/tile licence and document terms, rate limits and data residency. No scraping of unlicensed tiles. |
| **PDPL controller registration, counsel sign-off, breach playbook** | A code implementation cannot complete organizational/legal obligations. | Owner/legal counsel record evidence; agents must not certify legal compliance from code alone. |
| **Riyadh-region (or otherwise approved in-region) hosting** | Data residency is an operational/deployment constraint. | Owner selects/creates the target region; verify backups, object storage, DB, logs, AI providers and monitoring all follow the policy. |
| **Independent penetration-test vendor** | NFR-SEC-14 requires independent testing; internal test suites are not equivalent. | Book vendor scope, resolve report findings and record retest evidence. Keep sensitive reports access-controlled. |
| **Merchant bank account for seller/driver/worker payouts** | Settlement cannot be production verified without appropriate account and compliance onboarding. | Perform owner-approved sandbox or bank reconciliation; never enter account identifiers in prompts or public artifacts. |
| **Model/package approvals** | YOLO/transformers.js, model weights, Google Vision, tus/resumable upload server, LibreOffice, axe-core/Playwright (if not installed), PDF library, Sentry/Expo packages or any other new dependency may change licence, security, bundle size, deployment and data-residency posture. | Agent submits a one-page decision note (package/version/licence/size/platform/security/deployment alternatives). Owner explicitly approves before manifest/lockfile changes. |

## 18. Engineering references to use as implementation checks

Use these as technical references alongside the source-of-truth SRS. They are not substitutes for checking the versions/dependencies in this repository.

- **Next.js 15 Route Handlers:** https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware — current App Router handler conventions for HTTP methods and middleware.
- **Prisma ORM v6 migration workflows:** https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production — distinguishes development and production migration commands and cautions against running `migrate dev` in production. In this project, the additional owner rule is never use `migrate reset` or production `db push` to hide a history problem.
- **OpenAPI Specification:** https://spec.openapis.org/oas/ — latest listed specification at the time of preparation is 3.2.1 (10 September 2026), but select the version supported by the repository's installed client/tooling, not merely the newest spec.
- **Playwright Test:** https://playwright.dev/docs/intro and https://playwright.dev/docs/running-tests — test-runner patterns, browser contexts and CI/E2E practices.
- **buildingSMART bSDD API:** https://technical.buildingsmart.org/services/bsdd/using-the-bsdd-api/ — official API methods, contract versions, authorization and usage notes. Use API endpoints intended for system-to-system access; do not rely on deprecated identifier URI JSON for integration.
- **Grafana k6 thresholds:** https://grafana.com/docs/k6/latest/using-k6/thresholds/ — define numerical pass/fail thresholds for latency/error SLOs instead of publishing unqualified averages.
- **W3C WCAG overview:** https://www.w3.org/WAI/standards-guidelines/wcag/ — use the specific WCAG 2.1 AA success criteria required by the SRS and report criterion-level evidence.
- **Docker Engine security:** https://docs.docker.com/engine/security/ — apply least privilege and remove capabilities not required by the service; inspect the effective container configuration.
- **OWASP GenAI Prompt Injection:** https://genai.owasp.org/llmrisk/llm01-prompt-injection/ and the LLM prompt-injection prevention cheat sheet at https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html — treat user/retrieved content as untrusted and enforce tool authorization outside the model.
- **Expo push setup:** https://docs.expo.dev/push-notifications/push-notifications-setup/ — device/build credential requirements mean unit tests alone do not verify native push delivery.
- **Expo Sentry guidance:** https://docs.expo.dev/guides/using-sentry/ — environment/production release/source-map setup is part of operational verification, not just importing the package.

## 19. Model and agent routing

| Responsibility | Agent/model | Rationale / guardrail |
|---|---|---|
| Schema/migrations, payments, wallet/ledger, escrow, refunds, crypto, auth/RBAC, webhook signatures, AI backend/tools, upload security, data retention | **Claude Code** | Risk-sensitive core logic; perform the actual tests and preserve invariants. |
| Isolated UI, CRUD wiring to verified API contracts, i18n slices, dashboard screens, component tests, OpenAPI/type client wiring | **OpenCode + Nemotron Ultra 3**; use **DeepSeek** as the alternative if configured | Bulk implementation only. Do not allow model choice to bypass dependency, permission, test, or branch requirements. |
| Independent browser/screen review, evaluation-methodology review, security red-team, RTL and accessibility audit | **Antigravity** | Review-only: separate worktree; report/screenshots only; never modify the product code to clear its own findings. |
| Merge approval, credentials and business/legal decisions | **You (owner / traffic controller)** | Only owner reviews diffs, merges one branch, approves dependencies and credentials, and decides release. |

## 20. Minimum merge checklist (copy into each PR-free local review)

Although no remote PR is to be opened without your go-ahead, use this checklist before merging any local task branch:

- [ ] Correct task branch/worktree and actual SRS ID; no unrelated edits.
- [ ] Readable diff and `git diff --check`; no secrets, `.env` changes, generated cache, unlicensed model/fixture, accidental DB dump, or customer data.
- [ ] Schema read first; migrations ordered, tested from complete history in a disposable DB; no reset/db-push workaround.
- [ ] Authorization server-side, DTO allowlist, input validation, idempotence, safe failure path and audit behavior verified where relevant.
- [ ] Correct commands actually run; logs/output and exit status recorded. Failure or absent environment is marked blocked, not green.
- [ ] Tests prove visible/persisted outcomes. Mocked providers/models are explicitly test-only; they do not stand in for live provider/model validation.
- [ ] Required evidence report is present; screenshots and test artifacts are free of PII/secret tokens.
- [ ] `PROGRESS.md` is not modified by the feature branch; integration keeper updates it after merge from verified evidence.
- [ ] Local commit is focused; agent did not merge, push or open PR.
- [ ] After merge, run P03-A checks and resolve any cross-branch regression before starting dependent work.

## 21. Prompt inventory

This playbook contains **standalone prompts** for the following task/agent combinations (task IDs also appear in headings and evidence paths):

- **Baseline/release blockers:** P00-A Claude baseline; P00-B Antigravity SRS/screen audit; P01-A Claude admin blockers; P01-B Antigravity browser review; P02-A Claude migration safety; P02-B Antigravity migration audit; P03-A Claude integration/progress keeper; C10-A OpenCode mobile closeout; C10-B Antigravity mobile parity.
- **AI/search:** D1-A Claude evaluation harness; D1-B Antigravity eval audit; D2-A Claude detector; D2-B OpenCode image UX; D2-C Antigravity detector acceptance; D2-D OpenCode per-frame mobile video overlay; D3-GATE Claude scope decision; D3-A Claude assistant backend; D3-B OpenCode assistant UI; D3-C Antigravity red-team; D4-A Claude OCR backend; D4-B OpenCode document-review UI; D4-C Antigravity OCR audit; D5-A bSDD import; D5-B mobile voice UX; D5-C Arabic dialect corpus; D5-D resumable upload backend; D5-E upload UI; D5-F safe LibreOffice conversion; D5-G XLSX LLM classification; D5-H IFC container integration; D5-I search load test.
- **Quality/compliance/ops:** E1-A OpenAPI/mobile drift; E1-B financial integrations; E1-C six Playwright flows; E1-D Antigravity browser review; E2-BASE and E2-A–E2-L feature-localized slices; E2-M hardcoded-string gate; E2-N Antigravity RTL review; E3-A keyboard flows; E3-B screen-reader/contrast; E3-C axe CI; E3-D Antigravity access audit; E4-A load/performance; E4-B OpenMetrics; E4-C route/retention metrics; E4-D Antigravity perf review; E4-E BIM deployment hardening; E5-A content lifecycle backend; E5-B content ops UI; E6-A admin API readiness; E6-B admin UI; E6-C Antigravity admin audit.
- **Additional SRS gaps:** R-CATALOGUE-A/B; R-BILLING-A/B; R-TENDER; R-DISPUTES-A/B; R-WORKFORCE-A/B; R-LOGISTICS-A/B; R-SOCIAL; R-MESSAGING; R-SEARCH-CLARIFY; R-PAYMENT-CLIENT-A/B; R-PAYMENT-REFUND; R-BIM-FORMATS; R-ANALYTICS; R-ZATCA.
- **Final release:** I1 Claude traceability/integration audit; I2 Antigravity final acceptance review.

---

# 22. Final operating principle

A branch is ready to merge only when the owner can answer **what changed, why it matches the SRS, what exact test or live observation proves it, what remains blocked, and how it can be safely reverted**. The objective is not a large quantity of generated code or a high percentage printed in a status table. It is a buildable, secure, measurable product with reproducible evidence and no hidden launch blockers.

# Next-Time Prompt — How to resume Construct-Hub work

This file is the entry point for the next session, with me or any other AI
agent. The full project state lives in `PROGRESS.md` (and its PDF twin
`progress report.pdf`). This file only tells you how to re-enter.

Last updated: 2026-10-12

---

## 1. Open the next session in the project root

```bash
cd /home/meqdad/My-Projects/Construct-Hub_Project
claude     # or whichever AI CLI you use
```

## 2. Paste this opening prompt verbatim

```
Read ./PROGRESS.md end-to-end before doing anything else. It is the
self-contained handoff from the previous session.

Then:
1. Run the verify commands in §4 and confirm the state matches
   (web tsc clean, 100/100 tests pass, next build 115 pages).
2. Pick up at §5.2 Task #1: build POST /api/trips/[tripId]/ping.
3. Work through §5.2 tasks in the P0 → P1 → P2 order shown.
4. After each task, update PROGRESS.md (status table + task graph)
   and regenerate progress report.pdf with:
   pandoc PROGRESS.md -o "progress report.pdf" --pdf-engine=xelatex \
     -V geometry:margin=1in -V monofont="DejaVu Sans Mono" --toc

Do not change my .env, do not install new deps without asking,
do not push to remote without asking.
```

Any agent that reads `PROGRESS.md` first has the whole picture: SRS status,
10-task priority graph, Prisma schema traps (role vs userType, Tender.ownerId,
TimeLog manual minutes, Product.supplierId, no prisma.userProfile, etc.), run
and verify commands, and which gaps are agent-doable vs user-only.

## 3. First concrete work item to pick up

**P0 Task #1** — `POST /api/trips/[tripId]/ping` (file does not exist; the
mobile driver 60-s GPS loop is silently 404-ing today). Spec is in
`PROGRESS.md §5.2` with exact fields and the 1-req/s rate-limit requirement.

Then the rest of §5.2 in order:
- #2 `PATCH /api/trips/[tripId]` (accept / start / complete)
- #3 Instrument top-N production routes with `withMetrics`
- #4 Wire `orderStatusChanged` into the order status update route
- #5 Wire `milestoneApproved` into the milestone approve route
- #6 Wire `disputeOpened` into the dispute create route
- #7 Haversine geo helper for `WorkerLocationPing` → ETA
- #8 Scheduled-post cron substrate decision + dispatcher
- #9 Real Instagram Graph + TikTok Content-Posting adapters
- #10 Finance console UI (invoices / payouts list)

## 4. If you want to resume with me specifically

Open a new session in this folder and say:

> "Continue from PROGRESS.md §5.2 — next task is the trip ping endpoint."

I'll pick up without needing anything else.

## 5. Keeping the handoff fresh (do this after every session)

After every work session, ask the agent to:

1. Update the status table (§2) and task graph (§7) in `PROGRESS.md`.
2. Regenerate `progress report.pdf` with:

   ```bash
   cd /home/meqdad/My-Projects/Construct-Hub_Project && \
   pandoc PROGRESS.md -o "progress report.pdf" --pdf-engine=xelatex \
     -V geometry:margin=1in -V colorlinks=true -V linkcolor=blue \
     -V urlcolor=blue -V mainfont="DejaVu Sans" \
     -V monofont="DejaVu Sans Mono" -V monofontoptions="Scale=0.85" \
     --highlight-style=tango --toc \
     -V title="Construct-Hub — Progress Report" \
     -V author="meqdad-ROS" -V date="$(date +%Y-%m-%d)"
   ```

That way the handoff file is always current — whoever resumes next (me or
another agent) only has to read one file.

## 6. Guardrails for the next agent

- Project root: `/home/meqdad/My-Projects/Construct-Hub_Project`
- Web app lives in `waquor/` (Next.js 15, Prisma 6, TypeScript strict)
- Mobile app lives in `mobile/` (Expo SDK 52, Expo Router 4, RN 0.76)
- BIM sandbox lives in `services/bim-sandbox/` (FastAPI + IfcOpenShell)
- Prisma schema is authoritative — never guess field names, read
  `waquor/prisma/schema.prisma` first (see §6 Conventions in PROGRESS.md)
- `getSessionUser()` returns `user.role` (SRS code like `USR_WORKER`); the
  DB column is `userType` — Prisma `where` clauses must use `userType`
- Analytics writes are fire-and-forget: `void trackEvent(...)` — never await
- Keep the user's `.env` untouched; keep secrets out of commits
- Do not push to remote or open a PR without the user's explicit go-ahead

## 7. Files to point an agent at (in order of importance)

1. `PROGRESS.md` — the handoff (read first, always)
2. `progress report.pdf` — same content, for humans
3. `waquor/prisma/schema.prisma` — the source of truth for every DB field
4. `waquor/lib/analytics.ts` — the event + metric helpers to reuse
5. `waquor/lib/notify-events.ts` — the domain-event dispatcher to extend
6. `waquor/src/app/api/trips/[tripId]/route.ts` *(does not exist yet — the
   first task is to create it)*

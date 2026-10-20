# Cron substrate: k8s CronJob over BullMQ

**Date:** 2026-10-21
**Decision:** Use Kubernetes `batch/v1.CronJob` resources pointing at
authenticated Next.js API routes under `waquor/src/app/api/cron/*`. Guard every
route with a timing-safe `x-cron-secret` header comparison against
`CRON_DISPATCH_SECRET`. **Reject BullMQ** for the launch slice.

**Why not BullMQ.** BullMQ's repeatable-jobs feature is a good fit on paper —
built-in retries, exponential backoff, and visibility into the queue — but its
hard runtime requirement is a Redis cluster (BullMQ v5 requires Redis 6.2+ with
`maxmemory-policy noeviction`). The staging manifests committed under
`deploy/k8s/staging/` run Postgres, the waquor Next.js Deployment, the sandboxed
BIM parser, and its nginx proxy — **no Redis**. Standing up Redis (StatefulSet
plus a PVC plus a backup story) crosses the "no new infra beyond what the k8s
staging manifests already run" constraint from §5.1-6 and would need to be
approved before I touch it. Platform cron, in contrast, is a native Kubernetes
primitive that reuses the same control plane the manifests already stand on,
schedules the jobs declaratively alongside the Deployment, and keeps idempotency
where it belongs — in the business tables (`EscrowHold.status`,
`LedgerEntry.idemKey`, `FatooraInvoice.stage`, `SocialPost.status`) — not in a
separate queue whose state we would then have to reconcile.

**What the CronJob does.** Each CronJob is a one-shot pod that runs `curl -fsS
-H x-cron-secret:$SECRET https://waquor/api/cron/<job>`. The waquor route is the
single source of business logic: it claims rows atomically, posts the ledger
entries inside a single `prisma.$transaction`, and relies on the Prisma unique
index on `LedgerEntry.idemKey` to make the whole operation exactly-once even
across a mid-transaction crash and a retry.

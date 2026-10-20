# ConstructsHub Operations Runbook

**Audience:** on-call engineers, platform team, release managers  
**Last updated:** 2026-10-20  
**Scope:** web app (`waquor/`), mobile (`mobile/`), BIM service (`services/bim/`)

---

## 1. Architecture Overview

Three independently deployable surfaces:

| Service | Runtime | Port | Health Endpoint | Deploy Unit |
|---------|---------|------|-----------------|-------------|
| **waquor** (Next.js 15) | Node 20 (standalone) | 3000 | `GET /api/health` | Docker image `constructhub/waquor:<tag>` |
| **mobile** (Expo 52) | EAS Update (OTA) | n/a | n/a | EAS channel `preview` / `production` |
| **bim** (FastAPI + IfcOpenShell) | Python 3.12-slim | 8081 (via nginx proxy) | `GET /health` | Docker image `constructhub/bim:<tag>` |

All services share a **PostgreSQL** database (Prisma 6) and **Redis** (for future BullMQ cron, session cache).

---

## 2. CI/CD Pipeline (GitHub Actions)

The pipeline lives in `.github/workflows/ci.yml` and runs on every push to `main` and PR to `main`.

### 2.1 Pipeline Stages

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Web        │   │  Mobile     │   │  BIM        │   │  Docker     │
│  (lint,     │   │  (typecheck,│   │  (build    │   │  (build    │
│  typecheck, │   │   test)     │   │   image +   │   │   waquor   │
│  test,      │   │             │   │   pytest)   │   │   image)   │
│  build)     │   │             │   │             │   │             │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Deploy to      │
                         │  Staging        │
                         │  (manual step)  │
                         └─────────────────┘
```

| Job | Duration | Key Steps |
|-----|----------|-----------|
| **web** | ~5 min | `npm ci` → `prisma generate` → `typecheck` → `test:unit` → `next build` (standalone) |
| **mobile** | ~3 min | `npm ci` → `typecheck` → `test` |
| **bim** | ~3 min | `docker build` → `pytest` inside sandboxed image |
| **docker** | ~3 min | `docker build waquor` → smoke test `GET /api/health` |

### 2.2 Caching Strategy

- **Node modules**: Cached per `package-lock.json` + `prisma/schema.prisma` hash (waquor) or `package-lock.json` hash (mobile)
- **Docker layers**: GitHub Actions cache backend (`type=gha`) per service scope (`waquor`, `bim`)
- **Prisma engine**: Included in `node_modules` cache (`.prisma` + `@prisma` folders)

### 2.3 Build-Time Environment (CI)

The `web` job uses placeholder env vars for `next build`:
```yaml
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres?schema=public
NEXTAUTH_SECRET: ci-nextauth-secret-placeholder
NEXTAUTH_URL: http://localhost:3000
```
Real secrets are injected at deploy time via Kubernetes Secrets (see §3).

---

## 3. Deploy to Staging

### 3.1 Prerequisites

- `kubectl` context → `staging` cluster (Riyadh region)
- Container registry access (`ghcr.io` or `docker.io` for `constructhub/*`)
- Two Kubernetes Secrets in namespace `constructhub-staging` (template: `deploy/k8s/staging/10-secrets.example.yaml`):

| Secret | Keys |
|--------|------|
| `waquor-secrets` | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`, plus optional provider keys (`SENDGRID_API_KEY`, `TWILIO_AUTH_TOKEN`, `STRIPE_SECRET_KEY`, etc.) |
| `bim-secrets` | `BIM_SERVICE_TOKEN` (shared HMAC secret) |

### 3.2 Deploy Flow (CI/CD or Manual)

**Automated (when CD workflow is added):**
```bash
# CI pushes images tagged with git SHA
# CD workflow applies k8s manifests with IMAGE_TAG=${GITHUB_SHA}
```

**Manual (current):**
```bash
# 1. Build & push images
cd waquor
docker build -t constructhub/waquor:staging-$(git rev-parse --short HEAD) .
docker push constructhub/waquor:staging-$(git rev-parse --short HEAD)

cd ../services/bim
docker build -t constructhub/bim:staging-$(git rev-parse --short HEAD) .
docker push constructhub/bim:staging-$(git rev-parse --short HEAD)

# 2. Apply namespace + secrets (first time only)
kubectl apply -f deploy/k8s/staging/00-namespace.yaml
# Create secrets from template (replace REPLACE placeholders)
kubectl apply -f deploy/k8s/staging/10-secrets.example.yaml  # after editing

# 3. Run migration Job (wait for completion)
# Update image tag in the Job manifest, then:
kubectl apply -f deploy/k8s/staging/20-migration-job.yaml
kubectl wait --for=condition=complete job/waquor-migrate -n constructhub-staging --timeout=10m

# 4. Deploy waquor + bim (image tags updated by CI/CD or manually)
kubectl apply -f deploy/k8s/staging/30-waquor-deployment.yaml
kubectl apply -f deploy/k8s/staging/40-waquor-service.yaml
kubectl apply -f deploy/k8s/staging/50-waquor-hpa.yaml
kubectl apply -f deploy/k8s/staging/60-bim-deployment.yaml

# 5. Verify rollout
kubectl rollout status deploy/waquor -n constructhub-staging --timeout=120s
kubectl rollout status deploy/bim-parser -n constructhub-staging --timeout=120s
```

### 3.3 Run Database Migrations

**Always run migrations before switching traffic.**

```bash
# Via the pre-rollout Job (recommended — matches production pattern)
kubectl apply -f deploy/k8s/staging/20-migration-job.yaml
kubectl wait --for=condition=complete job/waquor-migrate -n constructhub-staging --timeout=10m
kubectl logs job/waquor-migrate -n constructhub-staging
# Should show: "All migrations have been successfully applied."
```

**Manual one-off:**
```bash
kubectl run prisma-migrate-$(date +%s) \
  --image=constructhub/waquor:staging-<short-sha> \
  --restart=Never \
  --overrides='{"spec":{"template":{"spec":{"containers":[{"name":"migrate","image":"constructhub/waquor:staging-<short-sha>","command":["npx","--yes","prisma","migrate","deploy","--schema=./prisma/schema.prisma"],"envFrom":[{"secretRef":{"name":"waquor-secrets"}}],"securityContext":{"runAsNonRoot":true,"runAsUser":1001,"runAsGroup":1001,"fsGroup":1001,"capabilities":{"drop":["ALL"]},"allowPrivilegeEscalation":false,"readOnlyRootFilesystem":true},"volumeMounts":[{"name":"tmp","mountPath":"/tmp"}],"volumes":[{"name":"tmp","emptyDir":{"medium":"Memory","sizeLimit":"64Mi"}}]}}]}}'
```

### 3.4 Verify Deployment

```bash
# Pod readiness
kubectl get pods -l app=waquor -n constructhub-staging
kubectl get pods -l app=bim-parser -n constructhub-staging

# Health endpoints
curl -sf https://staging.constructhub.sa/api/health
curl -sf http://bim-proxy.constructhub-staging.svc.cluster.local:8081/health  # from within cluster

# Smoke test key routes
curl -sf https://staging.constructhub.sa/api/analytics/me?days=1
curl -sf https://staging.constructhub.sa/api/trips/health
```

### 3.5 Mobile OTA (Expo)

```bash
cd mobile
eas update --branch staging --message "staging deploy $(git rev-parse --short HEAD)"
# Publishes to EAS channel "staging"; installed TestFlight / internal builds pick it up on next launch
```

### 3.6 Local Full-Stack Test (docker-compose.production.yml)

Reproduces staging topology on one host:

```bash
export POSTGRES_PASSWORD=... NEXTAUTH_SECRET=... BIM_SERVICE_TOKEN=...
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml ps        # all healthy
curl -fsS http://127.0.0.1:3000/api/health                # {"status":"ok",...}
```

Services: `waquor-db`, `waquor-migrate` (one-shot), `waquor`, `bim-parser`, `bim-proxy`.

---

## 4. Read the Pipeline

### 4.1 GitHub Actions Workflow (`.github/workflows/ci.yml`)

Key properties:
- **Concurrency**: `ci-${{ github.ref }}` with `cancel-in-progress: true` — new push cancels previous run
- **Triggers**: push to `main`, PR to `main`, `workflow_dispatch`
- **Node**: 20.18.1, Python: 3.12
- **Artifacts**: `waquor-next-build` (standalone output + static) retained 3 days

### 4.2 Kubernetes Manifests (`deploy/k8s/staging/`)

| File | Purpose |
|------|---------|
| `00-namespace.yaml` | `constructhub-staging` namespace |
| `10-secrets.example.yaml` | Template for `waquor-secrets` + `bim-secrets` |
| `20-migration-job.yaml` | One-shot `prisma migrate deploy` Job (runs before Deployment rollout) |
| `30-waquor-deployment.yaml` | 2-replica Deployment, non-root, read-only rootfs, HPA-ready |
| `40-waquor-service.yaml` | ClusterIP Service on port 80 |
| `50-waquor-hpa.yaml` | HPA: 2–8 replicas, CPU 70% / Memory 80% |
| `60-bim-deployment.yaml` | BIM parser (1 replica, hardened) + `bim-proxy` Service |

### 4.3 Image Tagging Convention

- **CI**: `constructhub/waquor:ci`, `constructhub/bim:ci` (ephemeral, per-run)
- **Staging**: `constructhub/waquor:staging-<short-sha>`, `constructhub/bim:staging-<short-sha>`
- **Production**: `constructhub/waquor:v<semver>`, `constructhub/bim:v<semver>`

---

## 5. Roll Back

### 5.1 Web App (waquor)

```bash
# 1. Check rollout history
kubectl rollout history deploy/waquor -n constructhub-staging

# 2. Roll back to previous revision
kubectl rollout undo deploy/waquor -n constructhub-staging

# 3. Verify
kubectl rollout status deploy/waquor -n constructhub-staging --timeout=120s
curl -sf https://staging.constructhub.sa/api/health
```

**If migration was already applied:** migrations are forward-only. Roll back the *code* only; if the new code is incompatible with the migrated schema:
1. Revert migration locally: `npx prisma migrate resolve --rolled-back <migration_name>`
2. Commit & push
3. Re-deploy old code (the previous migration Job will be a no-op)

### 5.2 BIM Service

```bash
kubectl rollout undo deploy/bim-parser -n constructhub-staging
kubectl rollout status deploy/bim-parser -n constructhub-staging --timeout=120s
curl -sf http://bim-proxy.constructhub-staging.svc.cluster.local:8081/health
```

### 5.3 Mobile OTA

```bash
cd mobile
eas update --branch staging --message "ROLLBACK: revert to previous build"
# Or republish the previous EAS update ID:
eas update:republish --branch staging --update-id <previous-update-id>
```

---

## 6. Run Migrations Manually

### 6.1 Web App Migrations (Prisma)

```bash
# Create a new migration locally
cd waquor
# Edit prisma/schema.prisma
npx prisma migrate dev --name <descriptive_name>
# Commits migration file to git; CI will apply on next deploy

# Apply to staging manually (if needed outside Job)
kubectl run prisma-migrate-manual-$(date +%s) \
  --image=constructhub/waquor:staging-<short-sha> \
  --restart=Never \
  --overrides='{"spec":{"template":{"spec":{"containers":[{"name":"migrate","image":"constructhub/waquor:staging-<short-sha>","command":["npx","--yes","prisma","migrate","deploy","--schema=./prisma/schema.prisma"],"envFrom":[{"secretRef":{"name":"waquor-secrets"}}],"securityContext":{"runAsNonRoot":true,"runAsUser":1001,"runAsGroup":1001,"fsGroup":1001,"capabilities":{"drop":["ALL"]},"allowPrivilegeEscalation":false,"readOnlyRootFilesystem":true}}]}}}'
```

### 6.2 BIM Service Migrations

BIM service uses raw SQL (no ORM). Run via `psql`:

```bash
# From local with tunnel
kubectl port-forward svc/postgres 5432:5432 -n constructhub-staging &
psql "postgresql://postgres:password@localhost:5432/constructhub" -f migration.sql
```

---

## 7. Where Logs Live

| Service | Log Source | Access |
|---------|------------|--------|
| **waquor** | stdout/stderr (JSON) | `kubectl logs -l app=waquor -n constructhub-staging --tail=100 -f` |
| **waquor** | Next.js build logs | GitHub Actions `web` job logs |
| **waquor** | Prisma query log | Set `DATABASE_LOGGING=query` in Secret → stdout |
| **bim** | stdout/stderr (uvicorn) | `kubectl logs -l app=bim-parser -n constructhub-staging --tail=100 -f` |
| **bim** | nginx proxy | `kubectl logs -l app=bim-parser -n constructhub-staging -c bim-proxy --tail=100 -f` |
| **mobile** | EAS build logs | `eas build:list --platform=all` → click build |
| **mobile** | Runtime (device) | Sentry / Bugsnag (when configured) |
| **db** | PostgreSQL | `kubectl logs -l app=postgres -n constructhub-staging` (if managed) |
| **redis** | Redis | `kubectl logs -l app=redis -n constructhub-staging` (if managed) |

### 7.1 Structured Log Format (waquor)

All `console.log` / `console.error` in API routes emit JSON:

```json
{
  "level": "info",
  "time": "2026-10-20T12:34:56.789Z",
  "msg": "order placed",
  "route": "/api/orders",
  "userId": "usr_abc123",
  "sessionId": "a1b2c3d4...",  // SHA-256 truncated 32 chars
  "requestId": "req-xyz789"
}
```

**Search in Loki/Grafana:** `{app="waquor"} |= "error" | json | level="error"`

### 7.2 Key Log Patterns to Watch

| Pattern | Meaning | Action |
|---------|---------|--------|
| `[notify.*:skip]` | Notification provider unconfigured | Expected if keys missing; configure to enable |
| `[social.publish:*]` | Instagram/TikTok publish attempt | Check `errorCode` and `requestId` for retry |
| `trackEvent` / `recordRouteMetric` | Analytics fire-and-forget | Silent failures OK; check `/api/admin/analytics/routes` for gaps |
| `prisma migrate deploy` | Migration running | Must complete before traffic switch |
| `cap_drop ALL` / `read_only` | BIM sandbox hardening | Expected in k8s/compose; do not remove |

---

## 8. Common Operational Tasks

### 8.1 Clear Redis Cache

```bash
kubectl exec -it deploy/redis -n constructhub-staging -- redis-cli FLUSHDB
```

### 8.2 Inspect Database

```bash
kubectl port-forward svc/postgres 5432:5432 -n constructhub-staging &
psql "postgresql://postgres:password@localhost:5432/constructhub"

# Useful queries
SELECT * FROM "AnalyticsEvent" ORDER BY "createdAt" DESC LIMIT 20;
SELECT "template", percentile_cont(0.95) WITHIN GROUP (ORDER BY "durationMs") AS p95
FROM "RouteMetric" WHERE "createdAt" > now() - interval '1 hour' GROUP BY "template";
SELECT * FROM "NotificationPref" WHERE "userId" = 'usr_abc123';
```

### 8.3 Restart a Stuck Deployment

```bash
kubectl rollout restart deploy/waquor -n constructhub-staging
kubectl rollout restart deploy/bim-parser -n constructhub-staging
```

### 8.4 Scale Replicas

```bash
kubectl scale deploy/waquor --replicas=5 -n constructhub-staging
kubectl scale deploy/bim-parser --replicas=3 -n constructhub-staging
```

### 8.5 Check Resource Usage

```bash
kubectl top pods -n constructhub-staging
kubectl describe pod <pod-name> -n constructhub-staging  # for OOMKilled, CrashLoopBackOff
```

---

## 9. Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Platform Lead | `#platform-oncall` Slack | PagerDuty |
| Database Admin | `#dba-oncall` Slack | PagerDuty |
| Security | `#security-incidents` Slack | Immediate |

---

## 10. Related Documentation

- `CONFIGURATION.md` — environment variables, feature flags, provider onboarding
- `PROGRESS.md` — project status, gaps, conventions
- `waquor/middleware.ts` — CSP, HSTS, auth gates
- `services/bim/docker-compose.yml` — local sandbox reference
- SRS Master v2.0: `ConstructsHub-Requirements/To-keep/ConstructsHub_SRS_v1.0.*`

---

## 11. Quick Reference Commands

```bash
# Trigger CI manually
gh workflow run ci -R <owner>/<repo>

# Watch CI run
gh run watch -R <owner>/<repo>

# Full staging deploy (manual)
./scripts/deploy-staging.sh  # (to be created)

# View live logs
kubectl logs -l app=waquor -n constructhub-staging -f --tail=50

# Run migration Job
kubectl apply -f deploy/k8s/staging/20-migration-job.yaml
kubectl wait --for=condition=complete job/waquor-migrate -n constructhub-staging --timeout=10m

# Rollback waquor
kubectl rollout undo deploy/waquor -n constructhub-staging

# Local full stack
docker compose -f docker-compose.production.yml up -d --build
```

---

*End of runbook. Keep this file updated as CI/CD, k8s manifests, and monitoring evolve.*
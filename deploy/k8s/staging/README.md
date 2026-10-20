# ConstructsHub — staging k8s manifests

Launch-blocker §5.1-5. Apply order:

```sh
kubectl apply -f 00-namespace.yaml
# Create the Secrets ONCE from a secure source (vault / sops / External Secrets).
# The committed 10-secrets.example.yaml is a template, not a usable secret.
kubectl apply -f ./my-secrets.yaml     # provided out-of-band

# Each release — CI builds two tags:
#   constructhub/waquor:${IMAGE_TAG}         (serving image, standalone bundle)
#   constructhub/waquor-migrate:${IMAGE_TAG} (migrate image, full node_modules)
export IMAGE_TAG=<git-sha-or-semver>
sed "s|constructhub/waquor-migrate:staging|constructhub/waquor-migrate:${IMAGE_TAG}|g" 20-migration-job.yaml \
  | kubectl apply -f -
kubectl -n constructhub-staging wait --for=condition=complete job/waquor-migrate --timeout=10m

# Only roll the Deployment once the migration Job succeeded.
sed "s|constructhub/waquor:staging|constructhub/waquor:${IMAGE_TAG}|g" 30-waquor-deployment.yaml \
  | kubectl apply -f -
kubectl -n constructhub-staging rollout status deploy/waquor --timeout=5m

kubectl apply -f 40-waquor-service.yaml
kubectl apply -f 50-waquor-hpa.yaml

sed "s|constructhub/bim:staging|constructhub/bim:${IMAGE_TAG}|g" 60-bim-deployment.yaml \
  | kubectl apply -f -
```

## Rollback

Because the migration Job runs **before** the Deployment is rolled, a bad
release aborts in one of two places:

1. **Migration fails.** The Deployment is still on the previous image.
   Previous pods keep serving traffic. Fix the migration, rebuild, resubmit:
   ```sh
   kubectl -n constructhub-staging delete job waquor-migrate   # or let TTL clean up
   # apply the new 20-migration-job.yaml with the fixed tag, wait for success,
   # then apply the new 30-waquor-deployment.yaml.
   ```

2. **Image rolls but is bad.** Previous ReplicaSet is still around:
   ```sh
   kubectl -n constructhub-staging rollout undo deploy/waquor
   ```
   This leaves the (successful) new DB migration in place, which is fine as
   long as every migration is **backwards-compatible** with the previous
   container image — the pattern we hold to: expand migration first, roll
   code, then contract in a later release. If a migration must be reverted,
   write a **new** forward-migration that undoes it; never `prisma migrate
   reset` in production.

## Known issue — repo migration trail (independent of this stack)

The repo's `waquor/prisma/migrations/20260401000000_search_indexes` references
`SearchDocument`, a table the preceding `20250706154843_init` migration does
not create — the schema trail is out of sync with the current
`schema.prisma`. `prisma migrate deploy` therefore errors with
`P3018 … relation "SearchDocument" does not exist` on a fresh database.

Fix path (**separate task**, not CI/CD scope): regenerate the init migration
from the current schema via
`prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
and squash the search-indexes migration behind it, or add `SearchDocument` /
every missing model to a new preceding migration.

Local sanity-check for THIS stack (bootstrap a fresh db directly from the
schema with `prisma db push` so the serving container can boot):

```sh
docker run --rm --network constructhub_waquor-net \
  -e DATABASE_URL='postgresql://constructhub:$PG@waquor-db:5432/constructhub?schema=public' \
  constructhub/waquor-migrate:latest \
  prisma db push --accept-data-loss --skip-generate
```

## Secrets management

All env comes in via `envFrom.secretRef` → `waquor-secrets` and `bim-secrets`.
The committed `10-secrets.example.yaml` is a template. In real deployment,
secrets are managed out-of-band (External Secrets Operator → AWS Secrets
Manager / HashiCorp Vault / sops-encrypted git). The Deployment never
references plaintext values; rotating a secret and `kubectl rollout restart
deploy/waquor` is enough to propagate.

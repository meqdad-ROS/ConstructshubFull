# ConstructsHub — staging k8s manifests

Launch-blocker §5.1-5. Apply order:

```sh
kubectl apply -f 00-namespace.yaml
# Create the Secrets ONCE from a secure source (vault / sops / External Secrets).
# The committed 10-secrets.example.yaml is a template, not a usable secret.
kubectl apply -f ./my-secrets.yaml     # provided out-of-band

# Each release:
export IMAGE_TAG=<git-sha-or-semver>
sed "s|constructhub/waquor:staging|constructhub/waquor:${IMAGE_TAG}|g" 20-migration-job.yaml \
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

## Secrets management

All env comes in via `envFrom.secretRef` → `waquor-secrets` and `bim-secrets`.
The committed `10-secrets.example.yaml` is a template. In real deployment,
secrets are managed out-of-band (External Secrets Operator → AWS Secrets
Manager / HashiCorp Vault / sops-encrypted git). The Deployment never
references plaintext values; rotating a secret and `kubectl rollout restart
deploy/waquor` is enough to propagate.

# Dependency Scan Baseline

**Owner:** platform-security
**Scan source:** `npm audit --omit=dev` + `pip-audit` + Trivy fs
**CI job:** [`.github/workflows/ci.yml#security`](../../.github/workflows/ci.yml)
**Last reviewed:** 2026-10-21

This file is the single source of truth for which dependency CVEs the CI
pipeline currently tolerates and why. The CI job fails on CRITICAL findings
unless they appear here with a dated rationale.

Any new CRITICAL finding that is NOT on this list fails the pipeline. Fix the
underlying package, then remove the entry here.

## Why not just `npm audit fix`

`npm audit fix` with `--omit=dev` would uninstall every dev-only package it
cannot audit under that filter — a destructive side effect. Fixes land as
targeted `npm install <pkg>@<fix-version>` PRs instead, each reviewed against
the Prisma + Next.js + Expo matrix.

## Current CRITICAL baseline (as of 2026-10-21)

| Package | Installed | Vector | Why tolerated | Owner | Resolve by |
|---|---|---|---|---|---|
| `next` | 15.5.9 | Cumulative Next.js advisories (DoS via Image Optimizer, SSRF via rewrites, cache poisoning, …) | 15.5.9 is already the latest 15.x minor; the advisory list is the full cumulative Next.js advisory corpus and most do not apply to our deployment (no Edge SSR, no custom server, Image Optimizer behind a WAF). A targeted upgrade to the next 15.5 patch is scheduled with the launch-blocker §5.1-4 pen-test remediation PR. | web | before pen test |
| `next-auth` | 4.24.13 | Email homoglyph normalisation, Bearer header crash, OAuth state cookie not provider-bound | Our auth flow is credentials-only on web + JWT Bearer on mobile; the OAuth state issue does not apply because we have no OAuth providers wired. The homoglyph normaliser is a user-registration surface — mitigated at the Zod `emailSchema` layer in `waquor/lib/security.ts`. Scheduled for the same upgrade PR. | web | before pen test |
| `protobufjs` (via `@xenova/transformers → onnxruntime-web → onnx-proto`) | 6.11.5 | Protoype-pollution + code injection in generated `toObject` + bytes-field defaults | Transitive through the embeddings pipeline (`lib/embeddings.ts`). We only deserialise our own ONNX model files that we bundle at build time — never user-controlled protobuf bytes — so the attack vector does not reach us. A pin to the newest 7.x via `overrides` in `package.json` is scheduled; blocked on confirming the ONNX wheel still loads. | search | before pen test |

## HIGH-severity items (non-blocking, surfaced as `::warning::`)

The CI job annotates HIGH findings but does not fail the pipeline on them. The
most consequential HIGH items today:

- `xlsx` — Prototype pollution + ReDoS. **No upstream fix available.** We only
  parse `xlsx` files inside `lib/search/documents.ts` which runs under
  `withMetrics` + size cap and never trusts the output beyond keyword
  extraction. Replace with `exceljs` + a signed-URL staging bucket during
  pen-test remediation.
- `uuid` old transitive — several `uuid` versions appear in the tree via
  Prisma / Next; the HIGH-severity advisory applies to `v3.x` which we never
  call directly. Resolve by `overrides` once Prisma's own transitive bump
  lands.

The complete HIGH list for any given commit is available as the
`sbom-and-audit-<sha>` artefact on every CI run.

## How to add an entry here

1. Confirm the CVE does not apply to our deployment (write out the reasoning,
   not just a dismissal).
2. Open a tracking ticket (owner + resolve-by date).
3. Add a row to the "Current CRITICAL baseline" table with the ticket link.
4. Reference `.github/workflows/ci.yml#security` from the ticket so the
   closing commit tightens the gate.

## How to tighten the gate

When the baseline table is empty:

1. Flip the `audit-level` from `critical` to `high` in the three audit steps.
2. Flip the Trivy `severity` from `CRITICAL` to `CRITICAL,HIGH`.
3. Delete this file's baseline table (leave the methodology notes).

The expected end state after pen-test remediation is a HIGH-level gate with
no baseline exceptions. Current state is CRITICAL with the three entries
above tolerated and tracked.

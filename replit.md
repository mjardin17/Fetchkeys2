# BossKey Private

A private local control center for BossLister that maps provider access, protects credential metadata, validates authorized connections, and coordinates inventory and resumable workflows.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bosskey-private` — BossKey Private web app, local crypto helper, provider manifest, Docker packaging, and PowerShell operations scripts.
- `artifacts/api-server/src/routes/bosskey.ts` — local API surface for readiness, provider records, validation, vault posture, workflows, and inventory.
- `lib/api-spec/openapi.yaml` — source of truth for the BossKey API contract.
- `artifacts/bosskey-private/provider-manifest.json` — secret-free discovery manifest and honest provider capability registry.

## Architecture decisions

- BossKey keeps provider capability states explicit (`OAUTH_AVAILABLE`, `PARTNER_ACCESS_REQUIRED`, `ACCESS_GATED`, `MANUAL_GUIDED`, and `IMPLEMENTED_AUTOMATIC`) instead of implying automation from a login.
- The browser vault uses libsodium Argon2id key derivation and XChaCha20-Poly1305 envelopes; only the encrypted verifier is persisted and the derived key is cleared on lock.
- The Docker package runs the static UI and local API together, publishes only through `127.0.0.1:4789`, drops Linux capabilities, and stores local data on a named volume.
- API contracts are generated from OpenAPI so UI actions and server validation share the same shapes.

## Product

BossKey Private gives BossLister one local command room for readiness, provider documentation and access state, an encrypted vault boundary, separate Books/Cards/Merchandise inventory, social channel constraints, and resumable authorization workflows. It never exposes raw credential values in dashboard payloads.

## User preferences

- Keep provider claims honest: guided, partner-restricted, access-gated, and unavailable operations must be labeled as such.
- Never scrape accounts, extract cookies or passwords, bypass provider authorization, or log secret values.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- The generated client uses the shared `/api` path; do not hardcode localhost URLs in the browser.
- Docker is intended to be launched from `artifacts/bosskey-private` with `.\start.ps1`; the host port is bound to loopback only.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

# START HERE — REPLIT CONTINUATION PROMPT

Use this entire file as the first instruction to the new Replit Agent.

## Mission

Take ownership of the imported workspace and finish the complete, working BossKey Private application for BossLister.

This is a continuation of an existing unfinished build. Do not restart it, replace it with a mockup, generate a new landing page, or discard the current code. Inspect what is already present, preserve all useful work, correct the incomplete architecture, implement every missing requirement, run the application, test it, and keep working until the completion gates in this file and the original product prompt pass.

The full original product prompt is already included at:

attached_assets/Pasted-Build-BossKey-Private-for-BossLister-Build-a-complete-w_1786771029097.txt

Read that file completely before editing code. It is the full product specification. This continuation prompt adds the verified checkpoint and execution rules a new agent needs.

## Non-negotiable operating rules

1. Continue from the imported checkpoint. Do not rebuild from scratch.
2. Do not run git reset, git checkout on working files, git clean, or any command that could discard the uncommitted build.
3. Before changing anything, create a timestamped local backup and record:
   - git status --short
   - git diff --stat
   - git diff
   - current commit
4. Preserve the current mobile-first dark BossKey interface and improve it in place.
5. Do not stop after producing a plan, audit, mockup, architecture, or partial phase. Implement the application.
6. Do not ask broad planning questions. Make sound engineering decisions from the original prompt and current code.
7. Ask Joshua only when a real provider authorization, account choice, legal approval, or secret destination is unavoidable. Ask one narrow question at a time, persist the checkpoint, and automatically resume afterward.
8. Never expose, print, log, commit, return, screenshot, or send plaintext credentials to Replit AI or any third party.
9. Never scrape credentials, cookies, sessions, passwords, MFA codes, CAPTCHA answers, private marketplace data, or unsupported services.
10. Use only official provider APIs and authorized account access. Keep partner-restricted, access-gated, upload-only, and manual workflows honestly labeled.
11. Do not claim a provider is implemented merely because a provider record or button exists. An automatic status requires functioning code plus tests.
12. Do not claim the build is complete until every applicable completion gate below has passed with evidence.

## Verified checkpoint — August 15, 2026

### Repository state

- Imported project root: Boss-Lister
- Git history currently contains one visible baseline commit:
  - 9ef0b8f — Initial commit — July 28, 2026
- The important BossKey work is currently uncommitted. Treat the entire imported working tree as valuable checkpoint data.
- The current working tree includes modified generated API files, OpenAPI changes, Replit configuration changes, a new BossKey API route, a complete BossKey UI directory, provider records, Docker files, PowerShell scripts, and the original product prompt.
- Do not discard or overwrite this dirty state.

### What is already implemented

- pnpm workspace using Node.js 24 and TypeScript.
- Replit configuration and workspace scripts.
- React/Vite mobile-first dark interface for:
  - command room
  - providers
  - private vault screen
  - books
  - cards
  - general merchandise
  - social channels
  - resumable workflows
- Express API scaffolding with OpenAPI, generated React Query client, generated Zod schemas, and health route.
- BossKey API route with dashboard, provider, vault-status, workflow, and inventory endpoints.
- A provider manifest with 20 initial provider records and honest-looking capability labels.
- Browser-side libsodium helper using Argon2id and XChaCha20-Poly1305 for a local vault verifier.
- Dockerfile, docker-compose.yml, non-root runtime user, loopback host-port mapping, health check, named data volume, memory/CPU limits, and dropped Linux capabilities.
- PowerShell start, stop, diagnose, backup, and restore scripts.
- Basic response security headers in the local static server.
- Basic Pino request logging with some header redaction.

### What is not complete and must not be misrepresented

The current application is a strong UI and API scaffold, not the complete product.

1. Current API behavior is simulated.
   - Provider, workflow, inventory, readiness, discovery, and validation data are hard-coded in memory.
   - A restart loses changes.
   - The fixed checkpoint timestamp and fixed readiness values are not real measurements.
   - Discovery reports a backup and manifest as completed without actually scanning and repairing BossLister.

2. The data layer contradicts the original requirement.
   - lib/db is an empty PostgreSQL/Drizzle placeholder.
   - It throws when DATABASE_URL is absent.
   - The original prompt requires local SQLite in the named Docker volume with no Postgres or Redis dependency.
   - Replace the placeholder with a durable SQLite implementation and real migrations.

3. The vault is incomplete.
   - The browser helper currently protects only a verifier in localStorage.
   - There is no durable encrypted credential store, credential CRUD, environment separation, scoped handles, expiration tracking, authorization grants, rotation, revocation, encrypted export, secure restore, one-time reveal, reauthentication, clipboard clearing, or complete auto-lock behavior.
   - The API always reports the vault as locked with zero credentials.

4. Provider adapters are metadata only.
   - There are no functioning provider-adapter contracts.
   - There are no real OAuth PKCE/device flows, callback handlers, token refresh jobs, webhook handlers, signature verification, API-key validators, listing publishers, inventory updates, order importers, or social publishers.
   - Google Books and Open Library are labeled automatic but no real adapter request code is present.

5. Workflow durability is absent.
   - Workflow state is stored only in an array.
   - There is no persisted checkpoint engine, idempotency store, retry scheduler, exponential backoff, dead-letter queue, permission-rule engine, duplicate protection, or restart recovery.

6. BossLister discovery and environment repair are absent.
   - There is no real safe scan of the requested BossLister repository/path.
   - There is no secret-safe environment-variable inventory.
   - There is no malformed-variable repair, atomic backup, CRLF preservation, callback/webhook discovery, or evidence-backed provider-manifest generation.

7. The developer-agent interface is incomplete.
   - Most required REST operations are missing.
   - The private local MCP server is missing.
   - Opaque credential handles and scoped agent permissions are missing.

8. Inventory and cross-listing are incomplete.
   - Current records contain only basic shared fields and two optional metadata inputs.
   - Complete Books and Cards schemas from the original prompt are missing.
   - Canonical product mappings, reservations, oversell prevention, order imports, webhooks, reconciliation, fees, shipping, packaging cost, profit, margin, ROI, break-even price, audit history, and idempotent publishing are missing.

9. Security controls are incomplete.
   - Express currently enables broad default CORS.
   - CSRF protection, rate limiting, strict local-origin policy, SSRF defenses, outbound-domain allowlists, authorization middleware, secure session handling, request-size controls, and complete secret redaction tests are missing.

10. Tests are missing.
    - No real unit, integration, provider contract, OAuth, webhook, Playwright, restart/resume, duplicate-prevention, secret-leak, or Docker health tests are present.
    - No test command currently exists at the workspace root.

11. Build status is not yet proven.
    - Dependencies were not installed in the handoff environment.
    - Run a clean install, code generation, typecheck, production build, and tests in Replit before trusting generated files.
    - Fix git diff whitespace errors and regenerate clients from the OpenAPI source rather than hand-editing generated files.

## Required execution order

### Phase 0 — Preserve and baseline

1. Read this file and the complete original prompt.
2. Inspect git status and the entire current codebase.
3. Create a timestamped backup before edits.
4. Save the imported checkpoint in Git without losing its existing history. Use a clearly named checkpoint commit or branch.
5. Enable Corepack and install with pnpm from the existing lockfile.
6. Run the existing code generation, typecheck, and build commands.
7. Start the current UI/API once and document baseline failures before fixing them.
8. Do not spend time redesigning working screens before the core behavior is real.

### Phase 1 — Correct the durable architecture

1. Replace the PostgreSQL placeholder with embedded SQLite stored under DATA_DIR in the named Docker volume.
2. Add versioned migrations and durable tables for:
   - projects
   - provider definitions
   - credential metadata and encrypted credential envelopes
   - authorization grants
   - permission rules
   - workflows and checkpoints
   - retry attempts and dead-letter jobs
   - inventory and category-specific metadata
   - marketplace listings and provider mappings
   - reservations
   - orders
   - webhooks and replay protection
   - sync cursors
   - idempotency keys
   - audit events
3. Keep one lightweight container and no external Postgres or Redis requirement.
4. Seed registry definitions idempotently without overwriting user data.

### Phase 2 — Finish the private vault

1. Use established audited cryptographic libraries exactly as required by the original prompt.
2. Implement master-password initialization, unlock, lock, inactivity auto-lock, and secure in-memory key handling.
3. Encrypt every credential with a unique nonce and authenticated metadata.
4. Store only encrypted envelopes and non-secret metadata at rest.
5. Add development, sandbox, and production separation.
6. Add scoped opaque credential handles for provider operations.
7. Implement credential create, update, validation, expiration warning, rotation, revocation, encrypted backup/export, safe restore, reauthentication before one-time reveal, and clipboard auto-clear.
8. Never return raw secrets in ordinary REST or MCP responses.
9. Add exhaustive redaction and secret-leak tests.

### Phase 3 — Implement real BossLister discovery and repair

1. Build a safe, path-confined scanner for the BossLister repository described in the original prompt.
2. Inspect the requested files and references without displaying secret values.
3. Detect providers from evidence and record why each was detected.
4. Generate provider-manifest.json from real evidence instead of returning fixed counts.
5. Detect malformed environment-variable names and values.
6. Back up and repair environment files atomically while preserving comments, unrelated values, ordering, and Windows CRLF endings.
7. Never send environment contents or secrets to the browser or model.
8. Do not modify BossLister until the timestamped backup exists.

### Phase 4 — Implement workflow, permission, REST, and MCP engines

1. Implement every durable state in the original prompt.
2. Persist checkpoints across restarts and OAuth callbacks.
3. Add idempotency, bounded retries, exponential backoff, dead-letter handling, replay protection, and duplicate-operation prevention.
4. Implement the reusable permission rule:
   - provider
   - project
   - account
   - requested scopes
   - environment
   - allowed operations
   - expiration/revocation
5. Require explicit approval for destructive actions unless an existing valid rule covers the exact action.
6. Implement every REST operation required by the original prompt.
7. Implement the private localhost MCP server with equivalent safe operations and opaque credential handles.
8. Add authorization and audit checks to every write operation.

### Phase 5 — Implement the provider-adapter system

1. Define one tested adapter contract for discovery, authorization, validation, token lifecycle, webhooks, listing, inventory, orders, social publishing, and guided setup.
2. Implement the first production-ready connectors named in the original prompt.
3. Use official current documentation and official endpoints.
4. Use mocked contract tests and official sandboxes when real credentials are unavailable.
5. A provider must remain OAUTH_AVAILABLE, API_KEY_AVAILABLE, PARTNER_ACCESS_REQUIRED, ACCESS_GATED, CSV_UPLOAD, FTP_UPLOAD, MANUAL_GUIDED, NO_PUBLIC_API, or UNVERIFIED until the required code and access are genuinely available.
6. IMPLEMENTED_AUTOMATIC requires working adapter code and passing tests.
7. Never fabricate sold-market data, validation success, pricing, confidence, or live publishing.
8. When sold data is unavailable, show the exact unavailable-data message required by the original prompt.
9. Add all remaining provider records from the original prompt as searchable, filterable, honest registry entries even when their workflow is guided.

### Phase 6 — Complete inventory, publishing, and oversell protection

1. Implement the full Books schema and UI from the original prompt.
2. Implement the full Cards schema and UI from the original prompt.
3. Complete General Merchandise and Social Media models.
4. Add canonical provider field mappings.
5. Add central quantities, reservations, provider SKU mappings, order import, webhook processing, scheduled reconciliation, price updates, listing update/end, fees, shipping, packaging cost, cost paid, profit, margin, ROI, break-even price, and audit history.
6. Make listing, inventory, order, and social operations idempotent.
7. Prove duplicate-listing and oversell protection with tests.

### Phase 7 — Finish the user experience

1. Preserve and improve the current mobile-first dark visual system.
2. Connect every screen to real persistent state.
3. Add complete provider detail, authorization, guided setup, callback, validation, scope approval, error, retry, and checkpoint-resume experiences.
4. Add complete credential metadata, expiration, environment, rotation, revocation, backup, and restore experiences without exposing secrets.
5. Ensure Books, Cards, General Merchandise, and Social Media are separate complete sections.
6. Make all provider records searchable and filterable.
7. Add clear loading, empty, offline, retryable, blocked, gated, and manual-action states.
8. Meet keyboard, screen-reader, contrast, touch-target, responsive, and reduced-motion accessibility requirements.

### Phase 8 — Harden local security and deployment

1. Bind public host access only to 127.0.0.1 through Docker.
2. Restrict CORS to the local application origin.
3. Add CSRF protection, rate limiting, body-size limits, secure cookies/sessions where used, strict CSP, SSRF protection, DNS/IP checks, redirect validation, and per-provider outbound allowlists.
4. Verify TLS certificates and reject unsafe redirect/callback URLs.
5. Keep telemetry and analytics disabled by default.
6. Keep the non-root user, read-only filesystem, dropped capabilities, health check, and 8 GB-computer resource limits.
7. Make all five PowerShell scripts reliable, quoted correctly, and testable on Windows Docker Desktop.
8. Ensure backup and restore operate on encrypted durable data and cannot silently overwrite data.

### Phase 9 — Test and prove completion

Create and run:

- encryption and decryption unit tests
- wrong-password and tamper-detection tests
- complete secret-redaction tests
- environment parser and CRLF-preservation tests
- atomic repair and rollback tests
- permission-rule tests
- provider contract tests
- OAuth PKCE/callback/state tests
- webhook signature and replay tests
- workflow restart/resume tests
- retry/dead-letter tests
- duplicate listing and oversell tests
- inventory reconciliation tests
- API authorization tests
- MCP operation tests
- Playwright end-to-end tests
- production build
- Docker build and health tests

## Completion gates

Do not announce completion until all of the following are true:

1. pnpm install succeeds from the committed lockfile.
2. OpenAPI code generation succeeds and generated files match the spec.
3. pnpm run typecheck passes.
4. pnpm run build passes.
5. The new unit/integration test command passes.
6. Playwright end-to-end tests pass.
7. Docker Compose builds and starts with the PowerShell workflow.
8. http://127.0.0.1:4789 opens the private dashboard.
9. The health endpoint passes from inside and outside the container.
10. Restart/resume and persistence tests pass.
11. Duplicate listing and oversell tests pass.
12. Secret-scanning and log/browser-response leak tests pass.
13. BossLister discovery creates a real evidence-backed provider manifest.
14. Environment repair creates a backup and preserves CRLF/comments/unrelated values.
15. Every automatic provider label is supported by implementation and tests.
16. Every unavailable/gated provider shows an exact honest reason and next action.
17. Books and Cards have their complete dedicated schemas and workflows.
18. Provider search/filter includes the full registry required by the original prompt.
19. git diff --check passes.
20. No secret, environment file, database, backup, token, or credential is committed.

## External authorization boundary

Complete every feature, adapter, test double, sandbox path, guided workflow, and validation path that can be completed without Joshua's private account access.

When a live provider genuinely requires Joshua:

1. Save the workflow checkpoint first.
2. Show the exact provider, project, account type, scopes, environment, callback URL, and intended actions.
3. Ask one unavoidable authorization question.
4. Never ask for a password, cookie, MFA code, CAPTCHA answer, or secret in chat.
5. Store the approved grant encrypted.
6. Resume automatically from the saved checkpoint.
7. Continue unrelated implementation while an external approval is pending.

## Required final handoff from Replit

At the end, provide a factual completion report containing:

- what was implemented
- important architecture decisions
- every command run
- tests and exact pass/fail results
- Docker health result
- remaining provider-authorizations that only Joshua can complete
- honest gated/manual provider list
- exact one-command Windows startup
- local URL
- backup and restore instructions
- current Git commit and branch
- confirmation that no secrets were committed or logged

If any completion gate is not proven, say the build is still incomplete, save BUILD_CHECKPOINT.md with the exact current state and next command, and continue working rather than calling the project finished.

# Harmonia Auth + Billing — Implementation Receipt (MVP)

This repo implements the “Sign‑in + Billing Module” concept as a working monorepo.

## Delivered components
- Core Service API (Fastify) with:
  - Multi-tenant projects
  - Email/password auth (JWT)
  - Billing endpoints (Stripe or MOCK)
  - Webhook receiver (Stripe) + subscription state storage
  - Encrypted secret storage (AES-256-GCM)
- Dashboard (Next.js): create projects, store secrets, flip sandbox→live, copy SDK snippet
- SDKs:
  - sdk-core: framework-agnostic TS client
  - sdk-react: Provider + SignIn/SignUp/Billing components
  - sdk-web: Web Components for non-React stacks
- CLI scaffolder: create-harmonia-auth-billing (Next.js App Router template)
- CI: GitHub Actions workflow with Postgres service + tests

## Sandbox vs Live
- New projects start in sandbox.
- Sandbox uses platform test keys from Core env (or MOCK if missing).
- Live uses per-project encrypted keys stored via Dashboard.

## How to run
See README.md (root).

## Verification log (local)

Commands executed:

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm add -D pg -w
pnpm install
pnpm test
pnpm dev
Invoke-WebRequest -UseBasicParsing http://localhost:4000/health
(Invoke-WebRequest -UseBasicParsing http://localhost:3000).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3001).StatusCode
```

Service checks:

```bash
# Core API
Invoke-WebRequest -UseBasicParsing http://localhost:4000/health

# Dashboard
Invoke-WebRequest -UseBasicParsing http://localhost:3000

# Demo app
Invoke-WebRequest -UseBasicParsing http://localhost:3001
```

Results:

- Migrations: success (DB migrated).
- Tests: `pnpm test` passed (core service 2/2 tests; sdk-core/sdk-react no tests found, passWithNoTests enabled).
- Services up:
  - Core API: http://localhost:4000/health -> {"ok":true}
  - Dashboard: http://localhost:3000 -> 200 OK
  - Demo: http://localhost:3001 -> 200 OK

TODOs:

- None.

Stopped services:

- `pnpm dev` terminated after verification. Re-run `docker compose up -d` and `pnpm dev` to start again.

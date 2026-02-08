# Project Harmonia — Auth + Billing Module (MVP)

This repo implements the **pluggable Sign‑in + Billing Module** described in the provided “Cryptographic Proof Receipt”.  
It’s a multi-tenant **Core Service + SDK + CLI scaffolder** that starts in **sandbox mode** with platform-owned test keys, then lets each tenant **swap in their own keys** and go live.

> What you get
- **Core Service (API)**: multi-tenant auth (email/password) + Stripe billing endpoints + webhooks.
- **SDKs**:
  - `@harmonia/sdk-react` React provider + ready-made pages (`<SignInPage />`, `<SignUpPage />`, `<BillingPortal />`)
  - `@harmonia/sdk-web` Web Components so any stack can drop-in tags
- **CLI**: `create-harmonia-auth-billing` scaffolds routes/pages for **Next.js (App Router)** by default.
- **Dashboard (Next.js)**: create projects, switch sandbox→live, store keys (encrypted).

---

## Quick start (local)

### 0) Requirements
- Node 20+
- pnpm 9+
- Docker (for Postgres)

### 1) Install
```bash
pnpm i
```

### 2) Start Postgres
```bash
docker compose up -d
```

### 3) Configure env
Copy env templates:
```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp services/core/.env.example services/core/.env
cp apps/demo-next/.env.example apps/demo-next/.env.local
```

Set **at minimum**:
- `HARMONIA_MASTER_KEY` (32+ chars)
- `HARMONIA_JWT_SECRET` (32+ chars)
- (optional) Stripe platform test keys: `HARMONIA_PLATFORM_STRIPE_TEST_SECRET`, `HARMONIA_PLATFORM_STRIPE_TEST_PUBLISHABLE`

If you don’t set Stripe keys, the system runs in **MOCK_BILLING** mode for demo.

### 4) Run migrations
```bash
pnpm db:migrate
```

### 5) Run everything
```bash
pnpm dev
```

Open:
- Dashboard: http://localhost:3000
- Demo app: http://localhost:3001
- Core API: http://localhost:4000/health

---

## Deploy (recommended “AI4U stack”)

**System of record**: Supabase Postgres (or any Postgres).  
**Dashboard**: Vercel (Next.js).  
**Core service**: Cloud Run / Render / Fly.io (Docker).  
**Proof/CI**: GitHub Actions (included).

### Push to GitHub (so it never “expires”)
```bash
git init
git add .
git commit -m "harmonia auth+billing mvp"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

---

## Security notes
- Tenant secrets (Stripe live secret, webhook secret) are stored **encrypted at rest** using AES‑256‑GCM with `HARMONIA_MASTER_KEY`.
- Client SDK never receives secrets; it only uses the public config and short-lived session tokens.

---

## Folder layout
- `services/core` — Fastify API (auth + billing + webhooks)
- `apps/dashboard` — Next.js admin UI
- `apps/demo-next` — Example Next.js app using the SDK
- `packages/sdk-core` — framework-agnostic client
- `packages/sdk-react` — React provider + pages
- `packages/sdk-web` — Web Components
- `packages/create-harmonia-auth-billing` — CLI scaffolder

---

## “Sandbox → Live” graduation flow
1) Create project in Dashboard (starts in `sandbox`).
2) Try demo auth + billing in sandbox (Stripe test or mock).
3) Paste your **live Stripe keys** in Dashboard.
4) Flip project to `live` and redeploy your app with `HARMONIA_PROJECT_ID`.

---

## License
© 2026 AI4Utech LLC — All Rights Reserved (default). Update as desired.

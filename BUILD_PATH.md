# Verifi AI – Medium-Step Engineering Path

A pragmatic, non-overcomplicated path to get from demo to a sellable MVP. Each step is sized to 0.5–2 days. Do steps in order unless noted.

---

## 1) Pick and scaffold the backend (Next.js API inside site)
- [ ] Use `verifiai-site/` Next.js App Router `app/api/*` for backend routes (keeps monorepo simple for now).
- [ ] Add a shared `verifiai-site/lib/db/` and `verifiai-site/lib/storage/` folder.
- [ ] Add `.env.local` template (`DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_*`).

## 2) Database and models (Prisma + Postgres)
- [ ] Add Prisma to `verifiai-site/`, configure `schema.prisma` with: `User`, `Org`, `Document`, `Analysis`, `Finding`, `Reminder`, `AuditLog`, `Subscription`.
- [ ] Generate client and run first migration.
- [ ] Add simple seed script for local testing.

## 3) AuthN/AuthZ (NextAuth minimal viable)
- [ ] Create `app/api/auth/[...nextauth]/route.ts` with GitHub + Google + Email.
- [ ] Store sessions in DB (Prisma adapter).
- [ ] Add `Org` membership and role field; default org on first login.
- [ ] Protect API routes with helper `getServerSession()`.

## 4) File upload pipeline (contracts)
- [ ] Create `app/api/documents/route.ts` to accept PDF/DOCX.
- [ ] Validate size/type; store to disk locally (dev) and abstract via `lib/storage/`.
- [ ] Stub virus scan function (sync) with TODO for production.
- [ ] Persist `Document` row with `orgId`, `uploaderId`, `path`, `status`.

## 5) Server-side AI analysis endpoint
- [ ] Create `app/api/analysis/route.ts` POST: takes `documentId`, enqueues synchronous stub worker for now.
- [ ] Add `lib/ai/analyzeContract.ts` that calls provider via server-side SDK using env key.
- [ ] Store `Analysis` and `Finding` records; return job status.

## 6) Frontend app wiring (`verifiai-product/`)
- [ ] Replace direct OpenAI calls with fetches to `/api/analysis`.
- [ ] Implement auth gate (if unauthenticated, redirect to `verifiai-site` sign-in or show modal).
- [ ] Add simple Upload page → call `/api/documents` → poll analysis status → render findings.

## 7) Metrics and audit basics
- [ ] Create `app/api/metrics/route.ts` to return counts for dashboard (docs analyzed, avg risk score, etc.).
- [ ] Write minimal `AuditLog` on document upload and analysis complete.

## 8) Exports (v1)
- [ ] Add `app/api/reports/[id]/route.ts` to stream a basic PDF (server-side generated HTML → PDF) and CSV of findings.

## 9) Billing guard (Stripe minimal)
- [ ] Add simple `POST /api/billing/checkout` to create Checkout Session for Pay‑per‑Contract and Subscription.
- [ ] Webhook handler `app/api/billing/webhook/route.ts` to upsert `Subscription`.
- [ ] Middleware check in `/api/analysis` that enforces entitlement (allow N free for dev).

## 10) Observability
- [ ] Add structured logger (pino or console JSON) with request IDs.
- [ ] Add Sentry for API and frontend apps.

## 11) Security hygiene (MVP)
- [ ] PII scrubbing helper for logs.
- [ ] Signed download URLs for stored files; never expose raw paths.
- [ ] Basic rate limit on uploads/analysis (per user/org).

## 12) Testing happy-paths
- [ ] Unit tests for `analyzeContract()` with mocked provider.
- [ ] API tests for `/api/documents` and `/api/analysis`.
- [ ] One Playwright test: login → upload → see findings → export PDF.

## 13) Ship sequence
- [ ] Dev ready: local DB, file storage, and AI calls work server-side.
- [ ] Staging: Postgres, S3 (EU), real Stripe in test mode, Sentry on.
- [ ] Production: switch storage to S3 EU + enable domain + secrets in env.

---

## Notes
- Keep the marketing site and API together initially to reduce complexity; split later if necessary.
- File storage abstraction allows easy swap from local disk → S3 EU when promoting to staging.
- Entitlement checks can start permissive and harden as billing stabilizes.

# ADR 0001: Backend Choice for MVP

Date: 2025-09-10
Status: Accepted

## Context
We need a backend to support authentication, file uploads, AI analysis (server-side), metrics, and billing. The repo already contains a Next.js App Router project (`verifiai-site/`) with NextAuth configured.

## Decision
Use Next.js App Router API routes as the backend for the MVP.

- Implement REST-ish routes under `app/api/*` for health, metrics, documents, and analysis.
- Keep logic modular to allow extraction into a separate service later if needed.
- Ensure all AI calls and secrets stay server-side. No API keys in the frontend.

## Rationale
- Fastest path: reuses existing Next.js app and deployment tooling.
- Simplifies session handling with NextAuth.
- Reduces infra complexity for MVP (one app for site + API).

## Consequences
- Tight coupling of site and API in MVP; can be split later.
- Concurrency/latency limits depend on the hosting setup; consider queues for heavy analysis.

## Next Steps
- Scaffold endpoints: `/api/health`, `/api/metrics`, `/api/documents` (POST), `/api/analysis` (POST).
- Add storage (S3 EU) and DB (Postgres) in subsequent ADRs.

# Verifi AI – Sales Readiness Plan (Release-to-Revenue Checklist)

This document is a practical, end-to-end plan to take Verifi AI from demo to a sellable, compliant product. It’s structured as a prioritized checklist with owners, target dates, and acceptance criteria. It covers product, engineering, security/privacy, legal, billing, go-to-market, support, and operations.

Use the checkboxes to track progress. Replace placeholders like [Owner] and [Date].

---

## 0) Current State Snapshot

- Demo product UI: `verifiai-product/` (React + Vite + Tailwind). AI via OpenAI client in frontend (`openai` 5.x). Local-only metrics via `src/services/metricsService.ts` (localStorage; no backend).
- Marketing site: `verifiai-site/` (Next.js 15 app router, Tailwind v4). Includes Nav, Hero, Pricing, FAQ. Auth UI hooks exist (`next-auth`) but no configured providers/route handlers in `app/api/auth/[...nextauth]` yet.
- No backend/API service. No database. No auth/session enforcement for the product. No billing. No observability. No formal testing or CI/CD.

---

## 1) Product Scope to MVP-Sellable

- [x] Define MVP surface and “done” criteria
  - Owner: Cascade • Target: 2025-09-09
  - Acceptance: One-pager with feature list, out-of-scope items, SLAs, and guardrails

### MVP One-Pager
- Vision: KMU‑freundliche Vertragsanalyse, die Risiken, Fristen und Verhandlungspunkte automatisch markiert, erklärt und planbar macht – ohne juristisches Vorwissen.
- Target Users: KMUs (10–500 MA), Startups, Bau/Handwerk, E‑Commerce (EU‑fokus)
- Primary Jobs-To-Be-Done:
  1) Vertrag schnell prüfen und Risiken verstehen
  2) Fristen im Blick behalten und rechtzeitig erinnert werden
  3) Ergebnisse mit Team teilen oder als Report exportieren
- Features (MVP scope):
  - Authentifizierung (GitHub/Google/Email) und Organisations‑Onboarding (Owner/Admin/Member)
  - Upload von PDF/DOCX (EU‑Region Storage, Virenscan, Größen/Typ‑Validierung)
  - Serverseitige AI‑Analyse: Risiko‑Score, Erklärungen, Verlinkung zur Textstelle
  - Findings Übersicht: Haftung, Verlängerung, Zahlungsziele, Kündigungsfristen
  - Fristen‑Kalender + E‑Mail‑Reminder
  - History & Audit‑Trail (Such/Filter)
  - Export: PDF (Bericht) und CSV (Metadaten)
  - Abrechnung: Pay‑per‑Contract (€29) + SMB Subscription (€99/Monat, 20 Verträge)
- Out‑of‑Scope (MVP):
  - Mehrsprachigkeit jenseits DE/EN
  - Deep integrations (DocuSign/Drive/Teams), Benchmarking, Verhandlungsvorschläge
  - Mobile Apps (iOS/Android)
- SLAs (MVP):
  - Analyse Enqueue p95 < 5s, Verarbeitungszeit p95 < 60s für typische Verträge (≤10MB)
  - Uptime Ziel: 99.5% (Beta), Support Antwortzeit < 1 Werktag
- Guardrails & Compliance:
  - Klarer Disclaimer: Keine Rechtsberatung
  - EU Data Residency, Verschlüsselung at‑rest/in‑transit, PII‑Scrubbing in Logs
  - RBAC, Audit‑Logs, Datenlöschung auf Anforderung, konfigurierbare Retention

- [ ] Core User Flows (E2E)
  - [ ] Onboarding: signup → verify email → create org → invite team
  - [ ] Upload contract (PDF/DOCX) → AI analysis → risk scoring → explanations → highlights
  - [ ] Calendar/Reminder for deadlines
  - [ ] Export report (PDF / CSV)
  - [ ] History/audit trail with search & filters
  - [ ] Account/Team settings

- [ ] Product UX polish pass for MVP
  - [ ] Empty states, loading, errors
  - [ ] Mobile responsiveness check
  - [ ] Accessibility: keyboard nav, ARIA, color contrast

---

## 2) Engineering: Architecture & Delivery

- Backend/API Service (FastAPI or Node/Next API OK; choose one)
  - [ ] Architecture decision record (ADR) for backend
    - Owner: [Owner] • Target: [Date]
    - Acceptance: ADR committed; folder scaffolding in `/api/` or separate repo/service
  - [ ] AuthN/AuthZ
    - [x] Implement NextAuth in `verifiai-site/` with configured providers (GitHub/Google + Email)
    - [ ] JWT/session storage, CSRF, secure cookies
    - [ ] Role-based access (owner, admin, member)
  - [ ] Contracts ingestion & storage
    - [ ] Object storage (S3/GCS) in EU region with KMS encryption
    - [ ] File virus scanning (e.g., ClamAV/Lambda or third-party)
    - [ ] PDF/DOCX parsing pipeline
  - [ ] AI analysis pipeline
    - [ ] Server-side calls to LLMs; no API key in frontend
    - [ ] Prompt templates & safety filters
    - [ ] Retry, timeout, circuit breaker; full request/response logging with PII scrubbing
  - [ ] Data model & DB
    - [ ] Postgres (EU region) with Prisma/SQLAlchemy
    - [ ] Tables: users, orgs, documents, analyses, findings, reminders, audit_log, subscriptions
  - [ ] Audit logging
    - [ ] Write immutable audit events (who, what, when, where)
  - [ ] Reporting/exports
    - [ ] PDF report generation service

- Frontend (`verifiai-product/`)
  - [ ] Remove direct `openai` usage from client. Route via backend.
  - [ ] Replace localStorage metrics with backend metrics endpoints (see `src/services/metricsService.ts`).
  - [ ] Add authenticated routes + org context + feature flags

- Observability & Ops
  - [ ] Logging (structured JSON, correlation IDs)
  - [ ] Metrics (requests, latency, errors, queue depth)
  - [ ] Tracing (OpenTelemetry)
  - [ ] Error reporting (Sentry)

- Testing
  - [ ] Unit tests (frontend + backend)
  - [ ] Integration tests for pipelines
  - [ ] E2E tests (Playwright/Cypress) covering top 5 user flows
  - [ ] Performance tests (document size, concurrency)
  - [ ] Security tests (OWASP Top 10 baseline)

- CI/CD
  - [ ] Pipelines for site, app, and backend
  - [ ] Preview environments per PR
  - [ ] Staging + Production with approvals
  - [ ] Blue/green or canary deployment strategy

---

## 3) Security, Privacy, Compliance (EU-first)

- [ ] Threat model & data classification
  - Acceptance: diagram of data flows (upload → storage → LLM → results)
- [ ] Data residency: EU-only services and storage buckets
- [ ] Encryption
  - [ ] In transit (TLS 1.2+)
  - [ ] At rest (KMS/CMK)
  - [ ] Key rotation policy
- [ ] Access control
  - [ ] RBAC, least privilege, break-glass procedure
  - [ ] Admin panel with audit
- [ ] Logging policy
  - [ ] PII scrubbing for logs/traces
  - [ ] Log retention & access controls
- [ ] Data retention & deletion
  - [ ] Customer-configurable retention window
  - [ ] Right-to-be-forgotten workflow
- [ ] DPA & Subprocessors
  - [ ] DPA template ready for customers
  - [ ] Subprocessor list (OpenAI/Anthropic, cloud, email)
- [ ] Security docs
  - [x] Security overview page on marketing site
  - [ ] Pen-test plan or vendor

---

## 4) Legal & Policy

- [x] Website legal pages in `verifiai-site/`
  - [x] Terms of Service
  - [x] Privacy Policy (GDPR compliant)
  - [x] Imprint/Impressum (if applicable)
  - [x] Cookie Policy & Consent banner
  - [ ] Data Processing Addendum (DPA)
  - [x] Disclaimer: “Kein Ersatz für Rechtsberatung”
- [ ] Product legal
  - [ ] In-app consent and disclaimers
  - [ ] Licensing & OSS notices

---

## 5) Billing & Pricing

- [ ] Stripe setup
  - [ ] Products/plans: Pay‑per‑Contract (€29) and SMB Subscription (€99/mo)
  - [ ] Metering: count per contract analysis
  - [ ] Trials & coupons
  - [ ] Customer portal (update payment method, invoices)
- [ ] Entitlements enforcement
  - [ ] Backend checks subscription status before analysis
  - [ ] Hard/soft limits, quota UI
- [ ] Invoicing & tax
  - [ ] VAT handling (EU), legal invoice details

---

## 6) Marketing Site & GTM Assets (`verifiai-site/`)

- [ ] Pages
  - [ ] Produkt, Preise, Sicherheit, FAQ (existing) – finalize copy
  - [ ] Blog (content marketing), Case Studies, Contact
  - [ ] Legal pages (see Section 4)
- [ ] Conversion
  - [ ] CTA forms: email capture → CRM (HubSpot/Pipedrive)
  - [ ] Beta waitlist and auto-reply
  - [ ] UTM tracking & analytics (Plausible/GA4)
- [ ] Collateral
  - [ ] Deck (10–12 slides)
  - [ ] 2–3 sample reports (PDF)
  - [ ] 60–90s product demo video

---

## 7) Customer Support & Ops

- [ ] Support channels
  - [ ] support@ mailbox and SLA
  - [ ] In-app feedback widget
  - [ ] Help Center (how-to, troubleshooting)
- [ ] Status & incidents
  - [ ] Public status page (Uptime provider)
  - [ ] Incident runbook & postmortem template
- [ ] Onboarding & success
  - [ ] Guided onboarding, tooltips, sample data
  - [ ] Email sequences (activation, deadline reminders)

---

## 8) QA, Launch Checklist, and Rollback

- [ ] QA Test Plan
  - [ ] E2E runs green for top 5 flows
  - [ ] Accessibility checks (axe)
  - [ ] Performance: p95 latency < [target] for analysis enqueue
- [ ] Launch Readiness Review (LRR)
  - [ ] Docs complete (runbook, on-call, escalation)
  - [ ] Billing tested in sandbox and live
  - [ ] Security sign-off
  - [ ] Founders’ checklist walk-through
- [ ] Rollback plan
  - [ ] Versioned releases, automatic rollback trigger

---

## 9) Analytics & KPIs

- [ ] Implement product analytics (PostHog/Amplitude)
  - [ ] Events: signup, upload, analysis_started, analysis_completed, risk_viewed, report_exported
  - [ ] Funnels and retention
- [ ] Business metrics dashboard
  - [ ] MQLs, signups, activations, conversions, churn, ARPA, LTV

---

## 10) Execution Timeline (example)

- Week 1–2: Backend ADR + scaffold; Stripe sandbox; legal page drafts; move OpenAI calls server-side
- Week 3–4: DB models, storage, AI pipeline; NextAuth; product analytics
- Week 5–6: Billing entitlements; exports; audit logs; security hardening; E2E tests
- Week 7: GTM assets (deck, video, reports); site pages; help center
- Week 8: Staging LRR; pilot customers; iterate and ship v1

Replace with your own timeline and assign owners below.

---

## 11) Owners & Deadlines

Copy this table and fill:

- Product: [Name]
- Backend/API: [Name]
- Frontend App: [Name]
- Site & Content: [Name]
- Security/Legal: [Name]
- Billing/Finance: [Name]
- Ops/Support: [Name]

---

## 12) Concrete Engineering Tasks (Initial Backlog)

- Backend/API
  - [ ] Create repo/package `api/` with FastAPI or Next API routes
  - [ ] `/auth` (NextAuth) with GitHub+Google+Email
  - [ ] `/documents` upload → S3 EU, size/type validation, virus scan
  - [ ] `/analysis` start → queue job → store results
  - [ ] `/reports/:id.pdf` generate and stream
  - [ ] `/metrics` return dashboard aggregates

- Frontend App (`verifiai-product/`)
  - [ ] Remove direct `openai` usage; call `/analysis`
  - [ ] Replace `metricsService.ts` with backend-driven metrics
  - [ ] Auth gate + org switcher + settings page
  - [ ] Export flows (PDF/CSV)

- Site (`verifiai-site/`)
  - [ ] Add `app/api/auth/[...nextauth]/route.ts` + providers config
  - [ ] Add legal pages and link in `Footer`
  - [ ] Add `/security`, `/blog`, `/case-studies` placeholders
  - [ ] Add CTA form → email/CRM

- Tooling
  - [ ] Monorepo CI (lint/test/build) + preview deployments
  - [ ] Sentry + OpenTelemetry setup

---

## 13) Risks & Mitigations

- Vendor lock-in (LLM): keep prompt+schema portable; support 2 providers
- Data sensitivity: PII scrubbing; customer-controlled deletion; encryption
- Legal risk: prominent disclaimer; human-in-the-loop recommended
- Performance: queue analyses; rate limit; graceful degradation

---

## 14) Definition of Done (for “Ready to Sell”)

- Contracts can be uploaded, analyzed, explained, exported, and tracked; all server-side with auth
- Billing gates usage reliably; invoices/tax correct; customer portal live
- Security/Privacy docs live; legal pages published; DPA available
- Monitoring, alerting, on-call, and rollback in place
- GTM assets published; analytics tracking core funnel; first pilot logos committed

# Ops + Admin + DevOps + Deps Audit

## VIEWPOINT 1: OBSERVABILITY & MONITORING — Grade D

### 1. CRITICAL — Sentry Integration Stubbed
**File:** `lib/monitoring.js:10-16`
Only `console.error()`; no aggregation or alerting.
**Fix:** Add `@sentry/nextjs`. Capture errors in route try/catch, wire Vercel cron logs, alert on error spikes.

### 2. CRITICAL — Missing Audit Logs on Critical Actions
**Files:** `app/api/payments/create-intent/route.js`, `app/api/orders/route.js:70-111`, `app/api/orders/[id]/status/route.js:86-98`
Only auth routes emit audit events; payments, order creation, status transitions silent.
**Fix:** Wire `logAuditEvent` at: `payment_attempt` / `payment_success` / `payment_failed` (create-intent + webhooks), `order_created` (checkout), `admin_action` (status transitions).

### 3. HIGH — Health Check Incomplete
**File:** `app/api/health/route.js:6-26`
Only pings Supabase; ignores Redis, SMTP, payment SDKs.
**Fix:** Check `redis.ping()`, `transporter.verify()`, Stripe balance retrieve (soft). Return per-dep status.

### 4. HIGH — Cron Failures Silent
**File:** `app/api/cron/process-emails/route.js:120-129`
No alert on repeated failures; cron secret optional.
**Fix:** Make `CRON_SECRET` required; dead-letter queue after N retries; daily summary email to ops.

### 5. MEDIUM — PII Leakage Risk in Logs
**File:** `lib/audit-log.js:35-40` + route console.error calls
Emails, IPs, order details flow into stdout logs with no redaction.
**Fix:** Redaction helper (`mask(email)`, hash IPs in non-audit logs). Restrict retention on Vercel log drains.

### 6. MEDIUM — No Web Vitals Monitoring
**File:** `next.config.js`
No RUM, no `reportWebVitals` handler.
**Fix:** `instrumentation.js` with `web-vitals` → Vercel Analytics or Sentry Performance.

---

## VIEWPOINT 2: ADMIN / OPERATIONAL TOOLING — Grade D+

### 1. HIGH — No Review Moderation UI
**File:** `app/api/products/[id]/reviews/route.js:62-182`
Reviews can be created; no admin UI to delete / flag / moderate spam. API DELETE exists but no admin page wires it up.
**Fix:** `app/admin/reviews/page.js` listing recent reviews + moderation actions.

### 2. HIGH — No Refund Workflow
**File:** `app/api/orders/[id]/route.js` + `lib/stripe.js:138-178` (unused)
No refund status on order, no refund reason, no admin trigger, no Stripe/PayPal refund call.
**Fix:** `orders.refund_status` + `refunds` table + `/api/orders/[id]/refund` + admin page button. Cross-ref with compliance finding (Romanian 14-day return right).

### 3. HIGH — No Customer Support Tools
**File:** `app/api/admin/dashboard/route.js:5-104`
Dashboard shows KPIs only; no customer lookup, password reset trigger, order history deep-dive.
**Fix:** `app/admin/customers/[id]/page.js` with profile, orders, payment history, audit events, "send password reset" action.

### 4. HIGH — No Bulk Price / Inventory Updates
**File:** `app/api/admin/products/import/route.js`
Import-only workflow; no post-load bulk edit (mark out of stock, bulk price shift by %, bulk category reassign).
**Fix:** CSV export → edit → import-update flow, or admin grid with multi-select + batch-update endpoint.

### 5. MEDIUM — Order Status Changes Not Notified to Admin
**File:** `app/api/orders/[id]/status/route.js:100-142`
Status transitions don't emit admin alerts (e.g., Sameday delivery failure).
**Fix:** `admin_action` audit event + daily digest or Slack webhook.

### 6. MEDIUM — No Inventory Audit / Low-Stock Alerts
**Fix:** Nightly cron: products with `stock <= 3` → admin email. Inventory history table for reconciliation.

---

## VIEWPOINT 3: DEVOPS / CI-CD — Grade C−

### 1. HIGH — CI Missing Security Checks
**File:** `.github/workflows/ci.yml:10-36`
No `npm audit`, no bundle-size check, no secret scanning (gitleaks), no Lighthouse.
**Fix:** Add jobs: `npm audit --audit-level=moderate`, `gitleaks detect`, bundle-analyzer diff comment on PRs.

### 2. HIGH — `--legacy-peer-deps` Hides Incompatibilities
**Files:** `.github/workflows/ci.yml:18`, `package.json`
Masks Stripe v14 / React 19 conflict. When conflict becomes real (new Stripe release), deploys break without warning.
**Fix:** Upgrade `@stripe/react-stripe-js` to a React-19-compatible version (v6+) and drop `--legacy-peer-deps`.

### 3. HIGH — No Env Var Validation
**File:** `.env.example:1-177` lists 50+ vars; runtime guards exist only for `JWT_SECRET` and Supabase.
**Fix:** `lib/env.js` using `zod` or hand-rolled; fail boot if any required var missing. Split required vs optional.

### 4. HIGH — No Supabase Migration Versioning
Flat `supabase/*.sql` files, manually applied. No `supabase/migrations/<ts>_*.sql` convention; no drift detection.
**Fix:** Adopt Supabase CLI migrations (`supabase db diff`, `supabase migration new`). Run order doc'd in README.

### 5. MEDIUM — Preview Deploys Share Prod Supabase
Single Supabase project → Vercel previews write to prod DB.
**Fix:** Separate Supabase project for staging/preview; env vars per Vercel environment.

### 6. MEDIUM — Cron Idempotency Not Enforced
**File:** `app/api/cron/process-emails/route.js:25-137`
Retries can duplicate jobs if cron fires twice.
**Fix:** Advisory lock on cron start, or `job_runs` table with `(job_name, window)` unique key.

---

## VIEWPOINT 4: DEPENDENCY HYGIENE — Grade C

### 1. CRITICAL — npm audit findings (5 high, 3 moderate reported)
- `nodemailer ≤8.0.4` — SMTP command injection, DoS, domain confusion.
- `xlsx` — Prototype Pollution + ReDoS, **no fix available** (upstream abandoned).
- `next 10.0.0-15.5.14` — disk cache exhaustion, Server Component DoS.
- `flatted ≤3.4.1`, `picomatch ≤2.3.1` — proto pollution / ReDoS (transitives).

**Fix:**
- `npm install nodemailer@latest`.
- Replace `xlsx` with `exceljs` or `node-xlsx-parser` — `xlsx` is a supply-chain liability.
- Upgrade Next to latest 15.x.
- `npm audit fix --force` for transitives after testing.

### 2. CRITICAL — Payment SDKs Outdated
- `stripe@^14.0.0` → latest v22.
- `@stripe/stripe-js@^3.0.0` → latest v9.
- `@stripe/react-stripe-js@^2.7.0` → latest v6+ (also fixes the React 19 peer-dep issue).

**Fix:** Staged upgrade behind feature-flag, ideally in a dedicated PR with regression tests on payment flow.

### 3. MEDIUM — bcrypt + bcryptjs Both Listed
Earlier `package.json` diff showed both; risk of inconsistent hash verification.
**Fix:** Pick one (`bcryptjs` is pure-JS, works on Vercel Edge; `bcrypt` is native). Remove the other.

### 4. LOW — Missing Type Defs
No `@types/*` packages since project is pure JS. If migration to TS happens, add them.

---

## TOP 10 PRIORITY ACTIONS

1. Upgrade `nodemailer` to 8.0.5+ — current has active CVEs.
2. Replace `xlsx` with a maintained lib — no upstream fix.
3. Upgrade Next 15 to latest patch.
4. Upgrade Stripe SDKs; drop `--legacy-peer-deps`.
5. Ship Sentry (or equivalent) + wire into all route try/catch.
6. Expand audit logging to payments, order creation, admin actions.
7. Build `lib/env.js` strict env-var validator.
8. Build refund workflow (ties into compliance audit #1).
9. Review moderation + customer support admin UIs.
10. Staging Supabase project + Vercel env separation.

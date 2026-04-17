# Security + Payments + Compliance Audit

> **Caveat from consolidator:** Several findings below deserve verification before action. Flagged items marked with ⚠ need a follow-up read before the fix is implemented.

## VIEWPOINT 1: SECURITY

### 1. CRITICAL — Unverified JWT in Middleware
**File:** `middleware.js:9-19`
`getTokenPayload()` base64-decodes JWT without signature verification and uses it for admin page routing (L70). ⚠ **Context matters:** middleware.js:6-8 explicitly notes this is "only for routing decisions" and "API routes still perform full signature verification." An attacker crafting a fake admin JWT can **load the admin HTML shell** (not data) because Next.js Edge Runtime cannot import `jsonwebtoken`. API routes still 403 on forged tokens.
**Fix:** Move signature verification to the API layer's auth helper (already done on most admin API routes — audit completeness). Consider using `jose` library which works in Edge Runtime if full verify is wanted in middleware.

### 2. CRITICAL — Amount Tampering Risk in Checkout
**File:** `app/api/checkout/route.js:117-123`
Total computed from cart items, passed to `process_checkout` RPC as `p_total`. If the RPC trusts `p_total` instead of recomputing server-side, a malicious client could pass an arbitrary value.
**Fix:** ⚠ **Verify `process_checkout` RPC body** (in `supabase/checkout.sql`): it should recompute total from `p_items` and IGNORE `p_total` (or assert equality). If the RPC trusts p_total, this is exploitable.

### 3. HIGH — CSRF with SameSite=Lax
**Files:** `middleware.js:55`, `lib/auth.js:88`, `app/api/checkout/route.js:13`
SameSite=Lax blocks cross-site cookies on sub-requests but NOT on top-level POST (form submission). Attacker's site with a form posting to `/api/checkout` would carry the session cookie.
**Fix:** Require JSON `Content-Type` on mutating endpoints (forces preflight), validate `Origin` header, or add CSRF tokens. Simplest: reject POST/PUT/DELETE if `Origin` isn't same-origin.

### 4. HIGH — Potential Stored XSS via Customer Fields
**Files:** `app/api/checkout/route.js:27-31, 142`
Customer name/address taken from request body and passed to email templates (orderConfirmation). If templates render raw strings into HTML without escaping, stored XSS in admin's email client.
**Fix:** ⚠ **Verify `lib/templates/orderConfirmation.js`** escapes with HTML entities. Add server-side sanitization on input (strip control chars, cap length).

### 5. HIGH — Admin Role Stale in Long-Lived JWT
**File:** `lib/auth.js`, issued at login with 7-day expiry, role frozen.
If user is demoted from admin, their existing token still passes role checks for up to 7 days.
**Fix:** Short JWT (1h) + refresh token, or look up role from DB on each admin action (main already does this for reviews DELETE — expand to other admin routes).

### 6. HIGH — Rate-Limit Bypass via X-Forwarded-For
**File:** `middleware.js:81-84`
`x-forwarded-for` parsed without validating the proxy chain. Behind Vercel this is safe (Vercel overwrites), but if the app is ever fronted by another proxy, a spoofed header skips rate limiting.
**Fix:** Document that only Vercel is trusted; if behind Cloudflare etc., use `cf-connecting-ip`.

### 7. MEDIUM — No JWT Key Rotation Strategy
**File:** `lib/auth.js:4-7`
Single `JWT_SECRET`. No versioning → can't rotate without invalidating all sessions.
**Fix:** Key ID (kid) in token header; accept multiple valid keys during rotation window.

### 8. MEDIUM — Audit Log Coverage Gaps
**File:** `lib/audit-log.js:14-28` (new helper)
Only login_success / login_failed / register wired so far. Missing: admin_action, payment_success, payment_failed, review_deleted, order_created, password_reset.
**Fix:** Wire `logAuditEvent` at the remaining sensitive entry points.

### 9. MEDIUM — Weak Password Policy on Register
**File:** `app/api/auth/register/route.js:9-16`
Only checks email+password presence, no length/complexity.
**Fix:** Min 8 chars + one non-alpha. Consider zxcvbn on client for UX.

### 10. LOW — Hardcoded Stripe API Version
**File:** `lib/stripe.js:14`
Fixed `apiVersion: '2023-10-16'`.
**Fix:** Either pin deliberately (current) and plan upgrades, or let library default.

**Grade: C**

---

## VIEWPOINT 2: PAYMENT INTEGRITY

> **⚠ Caveat:** Webhook specifics below need verification — agent reports conflicting signals on whether `/api/webhooks/stripe` exists and what it does.

### 1. CRITICAL — Stripe Webhook Verification Issues
**Claim:** redundant verification + returns 200 on signature failure.
**Fix:** ⚠ **Verify `app/api/webhooks/stripe/route.js`** (if it exists). Webhook must:
1. Read raw body (no JSON parse).
2. Verify signature with `stripe.webhooks.constructEvent(rawBody, sig, secret)`.
3. Return 400 on bad signature.
4. Idempotent processing of event IDs.

### 2. CRITICAL — PayPal IPN vs Webhooks API Confusion
**Claim:** handler mixes legacy IPN with modern Webhooks API.
**Fix:** ⚠ **Verify PayPal webhook handler.** Use Webhooks API (`v1/notifications/verify-webhook-signature`), not IPN. Remove IPN code.

### 3. HIGH — No Idempotency Keys on Payment Intents
**File:** `app/api/payments/create-intent/route.js:79-86`
Stripe's `createPaymentIntent` called without an idempotency key. Retry = duplicate intents.
**Fix:** Generate key from `orderId` + attempt hash; pass to Stripe `idempotencyKey` option.

### 4. HIGH — Double-Charge Race Condition on Payment Status
Concurrent webhooks hitting the same order may both read `status !== 'succeeded'` before either writes.
**Fix:** DB unique constraint on `(order_id, status='succeeded')` OR `SELECT ... FOR UPDATE` in an RPC.

### 5. HIGH — No Refund Flow
**File:** `lib/stripe.js:138-178` defines `refundPayment()` — unused.
No `/api/refunds` endpoint, no `returns` table, no admin UI. Claimed 30-day return policy is false on the ops side.
**Fix:** Build end-to-end refund workflow (covered more in compliance).

### 6. MEDIUM — No Payment Provider Timeout
**File:** `app/api/payments/confirm/route.js:45-59`
No `AbortController`/timeout. Orders can stick in `processing` if provider is slow.
**Fix:** 5s timeout + 503 with retry-after; reconciliation cron for long-processing payments.

### 7. MEDIUM — Revolut Webhook Signature Unclear
**File:** `app/api/payments/revolut/create/route.js`
⚠ **Verify** signature verification exists for Revolut webhooks. If not, implement per Revolut docs.

### 8. MEDIUM — PayPal Amount Mismatch Silent
**File:** `app/api/webhooks/paypal/route.js:88-95` (per agent)
Amount mismatch logged but silently returned — order stuck without alert.
**Fix:** Emit audit event + alert admin on mismatch.

**Grade: C** (pending webhook verification)

---

## VIEWPOINT 3: COMPLIANCE (GDPR + Romanian consumer law)

### 1. CRITICAL — No Return/Refund Mechanism Implemented
Marketing ("retur in 30 zile" in footer/FAQ) and Romanian consumer law (OUG 34/2014 — 14-day withdrawal right) promise refunds, but **no code**: no `returns` table, no `/api/orders/[id]/return` endpoint, no admin UI.
**Fix:** Build returns workflow: DB table, return request API (customer), admin approval UI, refund trigger via existing `refundPayment()`. Also **correct the policy text**: 14 days is the statutory minimum; if advertising 30, make sure 30 is honored.

### 2. CRITICAL — No Right to Erasure Endpoint (GDPR Art. 17)
No `/api/account/delete`. Privacy policy mentions it but doesn't expose the action.
**Fix:** `/api/account/delete` → anonymize/purge PII after 30-day grace; cascade to reviews/orders (anonymize, don't delete orders — accounting record retention required).

### 3. HIGH — Cookie Consent Banner Missing
`/cookies` policy page exists but no consent UI on first visit. GDPR + Romanian ePrivacy require opt-in for non-essential cookies.
**Fix:** Build banner (essential vs analytics/marketing), store consent in localStorage, gate non-essential scripts behind consent.

### 4. HIGH — Data Retention Not Enforced in Code
Privacy policy states retention windows (e.g., 3 years inactive accounts, 10 years fiscal). No cron purges.
**Fix:** Nightly job to anonymize expired inactive accounts; archive+purge audit_logs beyond retention.

### 5. HIGH — No Data Processor Register
Privacy policy lists vendors (Supabase, Vercel, Oblio, Sameday, Stripe, PayPal, Revolut) but no evidence of signed DPAs or public register.
**Fix:** Internal register + update privacy policy with explicit list and purposes.

### 6. MEDIUM — No ANPC Dispute Resolution Link
Romanian law requires the ANPC (consumer protection) link in Terms/footer.
**Fix:** Add link to [https://anpc.ro/ce-este-sal/](https://anpc.ro/ce-este-sal/) + SOL platform [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr) in footer.

### 7. MEDIUM — No Marketing Consent Checkbox at Registration
**File:** `app/api/auth/register/route.js:9-16`
No explicit opt-in for marketing emails. Romanian GDPR implementation requires separate explicit consent.
**Fix:** Add checkbox in register form, store in user preferences, honor unsubscribe per email.

### 8. MEDIUM — No DSAR (Data Subject Access Request) Endpoint (GDPR Art. 15)
No `/api/account/export`.
**Fix:** `/api/account/export` returning JSON with profile, orders, reviews, addresses, audit events, email logs.

**Grade: D**

---

## TOP IMMEDIATE ACTIONS (from this agent)

1. Verify + harden Stripe/PayPal webhook signature verification.
2. Verify `process_checkout` RPC recomputes total server-side.
3. Verify order-confirmation email template HTML-escapes customer fields.
4. Build refund flow (returns table + API + admin UI).
5. Build right-to-erasure + DSAR endpoints.
6. Ship cookie consent banner.
7. Wire `logAuditEvent` to remaining sensitive actions (payment events, admin actions, password reset, review moderation).
8. Add Origin/Referer check or CSRF tokens on mutating routes.

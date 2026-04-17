# Testing + Error Handling Audit

## VIEWPOINT 1: TESTING STRATEGY — Grade D+

### 1. CRITICAL — Zero Route Handler Integration Tests
**Files:** `app/api/checkout/route.js:13`, `app/api/payments/create-intent/route.js:12`, `app/api/reviews/[id]/route.js:129`
All 5 suites hit `lib/` only. Zero tests invoke Next.js route handlers end-to-end.
**Fix:** `__tests__/integration/` with handler-level tests for checkout, payments, review DELETE IDOR.

### 2. HIGH — Mock Realism Low
**Files:** `__tests__/unit/payment.test.js:1-150`, `jest.setup.js:35-50`
Payment tests define isolated validators instead of mocking Stripe/PayPal SDK responses.
**Fix:** Use `jest-mock-extended` against actual SDK shapes. Cover error paths.

### 3. HIGH — Auth Edge Cases Untested
**Files:** `lib/auth.js:16-22`, `__tests__/unit/auth-extended.test.js:75-107`
Happy paths + tampered/expired covered; middleware fallback, clock-skew, algorithm-confusion not tested.
**Fix:** Tests for middleware Redis-down path, clock-skew tolerance, explicit algorithm enforcement.

### 4. HIGH — Audit Logging Not Integration-Tested
**Files:** `app/api/auth/login/route.js:20-31`, `__tests__/unit/audit-log.test.js:23-75`
Helper is unit-tested; no integration test verifies login route actually emits events with correct payload.
**Fix:** Integration test — mock Supabase + route call → assert `logAuditEvent` payload.

### 5. HIGH — Review DELETE Authorization Untested
**File:** `app/api/reviews/[id]/route.js:129-162`
IDOR fix in place but no regression test.
**Fix:** Integration tests: non-owner DELETE → 403, owner → 200, admin-via-DB-role → 200.

### 6. MEDIUM — No Snapshot Tests
**Files:** `jest.config.cjs`, data-transforms use `.toMatchObject()` — missing fields can slip through.
**Fix:** Snapshot critical response payloads.

### 7. MEDIUM — No E2E / Browser Tests
No Playwright / Cypress.
**Fix:** 3-5 Playwright flows: guest checkout, login + order, payment happy path, returns (once built), admin order status change.

### 8. MEDIUM — Missing Entity Fixtures
**File:** `__tests__/unit/data-transforms.test.js:62-126`
Inline `makeUserRow` / `makeOrderRow`; no reusable fixtures.
**Fix:** `__tests__/fixtures/{orders,payments,carts}.fixture.js`.

---

## VIEWPOINT 2: ERROR HANDLING & RESILIENCE — Grade C

### 1. CRITICAL — No Idempotency on Payment Creation
**Files:** `app/api/payments/create-intent/route.js:62-135`, `lib/stripe.js:37-79`
Network retry creates duplicate Stripe intents.
**Fix:** Pass `idempotencyKey: orderId + attempt` to Stripe; persist intent ID immediately.

### 2. CRITICAL — Checkout Email Failure Doesn't Alert
**File:** `app/api/checkout/route.js:169-202`
Order RPC atomic, but email job failure is caught + logged to console. Customer gets "success" with no email.
**Fix:** Retry queue with backoff; mark `order.last_email_sent_at = null` and surface in admin "pending notifications" view.

### 3. HIGH — No Timeouts on External Calls
**Files:** `lib/stripe.js:37-79`, `app/api/checkout/route.js:92-115`
Stripe/PayPal/Supabase calls can hang indefinitely.
**Fix:** `AbortSignal.timeout(10_000)` per call; Stripe 10s, PayPal 15s, Supabase 5s.

### 4. HIGH — Rate Limiter Fails Open
**File:** `middleware.js:38-48`
Redis down → allow all → `/api/auth/login` brute-forceable.
**Fix:** Fail-closed for login/payments; alert on Redis unavailability.

### 5. HIGH — Supabase Errors Leak to Users
**Files:** `app/api/checkout/route.js:148-156`, `app/api/payments/create-intent/route.js:66-72`
Raw DB error strings (table/column names, constraints) returned.
**Fix:** Central `lib/error-handler.js` mapping DB errors → user-safe codes.

### 6. MEDIUM — No Circuit Breaker
No fallback when Stripe down (e.g., hide card option, push to ramburs).
**Fix:** `opossum` circuit breaker around each payment provider; UI adapts on trip.

### 7. MEDIUM — console.error-Only Logging
**Files:** `lib/monitoring.js:22-50`, `app/api/checkout/route.js:210-213`
Sentry stubbed. No alerts, no grouping, no breadcrumbs.
**Fix:** Wire Sentry (see ops audit #1).

### 8. MEDIUM — Partial Transaction Failures
**Files:** `app/api/checkout/route.js:137-202`, `app/api/payments/confirm/route.js:61-133`
Order + email_job insert non-atomic.
**Fix:** Single RPC wrapping order + email_job insert, or transactional outbox pattern.

### 9. LOW — Client-Side Error Display Inconsistent
Checkout RO, auth EN; some structured, some HTTP-only.
**Fix:** Global `{ success, error: { code, message } }` contract + client error-display component.

### 10. LOW — No Offline / Retry Queue
Network drop during checkout = user must resubmit.
**Fix:** IndexedDB queue + retry on reconnect (service worker). Lower priority — usually hand-holding.

---

## TOP RECOMMENDATIONS

1. Add 5 integration-level smoke tests for the business-critical flows.
2. Ship Stripe idempotency keys.
3. Email failure → retry queue, not silent swallow.
4. `AbortSignal.timeout` on all external calls.
5. Rate limiter fails closed on login/payment routes.
6. Central error handler that sanitizes DB error messages.
7. Review DELETE IDOR regression test.

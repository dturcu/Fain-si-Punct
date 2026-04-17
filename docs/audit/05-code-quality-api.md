# Code Quality + API Design Audit

## VIEWPOINT 1: CODE QUALITY

### 1. CRITICAL — Undefined Variable in Stripe Handler
**File:** `app/api/payments/create-intent/route.js:84`
`auth?.userId` referenced in `handleStripePayment(order)` but `auth` is not in scope — only `headersList` is. `ReferenceError` on any Stripe checkout. (Already flagged as separate side-task.)
**Fix:** Pass `auth` as param to `handleStripePayment(order, auth)` or drop userId from metadata.

### 2. CRITICAL — Monolithic supabase-queries Module
**File:** `lib/supabase-queries.js` (568 LOC)
20+ exports across user, order, cart, guest-cart concerns. `recalculateCartTotal` called 8 times with no doc.
**Fix:** Split into `lib/users-queries.js`, `orders-queries.js`, `cart-queries.js`. Each <200 LOC.

### 3. CRITICAL — Inconsistent HTTP Status Codes
**Files:** `app/api/auth/register/route.js:22`, `app/api/orders/route.js:106`
Email-exists returns 400 (should be 409). Validation errors mixed 400/500 (should be 422).
**Fix:** Enforce 401=unauth, 403=forbidden, 409=conflict, 422=validation, 500=internal.

### 4. HIGH — Error Message Language Mix
40 occurrences across 27 routes. "A apărut o eroare internă" (RO) alongside "Invalid credentials", "Unauthorized" (EN).
**Fix:** Pick one language per layer. Recommend English error codes + Romanian presentation layer.

### 5. HIGH — Auth Scheme Inconsistency
**Files:** `lib/auth.js:46-65`, `app/api/payments/create-intent/route.js:15-17`
`verifyAuth(headers)` (Bearer-or-cookie) vs `getCookieToken()` used inconsistently across routes.
**Fix:** Centralize via a single auth helper. Document required scheme per route.

### 6. MEDIUM — Transform Function Duplication
**Files:** `app/api/products/route.js:152-186`, `app/api/orders/route.js:113-151`, `lib/supabase-queries.js:227-269`
`orderRowToObj`, `rowToProduct` copy-pasted across route files.
**Fix:** Export transforms from lib only. Import in routes.

### 7. MEDIUM — Magic Numbers & Hardcoded Strings
**Files:** `app/api/products/route.js:100`, `app/api/payments/create-intent/route.js:81`
Hardcoded limit 100, currency `'ron'` vs `'RON'`, shipping cost scattered.
**Fix:** Centralize in `lib/constants.js`.

### 8. MEDIUM — Complex Functions Lack JSDoc
**Files:** `app/api/checkout/route.js:13-216`, `lib/supabase-queries.js:295-345`
Checkout orchestrates 4+ DB queries + RPC + stock validation. No documented invariants or side effects.
**Fix:** JSDoc with preconditions, side effects, error contracts.

**Grade: C+**

---

## VIEWPOINT 2: API DESIGN

### 1. CRITICAL — REST Verb Violation: `/orders/[id]/pay`
**File:** `app/api/orders/[id]/pay/route.js`
Action-based URL violates REST resource naming.
**Fix:** POST `/api/orders/[id]/payments` (resource collection).

### 2. CRITICAL — Two Conflicting Payment Flows
`/api/payments/create-intent` (Stripe/PayPal) vs `/api/orders/[id]/pay` (ramburs). Two mental models.
**Fix:** Consolidate into `/api/orders/{id}/payments` accepting method param.

### 3. CRITICAL — Cart POST Not Idempotent
**File:** `app/api/cart/route.js:37-149`
No idempotency key. Network retry double-adds items.
**Fix:** Accept `Idempotency-Key` header, dedupe in DB. Or use PUT `/api/cart/[itemId]` to set absolute qty.

### 4. HIGH — Query Param vs Body Inconsistency
`/api/products` GET query, `/api/cart` POST body, `/api/orders` GET query — no documented convention.
**Fix:** Filtering in query (GET); creation in body (POST/PUT/PATCH). Document.

### 5. HIGH — Pagination Inconsistency
**Files:** `app/api/products/route.js:88-92`, `app/api/orders/route.js:51`
Products paginates; orders hardcodes limit 200 with no cursor.
**Fix:** Standard `{ pagination: { total, page, limit, pages } }` shape. Cursor for orders.

### 6. HIGH — Validation Errors Leak DB Layer
**File:** `app/api/checkout/route.js:148-156`
Surfaces DB error text (`msg.includes('Insufficient stock')`). Client breaks if message changes.
**Fix:** Map DB errors to codes: `{ error: 'INSUFFICIENT_STOCK', message: '...' }`.

### 7. HIGH — Unsigned Guest Session Cookies Forgeable
**Files:** `app/api/cart/[itemId]/route.js:35-44`, `app/api/orders/[id]/pay/route.js:33-40`
Guest session UUID cookie not HMAC-signed. Attacker can forge to access other carts.
**Fix:** HMAC-sign guest sessions with `JWT_SECRET` or dedicated key. Verify before trust.

### 8. MEDIUM — Response Shape Inconsistency
Auth returns `{ success, user }`, most routes `{ success, data }`, `/api/auth/me` returns both.
**Fix:** Standardize `{ success, data, error?, pagination? }`. Nest user as `data.user`.

**Grade: D+**

---

## TOP CROSS-CUTTING RECOMMENDATIONS

1. Fix Stripe handler `auth` scope bug (blocking bug, not style).
2. Split `lib/supabase-queries.js` by domain.
3. Establish API conventions doc + migrate routes to match.
4. Unify payment flow into single resource.
5. Add idempotency key support to all POST endpoints with side effects.
6. Sign guest session cookies.

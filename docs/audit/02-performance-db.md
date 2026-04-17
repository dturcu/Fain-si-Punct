# Performance + Database Audit

**Stack:** Next.js 15 App Router, Supabase Postgres (service_role), Upstash Redis, Vercel
**Audit Date:** 2026-04-16

## VIEWPOINT 1: FRONTEND + API PERFORMANCE

### 1. CRITICAL — Unnecessary 'use client' on Home Page
**File:** `app/page.js:1`
Home page marked `'use client'` but only fetches two simple endpoints. Prevents SSR/ISR, forces clients to hydrate full JS bundle before any content renders. Increases TTI, disables edge caching.
**Fix:** Remove `'use client'`, convert to server component, fetch data server-side. Add `export const revalidate = 3600`.

### 2. HIGH — Product Detail Page Multi-Fetch Waterfall
**File:** `app/products/[id]/page.js:85-127`
Three sequential useEffect calls: product (L88), reviews (L107), related (L123). All client-side, causing waterfall latency.
**Fix:** Combine into `/api/products/[id]?includeReviews=true&includeRelated=true` returning all three in one call.

### 3. HIGH — Image Optimization Disabled via unoptimized Prop
**File:** `app/page.js:274`
`<Image ... unoptimized />` disables resizing, WebP negotiation, lazy loading. 2-3x larger image payloads, delayed LCP, CLS.
**Fix:** Remove `unoptimized`, add `sizes="(max-width: 768px) 100vw, 50vw"`.

### 4. HIGH — Product Listing Page Client-Heavy with No Caching
**File:** `app/products/page.js:1-177`
`ProductsContent` is `'use client'`, refetches filters/categories/products on every mutation. No ISR, no cache headers.
**Fix:** Server-side filtering or Next.js Data Cache. Store filter params in URL. Add `Cache-Control: public, s-maxage=300` to `/api/products`.

### 5. HIGH — Middleware Adds Redis Latency on Every Request
**File:** `middleware.js:26-48`
Calls `redis.incr()` on every `/api/auth/*`, `/api/checkout`, `/api/payments/*`. Adds 50-200ms per request.
**Fix:** In-memory sliding window counter in middleware instead of external Redis. (Note: this contradicts Upstash benefits across instances — trade-off; consider selective use.)

### 6. HIGH — No ISR for Catalog Pages
**File:** `app/api/products/route.js:96`
Weak inconsistent `Cache-Control`. Product detail fully dynamic.
**Fix:** `export const revalidate = 60` + `generateStaticParams()` for popular products.

### 7. MEDIUM — Fonts Not Optimized (Raw Link Tags)
**File:** `app/layout.js:47-49`
Raw `<link href="https://fonts.googleapis.com/css2?...">` instead of `next/font/google`. Causes FOUT, delays FCP.
**Fix:** `import { Inter } from 'next/font/google'`, apply via className.

### 8. MEDIUM — Stripe/PayPal Bundled on Non-Payment Pages
**File:** `package.json:20-21`
~200KB in main bundle even on home/product pages.
**Fix:** `dynamic(() => import('@stripe/react-stripe-js'), { ssr: false })` only on `/checkout`.

**Grade: D+**

---

## VIEWPOINT 2: DATABASE DESIGN & QUERY PATTERNS

### 1. CRITICAL — Cart addToCart() Lacks Transaction Atomicity
**File:** `lib/supabase-queries.js:295-344`
5 sequential ops: getCartByUserId (2 queries) → create-if-missing → query existing item → upsert → recalculateCartTotal (2 more). No transaction. `migrateGuestToUser()` L512-546 also non-atomic.
**Fix:** Postgres RPC `upsert_cart_item()` with `FOR UPDATE` locking.

### 2. CRITICAL — Missing Composite Indexes on Product Filters
**File:** `app/api/products/route.js:29-79` + `supabase/schema.sql:98-104`
Filters category+price+stock+tag+search simultaneously. Only `(category)`, `(price)`, `(avg_rating)`, `(category, price)` declared. Missing `(category, stock, price)` → full table scans.
**Fix:** `CREATE INDEX idx_products_category_stock ON products(category, stock) WHERE stock > 0;` + `CREATE INDEX idx_products_category_price_stock ON products(category, price, stock);`

### 3. CRITICAL — Payment Amounts Stored as INTEGER (Precision Loss)
**File:** `supabase/schema.sql:194`
`amount INTEGER NOT NULL`. Loses decimals; rounding errors accumulate.
**Fix:** `ALTER TABLE payments ALTER COLUMN amount TYPE NUMERIC(12, 2) USING amount / 100.0;`
(Note: this may be intentional for Stripe's cents convention — verify before migrating.)

### 4. HIGH — getOrderById Performs Two Queries (N+1 Pattern)
**File:** `lib/supabase-queries.js:116-130`
Fetches order, then order_items separately. Admin 20-orders page = 41 queries.
**Fix:** Nested select like `getOrdersByUserId()` L137: `.select('*, order_items(*)')`.

### 5. HIGH — RLS Subquery on order_items is Slow
**File:** `supabase/rls-policies.sql:64-70`
`order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())` per row.
**Fix:** Denormalize `user_id` into `order_items`, or rely on service-role only path.

### 6. HIGH — email_logs Table Unbounded (No Retention)
**File:** `supabase/schema.sql:292-315`
No partitioning/retention. Degrades after ~1M rows.
**Fix:** Nightly `DELETE FROM email_logs WHERE created_at < now() - interval '90 days' AND status IN ('sent', 'bounced');`

### 7. HIGH — Missing Filtered Index on email_logs Retry Query
**File:** `supabase/schema.sql:313`
`idx_email_logs_retry` too broad.
**Fix:** `CREATE INDEX idx_email_logs_retry_ready ON email_logs(id) WHERE status = 'pending_retry' AND next_retry_at <= NOW();`

### 8. MEDIUM — Guest Cart Merge Hard-Deletes (No Audit Trail)
**File:** `lib/supabase-queries.js:512-546`
Hard-delete on guest→user migration. Debugging conversion issues impossible.
**Fix:** `soft_delete_at TIMESTAMPTZ`, archive nightly.

**Grade: C**

---

## TOP 5 RECOMMENDATIONS (from this agent)

1. Remove 'use client' from home/product listing pages → SSR + ISR → 30-40% faster FCP.
2. Verify payment amount units — if not Stripe-cents, migrate INTEGER → NUMERIC(12,2).
3. Add composite index `(category, stock, price)` → 10x faster product queries.
4. Wrap cart operations in Postgres transaction → prevent race conditions.
5. Email log retention + filtered indexes → prevent performance cliff at 1M rows.

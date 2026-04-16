-- ============================================================================
-- Performance Indexes — Phase 1 audit remediation
-- ============================================================================
--
-- Rationale per index (from the audit):
--  1. Product filters combine (category, stock, price) at query time. The
--     existing single-column indexes can't serve the joint predicate well
--     once the product table grows beyond a few thousand rows.
--  2. Email log retry scanner currently relies on a broad index; a partial
--     index on the "ready to retry" slice is 10-100x faster as the table
--     grows unbounded.
--
-- Safe to re-run (IF NOT EXISTS). Run in Supabase SQL Editor after
-- schema.sql + rls-policies.sql + audit-logs.sql.
-- ============================================================================

-- In-stock products filtered by category — the hot path on catalog pages.
CREATE INDEX IF NOT EXISTS idx_products_category_stock
  ON products (category, stock)
  WHERE stock > 0;

-- Covers category + price range + in-stock composite filters (sort by price).
CREATE INDEX IF NOT EXISTS idx_products_category_price_stock
  ON products (category, price, stock);

-- Email retry queue — only the narrow "ready" slice is ever scanned by the
-- cron job; a partial index avoids touching sent/bounced rows entirely.
CREATE INDEX IF NOT EXISTS idx_email_logs_retry_ready
  ON email_logs (id)
  WHERE status = 'pending_retry' AND next_retry_at <= NOW();

-- Orders by user, most recent first — account/orders page hot path.
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Orders by guest session, most recent first — guest order lookup.
CREATE INDEX IF NOT EXISTS idx_orders_guest_created
  ON orders (guest_session_id, created_at DESC)
  WHERE guest_session_id IS NOT NULL;

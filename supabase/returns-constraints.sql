-- ============================================================================
-- Returns table — concurrent-open-request guard (addendum to returns.sql)
-- ============================================================================
--
-- Reviewer flagged that the JS-level "no existing open return" check is a
-- read-then-write race: two concurrent POSTs to /api/orders/[id]/return can
-- both see zero open returns and each insert a `requested` row, creating
-- duplicate refund workflows for the same order.
--
-- Fix: enforce the invariant at the database level with a partial unique
-- index on order_id WHERE status IN ('requested', 'approved'). Postgres
-- will reject the second insert atomically; the API layer maps 23505 to
-- apiError(PAYMENT_IN_PROGRESS).
--
-- Safe to re-run. Run AFTER supabase/returns.sql.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_returns_one_open_per_order
  ON returns (order_id)
  WHERE status IN ('requested', 'approved');

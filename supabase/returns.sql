-- ============================================================================
-- Returns / Refund Workflow — Phase 3 audit remediation
-- ============================================================================
--
-- Implements the 14-day statutory withdrawal right (OUG 34/2014).
--
-- State machine:
--   requested  -> approved  | rejected
--   approved   -> refunded  | cancelled
--   rejected   (terminal)
--   refunded   (terminal)
--   cancelled  (terminal)
--
-- Only the customer who owns the order can request a return. Only admins
-- can approve/reject/refund. Refund is triggered via Stripe/PayPal/Revolut
-- by the admin action, not by the customer-facing request.
--
-- Run after: schema.sql, rls-policies.sql, audit-logs.sql, perf-indexes.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS returns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id         UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  guest_session_id TEXT NULL, -- mirrors orders.guest_session_id for guest orders

  -- Customer-provided fields at request time
  reason_code     TEXT NOT NULL, -- withdrawal | defective | not_as_described | wrong_item | other
  reason_note     TEXT NULL,
  -- Items being returned (full or partial). JSON array of
  --   { orderItemId, quantity }
  items           JSONB NOT NULL,

  -- Financial
  refund_amount   NUMERIC(12, 2) NULL, -- computed on approve based on items + shipping
  refund_method   TEXT NULL, -- card | paypal | revolut | bank_transfer | ramburs_credit_note
  refund_external_id TEXT NULL, -- Stripe refund id, PayPal refund id, etc.

  -- State machine
  status          TEXT NOT NULL DEFAULT 'requested',
  admin_note      TEXT NULL, -- visible only to admins
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at      TIMESTAMPTZ NULL,
  decided_by      UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  refunded_at     TIMESTAMPTZ NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT returns_status_check CHECK (
    status IN ('requested', 'approved', 'rejected', 'refunded', 'cancelled')
  ),
  CONSTRAINT returns_reason_check CHECK (
    reason_code IN ('withdrawal', 'defective', 'not_as_described', 'wrong_item', 'other')
  )
);

-- Lookup patterns
CREATE INDEX IF NOT EXISTS idx_returns_order_id     ON returns (order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id      ON returns (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_returns_status       ON returns (status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at   ON returns (created_at DESC);

-- RLS: service-role only. Admins read/write via API routes that use the
-- service-role client. Customers never touch this table directly.
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Denormalize: orders table gets a "has_open_return" flag for admin list
-- rendering. Optional; remove if schema drift bites.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_open_return BOOLEAN NOT NULL DEFAULT FALSE;

-- Trigger: keep orders.has_open_return in sync automatically.
CREATE OR REPLACE FUNCTION sync_orders_has_open_return() RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders SET has_open_return = EXISTS (
    SELECT 1 FROM returns
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND status IN ('requested', 'approved')
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_returns_sync_open ON returns;
CREATE TRIGGER trg_returns_sync_open
  AFTER INSERT OR UPDATE OR DELETE ON returns
  FOR EACH ROW EXECUTE FUNCTION sync_orders_has_open_return();

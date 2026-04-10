-- ============================================================================
-- Row Level Security (RLS) Policies — Defense in Depth
-- ============================================================================
--
-- The application uses the Supabase service_role key for all API route access,
-- which bypasses RLS entirely. These policies exist as a defense-in-depth
-- measure: if the anon key is ever accidentally used in a client-side context,
-- RLS will restrict access to only what the authenticated user should see.
--
-- Without these policies, an exposed anon key would grant full table access.
-- With them, damage is contained to the authenticated user's own data.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Products: public read, admin-only write
-- ---------------------------------------------------------------------------
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- Reviews: public read
-- ---------------------------------------------------------------------------
CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- Users: read/update own row only
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- ---------------------------------------------------------------------------
-- Orders: read own orders only
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Order items: through order ownership
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id::text = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- Carts: own cart only
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can manage own cart"
  ON carts FOR ALL
  USING (user_id::text = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Cart items: through cart ownership
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can manage own cart items"
  ON cart_items FOR ALL
  USING (
    cart_id IN (
      SELECT id FROM carts WHERE user_id::text = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- All other tables: service_role only (no public access)
-- ---------------------------------------------------------------------------
-- Tables without explicit policies (payments, helpful_votes, email_logs,
-- order_email_logs, order_email_jobs, saved_payment_methods) are denied
-- by default when RLS is enabled. Only the service_role key can access them.

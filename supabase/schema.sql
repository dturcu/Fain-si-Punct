-- ShopHub Supabase Schema Migration
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  -- Address fields (flattened from nested object)
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Email preferences (flattened from nested object)
  email_pref_order_confirmation BOOLEAN NOT NULL DEFAULT true,
  email_pref_shipping_updates BOOLEAN NOT NULL DEFAULT true,
  email_pref_promotions BOOLEAN NOT NULL DEFAULT true,
  email_pref_newsletter BOOLEAN NOT NULL DEFAULT true,
  email_pref_updated_at TIMESTAMPTZ,
  unsubscribe_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- SAVED PAYMENT METHODS (separate table for array)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stripe', 'paypal')),
  last4 TEXT,
  brand TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_payment_methods_user ON saved_payment_methods(user_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  -- Rating distribution stored as JSONB
  rating_distribution JSONB NOT NULL DEFAULT '{"5":0,"4":0,"3":0,"2":0,"1":0}',
  image TEXT,
  images TEXT[] DEFAULT '{}',
  sku TEXT UNIQUE,
  tags TEXT[] DEFAULT '{}',
  -- Extra fields from Excel import
  manifest_sku TEXT,
  source_name TEXT,
  asin TEXT,
  ean TEXT,
  barcode TEXT,
  brand TEXT,
  sub_category TEXT,
  condition TEXT DEFAULT 'New',
  grade TEXT,
  weight NUMERIC(10,3),
  currency TEXT DEFAULT 'RON',
  total_rrp NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Generated tsvector column for full-text search (Romanian language)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('romanian', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(category, ''))
  ) STORED
);

CREATE INDEX idx_products_search ON products USING gin(search_vector);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_avg_rating ON products(avg_rating);
CREATE INDEX idx_products_category_price ON products(category, price);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id),
  guest_session_id TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  -- Customer info (denormalized for order history)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  -- Shipping address
  shipping_street TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_zip TEXT,
  shipping_country TEXT,
  -- Payment
  payment_id UUID,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded', 'pending_collection')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'paypal')),
  paid_at TIMESTAMPTZ,
  -- Shipping tracking
  tracking_number TEXT,
  tracking_url TEXT,
  -- Email tracking
  last_email_sent_at TIMESTAMPTZ,
  next_email_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_guest_session ON orders(guest_session_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- ============================================
-- ORDER ITEMS (separate table for array)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image TEXT
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  type TEXT NOT NULL CHECK (type IN ('stripe', 'paypal')),
  external_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
  payment_method TEXT,
  metadata JSONB DEFAULT '{}',
  webhook_verified BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_external ON payments(external_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_order_type ON payments(order_id, type);

-- Add foreign key for orders.payment_id after payments table exists
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment FOREIGN KEY (payment_id) REFERENCES payments(id);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  helpful INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One review per user per product
  UNIQUE(product_id, user_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating DESC);
CREATE INDEX idx_reviews_product_created ON reviews(product_id, created_at DESC);
CREATE INDEX idx_reviews_product_helpful ON reviews(product_id, helpful DESC);

-- ============================================
-- HELPFUL VOTES (separate table for array)
-- ============================================
CREATE TABLE IF NOT EXISTS helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One vote per user per review
  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_helpful_votes_review ON helpful_votes(review_id);

-- ============================================
-- CARTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  guest_session_id TEXT UNIQUE,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Either user_id or guest_session_id must be set
  CONSTRAINT carts_owner_check CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL)
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_guest_session ON carts(guest_session_id);

-- ============================================
-- CART ITEMS (separate table for array)
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  image TEXT,
  UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ============================================
-- EMAIL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_confirmation', 'shipping_update', 'password_reset', 'welcome', 'promotional')),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_retry' CHECK (status IN ('sent', 'failed', 'bounced', 'pending_retry')),
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  message_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient, type, status);
CREATE INDEX idx_email_logs_user ON email_logs(user_id, type);
CREATE INDEX idx_email_logs_order ON email_logs(order_id);
CREATE INDEX idx_email_logs_status ON email_logs(status, next_retry_at);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_retry ON email_logs(status, retry_count, next_retry_at);

-- ============================================
-- ORDER EMAIL LOGS (join table)
-- ============================================
CREATE TABLE IF NOT EXISTS order_email_logs (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  email_log_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  PRIMARY KEY (order_id, email_log_id)
);

-- ============================================
-- ORDER EMAIL JOBS (tracking Bull job IDs)
-- ============================================
CREATE TABLE IF NOT EXISTS order_email_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL
);

CREATE INDEX idx_order_email_jobs_order ON order_email_jobs(order_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CART TOTAL TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_cart_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE carts SET total = (
    SELECT COALESCE(SUM(price * quantity), 0)
    FROM cart_items WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
  ) WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_total_on_insert AFTER INSERT ON cart_items FOR EACH ROW EXECUTE FUNCTION update_cart_total();
CREATE TRIGGER update_cart_total_on_update AFTER UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_cart_total();
CREATE TRIGGER update_cart_total_on_delete AFTER DELETE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_cart_total();

-- ============================================
-- STOCK INCREMENT FUNCTION (used for payment failure rollback)
-- ============================================
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = stock + p_quantity WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Guest-session column migration
-- ============================================================================
--
-- Adds guest_session_id to `carts` and `orders` in production Supabase
-- projects whose schema was created before guest checkout landed.
--
-- schema.sql DECLARES these columns on fresh installs; this file PATCHES
-- the columns in on already-deployed databases. Idempotent.
--
-- Symptom without this migration:
--   PostgrestError 42703: 'column carts.guest_session_id does not exist'
--   on every POST /api/cart, GET /api/cart, and /api/checkout.
--
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- carts
-- ---------------------------------------------------------------------------
ALTER TABLE carts ADD COLUMN IF NOT EXISTS guest_session_id TEXT;

-- The original schema.sql declares `guest_session_id TEXT UNIQUE`. Only add
-- the unique constraint if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.carts'::regclass
      AND conname  = 'carts_guest_session_id_key'
  ) THEN
    ALTER TABLE carts ADD CONSTRAINT carts_guest_session_id_key UNIQUE (guest_session_id);
  END IF;
END $$;

-- Owner-check constraint: either user_id OR guest_session_id must be set.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.carts'::regclass
      AND conname  = 'carts_owner_check'
  ) THEN
    -- Before adding NOT NULL-style check, make sure any legacy rows conform.
    -- Any pre-existing row without user_id would already have failed insert
    -- under the old schema, so this should be safe.
    ALTER TABLE carts
      ADD CONSTRAINT carts_owner_check
      CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_carts_guest_session ON carts (guest_session_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_guest_session ON orders (guest_session_id);

-- Some deployments may still have `user_id` as NOT NULL. Making it nullable
-- is required for guest orders — relax only if currently NOT NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
      AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

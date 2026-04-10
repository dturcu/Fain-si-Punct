-- Migration: Unify payment method enum and add transactional checkout
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Update payment_method CHECK constraint
--    Old: ('stripe', 'paypal')
--    New: ('card', 'revolut', 'paypal', 'ramburs')
-- ============================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('card', 'revolut', 'paypal', 'ramburs'));

-- Migrate existing data from old enum values to new ones
UPDATE orders SET payment_method = 'card' WHERE payment_method = 'stripe';
UPDATE orders SET payment_method = 'ramburs' WHERE payment_method IS NULL;

-- ============================================
-- 2. Transactional checkout function
--    Atomically: check stock, decrement stock,
--    create order + items, clear cart.
-- ============================================
CREATE OR REPLACE FUNCTION process_checkout(
  p_user_id UUID,
  p_guest_session_id TEXT,
  p_items JSONB,
  p_customer JSONB,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_order_number TEXT,
  p_total NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_current_stock INT;
  v_variant_stock INT;
  v_variant_price NUMERIC;
  v_product_price NUMERIC;
  v_product_name TEXT;
  v_payment_status TEXT;
  v_order_status TEXT;
BEGIN
  -- Determine payment/order status based on method
  IF p_payment_method = 'ramburs' THEN
    v_payment_status := 'pending_collection';
    v_order_status := 'processing';
  ELSE
    v_payment_status := 'unpaid';
    v_order_status := 'pending';
  END IF;

  -- Lock and decrement stock for each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_item->>'variantId' IS NOT NULL AND v_item->>'variantId' != '' THEN
      -- Variant item: lock variant row
      SELECT stock, price_override INTO v_variant_stock, v_variant_price
      FROM product_variants
      WHERE id = (v_item->>'variantId')::UUID
      FOR UPDATE;

      SELECT price, name INTO v_product_price, v_product_name
      FROM products
      WHERE id = (v_item->>'productId')::UUID;

      IF v_variant_stock IS NULL THEN
        RAISE EXCEPTION 'Variant not found: %', v_item->>'variantId';
      END IF;

      IF v_variant_stock < (v_item->>'quantity')::INT THEN
        RAISE EXCEPTION 'Insufficient stock for variant of product %', v_product_name;
      END IF;

      UPDATE product_variants
      SET stock = stock - (v_item->>'quantity')::INT
      WHERE id = (v_item->>'variantId')::UUID;
    ELSE
      -- Regular product: lock product row
      SELECT stock, name INTO v_current_stock, v_product_name
      FROM products
      WHERE id = (v_item->>'productId')::UUID
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', v_item->>'productId';
      END IF;

      IF v_current_stock < (v_item->>'quantity')::INT THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product_name;
      END IF;

      UPDATE products
      SET stock = stock - (v_item->>'quantity')::INT
      WHERE id = (v_item->>'productId')::UUID;
    END IF;
  END LOOP;

  -- Create the order
  INSERT INTO orders (
    order_number, user_id, guest_session_id, total,
    status, payment_method, payment_status,
    customer_name, customer_email, customer_phone,
    shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country
  ) VALUES (
    p_order_number,
    p_user_id,
    p_guest_session_id,
    p_total,
    v_order_status,
    p_payment_method,
    v_payment_status,
    p_customer->>'name',
    p_customer->>'email',
    p_customer->>'phone',
    p_shipping_address->>'street',
    p_shipping_address->>'city',
    p_shipping_address->>'state',
    p_shipping_address->>'zip',
    p_shipping_address->>'country'
  ) RETURNING id INTO v_order_id;

  -- Insert order items
  INSERT INTO order_items (order_id, product_id, name, price, quantity, image, variant_id, variant_label)
  SELECT
    v_order_id,
    (item->>'productId')::UUID,
    item->>'name',
    (item->>'price')::NUMERIC,
    (item->>'quantity')::INT,
    item->>'image',
    CASE WHEN item->>'variantId' IS NOT NULL AND item->>'variantId' != ''
      THEN (item->>'variantId')::UUID ELSE NULL END,
    item->>'variantLabel'
  FROM jsonb_array_elements(p_items) AS item;

  -- Clear the cart
  IF p_user_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = p_user_id);
    DELETE FROM carts WHERE user_id = p_user_id;
  ELSIF p_guest_session_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE guest_session_id = p_guest_session_id);
    DELETE FROM carts WHERE guest_session_id = p_guest_session_id;
  END IF;

  RETURN jsonb_build_object('order_id', v_order_id, 'total', p_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

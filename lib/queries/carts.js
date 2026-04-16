import { supabaseAdmin } from '../supabase'

/**
 * Cart queries. Two shapes of cart share nearly all logic:
 *   - authenticated user carts, keyed by user_id
 *   - guest session carts, keyed by guest_session_id
 *
 * Both write to the same `carts` / `cart_items` tables. The exports below
 * are the authenticated-user set; guest equivalents live in guest-carts.js.
 *
 * recalculateCartTotal() is shared and exported so the guest module can
 * reuse it — it walks cart_items for a cart_id regardless of owner.
 */

export async function getCartByUserId(userId) {
  const { data: cart, error } = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error?.code === 'PGRST116') {
    return { id: null, userId, items: [], total: 0 }
  }
  if (error) throw error

  const { data: items } = await supabaseAdmin
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)

  return cartRowToObj(cart, items || [])
}

export async function addToCart(
  userId,
  productId,
  productName,
  productPrice,
  productImage,
  quantity,
  variantId = null,
  variantLabel = null
) {
  let cart = await getCartByUserId(userId)

  if (!cart.id) {
    const { data: newCart, error } = await supabaseAdmin
      .from('carts')
      .insert({ user_id: userId, total: 0 })
      .select()
      .single()
    if (error) throw error
    cart = cartRowToObj(newCart, [])
  }

  await upsertCartItem(cart.id, productId, productName, productPrice, productImage, quantity, variantId, variantLabel)
  await recalculateCartTotal(cart.id)
  return getCartByUserId(userId)
}

export async function updateCartItemQuantity(userId, itemId, quantity) {
  const cart = await getCartByUserId(userId)

  await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)

  await recalculateCartTotal(cart.id)
  return getCartByUserId(userId)
}

export async function removeFromCart(userId, itemId) {
  const cart = await getCartByUserId(userId)

  await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', itemId)

  await recalculateCartTotal(cart.id)
  return getCartByUserId(userId)
}

export async function clearCart(userId) {
  const cart = await getCartByUserId(userId)
  if (cart.id) {
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
  }
}

// ---------------------------------------------------------------------------
// Shared helpers (exported for guest-carts.js reuse)
// ---------------------------------------------------------------------------

/**
 * Upsert a cart item. Matches on (cart_id, product_id [, variant_id])
 * and either increments quantity or inserts a new row.
 */
export async function upsertCartItem(cartId, productId, productName, productPrice, productImage, quantity, variantId, variantLabel) {
  let existingQuery = supabaseAdmin
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .eq('product_id', productId)

  if (variantId) {
    existingQuery = existingQuery.eq('variant_id', variantId)
  } else {
    existingQuery = existingQuery.is('variant_id', null)
  }

  const { data: existingItem } = await existingQuery.single()

  if (existingItem) {
    await supabaseAdmin
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)
  } else {
    await supabaseAdmin.from('cart_items').insert({
      cart_id: cartId,
      product_id: productId,
      name: productName,
      price: productPrice,
      quantity,
      image: productImage,
      variant_id: variantId,
      variant_label: variantLabel,
    })
  }
}

export async function recalculateCartTotal(cartId) {
  const { data: items, error } = await supabaseAdmin
    .from('cart_items')
    .select('price, quantity')
    .eq('cart_id', cartId)

  if (error) throw error

  const total = (items || []).reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  )

  await supabaseAdmin
    .from('carts')
    .update({ total })
    .eq('id', cartId)
}

export function cartRowToObj(row, items = []) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    items: items.map((item) => ({
      _id: item.id,
      productId: item.product_id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      image: item.image,
      variantId: item.variant_id || null,
      variantLabel: item.variant_label || null,
    })),
    total: parseFloat(row.total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

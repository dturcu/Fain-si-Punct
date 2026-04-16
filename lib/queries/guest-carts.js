import { supabaseAdmin } from '../supabase'
import { upsertCartItem, recalculateCartTotal, cartRowToObj } from './carts'

/**
 * Guest cart queries — same schema as authenticated carts but keyed by
 * `guest_session_id`. migrateGuestToUser() merges a guest cart into a
 * user's cart upon sign-up/login.
 */

export async function getCartByGuestSession(guestSessionId) {
  const { data: cart, error } = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('guest_session_id', guestSessionId)
    .single()

  if (error?.code === 'PGRST116') {
    return { id: null, guestSessionId, items: [], total: 0 }
  }
  if (error) throw error

  const { data: items } = await supabaseAdmin
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)

  return cartRowToObj(cart, items || [])
}

export async function addToGuestCart(
  guestSessionId,
  productId,
  productName,
  productPrice,
  productImage,
  quantity,
  variantId = null,
  variantLabel = null
) {
  let cart = await getCartByGuestSession(guestSessionId)

  if (!cart.id) {
    const { data: newCart, error } = await supabaseAdmin
      .from('carts')
      .insert({ guest_session_id: guestSessionId, total: 0 })
      .select()
      .single()
    if (error) throw error
    cart = cartRowToObj(newCart, [])
  }

  await upsertCartItem(cart.id, productId, productName, productPrice, productImage, quantity, variantId, variantLabel)
  await recalculateCartTotal(cart.id)
  return getCartByGuestSession(guestSessionId)
}

export async function updateGuestCartItemQuantity(guestSessionId, itemId, quantity) {
  const cart = await getCartByGuestSession(guestSessionId)

  await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)

  await recalculateCartTotal(cart.id)
  return getCartByGuestSession(guestSessionId)
}

export async function removeFromGuestCart(guestSessionId, itemId) {
  const cart = await getCartByGuestSession(guestSessionId)

  await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', itemId)

  await recalculateCartTotal(cart.id)
  return getCartByGuestSession(guestSessionId)
}

export async function clearGuestCart(guestSessionId) {
  const cart = await getCartByGuestSession(guestSessionId)
  if (cart.id) {
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
  }
}

/**
 * Migrate guest cart and orders to a newly registered user.
 * Called after a guest creates an account post-checkout.
 */
export async function migrateGuestToUser(guestSessionId, userId) {
  const { data: existingUserCart } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single()

  const { data: guestCart } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('guest_session_id', guestSessionId)
    .single()

  if (guestCart && !existingUserCart) {
    await supabaseAdmin
      .from('carts')
      .update({ user_id: userId, guest_session_id: null })
      .eq('id', guestCart.id)
  } else if (guestCart && existingUserCart) {
    // Merge: move guest items into the user's cart, then delete guest cart.
    await supabaseAdmin
      .from('cart_items')
      .update({ cart_id: existingUserCart.id })
      .eq('cart_id', guestCart.id)
    await supabaseAdmin.from('carts').delete().eq('id', guestCart.id)
    await recalculateCartTotal(existingUserCart.id)
  }

  // Migrate guest orders to user.
  await supabaseAdmin
    .from('orders')
    .update({ user_id: userId, guest_session_id: null })
    .eq('guest_session_id', guestSessionId)
}

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
  // Only "row not found" (PGRST116) is an expected absence. Anything else
  // (RLS violation, connection error) must surface — otherwise guest data
  // is silently lost.
  const isExpectedNotFound = (err) => err && err.code === 'PGRST116'

  const { data: existingUserCart, error: existingErr } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (existingErr && !isExpectedNotFound(existingErr)) throw existingErr

  const { data: guestCart, error: guestErr } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('guest_session_id', guestSessionId)
    .single()
  if (guestErr && !isExpectedNotFound(guestErr)) throw guestErr

  if (guestCart && !existingUserCart) {
    const { error } = await supabaseAdmin
      .from('carts')
      .update({ user_id: userId, guest_session_id: null })
      .eq('id', guestCart.id)
    if (error) throw error
  } else if (guestCart && existingUserCart) {
    // Merge: move guest items into the user's cart, then delete guest cart.
    const { error: moveErr } = await supabaseAdmin
      .from('cart_items')
      .update({ cart_id: existingUserCart.id })
      .eq('cart_id', guestCart.id)
    if (moveErr) throw moveErr
    const { error: delErr } = await supabaseAdmin.from('carts').delete().eq('id', guestCart.id)
    if (delErr) throw delErr
    await recalculateCartTotal(existingUserCart.id)
  }

  // Migrate guest orders to user.
  const { error: ordersErr } = await supabaseAdmin
    .from('orders')
    .update({ user_id: userId, guest_session_id: null })
    .eq('guest_session_id', guestSessionId)
  if (ordersErr) throw ordersErr
}

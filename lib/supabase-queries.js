import { supabaseAdmin } from './supabase'

// ============================================
// USER OPERATIONS
// ============================================

export async function getUserById(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return userRowToObj(data)
}

export async function getUserByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error?.code === 'PGRST116') return null // Not found
  if (error) throw error
  return userRowToObj(data)
}

export async function createUser(email, passwordHash, firstName, lastName) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: 'customer',
    })
    .select()
    .single()

  if (error) throw error
  return userRowToObj(data)
}

export async function updateUserById(userId, updates) {
  const row = {}
  if (updates.firstName !== undefined) row.first_name = updates.firstName
  if (updates.lastName !== undefined) row.last_name = updates.lastName
  if (updates.phone !== undefined) row.phone = updates.phone
  if (updates.address !== undefined) {
    row.address_street = updates.address?.street
    row.address_city = updates.address?.city
    row.address_state = updates.address?.state
    row.address_zip = updates.address?.zip
    row.address_country = updates.address?.country
  }
  if (updates.emailPreferences !== undefined) {
    row.email_pref_order_confirmation = updates.emailPreferences?.orderConfirmation
    row.email_pref_shipping_updates = updates.emailPreferences?.shippingUpdates
    row.email_pref_promotions = updates.emailPreferences?.promotions
    row.email_pref_newsletter = updates.emailPreferences?.newsletter
    row.email_pref_updated_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(row)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return userRowToObj(data)
}

function userRowToObj(row) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    address: {
      street: row.address_street,
      city: row.address_city,
      state: row.address_state,
      zip: row.address_zip,
      country: row.address_country,
    },
    role: row.role,
    isActive: row.is_active,
    emailPreferences: {
      orderConfirmation: row.email_pref_order_confirmation,
      shippingUpdates: row.email_pref_shipping_updates,
      promotions: row.email_pref_promotions,
      newsletter: row.email_pref_newsletter,
      updatedAt: row.email_pref_updated_at,
    },
    unsubscribeToken: row.unsubscribe_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// ORDER OPERATIONS
// ============================================

export async function getOrderById(orderId) {
  const { data: orderRow, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) throw error

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  return orderRowToObj(orderRow, items || [])
}

export async function getOrdersByUserId(userId, limit = 10, skip = 0) {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1)

  if (error) throw error

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
      return orderRowToObj(order, items || [])
    })
  )

  return ordersWithItems
}

export async function createOrder(userId, items, total, customer, shippingAddress, orderNumber) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId,
      total,
      status: 'pending',
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_street: shippingAddress.street,
      shipping_city: shippingAddress.city,
      shipping_state: shippingAddress.state,
      shipping_zip: shippingAddress.zip,
      shipping_country: shippingAddress.country,
    })
    .select()
    .single()

  if (error) throw error

  // Insert order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }))

  await supabaseAdmin.from('order_items').insert(orderItems)

  return orderRowToObj(order, items)
}

export async function updateOrderStatus(orderId, status, updates = {}) {
  const row = { status }
  if (updates.trackingNumber) row.tracking_number = updates.trackingNumber
  if (updates.trackingUrl) row.tracking_url = updates.trackingUrl
  if (updates.paymentStatus) row.payment_status = updates.paymentStatus
  if (updates.paidAt) row.paid_at = updates.paidAt

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(row)
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  return orderRowToObj(data, items || [])
}

function orderRowToObj(row, items = []) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    items: items.map(item => ({
      productId: item.product_id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      image: item.image,
    })),
    total: parseFloat(row.total),
    status: row.status,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    shippingAddress: {
      street: row.shipping_street,
      city: row.shipping_city,
      state: row.shipping_state,
      zip: row.shipping_zip,
      country: row.shipping_country,
    },
    paymentId: row.payment_id,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at,
    trackingNumber: row.tracking_number,
    trackingUrl: row.tracking_url,
    lastEmailSentAt: row.last_email_sent_at,
    nextEmailRetryAt: row.next_email_retry_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// CART OPERATIONS
// ============================================

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

export async function addToCart(userId, productId, productName, productPrice, productImage, quantity) {
  let cart = await getCartByUserId(userId)

  if (!cart.id) {
    // Create cart if doesn't exist
    const { data: newCart, error } = await supabaseAdmin
      .from('carts')
      .insert({ user_id: userId, total: 0 })
      .select()
      .single()

    if (error) throw error
    cart = cartRowToObj(newCart, [])
  }

  // Check if item exists
  const { data: existingItem } = await supabaseAdmin
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .single()

  if (existingItem) {
    await supabaseAdmin
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)
  } else {
    await supabaseAdmin.from('cart_items').insert({
      cart_id: cart.id,
      product_id: productId,
      name: productName,
      price: productPrice,
      quantity,
      image: productImage,
    })
  }

  return getCartByUserId(userId)
}

export async function updateCartItemQuantity(userId, itemId, quantity) {
  const cart = await getCartByUserId(userId)

  await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)

  return getCartByUserId(userId)
}

export async function removeFromCart(userId, itemId) {
  await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', itemId)

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

function cartRowToObj(row, items = []) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    items: items.map(item => ({
      _id: item.id,
      productId: item.product_id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      image: item.image,
    })),
    total: parseFloat(row.total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

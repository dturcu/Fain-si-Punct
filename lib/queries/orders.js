import { supabaseAdmin } from '../supabase'

/**
 * Order queries — read (with N+1-safe items join), create, status updates.
 */

export async function getOrderById(orderId) {
  // Single query with nested select — eliminates N+1 (one query per order)
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (error) throw error
  const { order_items: items, ...order } = data
  return orderRowToObj(order, items || [])
}

export async function getOrdersByUserId(userId, limit = 10, skip = 0) {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1)

  if (error) throw error

  return (orders || []).map(({ order_items: items, ...order }) =>
    orderRowToObj(order, items || [])
  )
}

export async function createOrder(
  userId,
  items,
  total,
  customer,
  shippingAddress,
  orderNumber,
  paymentMethod = 'card',
  guestSessionId = null
) {
  const dbPaymentMethod = paymentMethod || 'ramburs'
  // ramburs = cash on delivery; payment collected at delivery, not upfront.
  const paymentStatus = paymentMethod === 'ramburs' ? 'pending_collection' : 'unpaid'

  const orderRow = {
    order_number: orderNumber,
    total,
    status: paymentMethod === 'ramburs' ? 'processing' : 'pending',
    payment_method: dbPaymentMethod,
    payment_status: paymentStatus,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    shipping_street: shippingAddress.street,
    shipping_city: shippingAddress.city,
    shipping_state: shippingAddress.state,
    shipping_zip: shippingAddress.zip,
    shipping_country: shippingAddress.country,
  }

  if (userId) orderRow.user_id = userId
  if (guestSessionId) orderRow.guest_session_id = guestSessionId

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert(orderRow)
    .select()
    .single()

  if (error) throw error

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    variant_id: item.variantId || null,
    variant_label: item.variantLabel || null,
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

export function orderRowToObj(row, items = []) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    guestSessionId: row.guest_session_id,
    items: items.map((item) => ({
      productId: item.product_id ?? item.productId,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      image: item.image,
      variantId: item.variant_id ?? item.variantId ?? null,
      variantLabel: item.variant_label ?? item.variantLabel ?? null,
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

import { supabaseAdmin } from '@/lib/supabase'

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const status = searchParams.get('status')

    let query = supabaseAdmin.from('orders').select('*')

    if (email) {
      query = query.eq('customer_email', email)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
        return orderRowToObj(order, items || [])
      })
    )

    return Response.json({ success: true, data: ordersWithItems })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        ...orderObjToRow(body),
        order_number: generateOrderNumber(),
      })
      .select()
      .single()

    if (error) throw error

    return Response.json(
      { success: true, data: orderRowToObj(order, body.items || []) },
      { status: 201 }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function orderObjToRow(body) {
  return {
    user_id: body.userId,
    total: body.total,
    status: body.status || 'pending',
    customer_name: body.customer?.name,
    customer_email: body.customer?.email,
    customer_phone: body.customer?.phone,
    shipping_street: body.shippingAddress?.street,
    shipping_city: body.shippingAddress?.city,
    shipping_state: body.shippingAddress?.state,
    shipping_zip: body.shippingAddress?.zip,
    shipping_country: body.shippingAddress?.country,
    payment_method: body.paymentMethod,
  }
}

export { orderRowToObj, orderObjToRow }

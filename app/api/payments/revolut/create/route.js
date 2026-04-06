import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken, getGuestSessionId } from '@/lib/auth'
import { createRevolutOrder, toMinorUnits } from '@/lib/revolut'

export async function POST(request) {
  try {
    const token = getCookieToken(request)
    const decoded = token ? verifyToken(token) : null
    const guestSessionId = getGuestSessionId(request)

    if (!decoded && !guestSessionId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return Response.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify ownership: user or guest session
    const isOwner = (decoded && order.user_id === decoded.userId) ||
      (guestSessionId && order.guest_session_id === guestSessionId)
    if (!isOwner) {
      return Response.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Check if already paid
    if (order.payment_status === 'paid') {
      return Response.json(
        { success: false, error: 'Order already paid' },
        { status: 400 }
      )
    }

    // Create Revolut payment order
    const revolutOrder = await createRevolutOrder({
      amount: toMinorUnits(order.total),
      currency: 'RON',
      description: `Comanda Fain si Punct #${order.order_number}`,
      merchantOrderId: order.id,
      customerEmail: order.customer_email,
      shippingAddress: {
        street: order.shipping_street,
        city: order.shipping_city,
        state: order.shipping_state,
        zip: order.shipping_zip,
      },
    })

    // Store Revolut order ID on our order
    // Try payment_provider_id column, fall back to tracking_url if column doesn't exist
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_provider_id: revolutOrder.id,
        payment_status: 'processing',
      })
      .eq('id', orderId)

    if (updateError) {
      // Column might not exist yet, store in tracking_url as fallback
      await supabaseAdmin
        .from('orders')
        .update({
          tracking_url: `revolut:${revolutOrder.id}`,
          payment_status: 'processing',
        })
        .eq('id', orderId)
    }

    return Response.json({
      success: true,
      data: {
        revolutOrderId: revolutOrder.id,
        publicId: revolutOrder.public_id,
        token: revolutOrder.token,
      },
    })
  } catch (error) {
    console.error('Revolut create order error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

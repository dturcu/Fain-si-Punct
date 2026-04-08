import { supabaseAdmin } from '@/lib/supabase'
import { getUserById, orderRowToObj } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { sendShippingNotification } from '@/lib/email'

export async function PUT(request, { params }) {
  try {
    const token = getCookieToken(request)
    if (!token) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { status, trackingNumber, trackingUrl } = await request.json()

    if (!status) {
      return Response.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return Response.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const oldStatus = order.status

    // Enforce state machine transitions — prevent nonsensical moves
    const allowedTransitions = {
      pending:     ['processing', 'cancelled'],
      processing:  ['shipped', 'cancelled'],
      shipped:     ['delivered', 'cancelled'],
      delivered:   [], // terminal
      cancelled:   [], // terminal
    }
    const allowed = allowedTransitions[oldStatus] || []
    if (oldStatus !== status && !allowed.includes(status)) {
      return Response.json(
        {
          success: false,
          error: `Cannot transition order from '${oldStatus}' to '${status}'. Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`,
        },
        { status: 422 }
      )
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Send shipping notification if status changed to shipped
    if (oldStatus !== 'shipped' && status === 'shipped' && trackingNumber && trackingUrl) {
      try {
        const orderUser = await getUserById(order.user_id)

        if (orderUser?.emailPreferences?.shippingUpdates !== false) {
          const emailResult = await sendShippingNotification(
            updatedOrder,
            trackingNumber,
            trackingUrl,
            order.customer_email
          )

          if (emailResult.success) {
            // Log the email
            await supabaseAdmin.from('email_logs').insert({
              recipient: order.customer_email,
              type: 'shipping_update',
              subject: `Your Order is Shipping - ${order.order_number}`,
              order_id: order.id,
              user_id: order.user_id,
              status: 'sent',
              message_id: emailResult.messageId,
              sent_at: emailResult.timestamp,
              metadata: {
                orderNumber: order.order_number,
                trackingNumber,
                trackingUrl,
              },
            })

            // Update order with last email sent time
            await supabaseAdmin
              .from('orders')
              .update({ last_email_sent_at: new Date().toISOString() })
              .eq('id', id)
          }
        }
      } catch (emailError) {
        console.error('Failed to send shipping notification:', emailError)
        // Don't fail the order update if email fails
      }
    }

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return Response.json({
      success: true,
      data: orderRowToObj(updatedOrder, items || []),
    })
  } catch (error) {
    console.error('Update order status error:', error)
    return Response.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}


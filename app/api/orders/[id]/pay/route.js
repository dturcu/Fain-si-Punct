import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken, getGuestSessionId } from '@/lib/auth'

export async function POST(request, { params }) {
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

    const { id } = await params

    // Get order and verify ownership
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

    const isOwner = (decoded && order.user_id === decoded.userId) ||
      (guestSessionId && order.guest_session_id === guestSessionId)
    if (!isOwner) {
      return Response.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Update payment status and order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return Response.json({
      success: true,
      data: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.payment_status,
        total: parseFloat(updatedOrder.total),
      },
    })
  } catch (error) {
    
    console.error('orders/[id]/pay error:', error)

    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

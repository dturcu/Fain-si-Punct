import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken, getGuestSessionId } from '@/lib/auth'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

export async function POST(request, { params }) {
  try {
    const token = getCookieToken(request)
    const decoded = token ? verifyToken(token) : null
    const guestSessionId = getGuestSessionId(request)

    if (!decoded && !guestSessionId) {
      return apiError(ERROR_CODES.UNAUTHORIZED)
    }

    const { id } = await params

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return apiError(ERROR_CODES.ORDER_NOT_FOUND)
    }

    const isOwner = (decoded && order.user_id === decoded.userId) ||
      (guestSessionId && order.guest_session_id === guestSessionId)
    if (!isOwner) {
      return apiError(ERROR_CODES.FORBIDDEN)
    }

    // Only allow marking as paid for cash-on-delivery orders.
    // Card/PayPal/Revolut payments must be verified through the provider webhook.
    if (order.payment_method !== 'ramburs') {
      return apiError(ERROR_CODES.FORBIDDEN, {
        details: 'payment status is managed by the provider for this method',
      })
    }

    // Prevent double-marking
    if (order.payment_status === 'paid') {
      return apiError(ERROR_CODES.ORDER_ALREADY_PAID)
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid', status: 'processing' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const { ip, userAgent } = getRequestMeta(request)
    await logAuditEvent('payment_success', {
      userId: decoded?.userId || null,
      ip,
      userAgent,
      metadata: { orderId: id, orderNumber: updatedOrder.order_number, method: 'ramburs' },
    })

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
    return handleApiError(error, 'orders/[id]/pay')
  }
}

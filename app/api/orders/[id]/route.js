import { supabaseAdmin } from '@/lib/supabase'
import { getUserById, orderRowToObj } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken, getGuestSessionId } from '@/lib/auth'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

export async function GET(request, { params }) {
  try {
    const token = getCookieToken(request)
    const decoded = token ? verifyToken(token) : null
    const guestSessionId = getGuestSessionId(request)

    if (!decoded && !guestSessionId) {
      return apiError(ERROR_CODES.UNAUTHORIZED)
    }

    const { id } = await params

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !order) {
      return apiError(ERROR_CODES.ORDER_NOT_FOUND)
    }

    // Verify access: owner (user or guest session) or admin
    let hasAccess = false
    if (decoded) {
      const user = await getUserById(decoded.userId)
      hasAccess = order.user_id === decoded.userId || (user && user.role === 'admin')
    }
    if (!hasAccess && guestSessionId && order.guest_session_id === guestSessionId) {
      hasAccess = true
    }

    if (!hasAccess) {
      return apiError(ERROR_CODES.FORBIDDEN)
    }

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return Response.json({ success: true, data: orderRowToObj(order, items || []) })
  } catch (error) {
    return handleApiError(error, 'orders/[id] GET')
  }
}

export async function PUT(request, { params }) {
  try {
    const token = getCookieToken(request)
    if (!token) return apiError(ERROR_CODES.UNAUTHORIZED)
    const decoded = verifyToken(token)
    if (!decoded) return apiError(ERROR_CODES.INVALID_TOKEN)

    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return apiError(ERROR_CODES.FORBIDDEN)
    }

    const { id } = await params
    const body = await request.json()

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: body.status,
        payment_status: body.paymentStatus,
        tracking_number: body.trackingNumber,
        tracking_url: body.trackingUrl,
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !order) {
      return apiError(ERROR_CODES.ORDER_NOT_FOUND)
    }

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return Response.json({ success: true, data: orderRowToObj(order, items || []) })
  } catch (error) {
    return handleApiError(error, 'orders/[id] PUT')
  }
}

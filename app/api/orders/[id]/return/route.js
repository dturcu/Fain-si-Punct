import { getOrderById } from '@/lib/supabase-queries'
import { getSessionContext } from '@/lib/auth'
import { createReturnRequest, getReturnsByOrder, REASON_CODES } from '@/lib/queries/returns'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

/**
 * Customer-facing return request endpoint.
 * POST /api/orders/[id]/return
 *
 * Validates:
 *   - session owns the order (user_id OR guest_session_id match)
 *   - order was delivered within the last 14 days (OUG 34/2014)
 *   - no existing open return for the order
 *   - reasonCode is recognized
 *   - items array references valid order_items with non-zero quantities
 */
const RETURN_WINDOW_DAYS = 14

export async function POST(request, { params }) {
  try {
    const session = getSessionContext(request)
    if (!session.userId && !session.guestSessionId) {
      return apiError(ERROR_CODES.UNAUTHORIZED)
    }

    const { id: orderId } = await params

    const order = await getOrderById(orderId)
    if (!order) return apiError(ERROR_CODES.ORDER_NOT_FOUND)

    // Ownership
    const isOwner =
      (session.userId && order.userId === session.userId) ||
      (session.guestSessionId && order.guestSessionId === session.guestSessionId)
    if (!isOwner) return apiError(ERROR_CODES.FORBIDDEN)

    // Order must be in a refundable state
    if (order.status !== 'delivered' && order.status !== 'shipped') {
      return apiError(ERROR_CODES.VALIDATION_FAILED, {
        details: 'order not yet delivered',
      })
    }

    // 14-day window from createdAt (or from shippedAt if we had it)
    const orderedAt = new Date(order.createdAt)
    const windowMs = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
    if (Date.now() - orderedAt.getTime() > windowMs) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, {
        details: `return window (${RETURN_WINDOW_DAYS} days) expired`,
      })
    }

    // No existing open return
    const existing = await getReturnsByOrder(orderId)
    const hasOpen = existing.some((r) => r.status === 'requested' || r.status === 'approved')
    if (hasOpen) {
      return apiError(ERROR_CODES.PAYMENT_IN_PROGRESS, {
        details: 'an open return already exists for this order',
      })
    }

    const body = await request.json()
    const { reasonCode, reasonNote, items } = body

    if (!REASON_CODES.includes(reasonCode)) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, {
        details: `reasonCode must be one of: ${REASON_CODES.join(', ')}`,
      })
    }

    // Validate items: array of { orderItemId, quantity } where quantity > 0
    // and each orderItemId references a real line in the order.
    if (!Array.isArray(items) || items.length === 0) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'items required' })
    }
    const orderProductIds = new Set((order.items || []).map((i) => i.productId))
    for (const line of items) {
      if (!line || typeof line !== 'object') {
        return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'invalid item shape' })
      }
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'invalid item quantity' })
      }
      // productId is REQUIRED — otherwise downstream approval/refund has no
      // line to reconcile against.
      if (!line.productId) {
        return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'productId required on each line' })
      }
      if (!orderProductIds.has(line.productId)) {
        return apiError(ERROR_CODES.VALIDATION_FAILED, {
          details: `productId not in order: ${line.productId}`,
        })
      }
    }

    let ret
    try {
      ret = await createReturnRequest({
        orderId,
        userId: session.userId || null,
        guestSessionId: session.userId ? null : session.guestSessionId,
        reasonCode,
        reasonNote,
        items,
      })
    } catch (err) {
      // 23505 = unique_violation. Our partial unique index
      // idx_returns_one_open_per_order fires when a second open return is
      // requested concurrently — map to the "in progress" error.
      if (err?.code === '23505') {
        return apiError(ERROR_CODES.PAYMENT_IN_PROGRESS, {
          details: 'an open return already exists for this order',
        })
      }
      throw err
    }

    const { ip, userAgent } = getRequestMeta(request)
    await logAuditEvent('order_created', {
      userId: session.userId || null,
      ip,
      userAgent,
      metadata: { returnRequest: true, returnId: ret.id, orderId, reasonCode },
    })

    return Response.json({ success: true, data: ret }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'orders/[id]/return')
  }
}

/**
 * GET — returns list of return requests for this order (owner or admin).
 */
export async function GET(request, { params }) {
  try {
    const session = getSessionContext(request)
    if (!session.userId && !session.guestSessionId) {
      return apiError(ERROR_CODES.UNAUTHORIZED)
    }

    const { id: orderId } = await params
    const order = await getOrderById(orderId)
    if (!order) return apiError(ERROR_CODES.ORDER_NOT_FOUND)

    const isOwner =
      (session.userId && order.userId === session.userId) ||
      (session.guestSessionId && order.guestSessionId === session.guestSessionId)
    if (!isOwner) return apiError(ERROR_CODES.FORBIDDEN)

    const returns = await getReturnsByOrder(orderId)
    return Response.json({ success: true, data: returns })
  } catch (error) {
    return handleApiError(error, 'orders/[id]/return GET')
  }
}

import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById, getOrderById } from '@/lib/supabase-queries'
import { supabaseAdmin } from '@/lib/supabase'
import { getReturnById, transitionReturn } from '@/lib/queries/returns'
import { refundPayment } from '@/lib/stripe'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

async function requireAdmin(request) {
  const token = getCookieToken(request)
  if (!token) return { error: apiError(ERROR_CODES.UNAUTHORIZED) }
  const decoded = verifyToken(token)
  if (!decoded) return { error: apiError(ERROR_CODES.INVALID_TOKEN) }
  const user = await getUserById(decoded.userId)
  if (!user || user.role !== 'admin') return { error: apiError(ERROR_CODES.FORBIDDEN) }
  return { decoded, user }
}

/**
 * PUT /api/admin/returns/[id]
 * Body: { action: 'approve' | 'reject' | 'refund' | 'cancel', note?, refundAmount? }
 *
 * Flow:
 *   - approve: request -> approved (no money moves yet).
 *   - reject:  request -> rejected.
 *   - refund:  approved -> refunded (triggers Stripe refund if the original
 *              payment was via Stripe; stores external refund id).
 *   - cancel:  request or approved -> cancelled.
 */
export async function PUT(request, { params }) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const { action, note, refundAmount } = body || {}

    const ret = await getReturnById(id)
    if (!ret) return apiError(ERROR_CODES.ORDER_NOT_FOUND, { details: 'return not found' })

    const { ip, userAgent } = getRequestMeta(request)
    const actionMap = {
      approve: 'approved',
      reject: 'rejected',
      refund: 'refunded',
      cancel: 'cancelled',
    }
    const nextStatus = actionMap[action]
    if (!nextStatus) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, { details: `unknown action: ${action}` })
    }

    // Special handling for refund: actually move money
    let refundExternalId = null
    let refundMethod = null
    let resolvedAmount = refundAmount

    if (nextStatus === 'refunded') {
      const order = await getOrderById(ret.orderId)
      if (!order) return apiError(ERROR_CODES.ORDER_NOT_FOUND)

      // Default refund amount to the full order total if not specified.
      if (resolvedAmount == null) resolvedAmount = order.total

      // Look up the payment row to find the provider intent id.
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('order_id', order.id)
        .eq('status', 'succeeded')
        .single()

      if (!payment) {
        // Ramburs (cash on delivery) — no provider refund. Treat as
        // manual credit: record and move on. Operator is expected to
        // issue a credit note via Oblio separately.
        refundMethod = 'ramburs_credit_note'
      } else if (payment.type === 'stripe') {
        const result = await refundPayment(payment.external_id, {
          amount: Math.round(resolvedAmount * 100),
        })
        if (!result.success) {
          return apiError(ERROR_CODES.PAYMENT_FAILED, { details: result.error })
        }
        refundExternalId = result.id
        refundMethod = 'card'
      } else {
        // PayPal / Revolut refund integration is a TODO — for now record
        // the approval and let operator refund manually in-provider.
        refundMethod = payment.type
      }
    }

    const updated = await transitionReturn(id, nextStatus, {
      adminUserId: auth.decoded.userId,
      adminNote: note,
      refundAmount: resolvedAmount,
      refundMethod,
      refundExternalId,
    })

    await logAuditEvent('admin_action', {
      userId: auth.decoded.userId,
      email: auth.user.email,
      ip,
      userAgent,
      metadata: {
        action: `return_${action}`,
        returnId: id,
        orderId: ret.orderId,
        refundAmount: resolvedAmount ?? null,
        refundMethod: refundMethod ?? null,
      },
    })

    return Response.json({ success: true, data: updated })
  } catch (error) {
    return handleApiError(error, 'admin/returns/[id] PUT')
  }
}

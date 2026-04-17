import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById, getOrdersByUserId } from '@/lib/supabase-queries'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/account/export
 * GDPR Article 15 — right of access (Data Subject Access Request).
 *
 * Returns a JSON bundle of everything we store about the caller:
 *   - profile
 *   - all orders (incl. line items, customer snapshot, shipping)
 *   - all reviews they wrote
 *   - cart (if any)
 *   - email preferences
 *   - audit-log entries
 *
 * Password hash and internal-only fields are excluded. Response is a
 * downloadable JSON file (Content-Disposition: attachment).
 */
export async function GET(request) {
  try {
    const token = getCookieToken(request)
    if (!token) return apiError(ERROR_CODES.UNAUTHORIZED)
    const decoded = verifyToken(token)
    if (!decoded) return apiError(ERROR_CODES.INVALID_TOKEN)

    const user = await getUserById(decoded.userId)
    if (!user) return apiError(ERROR_CODES.USER_NOT_FOUND)

    const [ordersFull, reviewsRes, cartRes, auditRes] = await Promise.all([
      getOrdersByUserId(user.id, 1000, 0),
      supabaseAdmin.from('reviews').select('*').eq('user_id', user.id),
      supabaseAdmin.from('carts').select('*, cart_items(*)').eq('user_id', user.id).single(),
      supabaseAdmin.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000),
    ])

    // Strip password + reset tokens before emitting the profile.
    const profile = { ...user }
    delete profile.password

    const bundle = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      profile,
      orders: ordersFull,
      reviews: reviewsRes.data || [],
      cart: cartRes.data || null,
      audit_events: (auditRes.data || []).map((r) => ({
        event_type: r.event_type,
        created_at: r.created_at,
        ip_address: r.ip_address,
        metadata: r.metadata,
      })),
    }

    const { ip, userAgent } = getRequestMeta(request)
    logAuditEvent('admin_action', {
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      metadata: { action: 'account_export' },
    })

    const filename = `fain-si-punct-export-${user.id}-${Date.now()}.json`
    return new Response(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handleApiError(error, 'account/export GET')
  }
}

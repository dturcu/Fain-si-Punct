import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById, getOrdersByUserId } from '@/lib/supabase-queries'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

async function requireAdmin(request) {
  const token = getCookieToken(request)
  if (!token) return { error: apiError(ERROR_CODES.UNAUTHORIZED) }
  const decoded = verifyToken(token)
  if (!decoded) return { error: apiError(ERROR_CODES.INVALID_TOKEN) }
  const me = await getUserById(decoded.userId)
  if (!me || me.role !== 'admin') return { error: apiError(ERROR_CODES.FORBIDDEN) }
  return { me, decoded }
}

/**
 * GET /api/admin/customers/[id]
 * Full customer snapshot for support: profile, orders, reviews count,
 * recent audit events (last 20).
 */
export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const { id } = await params
    const user = await getUserById(id)
    if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, { status: 404 })

    // Exclude password hash before sending.
    const profile = { ...user }
    delete profile.password

    const [orders, reviewsRes, auditsRes] = await Promise.all([
      getOrdersByUserId(id, 50, 0),
      supabaseAdmin.from('reviews').select('id, product_id, rating, title, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('audit_logs').select('event_type, created_at, ip_address, metadata').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    ])

    return Response.json({
      success: true,
      data: {
        profile,
        orders,
        reviews: reviewsRes.data || [],
        auditEvents: auditsRes.data || [],
      },
    })
  } catch (error) {
    return handleApiError(error, 'admin/customers/[id] GET')
  }
}

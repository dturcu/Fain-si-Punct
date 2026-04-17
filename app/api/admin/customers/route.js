import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

async function requireAdmin(request) {
  const token = getCookieToken(request)
  if (!token) return { error: apiError(ERROR_CODES.UNAUTHORIZED) }
  const decoded = verifyToken(token)
  if (!decoded) return { error: apiError(ERROR_CODES.INVALID_TOKEN) }
  const user = await getUserById(decoded.userId)
  if (!user || user.role !== 'admin') return { error: apiError(ERROR_CODES.FORBIDDEN) }
  return { user, decoded }
}

/**
 * GET /api/admin/customers?search=<email-or-name>&limit=&skip=
 * Customer support lookup. Returns up to 50 users, with counts per user
 * for open orders + total spend.
 */
export async function GET(request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)

    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, is_active, created_at')
      .neq('role', null)

    if (search) {
      const term = search.replace(/[%_"'\\]/g, '').toLowerCase()
      query = query.or(
        `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`
      )
    }

    const { data: users, error } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    // Cheap aggregate per user: order count + total spent. Uses two
    // targeted queries instead of per-user N+1.
    const ids = (users || []).map((u) => u.id)
    let stats = new Map()
    if (ids.length > 0) {
      const { data: orderRows } = await supabaseAdmin
        .from('orders')
        .select('user_id, total, status')
        .in('user_id', ids)
      for (const row of orderRows || []) {
        const s = stats.get(row.user_id) || { count: 0, totalSpent: 0 }
        s.count += 1
        s.totalSpent += parseFloat(row.total || 0)
        stats.set(row.user_id, s)
      }
    }

    return Response.json({
      success: true,
      data: (users || []).map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        ordersCount: stats.get(u.id)?.count || 0,
        totalSpent: Math.round((stats.get(u.id)?.totalSpent || 0) * 100) / 100,
      })),
    })
  } catch (error) {
    return handleApiError(error, 'admin/customers GET')
  }
}

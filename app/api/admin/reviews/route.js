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
 * GET /api/admin/reviews
 * Moderation queue. Supports ?search=&min_rating=&max_rating=&limit=&skip=.
 */
export async function GET(request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const minRating = parseInt(searchParams.get('min_rating') || '1', 10)
    const maxRating = parseInt(searchParams.get('max_rating') || '5', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)

    let query = supabaseAdmin
      .from('reviews')
      .select('*')
      .gte('rating', minRating)
      .lte('rating', maxRating)

    if (search) {
      const term = search.replace(/[%_"'\\]/g, '')
      query = query.or(`title.ilike.%${term}%,comment.ilike.%${term}%`)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error, 'admin/reviews GET')
  }
}

import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import { listReturns } from '@/lib/queries/returns'
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
 * GET /api/admin/returns
 * Admin-only list of return requests. Filter by ?status=requested etc.
 */
export async function GET(request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)

    const returns = await listReturns({ status, limit, skip })
    return Response.json({ success: true, data: returns })
  } catch (error) {
    return handleApiError(error, 'admin/returns GET')
  }
}

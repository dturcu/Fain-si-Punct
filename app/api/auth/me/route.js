import { getUserById, updateUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

function requireAuth(request) {
  const token = getCookieToken(request)
  if (!token) return { error: apiError(ERROR_CODES.UNAUTHORIZED) }
  const decoded = verifyToken(token)
  if (!decoded) return { error: apiError(ERROR_CODES.INVALID_TOKEN) }
  return { decoded }
}

export async function GET(request) {
  try {
    const { decoded, error } = requireAuth(request)
    if (error) return error

    const user = await getUserById(decoded.userId)
    if (!user) return apiError(ERROR_CODES.UNAUTHORIZED, { status: 404 })

    return Response.json({ success: true, user, data: user })
  } catch (error) {
    return handleApiError(error, 'auth/me GET')
  }
}

export async function PUT(request) {
  try {
    const { decoded, error } = requireAuth(request)
    if (error) return error

    const body = await request.json()
    const updates = {}
    if (body.firstName !== undefined) updates.firstName = body.firstName
    if (body.lastName !== undefined) updates.lastName = body.lastName
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.address !== undefined) updates.address = body.address

    const user = await updateUserById(decoded.userId, updates)
    return Response.json({ success: true, user, data: user })
  } catch (error) {
    return handleApiError(error, 'auth/me PUT')
  }
}

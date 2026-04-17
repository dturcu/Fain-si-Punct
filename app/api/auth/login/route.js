import bcrypt from 'bcryptjs'
import { createToken, getGuestSessionId } from '@/lib/auth'
import { getUserByEmail, migrateGuestToUser } from '@/lib/supabase-queries'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

export async function POST(request) {
  const { ip, userAgent } = getRequestMeta(request)
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return apiError(ERROR_CODES.EMAIL_AND_PASSWORD_REQUIRED)
    }

    const user = await getUserByEmail(email)
    if (!user) {
      await logAuditEvent('login_failed', { email, ip, userAgent, metadata: { reason: 'no_such_user' } })
      return apiError(ERROR_CODES.INVALID_CREDENTIALS)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '')
    if (!isPasswordValid) {
      await logAuditEvent('login_failed', { userId: user.id, email, ip, userAgent, metadata: { reason: 'bad_password' } })
      return apiError(ERROR_CODES.INVALID_CREDENTIALS)
    }

    await logAuditEvent('login_success', { userId: user.id, email: user.email, ip, userAgent })
    const token = createToken(user.id, user.email, user.role)

    // Migrate guest cart/orders to the logged-in user
    const guestSessionId = getGuestSessionId(request)
    if (guestSessionId) {
      try {
        await migrateGuestToUser(guestSessionId, user.id)
      } catch (migrationError) {
        console.error('Guest migration error:', migrationError)
      }
    }

    const userResponse = { ...user }
    delete userResponse.password

    const cookies = [
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
    ]
    if (guestSessionId) {
      cookies.push('guest_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
    }

    return Response.json(
      { success: true, user: userResponse },
      {
        status: 200,
        headers: { 'Set-Cookie': cookies },
      }
    )
  } catch (error) {
    return handleApiError(error, 'auth/login')
  }
}

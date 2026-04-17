import bcrypt from 'bcryptjs'
import { createToken, getGuestSessionId } from '@/lib/auth'
import { getUserByEmail, createUser, migrateGuestToUser } from '@/lib/supabase-queries'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

/**
 * Password complexity: min 8 chars, at least one letter AND one digit.
 * Uses Unicode \p{L} so the full Romanian alphabet (ă, â, î, ș, ț and
 * their capitals) counts as letters — the earlier [A-Za-zÀ-ÿ] range
 * missed ă (U+0103), ș (U+0219), ț (U+021B).
 */
function isStrongPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return false
  return /\p{L}/u.test(pw) && /\d/.test(pw)
}

export async function POST(request) {
  const { ip, userAgent } = getRequestMeta(request)
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password) {
      return apiError(ERROR_CODES.EMAIL_AND_PASSWORD_REQUIRED)
    }

    if (!isStrongPassword(password)) {
      return apiError(ERROR_CODES.WEAK_PASSWORD)
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return apiError(ERROR_CODES.EMAIL_EXISTS)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await createUser(email, hashedPassword, firstName, lastName)
    await logAuditEvent('register', { userId: user.id, email: user.email, ip, userAgent })
    const token = createToken(user.id, user.email, user.role)

    // Migrate guest cart/orders to the new user account
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
        status: 201,
        headers: { 'Set-Cookie': cookies },
      }
    )
  } catch (error) {
    return handleApiError(error, 'auth/register')
  }
}

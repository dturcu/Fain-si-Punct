import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

/**
 * POST /api/auth/reset-password
 * Validates the reset token and sets a new password.
 */
export async function POST(request) {
  const { ip, userAgent } = getRequestMeta(request)
  try {
    const { token, password } = await request.json()

    if (!token) {
      return apiError(ERROR_CODES.INVALID_TOKEN)
    }

    // Min 8 chars + letter + digit (matches register endpoint)
    if (typeof password !== 'string' || password.length < 8 || !/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
      return apiError(ERROR_CODES.WEAK_PASSWORD)
    }

    // Find user with this token
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, reset_token_expires')
      .eq('reset_token', token)
      .single()

    if (!user) {
      return apiError(ERROR_CODES.INVALID_TOKEN)
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      await supabaseAdmin
        .from('users')
        .update({ reset_token: null, reset_token_expires: null })
        .eq('id', user.id)
      return apiError(ERROR_CODES.INVALID_TOKEN)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id)

    logAuditEvent('password_reset', { userId: user.id, email: user.email, ip, userAgent })

    return Response.json({
      success: true,
      message: 'Parola a fost resetata cu succes. Te poti autentifica cu noua parola.',
    })
  } catch (error) {
    return handleApiError(error, 'auth/reset-password')
  }
}

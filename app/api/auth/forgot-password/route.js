import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { addEmailJob } from '@/lib/job-queue'
import { passwordReset } from '@/lib/templates/passwordReset'

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email with a unique token link.
 * Always returns success to prevent email enumeration.
 */
export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { success: false, error: 'Adresa de email nu este valida' },
        { status: 400 }
      )
    }

    // Look up user — but always respond with success regardless
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single()

    if (user) {
      // Generate token with 1-hour expiry
      const token = randomUUID()
      const expires = new Date()
      expires.setHours(expires.getHours() + 1)

      await supabaseAdmin
        .from('users')
        .update({
          reset_token: token,
          reset_token_expires: expires.toISOString(),
        })
        .eq('id', user.id)

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shophub.ro'
      const resetLink = `${baseUrl}/auth/reset-password?token=${token}`

      const html = passwordReset(resetLink, '1 ora')

      try {
        await addEmailJob({
          type: 'password_reset',
          recipient: user.email,
          subject: 'Resetare parola - ShopHub',
          html,
          userId: user.id,
          metadata: { resetToken: token },
        })
      } catch (emailErr) {
        console.error('Failed to queue reset email:', emailErr)
      }
    }

    // Always return success to prevent email enumeration
    return Response.json({
      success: true,
      message: 'Daca exista un cont cu aceasta adresa, vei primi un email cu instructiuni de resetare.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

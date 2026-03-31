import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/auth/reset-password
 * Validates token and sets new password.
 */
export async function POST(request) {
  try {
    const { token, password } = await request.json()

    if (!token) {
      return Response.json(
        { success: false, error: 'Token-ul de resetare lipseste' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return Response.json(
        { success: false, error: 'Parola trebuie sa aiba minim 6 caractere' },
        { status: 400 }
      )
    }

    // Find user with this token
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single()

    if (!user) {
      return Response.json(
        { success: false, error: 'Token-ul de resetare este invalid sau a expirat' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date(user.reset_token_expires) < new Date()) {
      // Clear expired token
      await supabaseAdmin
        .from('users')
        .update({ reset_token: null, reset_token_expires: null })
        .eq('id', user.id)

      return Response.json(
        { success: false, error: 'Token-ul de resetare a expirat. Te rugam sa soliciti unul nou.' },
        { status: 400 }
      )
    }

    // Hash new password and clear token
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

    return Response.json({
      success: true,
      message: 'Parola a fost resetata cu succes. Te poti autentifica cu noua parola.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

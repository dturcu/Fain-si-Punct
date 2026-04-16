import bcrypt from 'bcryptjs'
import { createToken, getGuestSessionId } from '@/lib/auth'
import { getUserByEmail, migrateGuestToUser } from '@/lib/supabase-queries'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'

export async function POST(request) {
  const { ip, userAgent } = getRequestMeta(request)
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    const user = await getUserByEmail(email)
    if (!user) {
      logAuditEvent('login_failed', { email, ip, userAgent, metadata: { reason: 'no_such_user' } })
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Note: In production, fetch actual password hash from DB
    // For now, store hashed password in 'password' field
    const isPasswordValid = await bcrypt.compare(password, user.password || '')
    if (!isPasswordValid) {
      logAuditEvent('login_failed', { userId: user.id, email, ip, userAgent, metadata: { reason: 'bad_password' } })
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    logAuditEvent('login_success', { userId: user.id, email: user.email, ip, userAgent })
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
      {
        success: true,
        user: userResponse,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookies,
        },
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

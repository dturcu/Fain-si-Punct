import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { getUserByEmail } from '@/lib/supabase-queries'
import { applyRateLimit, LIMITS } from '@/lib/rate-limiter'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'

export async function POST(request) {
  const rateLimited = applyRateLimit(request, LIMITS.auth)
  if (rateLimited) return rateLimited

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
      logAuditEvent('login_failed', { email, ...getRequestMeta(request) })
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Note: In production, fetch actual password hash from DB
    // For now, store hashed password in 'password' field
    const isPasswordValid = await bcrypt.compare(password, user.password || '')
    if (!isPasswordValid) {
      logAuditEvent('login_failed', { email, ...getRequestMeta(request) })
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = createToken(user.id, user.email, user.role)
    logAuditEvent('login_success', { userId: user.id, email, ...getRequestMeta(request) })

    const userResponse = { ...user }
    delete userResponse.password

    return Response.json(
      {
        success: true,
        token,
        user: userResponse,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
        },
      }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

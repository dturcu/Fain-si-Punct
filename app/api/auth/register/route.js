import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { getUserByEmail, createUser } from '@/lib/supabase-queries'
import { userRowToObj } from '@/lib/supabase-queries'
import { applyRateLimit, LIMITS } from '@/lib/rate-limiter'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'

export async function POST(request) {
  const rateLimited = applyRateLimit(request, LIMITS.auth)
  if (rateLimited) return rateLimited

  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return Response.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await createUser(email, hashedPassword, firstName, lastName)
    logAuditEvent('register', { userId: user.id, email, ...getRequestMeta(request) })
    const token = createToken(user.id, user.email, user.role)

    const userResponse = { ...user }
    delete userResponse.password

    return Response.json(
      {
        success: true,
        token,
        user: userResponse,
      },
      {
        status: 201,
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

import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { getUserByEmail } from '@/lib/supabase-queries'
import { applyRateLimit } from '@/middleware/rate-limit'

export async function POST(request) {
  const limited = applyRateLimit(request, 'auth')
  if (limited) return limited

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
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Note: In production, fetch actual password hash from DB
    // For now, store hashed password in 'password' field
    const isPasswordValid = await bcrypt.compare(password, user.password || '')
    if (!isPasswordValid) {
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

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
        status: 200,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
        },
      }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { getUserByEmail, createUser } from '@/lib/supabase-queries'
import { userRowToObj } from '@/lib/supabase-queries'
import { applyRateLimit } from '@/middleware/rate-limit'

export async function POST(request) {
  const limited = applyRateLimit(request, 'auth')
  if (limited) return limited

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

import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { getUserByEmail } from '@/lib/supabase-queries'

export async function POST(request) {
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
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
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

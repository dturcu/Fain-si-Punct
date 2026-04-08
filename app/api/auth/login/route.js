import bcrypt from 'bcryptjs'
import { createToken, getGuestSessionId } from '@/lib/auth'
import { getUserByEmail, migrateGuestToUser } from '@/lib/supabase-queries'
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
        token,
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

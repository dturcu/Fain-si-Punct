import bcrypt from 'bcryptjs'
import { createToken, getGuestSessionId } from '@/lib/auth'
import { getUserByEmail, createUser, migrateGuestToUser } from '@/lib/supabase-queries'
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

    // Migrate guest cart/orders to the new user account
    const guestSessionId = getGuestSessionId(request)
    if (guestSessionId) {
      try {
        await migrateGuestToUser(guestSessionId, user.id)
      } catch (migrationError) {
        console.error('Guest migration error:', migrationError)
        // Don't fail registration if migration fails
      }
    }

    const userResponse = { ...user }
    delete userResponse.password

    // Clear guest session cookie + set auth token cookie
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
        status: 201,
        headers: {
          'Set-Cookie': cookies,
        },
      }
    )
  } catch (error) {
    console.error('Register error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

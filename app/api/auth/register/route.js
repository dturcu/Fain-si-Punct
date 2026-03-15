import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    await connectDB()

    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return Response.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'customer',
    })

    const token = createToken(user._id, user.email, user.role)

    return Response.json(
      {
        success: true,
        token,
        user: user.toJSON(),
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; Max-Age=604800`,
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

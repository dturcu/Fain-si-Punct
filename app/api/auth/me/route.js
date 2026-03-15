import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { verifyToken, getCookieToken } from '@/lib/auth'

export async function GET(request) {
  try {
    await connectDB()

    const token = getCookieToken(request)
    if (!token) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      user: user.toJSON(),
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

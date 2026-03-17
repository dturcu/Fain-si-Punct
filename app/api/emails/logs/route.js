import { connectDB } from '@/lib/db'
import { verifyToken, getCookieToken } from '@/lib/auth'
import User from '@/models/User'
import EmailLog from '@/models/EmailLog'

/**
 * GET /api/emails/logs
 * View email history with filtering
 * Query params: type, status, orderId, userId, recipient, limit, page
 */
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

    // Verify user is admin
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')
    const recipient = searchParams.get('recipient')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)

    // Build filter
    const filter = {}
    if (type) filter.type = type
    if (status) filter.status = status
    if (orderId) filter.orderId = orderId
    if (userId) filter.userId = userId
    if (recipient) filter.recipient = new RegExp(recipient, 'i')

    // Get total count
    const total = await EmailLog.countDocuments(filter)

    // Get paginated results
    const skip = (page - 1) * limit
    const logs = await EmailLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    return Response.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get email logs error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

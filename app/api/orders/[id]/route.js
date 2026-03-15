import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { verifyToken, getCookieToken } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    await connectDB()

    const order = await Order.findById(params.id)

    if (!order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: order })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
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

    // Check if user is admin
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const order = await Order.findByIdAndUpdate(params.id, body, {
      new: true,
    })

    if (!order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: order })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

import { connectDB } from '@/lib/db'
import { verifyToken, getCookieToken } from '@/lib/auth'
import User from '@/models/User'
import crypto from 'crypto'

/**
 * GET /api/users/[id]/preferences
 * Get user email preferences
 */
export async function GET(request, { params }) {
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

    const { id } = params

    // Users can only view their own preferences unless they're admin
    if (decoded.userId !== id) {
      const user = await User.findById(decoded.userId)
      if (!user || user.role !== 'admin') {
        return Response.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const user = await User.findById(id)
    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: user.emailPreferences || {},
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]/preferences
 * Update user email preferences
 */
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

    const { id } = params

    // Users can only update their own preferences unless they're admin
    if (decoded.userId !== id) {
      const user = await User.findById(decoded.userId)
      if (!user || user.role !== 'admin') {
        return Response.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const { orderConfirmation, shippingUpdates, promotions, newsletter } = await request.json()

    const user = await User.findById(id)
    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update preferences
    user.emailPreferences = {
      orderConfirmation: orderConfirmation !== undefined ? orderConfirmation : user.emailPreferences?.orderConfirmation ?? true,
      shippingUpdates: shippingUpdates !== undefined ? shippingUpdates : user.emailPreferences?.shippingUpdates ?? true,
      promotions: promotions !== undefined ? promotions : user.emailPreferences?.promotions ?? true,
      newsletter: newsletter !== undefined ? newsletter : user.emailPreferences?.newsletter ?? true,
      updatedAt: new Date(),
    }

    // Generate unsubscribe token if not exists
    if (!user.unsubscribeToken) {
      user.unsubscribeToken = crypto.randomBytes(32).toString('hex')
    }

    await user.save()

    return Response.json({
      success: true,
      data: user.emailPreferences,
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

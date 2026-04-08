import { supabaseAdmin } from '@/lib/supabase'
import { getUserById, updateUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request, { params }) {
  try {
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

    const { id } = await params

    // Users can only view their own preferences unless they're admin
    if (decoded.userId !== id) {
      const user = await getUserById(decoded.userId)
      if (!user || user.role !== 'admin') {
        return Response.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const user = await getUserById(id)
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
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
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

    const { id } = await params

    // Users can only update their own preferences unless they're admin
    if (decoded.userId !== id) {
      const user = await getUserById(decoded.userId)
      if (!user || user.role !== 'admin') {
        return Response.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const { orderConfirmation, shippingUpdates, promotions, newsletter } = await request.json()

    const user = await getUserById(id)
    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update preferences
    const updatedUser = await updateUserById(id, {
      emailPreferences: {
        orderConfirmation: orderConfirmation !== undefined ? orderConfirmation : user.emailPreferences?.orderConfirmation ?? true,
        shippingUpdates: shippingUpdates !== undefined ? shippingUpdates : user.emailPreferences?.shippingUpdates ?? true,
        promotions: promotions !== undefined ? promotions : user.emailPreferences?.promotions ?? true,
        newsletter: newsletter !== undefined ? newsletter : user.emailPreferences?.newsletter ?? true,
      },
    })

    // Generate unsubscribe token if not exists
    if (!updatedUser.unsubscribeToken) {
      await supabaseAdmin
        .from('users')
        .update({ unsubscribe_token: crypto.randomBytes(32).toString('hex') })
        .eq('id', id)
    }

    return Response.json({
      success: true,
      data: updatedUser.emailPreferences,
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return Response.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

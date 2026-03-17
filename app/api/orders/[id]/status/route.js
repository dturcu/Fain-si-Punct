import { connectDB } from '@/lib/db'
import { verifyToken, getCookieToken } from '@/lib/auth'
import User from '@/models/User'
import Order from '@/models/Order'
import EmailLog from '@/models/EmailLog'
import { sendShippingNotification } from '@/lib/email'

/**
 * PUT /api/orders/[id]/status
 * Update order status and send notifications
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

    // Verify user is admin
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const { status, trackingNumber, trackingUrl } = await request.json()

    if (!status) {
      return Response.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return Response.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const order = await Order.findById(id)
    if (!order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const oldStatus = order.status
    order.status = status

    // Update tracking info if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber
    }
    if (trackingUrl) {
      order.trackingUrl = trackingUrl
    }

    // Send shipping notification if status changed to shipped and user hasn't opted out
    if (oldStatus !== 'shipped' && status === 'shipped' && trackingNumber && trackingUrl) {
      const orderUser = await User.findById(order.userId)

      if (orderUser?.emailPreferences?.shippingUpdates !== false) {
        try {
          const emailResult = await sendShippingNotification(
            order,
            trackingNumber,
            trackingUrl,
            order.customer.email
          )

          if (emailResult.success) {
            // Log the email
            const emailLog = await EmailLog.create({
              recipient: order.customer.email,
              type: 'shipping_update',
              subject: `Your Order is Shipping - ${order.orderNumber}`,
              orderId: order._id,
              userId: order.userId,
              status: 'sent',
              messageId: emailResult.messageId,
              sentAt: emailResult.timestamp,
              metadata: {
                orderNumber: order.orderNumber,
                trackingNumber,
                trackingUrl,
              },
            })

            // Update order with email log reference
            order.emailLog.push(emailLog._id)
            order.lastEmailSentAt = new Date()
          }
        } catch (emailError) {
          console.error('Failed to send shipping notification:', emailError)
          // Don't fail the order update if email fails
        }
      }
    }

    await order.save()

    return Response.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Update order status error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

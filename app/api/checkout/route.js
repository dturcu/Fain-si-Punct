import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'
import Order from '@/models/Order'
import Product from '@/models/Product'
import EmailLog from '@/models/EmailLog'
import User from '@/models/User'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { sendOrderConfirmation } from '@/lib/email'

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

export async function POST(request) {
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

    const { shippingAddress, customer } = await request.json()

    const cart = await Cart.findOne({ userId: decoded.userId })
    if (!cart || cart.items.length === 0) {
      return Response.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      )
    }

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      items: cart.items,
      total: cart.total,
      status: 'processing',
      customer,
      shippingAddress,
      userId: decoded.userId,
    })

    // Get user for email preferences
    const user = await User.findById(decoded.userId)

    // Send order confirmation email if user has not opted out
    if (user?.emailPreferences?.orderConfirmation !== false) {
      try {
        const emailResult = await sendOrderConfirmation(order, customer.email)

        if (emailResult.success) {
          // Log the email
          const emailLog = await EmailLog.create({
            recipient: customer.email,
            type: 'order_confirmation',
            subject: `Order Confirmation - ${order.orderNumber}`,
            orderId: order._id,
            userId: decoded.userId,
            status: 'sent',
            messageId: emailResult.messageId,
            sentAt: emailResult.timestamp,
            metadata: {
              orderNumber: order.orderNumber,
            },
          })

          // Update order with email log reference
          order.emailLog.push(emailLog._id)
          order.lastEmailSentAt = new Date()
          await order.save()
        }
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
        // Don't fail the order creation if email fails
      }
    }

    // Clear cart
    await Cart.deleteOne({ userId: decoded.userId })

    return Response.json(
      { success: true, data: order },
      { status: 201 }
    )
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'
import Order from '@/models/Order'
import Product from '@/models/Product'
import EmailLog from '@/models/EmailLog'
import User from '@/models/User'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { addEmailJob } from '@/lib/job-queue'
import { orderConfirmation } from '@/lib/templates/orderConfirmation'

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

    // Queue order confirmation email if user has not opted out
    if (user?.emailPreferences?.orderConfirmation !== false) {
      try {
        const emailHtml = orderConfirmation(order)
        const subject = `Order Confirmation - ${order.orderNumber}`

        // Add email job to queue for processing
        const emailJob = await addEmailJob({
          type: 'order_confirmation',
          recipient: customer.email,
          subject,
          html: emailHtml,
          orderId: order._id.toString(),
          userId: decoded.userId.toString(),
          metadata: {
            orderNumber: order.orderNumber,
            customerName: customer.name,
          },
        })

        // Track the job ID on the order
        order.emailJobs = order.emailJobs || []
        order.emailJobs.push(emailJob.id)
        order.lastEmailSentAt = new Date()
        await order.save()

        console.log(`Email job queued for order ${order._id}:`, emailJob.id)
      } catch (emailError) {
        console.error('Failed to queue order confirmation email:', emailError)
        // Don't fail the order creation if email queuing fails
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

import { supabaseAdmin } from '@/lib/supabase'
import { getCartByUserId, clearCart, getUserById, createOrder } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { addEmailJob } from '@/lib/job-queue'
import { orderConfirmation } from '@/lib/templates/orderConfirmation'

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

export async function POST(request) {
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

    const { shippingAddress, customer, paymentMethod } = await request.json()

    // Get user's cart
    const cart = await getCartByUserId(decoded.userId)
    if (!cart || !cart.items || cart.items.length === 0) {
      return Response.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Update product stock for each item
    for (const item of cart.items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single()

      if (product) {
        await supabaseAdmin
          .from('products')
          .update({ stock: Math.max(0, product.stock - item.quantity) })
          .eq('id', item.productId)
      }
    }

    // Calculate subtotal from cart items and apply shipping
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const shippingCost = subtotal >= 200 ? 0 : 15.99
    const orderTotal = subtotal + shippingCost

    // Create order
    const orderNumber = generateOrderNumber()
    const order = await createOrder(
      decoded.userId,
      cart.items,
      orderTotal,
      customer,
      shippingAddress,
      orderNumber,
      paymentMethod || 'card'
    )

    // Get user for email preferences
    const user = await getUserById(decoded.userId)

    // Queue order confirmation email if user hasn't opted out
    if (user?.emailPreferences?.orderConfirmation !== false) {
      try {
        const emailHtml = orderConfirmation(order)
        const subject = `Order Confirmation - ${order.orderNumber}`

        const emailJob = await addEmailJob({
          type: 'order_confirmation',
          recipient: customer.email,
          subject,
          html: emailHtml,
          orderId: order.id,
          userId: decoded.userId,
          metadata: {
            orderNumber: order.orderNumber,
            customerName: customer.name,
          },
        })

        // Update order with email job tracking
        await supabaseAdmin
          .from('order_email_jobs')
          .insert({
            order_id: order.id,
            job_id: emailJob.id,
          })

        await supabaseAdmin
          .from('orders')
          .update({ last_email_sent_at: new Date().toISOString() })
          .eq('id', order.id)

        console.log(`Email job queued for order ${order.id}:`, emailJob.id)
      } catch (emailError) {
        console.error('Failed to queue order confirmation email:', emailError)
        // Don't fail the order creation if email queuing fails
      }
    }

    // Clear cart
    await clearCart(decoded.userId)

    return Response.json(
      { success: true, data: order },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

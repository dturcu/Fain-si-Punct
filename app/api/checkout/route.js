import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { verifyToken, getCookieToken } from '@/lib/auth'

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
    })

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

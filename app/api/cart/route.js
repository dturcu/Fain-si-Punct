import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
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

    const cart = await Cart.findOne({ userId: decoded.userId }).populate('items.productId')

    return Response.json({
      success: true,
      data: cart || { items: [], total: 0 },
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
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

    const { productId, quantity } = await request.json()

    const product = await Product.findById(productId)
    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    let cart = await Cart.findOne({ userId: decoded.userId })

    if (!cart) {
      cart = new Cart({ userId: decoded.userId, items: [] })
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      })
    }

    await cart.save()

    return Response.json({ success: true, data: cart })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

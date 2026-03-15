import { connectDB } from '@/lib/db'
import Cart from '@/models/Cart'
import { verifyToken, getCookieToken } from '@/lib/auth'

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

    const { quantity } = await request.json()

    const cart = await Cart.findOne({ userId: decoded.userId })
    if (!cart) {
      return Response.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      )
    }

    const item = cart.items.id(params.itemId)
    if (!item) {
      return Response.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    item.quantity = quantity
    await cart.save()

    return Response.json({ success: true, data: cart })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
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

    const cart = await Cart.findOne({ userId: decoded.userId })
    if (!cart) {
      return Response.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      )
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== params.itemId)
    await cart.save()

    return Response.json({ success: true, data: cart })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

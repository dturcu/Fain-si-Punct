import { updateCartItemQuantity, removeFromCart, getCartByUserId } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'

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

    // Verify the cart item belongs to the user's cart
    const userCart = await getCartByUserId(decoded.userId)
    const itemBelongsToUser = userCart.items?.some(item => item.id === params.itemId || item.id === parseInt(params.itemId))
    if (!userCart.id || !itemBelongsToUser) {
      return Response.json(
        { success: false, error: 'Cart item not found' },
        { status: 403 }
      )
    }

    const { quantity } = await request.json()
    const cart = await updateCartItemQuantity(decoded.userId, params.itemId, quantity)

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

    // Verify the cart item belongs to the user's cart
    const userCart = await getCartByUserId(decoded.userId)
    const itemBelongsToUser = userCart.items?.some(item => item.id === params.itemId || item.id === parseInt(params.itemId))
    if (!userCart.id || !itemBelongsToUser) {
      return Response.json(
        { success: false, error: 'Cart item not found' },
        { status: 403 }
      )
    }

    const cart = await removeFromCart(decoded.userId, params.itemId)

    return Response.json({ success: true, data: cart })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

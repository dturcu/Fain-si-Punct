import { updateCartItemQuantity, removeFromCart, getCartByUserId } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants'

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

    const { itemId } = await params

    // Verify the cart item belongs to the user's cart
    const userCart = await getCartByUserId(decoded.userId)
    const itemBelongsToUser = userCart.items?.some(
      (item) => item._id === itemId || String(item._id) === String(itemId)
    )
    if (!userCart.id || !itemBelongsToUser) {
      return Response.json(
        { success: false, error: 'Cart item not found' },
        { status: 403 }
      )
    }

    const { quantity } = await request.json()

    if (!Number.isInteger(quantity) || quantity < 1) {
      return Response.json(
        { success: false, error: 'Cantitatea trebuie să fie un număr întreg pozitiv' },
        { status: 400 }
      )
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return Response.json(
        { success: false, error: `Cantitatea maximă per produs este ${MAX_QUANTITY_PER_ITEM}` },
        { status: 400 }
      )
    }

    const cart = await updateCartItemQuantity(decoded.userId, itemId, quantity)

    return Response.json({ success: true, data: cart })
  } catch (error) {
    console.error('Cart item error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
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

    const { itemId } = await params

    // Verify the cart item belongs to the user's cart
    const userCart = await getCartByUserId(decoded.userId)
    const itemBelongsToUser = userCart.items?.some(
      (item) => item._id === itemId || String(item._id) === String(itemId)
    )
    if (!userCart.id || !itemBelongsToUser) {
      return Response.json(
        { success: false, error: 'Cart item not found' },
        { status: 403 }
      )
    }

    const cart = await removeFromCart(decoded.userId, itemId)

    return Response.json({ success: true, data: cart })
  } catch (error) {
    console.error('Cart item error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

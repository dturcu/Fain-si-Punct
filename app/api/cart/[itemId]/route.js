import { updateCartItemQuantity, removeFromCart, getCartByUserId, updateGuestCartItemQuantity, removeFromGuestCart, getCartByGuestSession } from '@/lib/supabase-queries'
import { getSessionContext } from '@/lib/auth'
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants'

function getCartAndHelpers(session) {
  if (session.userId) {
    return {
      getCart: () => getCartByUserId(session.userId),
      updateQty: (itemId, qty) => updateCartItemQuantity(session.userId, itemId, qty),
      removeItem: (itemId) => removeFromCart(session.userId, itemId),
    }
  }
  return {
    getCart: () => getCartByGuestSession(session.guestSessionId),
    updateQty: (itemId, qty) => updateGuestCartItemQuantity(session.guestSessionId, itemId, qty),
    removeItem: (itemId) => removeFromGuestCart(session.guestSessionId, itemId),
  }
}

export async function PUT(request, { params }) {
  try {
    const session = getSessionContext(request)

    if (!session.userId && !session.guestSessionId) {
      return Response.json(
        { success: false, error: 'No cart session' },
        { status: 400 }
      )
    }

    const { itemId } = await params
    const { getCart, updateQty } = getCartAndHelpers(session)

    // Verify the cart item belongs to this session's cart
    const userCart = await getCart()
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

    const cart = await updateQty(itemId, quantity)

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
    const session = getSessionContext(request)

    if (!session.userId && !session.guestSessionId) {
      return Response.json(
        { success: false, error: 'No cart session' },
        { status: 400 }
      )
    }

    const { itemId } = await params
    const { getCart, removeItem } = getCartAndHelpers(session)

    // Verify the cart item belongs to this session's cart
    const userCart = await getCart()
    const itemBelongsToUser = userCart.items?.some(
      (item) => item._id === itemId || String(item._id) === String(itemId)
    )
    if (!userCart.id || !itemBelongsToUser) {
      return Response.json(
        { success: false, error: 'Cart item not found' },
        { status: 403 }
      )
    }

    const cart = await removeItem(itemId)

    return Response.json({ success: true, data: cart })
  } catch (error) {
    console.error('Cart item error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

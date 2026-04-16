import { updateCartItemQuantity, removeFromCart, getCartByUserId, updateGuestCartItemQuantity, removeFromGuestCart, getCartByGuestSession } from '@/lib/supabase-queries'
import { getSessionContext } from '@/lib/auth'
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

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

async function verifyOwnership(session, itemId) {
  if (!session.userId && !session.guestSessionId) {
    return { error: apiError(ERROR_CODES.UNAUTHORIZED) }
  }
  const { getCart } = getCartAndHelpers(session)
  const userCart = await getCart()
  const belongs = userCart.items?.some(
    (item) => item._id === itemId || String(item._id) === String(itemId)
  )
  if (!userCart.id || !belongs) {
    return { error: apiError(ERROR_CODES.CART_ITEM_NOT_FOUND) }
  }
  return { helpers: getCartAndHelpers(session) }
}

export async function PUT(request, { params }) {
  try {
    const session = getSessionContext(request)
    const { itemId } = await params

    const ownership = await verifyOwnership(session, itemId)
    if (ownership.error) return ownership.error

    const { quantity } = await request.json()

    if (!Number.isInteger(quantity) || quantity < 1) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'quantity must be a positive integer' })
    }
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return apiError(ERROR_CODES.QUANTITY_EXCEEDS_MAX)
    }

    const cart = await ownership.helpers.updateQty(itemId, quantity)
    return Response.json({ success: true, data: cart })
  } catch (error) {
    return handleApiError(error, 'cart/[itemId] PUT')
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = getSessionContext(request)
    const { itemId } = await params

    const ownership = await verifyOwnership(session, itemId)
    if (ownership.error) return ownership.error

    const cart = await ownership.helpers.removeItem(itemId)
    return Response.json({ success: true, data: cart })
  } catch (error) {
    return handleApiError(error, 'cart/[itemId] DELETE')
  }
}

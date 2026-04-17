/**
 * Barrel re-export of domain query modules.
 *
 * The 568-line monolith that used to live here was split (Phase 2 audit
 * remediation) into:
 *   - lib/queries/users.js
 *   - lib/queries/orders.js
 *   - lib/queries/carts.js
 *   - lib/queries/guest-carts.js
 *
 * This file keeps the old import surface intact so existing routes keep
 * compiling:  `import { getUserById, ... } from '@/lib/supabase-queries'`
 *
 * New code should prefer importing directly from the domain modules.
 */

export {
  getUserById,
  getUserByEmail,
  createUser,
  updateUserById,
  userRowToObj,
} from './queries/users'

export {
  getOrderById,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  orderRowToObj,
} from './queries/orders'

export {
  getCartByUserId,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  recalculateCartTotal,
} from './queries/carts'

export {
  getCartByGuestSession,
  addToGuestCart,
  updateGuestCartItemQuantity,
  removeFromGuestCart,
  clearGuestCart,
  migrateGuestToUser,
} from './queries/guest-carts'

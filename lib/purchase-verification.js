import Order from '@/models/Order'

/**
 * Verify if a user has purchased a specific product
 * @param {string} userId - The MongoDB ObjectId of the user
 * @param {string} productId - The MongoDB ObjectId of the product
 * @returns {Promise<object|null>} - Returns order if found, null otherwise
 */
export async function verifyUserPurchase(userId, productId) {
  try {
    const order = await Order.findOne({
      'items.productId': productId,
      'items.userId': userId,
      status: { $in: ['processing', 'shipped', 'delivered'] },
    })

    return order || null
  } catch (error) {
    console.error('Error verifying purchase:', error)
    throw error
  }
}

/**
 * Get all products purchased by a user
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {Promise<array>} - Array of product IDs
 */
export async function getPurchasedProducts(userId) {
  try {
    const orders = await Order.find({
      'items.userId': userId,
      status: { $in: ['processing', 'shipped', 'delivered'] },
    })

    const productIds = new Set()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        productIds.add(item.productId.toString())
      })
    })

    return Array.from(productIds)
  } catch (error) {
    console.error('Error getting purchased products:', error)
    throw error
  }
}

/**
 * Get all orders for a user
 * @param {string} userId - The MongoDB ObjectId of the user
 * @param {object} options - Query options (limit, skip, status)
 * @returns {Promise<array>} - Array of orders
 */
export async function getUserOrders(userId, options = {}) {
  try {
    const { limit = 10, skip = 0, status } = options

    const filter = { 'items.userId': userId }
    if (status) {
      filter.status = status
    }

    const orders = await Order.find(filter).limit(limit).skip(skip).sort({ createdAt: -1 })

    return orders
  } catch (error) {
    console.error('Error getting user orders:', error)
    throw error
  }
}

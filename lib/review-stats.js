import Review from '@/models/Review'
import Product from '@/models/Product'

/**
 * Calculate aggregated rating statistics for a product
 * @param {string} productId - The MongoDB ObjectId of the product
 * @returns {Promise<{avgRating: number, reviewCount: number, ratingDistribution: object}>}
 */
export async function calculateProductRating(productId) {
  try {
    // Get all reviews for the product
    const reviews = await Review.find({ productId }).select('rating')

    if (reviews.length === 0) {
      return {
        avgRating: 0,
        reviewCount: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const avgRating = parseFloat((totalRating / reviews.length).toFixed(2))

    // Calculate rating distribution (histogram)
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      ratingDistribution[review.rating]++
    })

    return {
      avgRating,
      reviewCount: reviews.length,
      ratingDistribution,
    }
  } catch (error) {
    console.error(`Error calculating rating for product ${productId}:`, error)
    throw error
  }
}

/**
 * Update product with aggregated review statistics
 * @param {string} productId - The MongoDB ObjectId of the product
 * @returns {Promise<object>} - Updated product document
 */
export async function updateProductRatingStats(productId) {
  try {
    const stats = await calculateProductRating(productId)

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        avgRating: stats.avgRating,
        reviewCount: stats.reviewCount,
        ratingDistribution: stats.ratingDistribution,
      },
      { new: true }
    )

    return updatedProduct
  } catch (error) {
    console.error(`Error updating product rating stats for ${productId}:`, error)
    throw error
  }
}

/**
 * Get review statistics for multiple products (for batch operations)
 * @param {array} productIds - Array of product MongoDB ObjectIds
 * @returns {Promise<array>} - Array of stats objects with productId
 */
export async function calculateBulkProductRatings(productIds) {
  try {
    const stats = await Promise.all(
      productIds.map(async (productId) => {
        const ratingStats = await calculateProductRating(productId)
        return {
          productId,
          ...ratingStats,
        }
      })
    )

    return stats
  } catch (error) {
    console.error('Error calculating bulk ratings:', error)
    throw error
  }
}

/**
 * Get reviews for a product with pagination and filtering
 * @param {string} productId - The MongoDB ObjectId of the product
 * @param {object} options - Query options
 * @returns {Promise<object>} - Paginated reviews with metadata
 */
export async function getProductReviews(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'newest', // 'newest', 'helpful', 'rating-high', 'rating-low'
    minRating = 0,
    maxRating = 5,
    verifiedOnly = false,
  } = options

  try {
    // Build filter
    const filter = {
      productId,
      rating: { $gte: minRating, $lte: maxRating },
    }

    if (verifiedOnly) {
      filter.verified = true
    }

    // Build sort
    let sortOptions = { createdAt: -1 } // default: newest
    switch (sortBy) {
      case 'helpful':
        sortOptions = { helpful: -1, createdAt: -1 }
        break
      case 'rating-high':
        sortOptions = { rating: -1, createdAt: -1 }
        break
      case 'rating-low':
        sortOptions = { rating: 1, createdAt: -1 }
        break
      default:
        sortOptions = { createdAt: -1 }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute queries
    const reviews = await Review.find(filter)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .populate('userId', 'firstName lastName')
      .lean()

    const totalCount = await Review.countDocuments(filter)
    const totalPages = Math.ceil(totalCount / limit)

    return {
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }
  } catch (error) {
    console.error(`Error fetching reviews for product ${productId}:`, error)
    throw error
  }
}

/**
 * Check if user has already reviewed this product
 * @param {string} productId - The MongoDB ObjectId of the product
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {Promise<boolean>} - True if review exists
 */
export async function userHasReviewed(productId, userId) {
  try {
    const review = await Review.findOne({ productId, userId }).lean()
    return !!review
  } catch (error) {
    console.error('Error checking if user reviewed:', error)
    throw error
  }
}

/**
 * Toggle helpful vote on a review
 * @param {string} reviewId - The MongoDB ObjectId of the review
 * @param {string} userId - The MongoDB ObjectId of the user voting
 * @param {string} voteType - 'helpful' or 'unhelpful'
 * @returns {Promise<object>} - Updated review
 */
export async function toggleHelpfulVote(reviewId, userId, voteType = 'helpful') {
  try {
    const review = await Review.findById(reviewId)

    if (!review) {
      throw new Error('Review not found')
    }

    // Check if user already voted
    const existingVoteIndex = review.helpfulVotes.findIndex(
      (vote) => vote.userId.toString() === userId.toString()
    )

    if (existingVoteIndex !== -1) {
      // Remove existing vote
      review.helpfulVotes.splice(existingVoteIndex, 1)
      review.helpful = review.helpfulVotes.filter((v) => v.type === 'helpful').length
    } else {
      // Add new vote
      review.helpfulVotes.push({
        userId,
        type: voteType,
      })
      review.helpful = review.helpfulVotes.filter((v) => v.type === 'helpful').length
    }

    await review.save()
    return review
  } catch (error) {
    console.error(`Error toggling helpful vote for review ${reviewId}:`, error)
    throw error
  }
}

import { supabaseAdmin } from './supabase'

/**
 * Calculate aggregated rating statistics for a product
 */
export async function calculateProductRating(productId) {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)

    if (error) throw error

    if (!reviews || reviews.length === 0) {
      return {
        avgRating: 0,
        reviewCount: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const avgRating = parseFloat((totalRating / reviews.length).toFixed(2))

    // Calculate rating distribution
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
 */
export async function updateProductRatingStats(productId) {
  try {
    const stats = await calculateProductRating(productId)

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        avg_rating: stats.avgRating,
        review_count: stats.reviewCount,
        rating_distribution: stats.ratingDistribution,
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error updating product rating stats for ${productId}:`, error)
    throw error
  }
}

/**
 * Get reviews for a product with pagination and filtering
 */
export async function getProductReviews(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'newest',
    minRating = 0,
    maxRating = 5,
    verifiedOnly = false,
  } = options

  try {
    // Build filter
    let query = supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('product_id', productId)
      .gte('rating', minRating)
      .lte('rating', maxRating)

    if (verifiedOnly) {
      query = query.eq('verified', true)
    }

    // Handle sorting
    switch (sortBy) {
      case 'helpful':
        query = query.order('helpful', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'rating-high':
        query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'rating-low':
        query = query.order('rating', { ascending: true }).order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const skip = (page - 1) * limit
    const { data: reviews, count, error } = await query.range(skip, skip + limit - 1)

    if (error) throw error

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      reviews: reviews || [],
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
 */
export async function userHasReviewed(productId, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single()

    if (error?.code === 'PGRST116') return false // Not found
    if (error) throw error
    return !!data
  } catch (error) {
    console.error('Error checking if user reviewed:', error)
    throw error
  }
}

/**
 * Toggle helpful vote on a review
 */
export async function toggleHelpfulVote(reviewId, userId, voteType = 'helpful') {
  try {
    // Get current helpful votes
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('helpful, *')
      .eq('id', reviewId)
      .single()

    if (fetchError) throw fetchError
    if (!review) throw new Error('Review not found')

    // Check if user already voted
    const { data: existingVote } = await supabaseAdmin
      .from('helpful_votes')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single()

    if (existingVote) {
      // Remove existing vote
      await supabaseAdmin
        .from('helpful_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId)
    } else {
      // Add new vote
      await supabaseAdmin.from('helpful_votes').insert({
        review_id: reviewId,
        user_id: userId,
        vote_type: voteType,
      })
    }

    // Recalculate helpful count
    const { data: allVotes } = await supabaseAdmin
      .from('helpful_votes')
      .select('vote_type')
      .eq('review_id', reviewId)
      .eq('vote_type', 'helpful')

    const helpfulCount = (allVotes || []).length

    // Update review helpful count
    const { data: updatedReview } = await supabaseAdmin
      .from('reviews')
      .update({ helpful: helpfulCount })
      .eq('id', reviewId)
      .select()
      .single()

    return updatedReview
  } catch (error) {
    console.error(`Error toggling helpful vote for review ${reviewId}:`, error)
    throw error
  }
}

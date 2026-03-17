import { connectDB } from '@/lib/db'
import Review from '@/models/Review'
import { updateProductRatingStats } from '@/lib/review-stats'

/**
 * PUT /api/reviews/[id]
 * Update a review (owner only)
 */
export async function PUT(request, { params }) {
  try {
    await connectDB()

    const body = await request.json()
    const { rating, title, comment, userId } = body

    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Find review
    const review = await Review.findById(params.id)

    if (!review) {
      return Response.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (review.userId.toString() !== userId) {
      return Response.json(
        { success: false, error: 'Unauthorized: only review owner can update' },
        { status: 403 }
      )
    }

    // Validate inputs
    if (rating && (rating < 1 || rating > 5)) {
      return Response.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (title && title.trim().length === 0) {
      return Response.json(
        { success: false, error: 'Title cannot be empty' },
        { status: 400 }
      )
    }

    // Update review
    if (rating !== undefined) review.rating = rating
    if (title !== undefined) review.title = title.trim()
    if (comment !== undefined) review.comment = comment ? comment.trim() : ''

    await review.save()

    // Update product rating stats
    await updateProductRatingStats(review.productId)

    // Populate user data
    await review.populate('userId', 'firstName lastName')

    return Response.json({
      success: true,
      data: review,
      message: 'Review updated successfully',
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/[id]
 * Delete a review (owner or admin)
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB()

    const body = await request.json()
    const { userId, isAdmin } = body

    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Find review
    const review = await Review.findById(params.id)

    if (!review) {
      return Response.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const isOwner = review.userId.toString() === userId
    if (!isOwner && !isAdmin) {
      return Response.json(
        { success: false, error: 'Unauthorized: only owner or admin can delete' },
        { status: 403 }
      )
    }

    const productId = review.productId

    // Delete review
    await Review.findByIdAndDelete(params.id)

    // Update product rating stats
    await updateProductRatingStats(productId)

    return Response.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviews/[id]
 * Get a single review
 */
export async function GET(request, { params }) {
  try {
    await connectDB()

    const review = await Review.findById(params.id).populate(
      'userId',
      'firstName lastName'
    )

    if (!review) {
      return Response.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      data: review,
    })
  } catch (error) {
    console.error('Error fetching review:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

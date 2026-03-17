import { connectDB } from '@/lib/db'
import Review from '@/models/Review'
import { toggleHelpfulVote } from '@/lib/review-stats'

/**
 * PATCH /api/reviews/[id]/helpful
 * Toggle helpful/unhelpful vote on a review
 * Prevents duplicate votes from same user
 */
export async function PATCH(request, { params }) {
  try {
    await connectDB()

    const body = await request.json()
    const { userId, voteType } = body

    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    if (!voteType || !['helpful', 'unhelpful'].includes(voteType)) {
      return Response.json(
        { success: false, error: 'Vote type must be "helpful" or "unhelpful"' },
        { status: 400 }
      )
    }

    // Toggle the helpful vote
    const review = await toggleHelpfulVote(params.id, userId, voteType)

    return Response.json({
      success: true,
      data: {
        reviewId: review._id,
        helpful: review.helpful,
        voteCount: review.helpfulVotes.length,
      },
      message: 'Vote recorded successfully',
    })
  } catch (error) {
    if (error.message === 'Review not found') {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    console.error('Error updating helpful vote:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviews/[id]/helpful
 * Get helpful vote information for a review
 */
export async function GET(request, { params }) {
  try {
    await connectDB()

    const review = await Review.findById(params.id).select('helpful helpfulVotes')

    if (!review) {
      return Response.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    const helpfulCount = review.helpfulVotes.filter(
      (v) => v.type === 'helpful'
    ).length
    const unhelpfulCount = review.helpfulVotes.filter(
      (v) => v.type === 'unhelpful'
    ).length

    return Response.json({
      success: true,
      data: {
        reviewId: review._id,
        helpful: helpfulCount,
        unhelpful: unhelpfulCount,
        total: review.helpfulVotes.length,
      },
    })
  } catch (error) {
    console.error('Error fetching helpful votes:', error)
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

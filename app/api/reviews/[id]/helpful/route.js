import { supabaseAdmin } from '@/lib/supabase'
import { toggleHelpfulVote } from '@/lib/reviews-supabase'

/**
 * PATCH /api/reviews/[id]/helpful
 * Toggle helpful/unhelpful vote on a review
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
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
    const review = await toggleHelpfulVote(id, userId, voteType)

    return Response.json({
      success: true,
      data: {
        reviewId: review.id,
        helpful: review.helpful,
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
    const { id } = await params

    const { data: votes, error } = await supabaseAdmin
      .from('helpful_votes')
      .select('vote_type')
      .eq('review_id', id)

    if (error) throw error

    const helpfulCount = (votes || []).filter(v => v.vote_type === 'helpful').length
    const unhelpfulCount = (votes || []).filter(v => v.vote_type === 'unhelpful').length

    return Response.json({
      success: true,
      data: {
        reviewId: id,
        helpful: helpfulCount,
        unhelpful: unhelpfulCount,
        total: votes?.length || 0,
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

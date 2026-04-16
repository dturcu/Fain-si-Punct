import { supabaseAdmin } from '@/lib/supabase'
import { updateProductRatingStats } from '@/lib/reviews-supabase'
import { getCookieToken, verifyToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'

/**
 * GET /api/reviews/[id]
 * Get a single review
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !review) {
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

/**
 * PUT /api/reviews/[id]
 * Update a review (owner only)
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { rating, title, comment, userId } = body

    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Find review
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !review) {
      return Response.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (review.user_id !== userId) {
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
    const updateData = {}
    if (rating !== undefined) updateData.rating = rating
    if (title !== undefined) updateData.title = title.trim()
    if (comment !== undefined) updateData.comment = comment ? comment.trim() : ''

    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Update product rating stats
    await updateProductRatingStats(review.product_id)

    return Response.json({
      success: true,
      data: updatedReview,
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
    const { id } = await params

    // Verify authentication from token — never trust client-provided isAdmin
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

    // Resolve admin status from the database, not from the request body
    const requestingUser = await getUserById(decoded.userId)
    const isAdmin = requestingUser?.role === 'admin'

    // Find review
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !review) {
      return Response.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check authorization against verified identity
    const isOwner = review.user_id === decoded.userId
    if (!isOwner && !isAdmin) {
      return Response.json(
        { success: false, error: 'Unauthorized: only owner or admin can delete' },
        { status: 403 }
      )
    }

    const productId = review.product_id

    // Delete helpful votes first (cascading)
    await supabaseAdmin
      .from('helpful_votes')
      .delete()
      .eq('review_id', id)

    // Delete review
    const { error: deleteError } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    logAuditEvent('review_deleted', { userId: decoded.userId, metadata: { reviewId: id, isAdmin }, ...getRequestMeta(request) })

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

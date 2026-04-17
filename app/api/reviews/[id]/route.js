import { supabaseAdmin } from '@/lib/supabase'
import { updateProductRatingStats } from '@/lib/reviews-supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

function requireAuth(request) {
  const token = getCookieToken(request)
  if (!token) return { error: apiError(ERROR_CODES.UNAUTHORIZED) }
  const decoded = verifyToken(token)
  if (!decoded) return { error: apiError(ERROR_CODES.INVALID_TOKEN) }
  return { decoded }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !review) {
      return apiError(ERROR_CODES.REVIEW_NOT_FOUND)
    }

    return Response.json({ success: true, data: review })
  } catch (error) {
    return handleApiError(error, 'reviews/[id] GET')
  }
}

export async function PUT(request, { params }) {
  try {
    const { decoded, error: authError } = requireAuth(request)
    if (authError) return authError
    const userId = decoded.userId

    const { id } = await params
    const body = await request.json()
    const { rating, title, comment } = body

    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !review) {
      return apiError(ERROR_CODES.REVIEW_NOT_FOUND)
    }

    if (review.user_id !== userId) {
      return apiError(ERROR_CODES.FORBIDDEN)
    }

    if (rating && (rating < 1 || rating > 5)) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'rating must be between 1 and 5' })
    }
    if (title && title.trim().length === 0) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'title cannot be empty' })
    }

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

    await updateProductRatingStats(review.product_id)

    return Response.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully',
    })
  } catch (error) {
    return handleApiError(error, 'reviews/[id] PUT')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { decoded, error: authError } = requireAuth(request)
    if (authError) return authError
    const userId = decoded.userId

    const { id } = await params

    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !review) {
      return apiError(ERROR_CODES.REVIEW_NOT_FOUND)
    }

    // Authorization: owner or admin (role resolved from DB via verified JWT)
    const isOwner = review.user_id === userId
    const user = isOwner ? null : await getUserById(userId)
    const isAdmin = !isOwner && user?.role === 'admin'
    if (!isOwner && !isAdmin) {
      return apiError(ERROR_CODES.FORBIDDEN)
    }

    const productId = review.product_id

    await supabaseAdmin.from('helpful_votes').delete().eq('review_id', id)
    const { error: deleteError } = await supabaseAdmin.from('reviews').delete().eq('id', id)
    if (deleteError) throw deleteError

    await updateProductRatingStats(productId)

    const { ip, userAgent } = getRequestMeta(request)
    await logAuditEvent('review_deleted', {
      userId,
      ip,
      userAgent,
      metadata: { reviewId: id, productId, actedAs: isAdmin ? 'admin' : 'owner' },
    })

    return Response.json({ success: true, message: 'Review deleted successfully' })
  } catch (error) {
    return handleApiError(error, 'reviews/[id] DELETE')
  }
}

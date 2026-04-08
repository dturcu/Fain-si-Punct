import { supabaseAdmin } from '@/lib/supabase'
import { getProductReviews, updateProductRatingStats, userHasReviewed } from '@/lib/reviews-supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'

/**
 * GET /api/products/[id]/reviews
 * List reviews for a product with pagination and filtering
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const minRating = parseInt(searchParams.get('minRating') || '0')
    const maxRating = parseInt(searchParams.get('maxRating') || '5')
    const verifiedOnly = searchParams.get('verified') === 'true'

    // Validate product exists
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get reviews with pagination
    const result = await getProductReviews(id, {
      page,
      limit,
      sortBy,
      minRating,
      maxRating,
      verifiedOnly,
    })

    return Response.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return Response.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/[id]/reviews
 * Create a new review for a product
 */
export async function POST(request, { params }) {
  try {
    // Auth: userId must come from the verified token, not the request body
    const token = getCookieToken(request)
    if (!token) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return Response.json({ success: false, error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const { id } = await params
    const body = await request.json()
    const { rating, title, comment } = body

    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
      return Response.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!title || title.trim().length === 0) {
      return Response.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Validate product exists
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Verify THIS user purchased the product (join via orders to scope by user)
    const { data: orderItem } = await supabaseAdmin
      .from('order_items')
      .select('order_id, orders!inner(user_id)')
      .eq('product_id', id)
      .eq('orders.user_id', userId)
      .limit(1)
      .single()

    if (!orderItem) {
      return Response.json(
        { success: false, error: 'You must purchase this product to review it' },
        { status: 403 }
      )
    }

    // Check for duplicate review
    const hasReviewed = await userHasReviewed(id, userId)
    if (hasReviewed) {
      return Response.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Create review
    const { data: review, error: createError } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id: id,
        user_id: userId,
        order_id: orderItem.order_id,
        rating: parseInt(rating),
        title: title.trim(),
        comment: comment ? comment.trim() : '',
        verified: true,
      })
      .select()
      .single()

    if (createError) throw createError

    // Update product rating stats
    await updateProductRatingStats(id)

    return Response.json(
      {
        success: true,
        data: review,
        message: 'Review created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating review:', error)
    return Response.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

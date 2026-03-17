import { connectDB } from '@/lib/db'
import Review from '@/models/Review'
import Product from '@/models/Product'
import Order from '@/models/Order'
import { getProductReviews, updateProductRatingStats } from '@/lib/review-stats'

/**
 * GET /api/products/[id]/reviews
 * List reviews for a product with pagination and filtering
 */
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const minRating = parseInt(searchParams.get('minRating') || '0')
    const maxRating = parseInt(searchParams.get('maxRating') || '5')
    const verifiedOnly = searchParams.get('verified') === 'true'

    // Validate product exists
    const product = await Product.findById(params.id)
    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get reviews with pagination
    const result = await getProductReviews(params.id, {
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
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/[id]/reviews
 * Create a new review for a product
 * Requires: authentication, purchase verification
 */
export async function POST(request, { params }) {
  try {
    await connectDB()

    const body = await request.json()
    const { rating, title, comment } = body

    // Get user from session/auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // In a real app, decode JWT from authHeader
    // For now, extract userId from request body (should be passed by authenticated middleware)
    const userId = body.userId
    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

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
    const product = await Product.findById(params.id)
    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Verify user purchased the product
    const order = await Order.findOne({
      'items.productId': params.id,
      'items.userId': userId,
    })

    if (!order) {
      return Response.json(
        { success: false, error: 'You must purchase this product to review it' },
        { status: 403 }
      )
    }

    // Check for duplicate review (one review per user per product)
    const existingReview = await Review.findOne({
      productId: params.id,
      userId,
    })

    if (existingReview) {
      return Response.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Create review
    const review = new Review({
      productId: params.id,
      userId,
      orderId: order._id,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment ? comment.trim() : '',
      verified: true, // Verified because user purchased
    })

    await review.save()

    // Update product rating stats
    await updateProductRatingStats(params.id)

    // Populate user data before returning
    await review.populate('userId', 'firstName lastName')

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
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

import { getCartByUserId, addToCart } from '@/lib/supabase-queries'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'

export async function GET(request) {
  try {
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

    const cart = await getCartByUserId(decoded.userId)

    return Response.json({
      success: true,
      data: cart || { items: [], total: 0 },
    })
  } catch (error) {
    return Response.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
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

    const { productId, quantity } = await request.json()

    if (!quantity || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return Response.json(
        { success: false, error: 'Quantity must be a whole number between 1 and 10' },
        { status: 400 }
      )
    }

    // Get product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, image')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const cart = await addToCart(
      decoded.userId,
      productId,
      product.name,
      product.price,
      product.image,
      quantity
    )

    return Response.json({ success: true, data: cart })
  } catch (error) {
    return Response.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

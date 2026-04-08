import { getCartByUserId, addToCart, getCartByGuestSession, addToGuestCart } from '@/lib/supabase-queries'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, guestSessionCookie } from '@/lib/auth'
import { MAX_QUANTITY_PER_ITEM } from '@/lib/constants'

export async function GET(request) {
  try {
    const session = getSessionContext(request)

    let cart
    if (session.userId) {
      cart = await getCartByUserId(session.userId)
    } else {
      cart = await getCartByGuestSession(session.guestSessionId)
    }

    const response = Response.json({
      success: true,
      data: cart || { items: [], total: 0 },
    })

    // Set guest session cookie if new
    if (session.isNew) {
      response.headers.set('Set-Cookie', guestSessionCookie(session.guestSessionId))
    }

    return response
  } catch (error) {
    console.error('Cart GET error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = getSessionContext(request)

    const { productId, quantity, variantId } = await request.json()

    if (!Number.isInteger(quantity) || quantity < 1) {
      return Response.json(
        { success: false, error: 'Cantitatea trebuie să fie un număr întreg pozitiv' },
        { status: 400 }
      )
    }

    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return Response.json(
        { success: false, error: `Cantitatea maximă per produs este ${MAX_QUANTITY_PER_ITEM}` },
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

    // If a variant is specified, look it up and use its price/image/stock
    let itemPrice = product.price
    let itemImage = product.image
    let variantLabel = null
    let resolvedVariantId = null

    if (variantId) {
      const { data: variant, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single()

      if (variantError || !variant) {
        return Response.json(
          { success: false, error: 'Varianta selectata nu exista' },
          { status: 404 }
        )
      }

      if (variant.stock < quantity) {
        return Response.json(
          { success: false, error: 'Stoc insuficient pentru varianta selectata' },
          { status: 400 }
        )
      }

      if (variant.price_override != null) itemPrice = parseFloat(variant.price_override)
      if (variant.image) itemImage = variant.image
      resolvedVariantId = variant.id

      // Build label like "Albastru / XL"
      const parts = []
      if (variant.color) parts.push(variant.color)
      if (variant.size) parts.push(variant.size)
      variantLabel = parts.join(' / ') || null
    }

    let cart
    if (session.userId) {
      cart = await addToCart(
        session.userId,
        productId,
        product.name,
        itemPrice,
        itemImage,
        quantity,
        resolvedVariantId,
        variantLabel
      )
    } else {
      cart = await addToGuestCart(
        session.guestSessionId,
        productId,
        product.name,
        itemPrice,
        itemImage,
        quantity,
        resolvedVariantId,
        variantLabel
      )
    }

    const response = Response.json({ success: true, data: cart })

    if (session.isNew) {
      response.headers.set('Set-Cookie', guestSessionCookie(session.guestSessionId))
    }

    return response
  } catch (error) {
    console.error('Cart POST error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

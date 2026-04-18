import { supabaseAdmin } from '@/lib/supabase'
import { rowToProduct, productToRow } from '@/lib/mappers/products'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'

async function requireAdmin(request) {
  const token = getCookieToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const user = await getUserById(decoded.userId)
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Support lookup by UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const query = supabaseAdmin.from('products').select('*')
    if (isUUID) {
      query.eq('id', id)
    } else {
      query.eq('slug', id)
    }
    const { data: product, error } = await query.single()

    if (error || !product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch variants separately (graceful — table may not exist yet)
    let variants = []
    try {
      const { data: variantRows } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
      if (variantRows) variants = variantRows
    } catch {
      // product_variants table may not exist yet — ignore
    }
    product.product_variants = variants

    return Response.json({ success: true, data: rowToProduct(product) })
  } catch (error) {
    console.error('Get product error:', error)
    return Response.json(
      { success: false, error: 'Failed to retrieve product' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(productToRow(body))
      .eq('id', id)
      .select()
      .single()

    if (error || !product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: rowToProduct(product) })
  } catch (error) {
    console.error('Update product error:', error)
    return Response.json(
      { success: false, error: 'Failed to update product' },
      { status: 400 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error || !product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: rowToProduct(product) })
  } catch (error) {
    console.error('Delete product error:', error)
    return Response.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

import { supabaseAdmin } from '@/lib/supabase'
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

    const { data: variants, error } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('color', { ascending: true })
      .order('size', { ascending: true })

    if (error) throw error

    return Response.json({
      success: true,
      data: (variants || []).map(variantRowToObj),
    })
  } catch (error) {
    console.error('Get variants error:', error)
    return Response.json(
      { success: false, error: 'Failed to retrieve variants' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const row = {
      product_id: id,
      color: body.color || null,
      size: body.size || null,
      stock: body.stock ?? 0,
      price_override: body.priceOverride ?? null,
      image: body.image || null,
      sku: body.sku || null,
    }

    const { data: variant, error } = await supabaseAdmin
      .from('product_variants')
      .insert(row)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json(
          { success: false, error: 'Aceasta combinatie culoare/marime exista deja' },
          { status: 409 }
        )
      }
      throw error
    }

    return Response.json({ success: true, data: variantRowToObj(variant) }, { status: 201 })
  } catch (error) {
    console.error('Create variant error:', error)
    return Response.json(
      { success: false, error: 'Failed to create variant' },
      { status: 400 }
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

    if (!body.variantId) {
      return Response.json({ success: false, error: 'variantId is required' }, { status: 400 })
    }

    const row = {}
    if (body.color !== undefined) row.color = body.color || null
    if (body.size !== undefined) row.size = body.size || null
    if (body.stock !== undefined) row.stock = body.stock
    if (body.priceOverride !== undefined) row.price_override = body.priceOverride
    if (body.image !== undefined) row.image = body.image || null
    if (body.sku !== undefined) row.sku = body.sku || null

    const { data: variant, error } = await supabaseAdmin
      .from('product_variants')
      .update(row)
      .eq('id', body.variantId)
      .eq('product_id', id)
      .select()
      .single()

    if (error || !variant) {
      return Response.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: variantRowToObj(variant) })
  } catch (error) {
    console.error('Update variant error:', error)
    return Response.json(
      { success: false, error: 'Failed to update variant' },
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
    const { searchParams } = new URL(request.url)
    const variantId = searchParams.get('variantId')

    if (!variantId) {
      return Response.json({ success: false, error: 'variantId is required' }, { status: 400 })
    }

    const { data: variant, error } = await supabaseAdmin
      .from('product_variants')
      .delete()
      .eq('id', variantId)
      .eq('product_id', id)
      .select()
      .single()

    if (error || !variant) {
      return Response.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: variantRowToObj(variant) })
  } catch (error) {
    console.error('Delete variant error:', error)
    return Response.json(
      { success: false, error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}

function variantRowToObj(row) {
  if (!row) return null
  return {
    id: row.id,
    productId: row.product_id,
    color: row.color,
    size: row.size,
    stock: row.stock,
    priceOverride: row.price_override ? parseFloat(row.price_override) : null,
    image: row.image,
    sku: row.sku,
  }
}

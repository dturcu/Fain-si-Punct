import { supabaseAdmin } from '@/lib/supabase'
import { rowToProduct, productToRow } from '../route'

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

    return Response.json({ success: true, data: rowToProduct(product) })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
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
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
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
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

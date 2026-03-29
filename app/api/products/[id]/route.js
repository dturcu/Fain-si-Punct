import { supabaseAdmin } from '@/lib/supabase'
import { rowToProduct, productToRow } from '../route'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
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

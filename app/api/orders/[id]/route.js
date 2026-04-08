import { supabaseAdmin } from '@/lib/supabase'
import { getUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { orderRowToObj } from '../route'

export async function GET(request, { params }) {
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

    const { id } = await params

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify the requesting user owns this order or is admin
    const user = await getUserById(decoded.userId)
    if (order.user_id !== decoded.userId && (!user || user.role !== 'admin')) {
      return Response.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return Response.json({ success: true, data: orderRowToObj(order, items || []) })
  } catch (error) {
    console.error('Order GET error:', error)
    return Response.json(
      { success: false, error: 'Failed to retrieve order' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
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

    // Verify user is admin
    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: body.status,
        payment_status: body.paymentStatus,
        tracking_number: body.trackingNumber,
        tracking_url: body.trackingUrl,
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return Response.json({ success: true, data: orderRowToObj(order, items || []) })
  } catch (error) {
    console.error('Order PUT error:', error)
    return Response.json(
      { success: false, error: 'Failed to update order' },
      { status: 400 }
    )
  }
}

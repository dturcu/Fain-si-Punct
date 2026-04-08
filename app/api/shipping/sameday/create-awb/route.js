import { supabaseAdmin } from '@/lib/supabase'
import { getUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { createAWB } from '@/lib/sameday'

export async function POST(request) {
  try {
    // Verify admin auth
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

    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return Response.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      )
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Prevent duplicate AWB creation
    if (order.tracking_number) {
      return Response.json(
        { success: false, error: 'AWB already exists for this order', trackingNumber: order.tracking_number },
        { status: 409 }
      )
    }

    // Determine if COD (cash on delivery / ramburs)
    const isCOD = order.payment_method === 'ramburs' || order.payment_method === 'cash_on_delivery'
    const codAmount = isCOD ? parseFloat(order.total) : 0

    // Create AWB via Sameday API
    const awbResult = await createAWB({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone || '',
      customerEmail: order.customer_email || '',
      street: order.shipping_street || '',
      city: order.shipping_city || '',
      county: order.shipping_state || '',
      postalCode: order.shipping_zip || '',
      weight: 1, // default 1kg, could be calculated from items
      codAmount,
      observation: `Comanda ${order.order_number}`,
    })

    // Update order with AWB info and set status to shipped
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        tracking_number: awbResult.awbNumber,
        tracking_url: awbResult.trackingUrl,
        status: 'shipped',
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Order update failed: ${updateError.message}`)
    }

    return Response.json({
      success: true,
      data: {
        awbNumber: awbResult.awbNumber,
        trackingUrl: awbResult.trackingUrl,
        awbCost: awbResult.awbCost,
        pdfLink: awbResult.pdfLink,
        orderStatus: updatedOrder.status,
      },
    })
  } catch (error) {
    console.error('Create AWB error:', error)
    return Response.json(
      { success: false, error: 'Failed to create shipping label' },
      { status: 500 }
    )
  }
}

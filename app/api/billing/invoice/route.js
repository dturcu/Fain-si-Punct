import { supabaseAdmin } from '@/lib/supabase'
import { getCookieToken, verifyToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import { createInvoice } from '@/lib/oblio'

export async function POST(request) {
  try {
    // Authenticate and verify admin role
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

    // Parse request body
    const { orderId, docType = 'factura' } = await request.json()
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

    // Fetch order items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`)
    }

    // Build order data for Oblio
    const orderData = {
      _id: order.id,
      id: order.id,
      orderNumber: order.order_number,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
      },
      shippingAddress: {
        street: order.shipping_street,
        city: order.shipping_city,
        state: order.shipping_state,
        zip: order.shipping_zip,
        country: order.shipping_country || 'Romania',
      },
      items: (items || []).map((item) => ({
        productId: item.product_id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
      })),
      total: parseFloat(order.total),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      paidAt: order.paid_at,
    }

    // Create invoice via Oblio API
    const invoiceResult = await createInvoice(orderData, { docType })

    // Store invoice reference on order
    const invoiceRef = `${invoiceResult.seriesName || ''}${invoiceResult.number || ''}`
    if (invoiceRef) {
      await supabaseAdmin
        .from('orders')
        .update({
          invoice_number: invoiceRef,
          invoice_series: invoiceResult.seriesName || null,
          invoice_link: invoiceResult.link || null,
        })
        .eq('id', orderId)
    }

    return Response.json({
      success: true,
      data: {
        invoiceNumber: invoiceResult.number,
        invoiceSeries: invoiceResult.seriesName,
        invoiceLink: invoiceResult.link,
        docType: invoiceResult.type,
        orderNumber: order.order_number,
      },
    })
  } catch (error) {
    console.error('Invoice creation error:', error)
    return Response.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrderById } from '@/lib/supabase-queries'
import { getPaymentIntent } from '@/lib/stripe'
import { capturePayPalOrder } from '@/lib/paypal'
import { verifyAuth } from '@/lib/auth'

/**
 * POST /api/payments/confirm
 * Confirm a payment and update order status
 */
export async function POST(request) {
  try {
    // Verify authentication
    const headersList = headers()
    const auth = await verifyAuth(headersList)

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, paymentMethod, paymentIntentId, paypalOrderId } = await request.json()

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify the authenticated user owns this order
    if (order.userId !== auth.userId && order.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (paymentMethod === 'stripe') {
      return confirmStripePayment(order, paymentIntentId)
    } else if (paymentMethod === 'paypal') {
      return confirmPayPalPayment(order, paypalOrderId)
    } else {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

async function confirmStripePayment(order, paymentIntentId) {
  try {
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing payment intent ID' }, { status: 400 })
    }

    // Get payment intent status from Stripe
    const result = await getPaymentIntent(paymentIntentId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Update payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('external_id', paymentIntentId)
      .single()

    if (payment) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: result.status === 'succeeded' ? 'succeeded' : 'failed',
          webhook_verified: true,
        })
        .eq('id', payment.id)
    } else {
      // Create payment record if doesn't exist
      await supabaseAdmin.from('payments').insert({
        order_id: order.id,
        type: 'stripe',
        external_id: paymentIntentId,
        amount: result.amount,
        currency: result.currency.toUpperCase(),
        status: result.status === 'succeeded' ? 'succeeded' : 'failed',
        payment_method: 'card',
        webhook_verified: true,
      })
    }

    // Update order based on payment status
    const updateData = {}
    if (result.status === 'succeeded') {
      updateData.payment_status = 'paid'
      updateData.paid_at = new Date().toISOString()
      updateData.status = 'processing'
    } else if (result.status === 'processing') {
      updateData.payment_status = 'processing'
    } else {
      updateData.payment_status = 'failed'
    }

    await supabaseAdmin.from('orders').update(updateData).eq('id', order.id)

    return NextResponse.json({
      success: result.status === 'succeeded',
      orderId: order.id,
      paymentStatus: updateData.payment_status || 'processing',
      message:
        result.status === 'succeeded'
          ? 'Payment confirmed successfully'
          : 'Payment is still processing',
    })
  } catch (error) {
    console.error('Error confirming Stripe payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm Stripe payment' },
      { status: 500 }
    )
  }
}

async function confirmPayPalPayment(order, paypalOrderId) {
  try {
    if (!paypalOrderId) {
      return NextResponse.json({ error: 'Missing PayPal order ID' }, { status: 400 })
    }

    // Capture the PayPal order
    const result = await capturePayPalOrder(paypalOrderId)

    if (!result.success) {
      // Update payment status as failed
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          error_message: result.error,
        })
        .eq('external_id', paypalOrderId)

      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', order.id)

      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Extract capture ID from response
    const captureId = result.purchaseUnits?.[0]?.payments?.captures?.[0]?.id

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'succeeded',
        payment_method: 'paypal',
        metadata: {
          captureId,
          payerId: result.payer?.payer_info?.payer_id,
        },
        webhook_verified: true,
      })
      .eq('external_id', paypalOrderId)

    // Update order
    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        status: 'processing',
      })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentStatus: 'paid',
      message: 'PayPal payment captured successfully',
    })
  } catch (error) {
    console.error('Error confirming PayPal payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm PayPal payment' },
      { status: 500 }
    )
  }
}

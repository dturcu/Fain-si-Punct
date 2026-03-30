import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPayPalIPN } from '@/lib/paypal'

/**
 * POST /api/webhooks/paypal
 * Handle PayPal webhook events (IPN - Instant Payment Notification)
 */
export async function POST(request) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const event = params.get('event_type')

    // Verify webhook signature
    const isVerified = await verifyPayPalIPN(body)
    if (!isVerified) {
      console.warn('PayPal webhook verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('PayPal webhook received:', event)

    // Handle different event types
    if (event === 'PAYMENT.CAPTURE.COMPLETED') {
      await handlePaymentCaptureCompleted(params)
    } else if (event === 'PAYMENT.CAPTURE.DENIED') {
      await handlePaymentCaptureDenied(params)
    } else if (event === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = params.get('resource_order_id')
      console.log('Order approved in PayPal:', orderId)
    } else {
      console.log('Unhandled PayPal event type:', event)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  }
}

async function handlePaymentCaptureCompleted(params) {
  try {
    const captureId = params.get('resource_capture_id')
    const status = params.get('resource_status')
    const amount = params.get('resource_amount_value')
    const currency = params.get('resource_amount_currency_code')

    console.log('Processing PAYMENT.CAPTURE.COMPLETED:', captureId)

    // Find payment by exact capture ID match (unique index)
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('external_id', captureId)
      .eq('type', 'paypal')
      .single()

    if (!payment) {
      console.warn('Payment not found for capture ID:', captureId)
      return
    }

    if (payment.status === 'succeeded') {
      console.log('Payment already processed (idempotent):', captureId)
      return
    }

    // Validate amount: webhook value (in RON) must match stored amount (in bani/cents)
    const webhookAmountBani = Math.round(parseFloat(amount) * 100)
    if (webhookAmountBani !== payment.amount) {
      console.error(
        `PayPal amount mismatch for ${captureId}: expected ${payment.amount} bani, got ${webhookAmountBani} bani`
      )
      return
    }

    // Update payment with succeeded status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'succeeded',
        metadata: {
          ...payment.metadata,
          captureStatus: status,
          webhookVerifiedAt: new Date().toISOString(),
        },
        webhook_verified: true,
      })
      .eq('id', payment.id)

    // Update order status (only if not already paid)
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single()

    if (order) {
      if (order.payment_status !== 'paid') {
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            status: 'processing',
          })
          .eq('id', order.id)
        console.log('Order updated for PayPal payment:', order.id)
      } else {
        console.log('Order already marked as paid (idempotent):', order.id)
      }
    } else {
      console.error('Order not found for payment:', payment.order_id)
    }
  } catch (error) {
    console.error('Error handling PAYMENT.CAPTURE.COMPLETED:', error)
  }
}

async function handlePaymentCaptureDenied(params) {
  try {
    const captureId = params.get('resource_capture_id')
    const reason = params.get('resource_reason_code')

    console.log('Processing PAYMENT.CAPTURE.DENIED:', captureId)

    // Find payment by exact capture ID match
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('external_id', captureId)
      .eq('type', 'paypal')
      .single()

    if (!payment) {
      console.warn('Payment not found for denied capture ID:', captureId)
      return
    }

    // Only update if not already processed
    if (payment.status === 'failed') {
      console.log('Payment already marked as failed (idempotent):', captureId)
      return
    }

    // Update payment with failed status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        error_message: `Payment denied: ${reason}`,
        metadata: {
          ...payment.metadata,
          denialReason: reason,
          webhookVerifiedAt: new Date().toISOString(),
        },
        webhook_verified: true,
      })
      .eq('id', payment.id)

    // Update order status
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single()

    if (order) {
      if (order.payment_status !== 'failed') {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order.id)
        console.log('Order payment marked as failed:', order.id)
      } else {
        console.log('Order already marked as failed (idempotent):', order.id)
      }
    }
  } catch (error) {
    console.error('Error handling PAYMENT.CAPTURE.DENIED:', error)
  }
}

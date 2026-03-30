import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { constructWebhookEvent, verifyWebhookSignature } from '@/lib/stripe'

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse and construct event
    const event = constructWebhookEvent(body, signature)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded:', paymentIntent.id)

    // Find the payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('external_id', paymentIntent.id)
      .single()

    if (!payment) {
      console.warn('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Prevent duplicate processing
    if (payment.status === 'succeeded' && payment.webhook_verified) {
      console.log('Payment already processed:', paymentIntent.id)
      return
    }

    // Validate amount: webhook amount must match the stored payment amount
    // (prevents an attacker constructing a webhook for a lesser amount)
    if (paymentIntent.amount !== payment.amount) {
      console.error(
        `Amount mismatch for ${paymentIntent.id}: expected ${payment.amount}, got ${paymentIntent.amount}`
      )
      return
    }

    // Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'succeeded',
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
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          status: 'processing',
        })
        .eq('id', order.id)

      console.log('Order updated for payment:', order.id)
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed:', paymentIntent.id)

    // Find the payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('external_id', paymentIntent.id)
      .single()

    if (!payment) {
      console.warn('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
        webhook_verified: true,
        retry_count: (payment.retry_count || 0) + 1,
      })
      .eq('id', payment.id)

    // Update order status
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single()

    if (order) {
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', order.id)

      console.log('Order payment marked as failed:', order.id)
    }
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error)
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log('Processing payment_intent.canceled:', paymentIntent.id)

    // Find the payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('external_id', paymentIntent.id)
      .single()

    if (!payment) {
      console.warn('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        error_message: 'Payment canceled',
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
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', order.id)

      console.log('Order marked as canceled:', order.id)
    }
  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error)
  }
}

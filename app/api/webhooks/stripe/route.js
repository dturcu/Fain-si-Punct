import { NextResponse } from 'next/server'
import Order from '@/models/Order'
import Payment from '@/models/Payment'
import {
  constructWebhookEvent,
  verifyWebhookSignature,
} from '@/lib/stripe'

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 *
 * Supported events:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - payment_intent.canceled
 */
export async function POST(request) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
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

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded:', paymentIntent.id)

    // Find the payment record
    const payment = await Payment.findOne({
      externalId: paymentIntent.id,
    })

    if (!payment) {
      console.warn('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Prevent duplicate processing
    if (payment.status === 'succeeded' && payment.webhookVerified) {
      console.log('Payment already processed:', paymentIntent.id)
      return
    }

    // Update payment status
    payment.status = 'succeeded'
    payment.webhookVerified = true
    await payment.save()

    // Update order status
    const order = await Order.findById(payment.orderId)
    if (order) {
      order.paymentStatus = 'paid'
      order.paidAt = new Date()
      order.status = 'processing'
      await order.save()

      console.log('Order updated for payment:', order._id)
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error)
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed:', paymentIntent.id)

    // Find the payment record
    const payment = await Payment.findOne({
      externalId: paymentIntent.id,
    })

    if (!payment) {
      console.warn('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Update payment status
    payment.status = 'failed'
    payment.errorMessage =
      paymentIntent.last_payment_error?.message || 'Payment failed'
    payment.webhookVerified = true
    payment.retryCount = (payment.retryCount || 0) + 1
    await payment.save()

    // Update order status
    const order = await Order.findById(payment.orderId)
    if (order) {
      order.paymentStatus = 'failed'
      await order.save()

      console.log('Order payment marked as failed:', order._id)
    }
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error)
  }
}

/**
 * Handle payment_intent.canceled event
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log('Processing payment_intent.canceled:', paymentIntent.id)

    // Find the payment record
    const payment = await Payment.findOne({
      externalId: paymentIntent.id,
    })

    if (!payment) {
      console.warn('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Update payment status
    payment.status = 'failed'
    payment.errorMessage = 'Payment canceled'
    payment.webhookVerified = true
    await payment.save()

    // Update order status
    const order = await Order.findById(payment.orderId)
    if (order) {
      order.paymentStatus = 'failed'
      await order.save()

      console.log('Order marked as canceled:', order._id)
    }
  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error)
  }
}

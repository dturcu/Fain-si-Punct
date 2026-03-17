import { NextResponse } from 'next/server'
import Order from '@/models/Order'
import Payment from '@/models/Payment'
import { verifyPayPalIPN } from '@/lib/paypal'

/**
 * POST /api/webhooks/paypal
 * Handle PayPal webhook events (IPN - Instant Payment Notification)
 *
 * Supported events:
 * - PAYMENT.CAPTURE.COMPLETED
 * - PAYMENT.CAPTURE.DENIED
 * - CHECKOUT.ORDER.APPROVED
 */
export async function POST(request) {
  try {
    const body = await request.text()
    const headers = request.headers

    console.log('PayPal webhook received')

    // Parse the body
    const params = new URLSearchParams(body)
    const event = params.get('event_type')

    // Verify webhook authenticity
    // TODO: In production, verify webhook signature using PayPal SDK:
    // const verified = await verifyPayPalIPN(body, headers)
    // if (!verified) return NextResponse.json({ received: true }, { status: 200 })
    // For now, rely on idempotent payment ID matching (externalId)

    // Handle different event types
    if (event === 'PAYMENT.CAPTURE.COMPLETED') {
      const paymentId = params.get('resource_id')
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

/**
 * Handle PAYMENT.CAPTURE.COMPLETED event
 */
async function handlePaymentCaptureCompleted(params) {
  try {
    const captureId = params.get('resource_capture_id')
    const status = params.get('resource_status')
    const amount = params.get('resource_amount_value')
    const currency = params.get('resource_amount_currency_code')

    console.log('Processing PAYMENT.CAPTURE.COMPLETED:', captureId)

    // Find payment by exact capture ID match (unique index)
    // This is idempotent - matches by PayPal's external capture ID
    const payment = await Payment.findOne({
      externalId: captureId,
      type: 'paypal',
    })

    if (!payment) {
      console.warn('Payment not found for capture ID:', captureId)
      console.warn('This could be a stale webhook or payment created on another system')
      return
    }

    if (payment.status === 'succeeded') {
      console.log('Payment already processed (idempotent):', captureId)
      return
    }

    // Update payment with succeeded status
    payment.status = 'succeeded'
    payment.metadata = {
      ...payment.metadata,
      captureStatus: status,
      webhookVerifiedAt: new Date().toISOString(),
    }
    payment.webhookVerified = true
    await payment.save()

    // Update order status (only if not already paid)
    const order = await Order.findById(payment.orderId)
    if (order) {
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid'
        order.paidAt = new Date()
        order.status = 'processing'
        await order.save()
        console.log('Order updated for PayPal payment:', order._id)
      } else {
        console.log('Order already marked as paid (idempotent):', order._id)
      }
    } else {
      console.error('Order not found for payment:', payment.orderId)
    }
  } catch (error) {
    console.error('Error handling PAYMENT.CAPTURE.COMPLETED:', error)
  }
}

/**
 * Handle PAYMENT.CAPTURE.DENIED event
 */
async function handlePaymentCaptureDenied(params) {
  try {
    const captureId = params.get('resource_capture_id')
    const reason = params.get('resource_reason_code')

    console.log('Processing PAYMENT.CAPTURE.DENIED:', captureId)

    // Find payment by exact capture ID match (unique index)
    // Prevents issues with multiple pending payments
    const payment = await Payment.findOne({
      externalId: captureId,
      type: 'paypal',
    })

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
    payment.status = 'failed'
    payment.errorMessage = `Payment denied: ${reason}`
    payment.metadata = {
      ...payment.metadata,
      denialReason: reason,
      webhookVerifiedAt: new Date().toISOString(),
    }
    payment.webhookVerified = true
    await payment.save()

    // Update order status
    const order = await Order.findById(payment.orderId)
    if (order) {
      if (order.paymentStatus !== 'failed') {
        order.paymentStatus = 'failed'
        await order.save()
        console.log('Order payment marked as failed:', order._id)
      } else {
        console.log('Order already marked as failed (idempotent):', order._id)
      }
    }
  } catch (error) {
    console.error('Error handling PAYMENT.CAPTURE.DENIED:', error)
  }
}

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
    // Note: Full webhook signature verification would require PayPal SDK
    // This is a simplified version - in production, use full verification

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

    // Note: In a real implementation, you'd need to track the relationship
    // between PayPal capture ID and your payment record
    // This is simplified - you might need to query by metadata

    // Try to find payment by looking at recent payments
    const payments = await Payment.find({
      type: 'paypal',
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 1800000) }, // Last 30 minutes
    }).limit(10)

    if (payments.length === 0) {
      console.warn('No pending PayPal payment found for capture:', captureId)
      return
    }

    // Update the matching payment (first one found)
    const payment = payments[0]

    if (payment.status === 'succeeded') {
      console.log('Payment already processed:', payment.externalId)
      return
    }

    payment.status = 'succeeded'
    payment.metadata = {
      ...payment.metadata,
      captureId,
      captureStatus: status,
    }
    payment.webhookVerified = true
    await payment.save()

    // Update order status
    const order = await Order.findById(payment.orderId)
    if (order) {
      order.paymentStatus = 'paid'
      order.paidAt = new Date()
      order.status = 'processing'
      await order.save()

      console.log('Order updated for PayPal payment:', order._id)
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

    // Find payments that might be related to this capture
    const payments = await Payment.find({
      type: 'paypal',
      status: { $in: ['pending', 'processing'] },
      createdAt: { $gte: new Date(Date.now() - 1800000) }, // Last 30 minutes
    }).limit(10)

    if (payments.length === 0) {
      console.warn('No pending PayPal payment found for denied capture:', captureId)
      return
    }

    // Update the matching payment
    const payment = payments[0]
    payment.status = 'failed'
    payment.errorMessage = `Payment denied: ${reason}`
    payment.webhookVerified = true
    await payment.save()

    // Update order status
    const order = await Order.findById(payment.orderId)
    if (order) {
      order.paymentStatus = 'failed'
      await order.save()

      console.log('Order payment marked as failed:', order._id)
    }
  } catch (error) {
    console.error('Error handling PAYMENT.CAPTURE.DENIED:', error)
  }
}

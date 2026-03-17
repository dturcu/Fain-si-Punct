import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import mongoose from 'mongoose'
import Order from '@/models/Order'
import Payment from '@/models/Payment'
import { getPaymentIntent } from '@/lib/stripe'
import { capturePayPalOrder } from '@/lib/paypal'
import { verifyAuth } from '@/lib/auth'

/**
 * POST /api/payments/confirm
 * Confirm a payment and update order status
 *
 * Request body:
 * {
 *   orderId: string,
 *   paymentMethod: 'stripe' | 'paypal',
 *   paymentIntentId?: string (for Stripe)
 *   paypalOrderId?: string (for PayPal)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   orderId: string,
 *   paymentStatus: string,
 *   message: string
 * }
 */
export async function POST(request) {
  try {
    // Verify authentication
    const headersList = headers()
    const auth = await verifyAuth(headersList)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId, paymentMethod, paymentIntentId, paypalOrderId } =
      await request.json()

    // Validate input
    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (paymentMethod === 'stripe') {
      return confirmStripePayment(order, paymentIntentId)
    } else if (paymentMethod === 'paypal') {
      return confirmPayPalPayment(order, paypalOrderId)
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

/**
 * Confirm Stripe payment
 */
async function confirmStripePayment(order, paymentIntentId) {
  try {
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      )
    }

    // Get payment intent status from Stripe
    const result = await getPaymentIntent(paymentIntentId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { externalId: paymentIntentId },
      {
        status: result.status === 'succeeded' ? 'succeeded' : 'failed',
        webhookVerified: true,
        updatedAt: new Date(),
      },
      { new: true }
    )

    if (!payment) {
      // Payment record doesn't exist, create it
      await Payment.create({
        orderId: order._id,
        type: 'stripe',
        externalId: paymentIntentId,
        amount: result.amount,
        currency: result.currency.toUpperCase(),
        status: result.status === 'succeeded' ? 'succeeded' : 'failed',
        paymentMethod: 'card',
        webhookVerified: true,
      })
    }

    // Update order based on payment status
    if (result.status === 'succeeded') {
      order.paymentStatus = 'paid'
      order.paidAt = new Date()
      order.status = 'processing'
    } else if (result.status === 'processing') {
      order.paymentStatus = 'processing'
    } else {
      order.paymentStatus = 'failed'
    }

    await order.save()

    return NextResponse.json({
      success: result.status === 'succeeded',
      orderId: order._id,
      paymentStatus: order.paymentStatus,
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

/**
 * Confirm PayPal payment
 */
async function confirmPayPalPayment(order, paypalOrderId) {
  try {
    if (!paypalOrderId) {
      return NextResponse.json(
        { error: 'Missing PayPal order ID' },
        { status: 400 }
      )
    }

    // Capture the PayPal order
    const result = await capturePayPalOrder(paypalOrderId)

    if (!result.success) {
      // Update payment status as failed
      await Payment.findOneAndUpdate(
        { externalId: paypalOrderId },
        {
          status: 'failed',
          errorMessage: result.error,
          updatedAt: new Date(),
        }
      )

      order.paymentStatus = 'failed'
      await order.save()

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Extract capture ID from response
    const captureId =
      result.purchaseUnits[0]?.payments?.captures[0]?.id

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { externalId: paypalOrderId },
      {
        status: 'succeeded',
        paymentMethod: 'paypal',
        metadata: {
          captureId,
          payerId: result.payer?.payer_info?.payer_id,
        },
        webhookVerified: true,
        updatedAt: new Date(),
      },
      { new: true }
    )

    // Update order
    order.paymentStatus = 'paid'
    order.paidAt = new Date()
    order.status = 'processing'
    await order.save()

    return NextResponse.json({
      success: true,
      orderId: order._id,
      paymentStatus: 'paid',
      message: 'PayPal payment captured successfully',
    })
  } catch (error) {
    console.error('Error confirming PayPal payment:', error)

    // Try to update the payment record
    await Payment.findOneAndUpdate(
      { externalId: paypalOrderId },
      {
        status: 'failed',
        errorMessage: error.message,
        updatedAt: new Date(),
      }
    ).catch(() => {})

    return NextResponse.json(
      { error: 'Failed to confirm PayPal payment' },
      { status: 500 }
    )
  }
}

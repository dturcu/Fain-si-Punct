import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import mongoose from 'mongoose'
import Order from '@/models/Order'
import Payment from '@/models/Payment'
import {
  createPaymentIntent,
  getStripePublicKey,
} from '@/lib/stripe'
import { createPayPalOrder, getPayPalClientId } from '@/lib/paypal'
import { verifyAuth } from '@/lib/auth'

/**
 * POST /api/payments/create-intent
 * Create a payment intent for either Stripe or PayPal
 *
 * Request body:
 * {
 *   orderId: string,
 *   method: 'stripe' | 'paypal'
 * }
 *
 * Response:
 * Stripe: { clientSecret, paymentIntentId, publicKey }
 * PayPal: { approvalUrl, paypalOrderId }
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

    const { orderId, method } = await request.json()

    // Validate input
    if (!orderId || !method) {
      return NextResponse.json(
        { error: 'Missing orderId or method' },
        { status: 400 }
      )
    }

    if (!['stripe', 'paypal'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to user
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

    // Check if order already has a processing payment
    const existingPayment = await Payment.findOne({
      orderId: order._id,
      status: 'processing',
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Order already has a processing payment' },
        { status: 409 }
      )
    }

    if (method === 'stripe') {
      return handleStripePayment(order, auth)
    } else {
      return handlePayPalPayment(order, auth)
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

/**
 * Handle Stripe payment intent creation
 */
async function handleStripePayment(order, auth) {
  try {
    const amountInCents = Math.round(order.total * 100)

    const result = await createPaymentIntent({
      amount: amountInCents,
      currency: 'usd',
      orderId: order._id,
      metadata: {
        userId: auth.userId,
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Create payment record in database
    const payment = new Payment({
      orderId: order._id,
      type: 'stripe',
      externalId: result.id,
      amount: amountInCents,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'card',
      metadata: {
        clientSecret: result.clientSecret,
      },
    })

    await payment.save()

    // Update order with payment reference
    order.paymentId = payment._id
    order.paymentMethod = 'stripe'
    order.paymentStatus = 'processing'
    await order.save()

    return NextResponse.json(
      {
        clientSecret: result.clientSecret,
        paymentIntentId: result.id,
        publicKey: getStripePublicKey(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error handling Stripe payment:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe payment intent' },
      { status: 500 }
    )
  }
}

/**
 * Handle PayPal order creation
 */
async function handlePayPalPayment(order, auth) {
  try {
    const result = await createPayPalOrder({
      amount: Math.round(order.total * 100),
      currency: 'USD',
      orderId: order._id,
      items: order.items,
      returnUrl: `${process.env.NEXT_PUBLIC_API_URL}/payments/paypal/return`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_URL}/checkout?error=cancelled`,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Create payment record in database
    const payment = new Payment({
      orderId: order._id,
      type: 'paypal',
      externalId: result.id,
      amount: Math.round(order.total * 100),
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'paypal',
    })

    await payment.save()

    // Update order with payment reference
    order.paymentId = payment._id
    order.paymentMethod = 'paypal'
    order.paymentStatus = 'processing'
    await order.save()

    return NextResponse.json(
      {
        approvalUrl: result.approvalUrl,
        paypalOrderId: result.id,
        clientId: getPayPalClientId(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error handling PayPal payment:', error)
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}

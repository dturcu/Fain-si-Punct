import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrderById } from '@/lib/supabase-queries'
import { createPaymentIntent, getStripePublicKey } from '@/lib/stripe'
import { createPayPalOrder, getPayPalClientId } from '@/lib/paypal'
import { verifyAuth } from '@/lib/auth'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'

/**
 * POST /api/payments/create-intent
 * Create a payment intent for either Stripe or PayPal
 */
export async function POST(request) {
  try {
    // Verify authentication
    const headersList = headers()
    const auth = await verifyAuth(headersList)

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, method } = await request.json()

    if (!orderId || !method) {
      return NextResponse.json({ error: 'Missing orderId or method' }, { status: 400 })
    }

    if (!['stripe', 'paypal'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Verify order exists and belongs to the authenticated user
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Enforce ownership — prevent one user from paying another's order
    if (order.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if order already has a processing payment
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'processing')
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Order already has a processing payment' },
        { status: 409 }
      )
    }

    logAuditEvent('payment_attempt', { userId: auth.userId, metadata: { orderId, method }, ...getRequestMeta(request) })

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

async function handleStripePayment(order, auth) {
  try {
    // Re-fetch the authoritative total from the database to prevent client-side price manipulation
    const { data: freshOrder, error: freshError } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('id', order.id)
      .eq('user_id', auth.userId)
      .single()

    if (freshError || !freshOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const amountInCents = Math.round(parseFloat(freshOrder.total) * 100)

    const result = await createPaymentIntent({
      amount: amountInCents,
      currency: 'usd',
      orderId: order.id,
      metadata: {
        userId: auth.userId,
      },
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Create payment record in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: order.id,
        type: 'stripe',
        external_id: result.id,
        amount: amountInCents,
        currency: 'USD',
        status: 'pending',
        payment_method: 'card',
        metadata: { clientSecret: result.clientSecret },
      })
      .select()
      .single()

    if (error) throw error

    // Update order with payment reference
    await supabaseAdmin
      .from('orders')
      .update({
        payment_id: payment.id,
        payment_method: 'stripe',
        payment_status: 'processing',
      })
      .eq('id', order.id)

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

async function handlePayPalPayment(order, auth) {
  try {
    // Re-fetch authoritative total from DB
    const { data: freshOrder, error: freshError } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('id', order.id)
      .eq('user_id', auth.userId)
      .single()

    if (freshError || !freshOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const result = await createPayPalOrder({
      amount: Math.round(parseFloat(freshOrder.total) * 100),
      currency: 'USD',
      orderId: order.id,
      items: order.items,
      returnUrl: `${process.env.NEXT_PUBLIC_API_URL}/payments/paypal/return`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_URL}/checkout?error=cancelled`,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Create payment record in database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: order.id,
        type: 'paypal',
        external_id: result.id,
        amount: Math.round(parseFloat(freshOrder.total) * 100),
        currency: 'USD',
        status: 'pending',
        payment_method: 'paypal',
      })
      .select()
      .single()

    if (error) throw error

    // Update order with payment reference
    await supabaseAdmin
      .from('orders')
      .update({
        payment_id: payment.id,
        payment_method: 'paypal',
        payment_status: 'processing',
      })
      .eq('id', order.id)

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

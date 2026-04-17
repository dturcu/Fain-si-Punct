import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrderById } from '@/lib/supabase-queries'
import { createPaymentIntent, getStripePublicKey } from '@/lib/stripe'
import { createPayPalOrder, getPayPalClientId } from '@/lib/paypal'
import { verifyAuth, getGuestSessionId } from '@/lib/auth'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'
/**
 * POST /api/payments/create-intent
 * Create a payment intent for either Stripe or PayPal
 */
export async function POST(request) {
  try {
    // Verify authentication (user or guest)
    const headersList = await headers()
    const auth = verifyAuth(headersList)
    const guestSessionId = getGuestSessionId(request)

    if (!auth && !guestSessionId) {
      return apiError(ERROR_CODES.UNAUTHORIZED)
    }

    const { orderId, method } = await request.json()

    if (!orderId || !method) {
      return apiError(ERROR_CODES.MISSING_FIELD, { details: 'orderId and method are required' })
    }

    if (!['stripe', 'paypal'].includes(method)) {
      return apiError(ERROR_CODES.INVALID_PAYMENT_METHOD)
    }

    // Verify order exists
    const order = await getOrderById(orderId)
    if (!order) {
      return apiError(ERROR_CODES.ORDER_NOT_FOUND)
    }

    // Ownership check: user owns order OR guest session matches
    const isOwner = (auth && order.userId === auth.userId) ||
      (guestSessionId && order.guestSessionId === guestSessionId)
    if (!isOwner) {
      return apiError(ERROR_CODES.FORBIDDEN)
    }

    // Check if order already has a processing payment. maybeSingle()
    // tolerates 0-row (no existing) and returns the error for anything
    // unexpected so we don't silently bypass the guard on transient DB
    // errors.
    const { data: existingPayment, error: existingErr } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'processing')
      .maybeSingle()

    if (existingErr) throw existingErr
    if (existingPayment) {
      return apiError(ERROR_CODES.PAYMENT_IN_PROGRESS)
    }

    const { ip, userAgent } = getRequestMeta(request)
    await logAuditEvent('payment_attempt', {
      userId: auth?.userId || null,
      ip,
      userAgent,
      metadata: { orderId, method, total: order.total },
    })

    if (method === 'stripe') {
      return handleStripePayment(order, auth)
    } else {
      return handlePayPalPayment(order, auth)
    }
  } catch (error) {
    return handleApiError(error, 'payments/create-intent', ERROR_CODES.PAYMENT_FAILED)
  }
}

async function handleStripePayment(order, auth) {
  try {
    const amountInCents = Math.round(order.total * 100)

    const result = await createPaymentIntent({
      amount: amountInCents,
      currency: 'ron',
      orderId: order.id,
      metadata: {
        userId: auth?.userId || 'guest',
      },
      idempotencyKey: `pi_order_${order.id}`,
    })

    if (!result.success) {
      return apiError(ERROR_CODES.PAYMENT_FAILED, { details: result.error })
    }

    // Upsert by external_id — Stripe's stable idempotency key returns the
    // SAME PaymentIntent on retry, but payments.external_id is UNIQUE, so a
    // second plain INSERT would 23505. Upsert keeps us at one row per intent.
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .upsert(
        {
          order_id: order.id,
          type: 'stripe',
          external_id: result.id,
          amount: amountInCents,
          currency: 'RON',
          status: 'pending',
          payment_method: 'card',
          metadata: { clientSecret: result.clientSecret },
        },
        { onConflict: 'external_id' }
      )
      .select()
      .single()

    if (error) throw error

    const { error: orderUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_id: payment.id,
        payment_method: 'stripe',
        payment_status: 'processing',
      })
      .eq('id', order.id)

    if (orderUpdateError) throw orderUpdateError

    return NextResponse.json(
      {
        clientSecret: result.clientSecret,
        paymentIntentId: result.id,
        publicKey: getStripePublicKey(),
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, 'payments/create-intent/stripe', ERROR_CODES.PAYMENT_FAILED)
  }
}

async function handlePayPalPayment(order, _auth) {
  try {
    const result = await createPayPalOrder({
      amount: Math.round(order.total * 100),
      currency: 'RON',
      orderId: order.id,
      items: order.items,
      returnUrl: `${process.env.NEXT_PUBLIC_API_URL}/payments/paypal/return`,
      cancelUrl: `${process.env.NEXT_PUBLIC_API_URL}/checkout?error=cancelled`,
    })

    if (!result.success) {
      return apiError(ERROR_CODES.PAYMENT_FAILED, { details: result.error })
    }

    // Upsert by external_id — same rationale as Stripe handler.
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .upsert(
        {
          order_id: order.id,
          type: 'paypal',
          external_id: result.id,
          amount: Math.round(order.total * 100),
          currency: 'RON',
          status: 'pending',
          payment_method: 'paypal',
        },
        { onConflict: 'external_id' }
      )
      .select()
      .single()

    if (error) throw error

    const { error: orderUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_id: payment.id,
        payment_method: 'paypal',
        payment_status: 'processing',
      })
      .eq('id', order.id)

    if (orderUpdateError) throw orderUpdateError

    return NextResponse.json(
      {
        approvalUrl: result.approvalUrl,
        paypalOrderId: result.id,
        clientId: getPayPalClientId(),
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, 'payments/create-intent/paypal', ERROR_CODES.PAYMENT_FAILED)
  }
}

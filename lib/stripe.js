import Stripe from 'stripe'

/**
 * Lazily initialize Stripe client — only throws when actually used,
 * not at import/build time (which breaks Next.js static page collection).
 *
 * `timeout` bounds each HTTP call (10s).
 * `apiVersion` pinned to a 2025 release; bump deliberately after testing.
 */
let _stripe = null
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      timeout: 10_000,
      maxNetworkRetries: 2,
    })
  }
  return _stripe
}

// Keep backward-compat default export
const stripe = new Proxy({}, {
  get(_, prop) {
    return getStripe()[prop]
  },
})

/**
 * Create a payment intent for a new payment.
 * @param {Object} params
 * @param {number} params.amount - Amount in the currency's smallest unit (e.g. bani for RON)
 * @param {string} params.currency - Currency code (lowercase ISO 4217, e.g. 'ron')
 * @param {string} params.orderId - Order ID for metadata + idempotency key derivation
 * @param {string} [params.customerId] - Stripe customer ID
 * @param {Object} [params.metadata] - Additional metadata
 * @param {string} [params.idempotencyKey] - Override automatic idempotency key
 * @returns {Promise<{success:boolean, clientSecret?:string, id?:string, status?:string, error?:string}>}
 */
export async function createPaymentIntent(params) {
  try {
    const {
      amount,
      currency = 'ron',
      orderId,
      customerId,
      metadata = {},
      idempotencyKey,
    } = params

    const intentParams = {
      amount,
      currency,
      metadata: {
        orderId: orderId.toString(),
        ...metadata,
      },
      automatic_payment_methods: { enabled: true },
    }

    if (customerId) {
      intentParams.customer = customerId
    }

    // Stable idempotency key prevents duplicate intents on network retry.
    const key = idempotencyKey || `pi_create_${orderId}`
    const paymentIntent = await stripe.paymentIntents.create(intentParams, {
      idempotencyKey: key,
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      status: paymentIntent.status,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Retrieve a payment intent to check its status.
 * @param {string} paymentIntentId
 */
export async function getPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      success: true,
      status: paymentIntent.status,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    }
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Confirm a payment intent (saved card or additional confirmation flows).
 * @param {string} paymentIntentId
 * @param {Object} [params]
 */
export async function confirmPaymentIntent(paymentIntentId, params = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, params)
    return {
      success: true,
      status: paymentIntent.status,
      id: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error confirming payment intent:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Refund a payment. Uses the `payment_intent` parameter (Stripe-recommended
 * since API 2022-11-15); avoids the removed `paymentIntent.charges` array.
 * @param {string} paymentIntentId
 * @param {Object} [params] - Additional refund params (amount, reason, metadata)
 */
export async function refundPayment(paymentIntentId, params = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
      return {
        success: false,
        error: 'Payment cannot be refunded in current status',
      }
    }

    // Split: idempotencyKey is a request-option, not a refund-body field.
    // Spreading it into the body sends it to Stripe as an unknown field
    // and can cause the call to fail.
    const { idempotencyKey, ...refundBody } = params
    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntentId, ...refundBody },
      { idempotencyKey: idempotencyKey || `refund_${paymentIntentId}` }
    )

    return {
      success: true,
      id: refund.id,
      status: refund.status,
    }
  } catch (error) {
    console.error('Error refunding payment:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Verify webhook signature from Stripe.
 * @param {string|Buffer} body - Raw request body
 * @param {string} signature - Stripe signature header
 */
export function verifyWebhookSignature(body, signature) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return false
    }
    stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return true
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message)
    return false
  }
}

/**
 * Construct webhook event. Throws on invalid signature.
 * @param {string|Buffer} body - Raw request body
 * @param {string} signature - Stripe signature header
 */
export function constructWebhookEvent(body, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured')
  }
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}

/**
 * Create a Stripe customer.
 */
export async function createStripeCustomer(params) {
  try {
    const customer = await stripe.customers.create(params)
    return { success: true, id: customer.id }
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get Stripe public key for client-side use.
 */
export function getStripePublicKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
}

export default stripe

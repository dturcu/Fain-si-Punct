import Stripe from 'stripe'

/**
 * Lazily initialize Stripe client — only throws when actually used,
 * not at import/build time (which breaks Next.js static page collection).
 */
let _stripe = null
function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
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
 * Create a payment intent for a new payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in cents
 * @param {string} params.currency - Currency code (e.g., 'usd')
 * @param {string} params.orderId - Order ID for metadata
 * @param {string} params.customerId - Stripe customer ID (optional)
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Payment intent object
 */
export async function createPaymentIntent(params) {
  try {
    const {
      amount,
      currency = 'ron',
      orderId,
      customerId,
      metadata = {},
    } = params

    const intentParams = {
      amount,
      currency,
      metadata: {
        orderId: orderId.toString(),
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    }

    // Add customer if provided
    if (customerId) {
      intentParams.customer = customerId
    }

    const paymentIntent = await stripe.paymentIntents.create(intentParams)

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
 * Retrieve a payment intent to check its status
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Payment intent object
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
 * Confirm a payment intent (if using saved card or additional confirmation needed)
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {Object} params - Confirmation parameters
 * @returns {Promise<Object>} Confirmation result
 */
export async function confirmPaymentIntent(paymentIntentId, params = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      params
    )

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
 * Refund a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {Object} params - Refund parameters
 * @returns {Promise<Object>} Refund result
 */
export async function refundPayment(paymentIntentId, params = {}) {
  try {
    // Get the charge ID from the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (
      paymentIntent.status !== 'succeeded' &&
      paymentIntent.status !== 'processing'
    ) {
      return {
        success: false,
        error: 'Payment cannot be refunded in current status',
      }
    }

    const chargeId = paymentIntent.charges.data[0]?.id
    if (!chargeId) {
      return {
        success: false,
        error: 'No charge found to refund',
      }
    }

    const refund = await stripe.refunds.create({
      charge: chargeId,
      ...params,
    })

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
 * Verify webhook signature from Stripe
 * @param {string} body - Raw request body as string
 * @param {string} signature - Stripe signature header
 * @returns {boolean} Whether signature is valid
 */
export function verifyWebhookSignature(body, signature) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return false
    }

    // Stripe.constructEvent validates the signature automatically
    stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return true
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message)
    return false
  }
}

/**
 * Construct webhook event from body and signature
 * @param {string} body - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Webhook event
 */
export function constructWebhookEvent(body, signature) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured')
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return event
  } catch (error) {
    console.error('Error constructing webhook event:', error)
    throw error
  }
}

/**
 * Create a Stripe customer
 * @param {Object} params - Customer parameters
 * @returns {Promise<Object>} Customer object
 */
export async function createStripeCustomer(params) {
  try {
    const customer = await stripe.customers.create(params)
    return {
      success: true,
      id: customer.id,
    }
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get Stripe public key for client-side use
 * @returns {string} Stripe public key
 */
export function getStripePublicKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
}

export default stripe

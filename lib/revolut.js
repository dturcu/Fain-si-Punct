/**
 * Revolut Business Payment Gateway integration
 * Docs: https://developer.revolut.com/docs/merchant/
 */

const REVOLUT_API_KEY = process.env.REVOLUT_API_KEY || 'sk_sandbox_dummy_key'
const REVOLUT_SANDBOX = process.env.REVOLUT_ENVIRONMENT !== 'production'

const BASE_URL = REVOLUT_SANDBOX
  ? 'https://sandbox-merchant.revolut.com/api'
  : 'https://merchant.revolut.com/api'

// Revolut Pay widget URL
export const REVOLUT_WIDGET_URL = REVOLUT_SANDBOX
  ? 'https://sandbox-merchant.revolut.com/embed.js'
  : 'https://merchant.revolut.com/embed.js'

export const REVOLUT_PUBLIC_ID = process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_ID || ''

/**
 * Create a payment order on Revolut
 * @param {object} params
 * @param {number} params.amount - Amount in minor units (cents/bani). e.g. 1999 = 19.99 RON
 * @param {string} params.currency - ISO 4217 currency code (e.g. "RON")
 * @param {string} params.description - Order description
 * @param {string} params.merchantOrderId - Your internal order reference
 * @param {string} params.customerEmail - Customer email
 * @param {object} params.shippingAddress - Shipping address
 */
export async function createRevolutOrder({
  amount,
  currency = 'RON',
  description,
  merchantOrderId,
  customerEmail,
  shippingAddress,
}) {
  const body = {
    amount,
    currency,
    description,
    merchant_order_ext_ref: merchantOrderId,
    email: customerEmail,
    capture_mode: 'AUTOMATIC',
  }

  if (shippingAddress) {
    body.shipping_address = {
      street_line_1: shippingAddress.street || '',
      city: shippingAddress.city || '',
      region: shippingAddress.state || '',
      postcode: shippingAddress.zip || '',
      country_code: 'RO',
    }
  }

  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${REVOLUT_API_KEY}`,
      'Revolut-Api-Version': '2024-09-01',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Retrieve a Revolut order by ID
 */
export async function getRevolutOrder(orderId) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${REVOLUT_API_KEY}`,
      'Revolut-Api-Version': '2024-09-01',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Revolut API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Verify Revolut webhook signature
 */
export function verifyRevolutWebhook(payload, signature) {
  // In production, verify the webhook signature using the signing secret
  // For sandbox/demo, we'll accept all webhooks
  if (REVOLUT_SANDBOX) return true

  const signingSecret = process.env.REVOLUT_WEBHOOK_SECRET
  if (!signingSecret) return false

  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Convert RON amount to minor units (bani)
 * e.g. 19.99 -> 1999
 */
export function toMinorUnits(amount) {
  return Math.round(parseFloat(amount) * 100)
}

import paypal from '@paypal/checkout-server-sdk'

/**
 * Initialize PayPal environment based on mode
 * @returns {Object} PayPal client environment
 */
function getPayPalEnvironment() {
  const isProduction = process.env.PAYPAL_MODE === 'production'

  if (isProduction) {
    return new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  } else {
    return new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  }
}

/**
 * Get PayPal API client
 * @returns {Object} PayPal client
 */
function getPayPalClient() {
  const environment = getPayPalEnvironment()
  return new paypal.core.PayPalHttpClient(environment)
}

/**
 * Create a PayPal order
 * @param {Object} params - Order parameters
 * @param {number} params.amount - Order amount
 * @param {string} params.currency - Currency code
 * @param {string} params.orderId - Internal order ID
 * @param {Array} params.items - Order items
 * @param {string} params.returnUrl - Return URL after approval
 * @param {string} params.cancelUrl - Cancel URL
 * @returns {Promise<Object>} Created order details
 */
export async function createPayPalOrder(params) {
  try {
    const {
      amount,
      currency = 'RON',
      orderId,
      items = [],
      returnUrl,
      cancelUrl,
    } = params

    const request = new paypal.orders.OrdersCreateRequest()

    // Set request body
    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      payer: {},
      purchase_units: [
        {
          reference_id: orderId.toString(),
          amount: {
            currency_code: currency,
            value: (amount / 100).toString(), // Convert from cents to dollars
            breakdown: {
              item_total: {
                currency_code: currency,
                value: (amount / 100).toString(),
              },
            },
          },
          items: items.map((item) => ({
            name: item.name,
            sku: item.sku || item.id,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: currency,
              value: (item.price / 100).toString(),
            },
          })),
        },
      ],
      application_context: {
        brand_name: 'ShopHub',
        locale: 'en-US',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    })

    const client = getPayPalClient()
    const response = await client.execute(request)

    return {
      success: true,
      id: response.result.id,
      status: response.result.status,
      approvalUrl: response.result.links.find(
        (link) => link.rel === 'approve'
      )?.href,
    }
  } catch (error) {
    console.error('Error creating PayPal order:', error)
    return {
      success: false,
      error: error.message || 'Failed to create PayPal order',
    }
  }
}

/**
 * Capture a PayPal order (complete the payment)
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<Object>} Capture result
 */
export async function capturePayPalOrder(paypalOrderId) {
  try {
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId)
    request.requestBody({})

    const client = getPayPalClient()
    const response = await client.execute(request)

    if (response.result.status === 'COMPLETED') {
      return {
        success: true,
        id: response.result.id,
        status: response.result.status,
        payer: response.result.payer,
        purchaseUnits: response.result.purchase_units,
      }
    } else {
      return {
        success: false,
        error: `Order capture failed with status: ${response.result.status}`,
      }
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error)
    return {
      success: false,
      error: error.message || 'Failed to capture PayPal order',
    }
  }
}

/**
 * Get PayPal order details
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<Object>} Order details
 */
export async function getPayPalOrder(paypalOrderId) {
  try {
    const request = new paypal.orders.OrdersGetRequest(paypalOrderId)

    const client = getPayPalClient()
    const response = await client.execute(request)

    return {
      success: true,
      id: response.result.id,
      status: response.result.status,
      payer: response.result.payer,
    }
  } catch (error) {
    console.error('Error getting PayPal order:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Refund a PayPal order
 * Note: PayPal refunds are done through the captured payment
 * This is a simplified example
 * @param {string} captureId - PayPal capture ID from completed order
 * @param {Object} params - Refund parameters
 * @returns {Promise<Object>} Refund result
 */
export async function refundPayPalPayment(captureId, params = {}) {
  try {
    const request = new paypal.payments.CapturesRefundRequest(captureId)

    request.requestBody({
      amount: params.amount
        ? {
            currency_code: params.currency || 'RON',
            value: (params.amount / 100).toString(),
          }
        : undefined,
      note_to_payer: params.reason || 'Refund requested',
    })
    // Note: currency defaults to RON for refunds

    const client = getPayPalClient()
    const response = await client.execute(request)

    return {
      success: true,
      id: response.result.id,
      status: response.result.status,
    }
  } catch (error) {
    console.error('Error refunding PayPal payment:', error)
    return {
      success: false,
      error: error.message || 'Failed to refund PayPal payment',
    }
  }
}

/**
 * Verify PayPal IPN (Instant Payment Notification) webhook
 * @param {string} body - Raw request body
 * @returns {Promise<boolean>} Whether IPN is verified
 */
export async function verifyPayPalIPN(body) {
  try {
    // Build verification request: IPN spec requires re-posting all original fields
    // plus cmd=_notify-validate as the first field
    const verifyUrl =
      process.env.PAYPAL_MODE === 'production'
        ? 'https://www.paypal.com/cgi-bin/webscr'
        : 'https://www.sandbox.paypal.com/cgi-bin/webscr'

    // Re-post the raw body with the validate command prepended
    const verifyBody = `cmd=_notify-validate&${body}`

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyBody,
    })

    const text = await response.text()
    return text === 'VERIFIED'
  } catch (error) {
    console.error('Error verifying PayPal IPN:', error)
    return false
  }
}

/**
 * Get PayPal client ID for client-side use
 * @returns {string} PayPal client ID
 */
export function getPayPalClientId() {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
}

export default {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrder,
  refundPayPalPayment,
  verifyPayPalIPN,
  getPayPalClientId,
}

/**
 * Oblio.eu API Client
 * Romanian invoicing/billing integration
 *
 * API docs: https://www.oblio.eu/api
 * Auth: OAuth2 client_credentials flow
 * Base URL: https://www.oblio.eu/api
 *
 * Environment variables:
 *   OBLIO_API_KEY     - API key (client_id)
 *   OBLIO_API_SECRET  - API secret (client_secret)
 *   OBLIO_COMPANY_CIF - Company tax identification number (CIF)
 */

const OBLIO_BASE_URL = 'https://www.oblio.eu/api'
const OBLIO_AUTH_URL = 'https://www.oblio.eu/api/authorize/token'

// In-memory token cache
let cachedToken = null
let tokenExpiresAt = 0

/**
 * Get an access token from Oblio using OAuth2 client_credentials grant.
 * Caches the token in memory until it expires.
 * @returns {Promise<string>} The access token
 */
export async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  const apiKey = process.env.OBLIO_API_KEY
  const apiSecret = process.env.OBLIO_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('OBLIO_API_KEY and OBLIO_API_SECRET environment variables are required')
  }

  const response = await fetch(OBLIO_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      grant_type: 'client_credentials',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Oblio auth failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()

  cachedToken = data.access_token
  // Token typically expires in 3600 seconds; use the value from the response if available
  const expiresIn = data.expires_in || 3600
  tokenExpiresAt = Date.now() + expiresIn * 1000

  return cachedToken
}

/**
 * Make an authenticated request to the Oblio API.
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g., '/docs/factura')
 * @param {object} [body] - Request body for POST/PUT
 * @param {object} [queryParams] - Query parameters for GET
 * @returns {Promise<object>} The parsed JSON response
 */
async function oblioRequest(method, path, body = null, queryParams = null) {
  const token = await getAccessToken()

  let url = `${OBLIO_BASE_URL}${path}`
  if (queryParams) {
    const params = new URLSearchParams(queryParams)
    url += `?${params.toString()}`
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Oblio API error (${response.status}) ${method} ${path}: ${errorBody}`)
  }

  return response.json()
}

/**
 * Create an invoice (factura) or proforma in Oblio.
 *
 * @param {object} orderData - Order data to generate the invoice from
 * @param {string} orderData.orderNumber - Order reference number
 * @param {object} orderData.customer - Customer info { name, email, phone }
 * @param {object} orderData.shippingAddress - Address { street, city, state, zip, country }
 * @param {Array} orderData.items - Array of { name, quantity, price }
 * @param {number} orderData.total - Order total
 * @param {string} [orderData.paymentMethod] - Payment method
 * @param {object} [options] - Additional options
 * @param {string} [options.docType='factura'] - Document type: 'factura' or 'proforma'
 * @param {string} [options.seriesName] - Invoice series name (e.g., 'FCT')
 * @param {string} [options.currency='RON'] - Currency code
 * @param {boolean} [options.vatIncluded=true] - Whether prices include VAT
 * @returns {Promise<object>} Invoice creation response with number, series, link, etc.
 */
export async function createInvoice(orderData, options = {}) {
  const cif = process.env.OBLIO_COMPANY_CIF
  if (!cif) {
    throw new Error('OBLIO_COMPANY_CIF environment variable is required')
  }

  const {
    docType = 'factura',
    seriesName = '',
    currency = 'RON',
    vatIncluded = true,
  } = options

  const today = new Date().toISOString().split('T')[0] // yyyy-mm-dd
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Build the client object
  const client = {
    name: orderData.customer?.name || 'Client necunoscut',
    email: orderData.customer?.email || '',
    phone: orderData.customer?.phone || '',
    address: orderData.shippingAddress?.street || '',
    city: orderData.shippingAddress?.city || '',
    state: orderData.shippingAddress?.state || '',
    country: orderData.shippingAddress?.country || 'Romania',
    vatPayer: false,
  }

  // Map order items to Oblio product format
  const products = (orderData.items || []).map((item) => ({
    name: item.name,
    code: item.productId || '',
    description: '',
    price: parseFloat(item.price),
    measuringUnit: 'buc',
    currency,
    vatName: 'Normala',
    vatPercentage: 19,
    vatIncluded,
    quantity: item.quantity || 1,
    productType: 'Marfa',
  }))

  if (products.length === 0) {
    throw new Error('Cannot create invoice: order has no items')
  }

  const invoicePayload = {
    cif,
    client,
    issueDate: today,
    dueDate,
    deliveryDate: today,
    seriesName,
    language: 'RO',
    precision: 2,
    currency,
    products,
    mentions: `Comanda: ${orderData.orderNumber || 'N/A'}`,
    internalNote: `OrderID: ${orderData._id || orderData.id || ''}`,
  }

  // If order was paid, add collect info
  if (orderData.paymentStatus === 'paid' || orderData.paidAt) {
    invoicePayload.collect = {
      type: mapPaymentMethod(orderData.paymentMethod),
      seriesName: '',
      collectDate: today,
    }
  }

  const result = await oblioRequest('POST', `/docs/${docType}`, invoicePayload)

  return {
    success: true,
    type: docType,
    seriesName: result.data?.seriesName || seriesName,
    number: result.data?.number || null,
    link: result.data?.link || null,
    raw: result.data || result,
  }
}

/**
 * Get an existing invoice from Oblio.
 *
 * @param {string} seriesName - Invoice series name
 * @param {string|number} number - Invoice number
 * @param {string} [docType='factura'] - Document type: 'factura' or 'proforma'
 * @returns {Promise<object>} Invoice data
 */
export async function getInvoice(seriesName, number, docType = 'factura') {
  const cif = process.env.OBLIO_COMPANY_CIF
  if (!cif) {
    throw new Error('OBLIO_COMPANY_CIF environment variable is required')
  }

  const result = await oblioRequest('GET', `/docs/${docType}`, null, {
    cif,
    seriesName,
    number: String(number),
  })

  return result
}

/**
 * Map internal payment method names to Oblio collect types.
 * @param {string} method - Payment method from the order
 * @returns {string} Oblio-compatible payment type
 */
function mapPaymentMethod(method) {
  const mapping = {
    card: 'Card',
    stripe: 'Card',
    revolut: 'Card',
    paypal: 'Ordin de plata',
    transfer: 'Ordin de plata',
    cash: 'Chitanta',
    ramburs: 'Chitanta',
    cod: 'Chitanta',
  }
  return mapping[(method || '').toLowerCase()] || 'Alte incasari'
}

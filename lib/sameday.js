/**
 * Sameday Courier API Client
 * Documentation: https://sameday-api.demo.zitec.com/api/documentation
 *
 * Environment variables:
 *   SAMEDAY_USERNAME - API username (default: test for sandbox)
 *   SAMEDAY_PASSWORD - API password (default: test for sandbox)
 *   SAMEDAY_ENVIRONMENT - 'sandbox' or 'production' (default: sandbox)
 *   SAMEDAY_PICKUP_POINT_ID - Pickup point ID from Sameday account
 */

import { fetchWithTimeout, TIMEOUTS } from './http'

const BASE_URLS = {
  sandbox: 'https://sameday-api.demo.zitec.com',
  production: 'https://api.sameday.ro',
}

const SAMEDAY_USERNAME = process.env.SAMEDAY_USERNAME || 'test'
const SAMEDAY_PASSWORD = process.env.SAMEDAY_PASSWORD || 'test'
const SAMEDAY_ENVIRONMENT = process.env.SAMEDAY_ENVIRONMENT || 'sandbox'
const SAMEDAY_PICKUP_POINT_ID = process.env.SAMEDAY_PICKUP_POINT_ID || '1'

// Default service ID for standard delivery (24h)
const SAMEDAY_SERVICE_ID = process.env.SAMEDAY_SERVICE_ID || '7'

let cachedToken = null
let tokenExpiresAt = null

function getBaseUrl() {
  return BASE_URLS[SAMEDAY_ENVIRONMENT] || BASE_URLS.sandbox
}

/**
 * Authenticate with Sameday API and obtain a JWT token.
 * The token is cached in memory until it expires.
 * @returns {Promise<string>} JWT token
 */
export async function authenticate() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  const baseUrl = getBaseUrl()

  const response = await fetchWithTimeout(`${baseUrl}/api/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: SAMEDAY_USERNAME,
      password: SAMEDAY_PASSWORD,
    }).toString(),
  }, TIMEOUTS.sameday)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Sameday authentication failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  cachedToken = data.token
  // Sameday tokens typically expire in 24 hours; default to 12h if not specified
  const expiresInMs = (data.expire_at_utc
    ? new Date(data.expire_at_utc).getTime() - Date.now()
    : 12 * 60 * 60 * 1000)
  tokenExpiresAt = Date.now() + expiresInMs

  return cachedToken
}

/**
 * Create an AWB (shipping label) for an order.
 *
 * @param {Object} orderData
 * @param {string} orderData.orderNumber - Internal order reference
 * @param {string} orderData.customerName - Recipient full name
 * @param {string} orderData.customerPhone - Recipient phone number
 * @param {string} orderData.customerEmail - Recipient email (optional)
 * @param {string} orderData.street - Delivery street address
 * @param {string} orderData.city - Delivery city
 * @param {string} orderData.county - Delivery county (judet)
 * @param {string} orderData.postalCode - Postal code (optional)
 * @param {number} orderData.weight - Package weight in kg
 * @param {number} orderData.width - Package width in cm (optional, default 20)
 * @param {number} orderData.height - Package height in cm (optional, default 10)
 * @param {number} orderData.length - Package length in cm (optional, default 30)
 * @param {number} orderData.codAmount - Cash on delivery amount in RON (0 if prepaid)
 * @param {string} orderData.observation - Notes for the courier (optional)
 * @returns {Promise<{awbNumber: string, awbCost: number, trackingUrl: string}>}
 */
export async function createAWB(orderData) {
  const token = await authenticate()
  const baseUrl = getBaseUrl()

  const {
    orderNumber,
    customerName,
    customerPhone,
    customerEmail = '',
    street,
    city,
    county,
    postalCode = '',
    weight = 1,
    width = 20,
    height = 10,
    length = 30,
    codAmount = 0,
    observation = '',
  } = orderData

  const body = {
    pickupPoint: parseInt(SAMEDAY_PICKUP_POINT_ID, 10),
    contactPerson: null,
    packageType: 1, // 1 = parcel
    packageNumber: 1,
    packageWeight: weight,
    service: parseInt(SAMEDAY_SERVICE_ID, 10),
    awbPayment: 1, // 1 = sender pays shipping
    cashOnDelivery: codAmount > 0 ? codAmount : undefined,
    cashOnDeliveryReturns: codAmount > 0 ? 1 : undefined, // 1 = bank transfer return
    insuredValue: 0,
    thirdPartyPickup: 0,
    serviceTaxes: [],
    awbRecipient: {
      name: customerName,
      phoneNumber: customerPhone,
      personType: 0, // 0 = individual
      postalCode: postalCode || undefined,
      county: county,
      city: city,
      address: street,
      email: customerEmail || undefined,
    },
    parcels: [
      {
        weight: weight,
        width: width,
        height: height,
        length: length,
        isLast: true,
      },
    ],
    observation: observation || `Comanda ${orderNumber}`,
    clientInternalReference: orderNumber,
  }

  const response = await fetchWithTimeout(`${baseUrl}/api/awb`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-TOKEN': token,
    },
    body: JSON.stringify(body),
  }, TIMEOUTS.sameday)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Sameday create AWB failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  // Build tracking URL based on environment
  const trackingBaseUrl = SAMEDAY_ENVIRONMENT === 'production'
    ? 'https://www.sameday.ro/tracking'
    : 'https://sameday-api.demo.zitec.com/tracking'

  return {
    awbNumber: data.awbNumber,
    awbCost: data.awbCost || 0,
    trackingUrl: `${trackingBaseUrl}/${data.awbNumber}`,
    pdfLink: data.pdfLink || null,
  }
}

/**
 * Get tracking status for an AWB.
 *
 * @param {string} awbNumber - The AWB number to track
 * @returns {Promise<Object>} Tracking status with history
 */
export async function getAWBStatus(awbNumber) {
  const token = await authenticate()
  const baseUrl = getBaseUrl()

  const response = await fetchWithTimeout(`${baseUrl}/api/awb/${awbNumber}/status`, {
    method: 'GET',
    headers: {
      'X-AUTH-TOKEN': token,
    },
  }, TIMEOUTS.sameday)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Sameday get AWB status failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  return {
    awbNumber,
    summary: data.awbSummary || null,
    history: data.awbHistory || [],
    delivered: data.awbSummary?.delivered || false,
    lastStatus: data.awbSummary?.lastDeliveryAttempt || null,
  }
}

/**
 * Get available counties for delivery estimation.
 *
 * @param {Object} params
 * @param {string} params.county - County name (optional)
 * @returns {Promise<Object[]>} List of counties with delivery info
 */
export async function estimateDelivery(params = {}) {
  const token = await authenticate()
  const baseUrl = getBaseUrl()

  const queryParams = new URLSearchParams()
  if (params.county) queryParams.append('name', params.county)

  const url = `${baseUrl}/api/geolocation/county${queryParams.toString() ? '?' + queryParams.toString() : ''}`

  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'X-AUTH-TOKEN': token,
    },
  }, TIMEOUTS.sameday)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Sameday estimate delivery failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data
}

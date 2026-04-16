/**
 * Central error mapper for API routes.
 *
 * Converts Supabase / Stripe / unknown errors into canonical apiError()
 * responses. Prevents raw DB messages (table/column names, constraint
 * details) from leaking to clients.
 *
 * Usage:
 *   try {
 *     ...
 *   } catch (error) {
 *     return handleApiError(error, 'checkout')
 *   }
 */

import { apiError, ERROR_CODES } from './i18n-errors'

const SUPABASE_CODE_MAP = {
  PGRST116: ERROR_CODES.ORDER_NOT_FOUND, // row not found (caller may override)
  '23505': ERROR_CODES.EMAIL_EXISTS, // unique violation — refine per caller when needed
  '23503': ERROR_CODES.VALIDATION_FAILED, // FK violation
}

/**
 * Map an arbitrary error to a canonical API error response.
 * @param {unknown} error - Any thrown error (Error, Supabase error, stripe error, string)
 * @param {string} [context] - Short label for structured logging (e.g. 'checkout')
 * @param {string} [fallbackCode] - Error code to return when nothing else matches
 */
export function handleApiError(error, context = 'api', fallbackCode = ERROR_CODES.INTERNAL_ERROR) {
  // Log the raw error server-side (stdout → Vercel logs → future Sentry)
  if (context) {
    console.error(`[${context}]`, error)
  } else {
    console.error(error)
  }

  // Supabase errors have a shape like { code: 'PGRST116', message, details, hint }
  if (error && typeof error === 'object' && typeof error.code === 'string') {
    const mapped = SUPABASE_CODE_MAP[error.code]
    if (mapped) return apiError(mapped)
  }

  // Stripe errors have `type` and `statusCode`
  if (error && typeof error === 'object' && typeof error.type === 'string' && error.type.startsWith('Stripe')) {
    return apiError(ERROR_CODES.PAYMENT_FAILED)
  }

  // AbortError from our fetchWithTimeout
  if (error && error.name === 'AbortError') {
    return apiError(ERROR_CODES.SERVICE_UNAVAILABLE)
  }

  return apiError(fallbackCode)
}

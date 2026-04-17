/**
 * Single source of truth for user-facing API error messages.
 *
 * Routes should never hand-write Romanian error strings, and never return
 * raw Supabase/Stripe/PayPal error text to clients. Instead:
 *
 *   import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
 *   return apiError(ERROR_CODES.INVALID_CREDENTIALS)
 *
 * The resulting response body is { success: false, error: { code, message } }
 * where `message` is Romanian for end-user display and `code` is machine-
 * readable for client-side localization or error handling.
 */

export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  EMAIL_AND_PASSWORD_REQUIRED: 'EMAIL_AND_PASSWORD_REQUIRED',
  WEAK_PASSWORD: 'WEAK_PASSWORD',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  MISSING_FIELD: 'MISSING_FIELD',

  // Cart
  CART_EMPTY: 'CART_EMPTY',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
  QUANTITY_EXCEEDS_MAX: 'QUANTITY_EXCEEDS_MAX',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

  // Products / reviews / users
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Orders
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',

  // Checkout / payment
  CHECKOUT_FAILED: 'CHECKOUT_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_IN_PROGRESS: 'PAYMENT_IN_PROGRESS',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',

  // Rate limiting / server
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
}

const MESSAGES_RO = {
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Date de autentificare incorecte',
  [ERROR_CODES.UNAUTHORIZED]: 'Neautorizat',
  [ERROR_CODES.INVALID_TOKEN]: 'Token invalid sau expirat',
  [ERROR_CODES.FORBIDDEN]: 'Acces interzis',
  [ERROR_CODES.EMAIL_EXISTS]: 'Exista deja un cont cu aceasta adresa de email',
  [ERROR_CODES.EMAIL_AND_PASSWORD_REQUIRED]: 'Emailul si parola sunt obligatorii',
  [ERROR_CODES.WEAK_PASSWORD]: 'Parola trebuie sa aiba cel putin 8 caractere, inclusiv o litera si o cifra',

  [ERROR_CODES.VALIDATION_FAILED]: 'Datele introduse nu sunt valide',
  [ERROR_CODES.INVALID_EMAIL]: 'Adresa de email nu este valida',
  [ERROR_CODES.INVALID_PHONE]: 'Numarul de telefon nu este valid',
  [ERROR_CODES.MISSING_FIELD]: 'Un camp obligatoriu lipseste',

  [ERROR_CODES.CART_EMPTY]: 'Cosul tau este gol',
  [ERROR_CODES.CART_ITEM_NOT_FOUND]: 'Produsul nu a fost gasit in cos',
  [ERROR_CODES.QUANTITY_EXCEEDS_MAX]: 'Ai depasit cantitatea maxima permisa',
  [ERROR_CODES.INSUFFICIENT_STOCK]: 'Stoc insuficient pentru unul sau mai multe produse',

  [ERROR_CODES.PRODUCT_NOT_FOUND]: 'Produsul nu a fost gasit',
  [ERROR_CODES.REVIEW_NOT_FOUND]: 'Recenzia nu a fost gasita',
  [ERROR_CODES.USER_NOT_FOUND]: 'Utilizatorul nu a fost gasit',

  [ERROR_CODES.ORDER_NOT_FOUND]: 'Comanda nu a fost gasita',
  [ERROR_CODES.ORDER_ALREADY_PAID]: 'Comanda a fost deja platita',

  [ERROR_CODES.CHECKOUT_FAILED]: 'A aparut o eroare la finalizarea comenzii',
  [ERROR_CODES.PAYMENT_FAILED]: 'Plata nu a putut fi procesata',
  [ERROR_CODES.PAYMENT_IN_PROGRESS]: 'Exista deja o plata in curs pentru aceasta comanda',
  [ERROR_CODES.INVALID_PAYMENT_METHOD]: 'Metoda de plata selectata nu este valida',

  [ERROR_CODES.RATE_LIMITED]: 'Prea multe cereri. Incearca din nou mai tarziu.',
  [ERROR_CODES.INTERNAL_ERROR]: 'A aparut o eroare interna. Incearca din nou mai tarziu.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Serviciu indisponibil momentan. Incearca din nou in cateva minute.',
}

const STATUS_MAP = {
  [ERROR_CODES.INVALID_CREDENTIALS]: 401,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.INVALID_TOKEN]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.EMAIL_EXISTS]: 409,
  [ERROR_CODES.EMAIL_AND_PASSWORD_REQUIRED]: 400,
  [ERROR_CODES.WEAK_PASSWORD]: 422,

  [ERROR_CODES.VALIDATION_FAILED]: 422,
  [ERROR_CODES.INVALID_EMAIL]: 422,
  [ERROR_CODES.INVALID_PHONE]: 422,
  [ERROR_CODES.MISSING_FIELD]: 400,

  [ERROR_CODES.CART_EMPTY]: 400,
  [ERROR_CODES.CART_ITEM_NOT_FOUND]: 404,
  [ERROR_CODES.QUANTITY_EXCEEDS_MAX]: 422,
  [ERROR_CODES.INSUFFICIENT_STOCK]: 409,

  [ERROR_CODES.PRODUCT_NOT_FOUND]: 404,
  [ERROR_CODES.REVIEW_NOT_FOUND]: 404,
  [ERROR_CODES.USER_NOT_FOUND]: 404,
  [ERROR_CODES.ORDER_NOT_FOUND]: 404,
  [ERROR_CODES.ORDER_ALREADY_PAID]: 409,

  [ERROR_CODES.CHECKOUT_FAILED]: 500,
  [ERROR_CODES.PAYMENT_FAILED]: 502,
  [ERROR_CODES.PAYMENT_IN_PROGRESS]: 409,
  [ERROR_CODES.INVALID_PAYMENT_METHOD]: 422,

  [ERROR_CODES.RATE_LIMITED]: 429,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
}

/**
 * Build a Next.js Response.json with the canonical error shape.
 * @param {string} code - One of ERROR_CODES.*
 * @param {Object} [opts]
 * @param {string} [opts.details] - Optional extra context (NOT user-facing secret data)
 * @param {number} [opts.status] - Override default status
 */
export function apiError(code, { details, status } = {}) {
  const message = MESSAGES_RO[code] || MESSAGES_RO[ERROR_CODES.INTERNAL_ERROR]
  const httpStatus = status || STATUS_MAP[code] || 500
  return Response.json(
    {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status: httpStatus }
  )
}

/**
 * Get just the Romanian message for a code (useful for embedding).
 */
export function getMessage(code) {
  return MESSAGES_RO[code] || MESSAGES_RO[ERROR_CODES.INTERNAL_ERROR]
}

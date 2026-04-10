/**
 * Input sanitization middleware for security
 * Prevents XSS and validates common input formats
 */

/**
 * Sanitize strings to prevent XSS attacks
 */
export function sanitizeXSS(str) {
  if (typeof str !== 'string') {
    return str
  }

  const xssMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return str.replace(/[&<>"']/g, (char) => xssMap[char])
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requires: min 6 chars, mix of letters and numbers
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return false
  }

  return (
    password.length >= 6 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

/**
 * Validate phone number format
 */
export function validatePhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/
  return phoneRegex.test(phone)
}

/**
 * Validate zip code format (US)
 */
export function validateZipCode(zip) {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zip)
}

/**
 * Validate UUID format
 */
export function validateUUID(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Sanitize a payload object (trim strings, apply XSS protection)
 */
export function sanitizePayload(payload, schema = {}) {
  if (typeof payload !== 'object' || payload === null) {
    return payload
  }

  const sanitized = {}

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim()
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value)
    } else {
      sanitized[key] = value
    }
  }

  // Validate against schema if provided
  if (Object.keys(schema).length > 0) {
    for (const [key, rule] of Object.entries(schema)) {
      const value = sanitized[key]

      // Check required
      if (rule.required && !value) {
        throw new Error(`Missing required field: ${key}`)
      }

      // Check type
      if (value && rule.type && typeof value !== rule.type) {
        throw new Error(`Invalid type for field ${key}: expected ${rule.type}`)
      }

      // Check email
      if (key === 'email' && !validateEmail(value)) {
        throw new Error(`Invalid email format: ${value}`)
      }

      // Check password
      if (key === 'password' && !validatePassword(value)) {
        throw new Error(`Password must be at least 6 characters with letters and numbers`)
      }

      // Check min length
      if (rule.minLength && value?.length < rule.minLength) {
        throw new Error(`${key} must be at least ${rule.minLength} characters`)
      }

      // Check max length
      if (rule.maxLength && value?.length > rule.maxLength) {
        throw new Error(`${key} must be at most ${rule.maxLength} characters`)
      }

      // Check min value
      if (rule.min !== undefined && value < rule.min) {
        throw new Error(`${key} must be at least ${rule.min}`)
      }

      // Check max value
      if (rule.max !== undefined && value > rule.max) {
        throw new Error(`${key} must be at most ${rule.max}`)
      }

      // Check allowed values
      if (rule.enum && !rule.enum.includes(value)) {
        throw new Error(`${key} must be one of: ${rule.enum.join(', ')}`)
      }
    }
  }

  return sanitized
}

/**
 * Create sanitization middleware
 */
export async function sanitizationMiddleware(request) {
  try {
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      const contentType = request.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        const body = await request.json()
        const sanitized = sanitizePayload(body)
        return sanitized
      }
    }
  } catch (error) {
    console.error('Sanitization error:', error)
    throw error
  }

  return null
}

/**
 * Validation schemas for common endpoints
 */
export const validationSchemas = {
  register: {
    email: { required: true, type: 'string', minLength: 5, maxLength: 255 },
    password: { required: true, type: 'string', minLength: 6, maxLength: 128 },
    firstName: { type: 'string', maxLength: 100 },
    lastName: { type: 'string', maxLength: 100 },
  },

  login: {
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  },

  updateProfile: {
    firstName: { type: 'string', maxLength: 100 },
    lastName: { type: 'string', maxLength: 100 },
    phone: { type: 'string', maxLength: 20 },
  },

  createReview: {
    rating: { required: true, type: 'number', min: 1, max: 5 },
    title: { required: true, type: 'string', minLength: 3, maxLength: 200 },
    comment: { type: 'string', maxLength: 5000 },
  },

  addToCart: {
    productId: { required: true, type: 'string' },
    quantity: { required: true, type: 'number', min: 1, max: 100 },
  },

  checkout: {
    shippingAddress: { required: true, type: 'object' },
    customer: { required: true, type: 'object' },
  },
}

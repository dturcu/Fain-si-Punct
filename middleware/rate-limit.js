import redis from 'redis'

/**
 * Simple in-memory rate limiter for development
 * For production, use Redis-based rate limiting
 */
class RateLimiter {
  constructor() {
    this.requests = new Map()
  }

  /**
   * Check if request is allowed
   * @param {string} key - Rate limit key (IP, user ID, etc.)
   * @param {number} limit - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if allowed, false if rate limited
   */
  isAllowed(key, limit = 100, windowMs = 900000) {
    const now = Date.now()
    const windowStart = now - windowMs

    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }

    const timestamps = this.requests.get(key)

    // Remove old requests outside the window
    const recentRequests = timestamps.filter((ts) => ts > windowStart)

    if (recentRequests.length < limit) {
      recentRequests.push(now)
      this.requests.set(key, recentRequests)
      return true
    }

    return false
  }

  /**
   * Get current request count for key
   */
  getCount(key) {
    return this.requests.get(key)?.length || 0
  }

  /**
   * Reset rate limit for key
   */
  reset(key) {
    this.requests.delete(key)
  }

  /**
   * Clear all rate limits (for testing)
   */
  clear() {
    this.requests.clear()
  }
}

// Global rate limiter instance
let limiter = new RateLimiter()

/**
 * Create rate limit middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Middleware function
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 900000, // 15 minutes
    max = 100, // max requests per window
    keyGenerator = (request) => {
      // Use IP address as key
      return (
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown'
      )
    },
    skip = () => false, // Skip rate limiting for certain requests
    onLimitReached = () => {},
  } = options

  return async (request, response, next) => {
    // Skip rate limiting if needed
    if (skip(request)) {
      return next()
    }

    const key = keyGenerator(request)
    const isAllowed = limiter.isAllowed(key, max, windowMs)

    if (!isAllowed) {
      onLimitReached(request, response)
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(windowMs / 1000),
        },
      })
    }

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', max.toString())
    response.headers.set('X-RateLimit-Remaining', (max - limiter.getCount(key)).toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil((Date.now() + windowMs) / 1000).toString())

    return next()
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Auth endpoints - very strict
  auth: {
    windowMs: 900000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
  },

  // Product read endpoints - moderate
  products: {
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute
  },

  // Cart endpoints - moderate
  cart: {
    windowMs: 60000, // 1 minute
    max: 50, // 50 requests per minute
  },

  // Checkout - strict
  checkout: {
    windowMs: 3600000, // 1 hour
    max: 10, // 10 checkout attempts per hour
  },

  // Payment processing - very strict
  payment: {
    windowMs: 3600000, // 1 hour
    max: 20, // 20 payment attempts per hour
  },

  // Webhooks - allow more
  webhook: {
    windowMs: 60000, // 1 minute
    max: 1000, // 1000 requests per minute
  },

  // API endpoints - general
  api: {
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute
  },
}

/**
 * Apply rate limiting to specific endpoint
 * @param {string} endpointType - Type of endpoint (auth, products, etc.)
 * @returns {Function} Middleware function
 */
export function rateLimitEndpoint(endpointType = 'api') {
  const config = rateLimitConfigs[endpointType] || rateLimitConfigs.api

  return createRateLimiter({
    windowMs: config.windowMs,
    max: config.max,
    skip: (request) => {
      // Skip rate limiting for internal IPs
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
      return ['127.0.0.1', '::1'].includes(ip)
    },
  })
}

export default limiter

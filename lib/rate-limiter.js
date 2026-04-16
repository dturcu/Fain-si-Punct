/**
 * In-process rate limiter for Next.js App Router route handlers.
 * Uses a module-level Map so the state persists across requests within
 * a single serverless function instance.
 *
 * NOTE: This is per-instance only. On Vercel, different instances won't
 * share state. For true global rate limiting use Upstash Redis.
 */

const store = new Map()

/**
 * Check whether a request from `key` is within the allowed rate.
 * @param {string} key - IP address or other identifier
 * @param {number} limit - Max requests per window
 * @param {number} windowMs - Window duration in ms
 * @returns {{ allowed: boolean, retryAfter: number }}
 */
export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now()
  const windowStart = now - windowMs

  if (!store.has(key)) {
    store.set(key, [])
  }

  const timestamps = store.get(key).filter((ts) => ts > windowStart)

  if (timestamps.length >= limit) {
    const oldest = timestamps[0]
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    store.set(key, timestamps)
    return { allowed: false, retryAfter }
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return { allowed: true, retryAfter: 0 }
}

/**
 * Get the client IP from a Next.js request.
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limit presets.
 */
export const LIMITS = {
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },        // 5 per 15 min
  checkout: { limit: 10, windowMs: 60 * 60 * 1000 },    // 10 per hour
  payment: { limit: 20, windowMs: 60 * 60 * 1000 },     // 20 per hour
  api: { limit: 100, windowMs: 60 * 1000 },              // 100 per minute
}

/**
 * Apply rate limiting inside a route handler.
 * Returns a Response if rate limited, null if the request is allowed.
 *
 * Usage:
 *   const limited = applyRateLimit(request, LIMITS.auth)
 *   if (limited) return limited
 */
export function applyRateLimit(request, { limit, windowMs }) {
  const ip = getClientIp(request)
  // Skip rate limiting for loopback (local dev)
  if (ip === '127.0.0.1' || ip === '::1') return null

  const { allowed, retryAfter } = checkRateLimit(ip, limit, windowMs)
  if (!allowed) {
    return Response.json(
      { success: false, error: 'Prea multe cereri. Incearca din nou mai tarziu.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }
  return null
}

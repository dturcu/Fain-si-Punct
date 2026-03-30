import { NextResponse } from 'next/server'

/**
 * In-memory rate limiter using a sliding window per IP.
 * Note: in a multi-instance/serverless deployment (Vercel) each instance has
 * its own map, so this won't coordinate across instances. For production scale,
 * replace the store with an Upstash Redis call (already available in this project).
 * Even without coordination, this provides meaningful protection per-instance.
 */
const store = new Map()

function isRateLimited(ip, limit, windowMs) {
  const now = Date.now()
  const windowStart = now - windowMs
  const key = ip || 'unknown'

  const timestamps = (store.get(key) || []).filter((t) => t > windowStart)
  if (timestamps.length >= limit) return true

  timestamps.push(now)
  store.set(key, timestamps)

  // Prevent unbounded memory growth — evict after 2× the window
  setTimeout(() => store.delete(key), windowMs * 2)
  return false
}

// Route-specific limits: [maxRequests, windowMs]
const LIMITS = {
  '/api/auth/login':    [10,  15 * 60 * 1000],  // 10 per 15 min
  '/api/auth/register': [5,   60 * 60 * 1000],  // 5 per hour
  '/api/checkout':      [10,  60 * 60 * 1000],  // 10 per hour
  '/api/payments':      [20,  60 * 60 * 1000],  // 20 per hour
  '/api/reviews':       [30,  60 * 60 * 1000],  // 30 per hour
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Find the most specific matching limit
  const matchedPath = Object.keys(LIMITS).find((p) => pathname.startsWith(p))
  if (!matchedPath) return NextResponse.next()

  const [limit, windowMs] = LIMITS[matchedPath]
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  // Skip rate limiting for localhost in development
  if (ip === '127.0.0.1' || ip === '::1') return NextResponse.next()

  if (isRateLimited(ip, limit, windowMs)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests, please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(windowMs / 1000)),
        },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/checkout',
    '/api/payments/:path*',
    '/api/reviews/:path*',
  ],
}

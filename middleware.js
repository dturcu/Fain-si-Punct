import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

/**
 * Edge-compatible JWT payload reader.
 * Does NOT verify the signature — signature verification happens in API route handlers.
 * This is used only for routing decisions (redirect non-admin users away from /admin pages).
 */
function getTokenPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // atob is available in Edge Runtime
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

/**
 * Upstash Redis rate limiter.
 * Per-route failMode decides whether Redis unavailability is tolerated:
 *   'closed' (auth/payment) — reject with 503 when Redis is down.
 *     Prevents brute-force against login if the rate limiter goes away.
 *   'open'   (reviews, low-risk) — allow on Redis failure.
 */
let redis
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch {
  // Redis client init failed — handled per-route via failMode
}

async function checkRateLimit(ip, route, limit, windowSec, failMode) {
  // Rate limiting is an opt-in: if the project hasn't set
  // UPSTASH_REDIS_REST_URL/TOKEN, rate-limiting is intentionally off.
  // Fail-closed here would block every auth request on any deploy
  // without Redis configured — exactly what happened in production
  // after the Phase 1 fail-closed change. Instead, distinguish:
  //   - !redis           → Redis not configured → allow (feature off)
  //   - redis throws     → Redis configured but unreachable → fail per mode
  if (!redis) return { allowed: true }

  try {
    const key = `rate:${route}:${ip}`
    const current = await redis.incr(key)
    if (current === 1) await redis.expire(key, windowSec)
    return { allowed: current <= limit }
  } catch {
    return failMode === 'closed' ? { allowed: false, unavailable: true } : { allowed: true }
  }
}

// Route-specific limits: [maxRequests, windowSeconds, failMode]
// failMode 'closed' = reject when Redis is unavailable.
// failMode 'open'   = allow when Redis is unavailable.
const LIMITS = {
  '/api/auth/login':    [10,  15 * 60, 'closed'], // brute-force surface
  '/api/auth/register': [5,   60 * 60, 'closed'],
  '/api/checkout':      [10,  60 * 60, 'closed'], // payment-adjacent
  '/api/payments':      [20,  60 * 60, 'closed'], // payment surface
  '/api/reviews':       [30,  60 * 60, 'open'],   // spam is recoverable
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Admin route guard — check JWT claims before serving admin pages.
  // API routes still perform full signature verification.
  if (pathname.startsWith('/admin')) {
    const cookie = request.cookies.get('token')
    if (!cookie?.value) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    const payload = getTokenPayload(cookie.value)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Rate limiting for API routes
  const matchedPath = Object.keys(LIMITS).find((p) => pathname.startsWith(p))
  if (!matchedPath) return NextResponse.next()

  const [limit, windowSec, failMode] = LIMITS[matchedPath]
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  // Skip rate limiting for localhost in development
  if (ip === '127.0.0.1' || ip === '::1') return NextResponse.next()

  const { allowed, unavailable } = await checkRateLimit(ip, matchedPath, limit, windowSec, failMode)
  if (!allowed) {
    const status = unavailable ? 503 : 429
    const message = unavailable
      ? 'Service temporarily unavailable. Please retry in a moment.'
      : 'Too many requests, please try again later.'
    return new NextResponse(
      JSON.stringify({ success: false, error: message }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(unavailable ? 30 : windowSec),
        },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/auth/:path*',
    '/api/checkout',
    '/api/payments/:path*',
    '/api/reviews/:path*',
  ],
}

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
 * Coordinates across all serverless instances via a shared Redis store.
 * Falls back to allowing requests if Redis is unavailable (fail-open).
 */
let redis
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch (e) {
  // Fall back to no rate limiting if Redis is unavailable
}

async function checkRateLimit(ip, route, limit, windowSec) {
  if (!redis) return true // No rate limiting without Redis
  try {
    const key = `rate:${route}:${ip}`
    const current = await redis.incr(key)
    if (current === 1) await redis.expire(key, windowSec)
    return current <= limit
  } catch {
    return true // Fail open if Redis errors
  }
}

// Route-specific limits: [maxRequests, windowSeconds]
const LIMITS = {
  '/api/auth/login':    [10,  15 * 60],     // 10 per 15 min
  '/api/auth/register': [5,   60 * 60],     // 5 per hour
  '/api/checkout':      [10,  60 * 60],     // 10 per hour
  '/api/payments':      [20,  60 * 60],     // 20 per hour
  '/api/reviews':       [30,  60 * 60],     // 30 per hour
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

  const [limit, windowSec] = LIMITS[matchedPath]
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  // Skip rate limiting for localhost in development
  if (ip === '127.0.0.1' || ip === '::1') return NextResponse.next()

  const allowed = await checkRateLimit(ip, matchedPath, limit, windowSec)
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests, please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(windowSec),
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

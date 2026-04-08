import { NextResponse } from 'next/server'

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
    '/admin/:path*',
    '/api/auth/:path*',
    '/api/checkout',
    '/api/payments/:path*',
    '/api/reviews/:path*',
  ],
}

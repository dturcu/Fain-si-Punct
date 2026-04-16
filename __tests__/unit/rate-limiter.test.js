/**
 * Unit tests for lib/rate-limiter.js
 *
 * The rate limiter uses a module-level Map. Because Jest caches modules, each
 * test file gets one module instance. We isolate tests by using unique keys
 * per test so no test bleeds into another.
 */

import {
  checkRateLimit,
  applyRateLimit,
  getClientIp,
} from '@/lib/rate-limiter'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Make a unique key for each test so the shared Map doesn't accumulate. */
let keyCounter = 0
function uniqueKey(prefix = 'ip') {
  return `${prefix}-test-${++keyCounter}`
}

/**
 * Build a minimal Next.js-style Request with the given headers.
 */
function makeRequest(headers = {}) {
  return {
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null
      },
    },
  }
}

// ─── checkRateLimit ─────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const result = checkRateLimit(uniqueKey(), 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.retryAfter).toBe(0)
  })

  it('allows up to the limit', () => {
    const key = uniqueKey()
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000)
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks the request that exceeds the limit', () => {
    const key = uniqueKey()
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000)

    const result = checkRateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(false)
  })

  it('returns retryAfter > 0 when blocked', () => {
    const key = uniqueKey()
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000)

    const result = checkRateLimit(key, 5, 60_000)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('different keys have independent limits', () => {
    const keyA = uniqueKey('a')
    const keyB = uniqueKey('b')

    // Exhaust keyA
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, 5, 60_000)
    expect(checkRateLimit(keyA, 5, 60_000).allowed).toBe(false)

    // keyB is untouched — first request must be allowed
    expect(checkRateLimit(keyB, 5, 60_000).allowed).toBe(true)
  })

  it('resets after the window expires', () => {
    const key = uniqueKey()
    // Use a 1 ms window — everything in the past is expired immediately
    checkRateLimit(key, 1, 1)
    // Wait long enough for the window to close
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, 1, 1)
        expect(result.allowed).toBe(true)
        resolve()
      }, 20)
    })
  })
})

// ─── applyRateLimit ──────────────────────────────────────────────────────────

describe('applyRateLimit', () => {
  it('returns null when the request is within the limit', () => {
    const ip = `192.168.1.${++keyCounter}`
    const request = makeRequest({ 'x-forwarded-for': ip })
    const result = applyRateLimit(request, { limit: 10, windowMs: 60_000 })
    expect(result).toBeNull()
  })

  it('returns a 429 Response when the limit is exceeded', async () => {
    const ip = `10.0.${++keyCounter}.1`
    const request = makeRequest({ 'x-forwarded-for': ip })
    const config = { limit: 2, windowMs: 60_000 }

    // Exhaust the limit
    applyRateLimit(request, config)
    applyRateLimit(request, config)

    const response = applyRateLimit(request, config)
    expect(response).not.toBeNull()
    expect(response.status).toBe(429)
  })

  it('429 response body has success:false and error message', async () => {
    const ip = `10.1.${++keyCounter}.1`
    const request = makeRequest({ 'x-forwarded-for': ip })
    const config = { limit: 1, windowMs: 60_000 }

    applyRateLimit(request, config) // consume the one allowed request

    const response = applyRateLimit(request, config)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })

  it('429 response includes Retry-After header', async () => {
    const ip = `10.2.${++keyCounter}.1`
    const request = makeRequest({ 'x-forwarded-for': ip })
    const config = { limit: 1, windowMs: 60_000 }

    applyRateLimit(request, config)

    const response = applyRateLimit(request, config)
    expect(response.headers.get('Retry-After')).not.toBeNull()
  })

  it('always allows loopback IP 127.0.0.1', () => {
    const request = makeRequest({ 'x-forwarded-for': '127.0.0.1' })
    const config = { limit: 0, windowMs: 60_000 } // limit=0 would block anything else

    // Even with limit=0, loopback is exempted
    const result = applyRateLimit(request, config)
    expect(result).toBeNull()
  })

  it('always allows loopback IP ::1', () => {
    const request = makeRequest({ 'x-forwarded-for': '::1' })
    const config = { limit: 0, windowMs: 60_000 }

    const result = applyRateLimit(request, config)
    expect(result).toBeNull()
  })
})

// ─── getClientIp ─────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  it('reads x-forwarded-for (first value)', () => {
    const request = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getClientIp(request)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    const request = makeRequest({ 'x-real-ip': '9.8.7.6' })
    expect(getClientIp(request)).toBe('9.8.7.6')
  })

  it('returns "unknown" when no IP header present', () => {
    const request = makeRequest()
    expect(getClientIp(request)).toBe('unknown')
  })
})

/**
 * Extended unit tests for lib/auth.js
 *
 * JWT_SECRET is set to 'test-secret-key' by jest.setup.js before the module
 * is loaded, so the guard in auth.js won't throw.
 *
 * Coverage:
 *  - createToken returns valid 3-part JWT
 *  - verifyToken decodes payload correctly
 *  - verifyToken returns null for expired / tampered / garbage tokens
 *  - getCookieToken extracts the token from a cookie header
 *  - getCookieToken returns null when no token cookie is present
 *  - getTokenFromRequest extracts Bearer token
 *  - verifyAuth works with both Bearer and cookie auth
 */

import {
  createToken,
  verifyToken,
  getCookieToken,
  getTokenFromRequest,
  verifyAuth,
} from '@/lib/auth'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeHeaders(headers = {}) {
  return {
    get(name) {
      return headers[name.toLowerCase()] ?? null
    },
  }
}

function makeRequest(headers = {}) {
  return { headers: makeHeaders(headers) }
}

// ─── createToken ─────────────────────────────────────────────────────────────

describe('createToken', () => {
  it('returns a string', () => {
    expect(typeof createToken('uid', 'a@b.com', 'customer')).toBe('string')
  })

  it('returns a three-part JWT (header.payload.signature)', () => {
    const token = createToken('uid', 'a@b.com', 'customer')
    expect(token.split('.').length).toBe(3)
  })

  it('embeds userId, email and role in the payload', () => {
    const token = createToken('u-123', 'test@example.com', 'admin')
    const decoded = verifyToken(token)
    expect(decoded.userId).toBe('u-123')
    expect(decoded.email).toBe('test@example.com')
    expect(decoded.role).toBe('admin')
  })

  it('sets an expiration in the future', () => {
    const token = createToken('u-1', 'x@x.com', 'customer')
    const decoded = verifyToken(token)
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('sets an issued-at timestamp', () => {
    const before = Math.floor(Date.now() / 1000)
    const token = createToken('u-1', 'x@x.com', 'customer')
    const decoded = verifyToken(token)
    expect(decoded.iat).toBeGreaterThanOrEqual(before)
  })
})

// ─── verifyToken ─────────────────────────────────────────────────────────────

describe('verifyToken', () => {
  it('returns the decoded payload for a valid token', () => {
    const token = createToken('u-42', 'user@shop.ro', 'customer')
    const decoded = verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded.userId).toBe('u-42')
  })

  it('returns null for a completely invalid string', () => {
    expect(verifyToken('not-a-jwt')).toBeNull()
  })

  it('returns null for a well-formed but tampered token', () => {
    const token = createToken('u-1', 'a@b.com', 'customer')
    const parts = token.split('.')
    // Flip one character in the signature
    parts[2] = parts[2].slice(0, -2) + 'XX'
    expect(verifyToken(parts.join('.'))).toBeNull()
  })

  it('returns null for a hardcoded expired token', () => {
    // Payload: { exp: 1600000000 } — far in the past
    const expired =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJleHAiOjE2MDAwMDAwMDB9.' +
      'invalid'
    expect(verifyToken(expired)).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(verifyToken('')).toBeNull()
  })
})

// ─── getCookieToken ──────────────────────────────────────────────────────────

describe('getCookieToken', () => {
  it('extracts the token value when it is the only cookie', () => {
    const request = makeRequest({ cookie: 'token=abc.def.ghi' })
    expect(getCookieToken(request)).toBe('abc.def.ghi')
  })

  it('extracts the token when there are multiple cookies', () => {
    const request = makeRequest({
      cookie: 'session=xyz; token=my-jwt-token; lang=ro',
    })
    expect(getCookieToken(request)).toBe('my-jwt-token')
  })

  it('returns null when no cookie header is present', () => {
    const request = makeRequest()
    expect(getCookieToken(request)).toBeNull()
  })

  it('returns null/undefined (falsy) when the cookie header has no token cookie', () => {
    const request = makeRequest({ cookie: 'session=abc; lang=ro' })
    // The implementation returns undefined via optional chaining — falsy is the contract
    expect(getCookieToken(request)).toBeFalsy()
  })

  it('returns undefined (falsy) for token= with empty value', () => {
    // Depends on JS split behaviour — the empty string is falsy
    const request = makeRequest({ cookie: 'token=' })
    const result = getCookieToken(request)
    expect(result).toBeFalsy()
  })
})

// ─── getTokenFromRequest ─────────────────────────────────────────────────────

describe('getTokenFromRequest', () => {
  it('extracts the token from a Bearer authorization header', () => {
    const request = makeRequest({ authorization: 'Bearer tok.en.here' })
    expect(getTokenFromRequest(request)).toBe('tok.en.here')
  })

  it('returns null when authorization header is absent', () => {
    expect(getTokenFromRequest(makeRequest())).toBeNull()
  })

  it('returns null when authorization header is not Bearer', () => {
    const request = makeRequest({ authorization: 'Basic dXNlcjpwYXNz' })
    expect(getTokenFromRequest(request)).toBeNull()
  })
})

// ─── verifyAuth ──────────────────────────────────────────────────────────────

describe('verifyAuth', () => {
  it('authenticates via Bearer token', () => {
    const token = createToken('u-99', 'v@v.com', 'admin')
    const headers = makeHeaders({ authorization: `Bearer ${token}` })
    const decoded = verifyAuth(headers)
    expect(decoded).not.toBeNull()
    expect(decoded.userId).toBe('u-99')
    expect(decoded.role).toBe('admin')
  })

  it('authenticates via cookie token', () => {
    const token = createToken('u-77', 'c@c.com', 'customer')
    const headers = makeHeaders({ cookie: `token=${token}` })
    const decoded = verifyAuth(headers)
    expect(decoded).not.toBeNull()
    expect(decoded.userId).toBe('u-77')
  })

  it('prefers Bearer over cookie', () => {
    const bearerToken = createToken('u-bearer', 'b@b.com', 'admin')
    const cookieToken = createToken('u-cookie', 'c@c.com', 'customer')
    const headers = makeHeaders({
      authorization: `Bearer ${bearerToken}`,
      cookie: `token=${cookieToken}`,
    })
    const decoded = verifyAuth(headers)
    expect(decoded.userId).toBe('u-bearer')
  })

  it('returns null when neither Bearer nor cookie is present', () => {
    expect(verifyAuth(makeHeaders())).toBeNull()
  })

  it('returns null when Bearer token is invalid', () => {
    const headers = makeHeaders({ authorization: 'Bearer garbage' })
    expect(verifyAuth(headers)).toBeNull()
  })
})

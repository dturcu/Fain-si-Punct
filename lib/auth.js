import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export function createToken(userId, email, role) {
  return jwt.sign({ userId, email, role }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

export function getCookieToken(request) {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null

  const tokens = cookie.split('; ').find((row) => row.startsWith('token='))
  return tokens?.split('=')[1]
}

/**
 * Verify authentication from request headers
 * Works with both Bearer token and cookie-based auth
 * @param {Headers} headersList - Request headers
 * @returns {Object|null} Decoded token or null if invalid
 */
export function verifyAuth(headersList) {
  // Try Bearer token first
  const authHeader = headersList.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return verifyToken(token)
  }

  // Try cookie-based auth
  const cookie = headersList.get('cookie')
  if (cookie) {
    const tokens = cookie.split('; ').find((row) => row.startsWith('token='))
    if (tokens) {
      const token = tokens.split('=')[1]
      return verifyToken(token)
    }
  }

  return null
}

/**
 * Get guest session ID from cookie, or null if not set.
 */
export function getGuestSessionId(request) {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null
  const match = cookie.split('; ').find((row) => row.startsWith('guest_session='))
  return match?.split('=')[1] || null
}

/**
 * Generate a new guest session ID.
 */
export function createGuestSessionId() {
  return randomUUID()
}

/**
 * Build a Set-Cookie header for the guest session.
 * 30-day expiry, HttpOnly, SameSite=Lax.
 */
export function guestSessionCookie(sessionId) {
  return `guest_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
}

/**
 * Returns { userId, guestSessionId } — exactly one will be non-null.
 * If the user is authenticated, userId is set. Otherwise guestSessionId is set
 * (read from cookie, or a new one that the caller must set via Set-Cookie).
 */
export function getSessionContext(request) {
  const token = getCookieToken(request)
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      return { userId: decoded.userId, guestSessionId: null, isNew: false }
    }
  }
  const existing = getGuestSessionId(request)
  if (existing) {
    return { userId: null, guestSessionId: existing, isNew: false }
  }
  const newId = createGuestSessionId()
  return { userId: null, guestSessionId: newId, isNew: true }
}

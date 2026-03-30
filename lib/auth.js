import jwt from 'jsonwebtoken'

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

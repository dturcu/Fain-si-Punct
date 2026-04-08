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

export function middleware(request) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('token')
  if (!cookie?.value) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const payload = getTokenPayload(cookie.value)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Token present and claims say admin — let through.
  // API routes still perform full signature verification.
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

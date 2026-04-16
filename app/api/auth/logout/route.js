import { verifyToken, getCookieToken } from '@/lib/auth'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'

export async function POST(request) {
  // Best-effort audit event — don't fail logout if token is already bad.
  const token = getCookieToken(request)
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      const { ip, userAgent } = getRequestMeta(request)
      logAuditEvent('logout', { userId: decoded.userId, email: decoded.email, ip, userAgent })
    }
  }

  return Response.json(
    { success: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': 'token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      },
    }
  )
}

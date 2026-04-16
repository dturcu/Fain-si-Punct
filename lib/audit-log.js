import { supabaseAdmin } from './supabase'

/**
 * Log a security-relevant event to the audit_logs table.
 * Fails silently — audit logging must never break the main flow.
 * @param {'login_success'|'login_failed'|'logout'|'register'|'password_reset'|'admin_action'|'payment_attempt'|'payment_success'|'payment_failed'|'review_deleted'|'order_created'} eventType
 * @param {Object} opts
 * @param {string} [opts.userId]
 * @param {string} [opts.email]
 * @param {string} [opts.ip]
 * @param {string} [opts.userAgent]
 * @param {Object} [opts.metadata]
 */
export async function logAuditEvent(eventType, { userId, email, ip, userAgent, metadata } = {}) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      event_type: eventType,
      user_id: userId || null,
      email: email || null,
      ip_address: ip || null,
      user_agent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Intentionally silent — audit log failure must not break auth flow
  }
}

/**
 * Extract IP and user agent from a Next.js Request object.
 * @param {Request} request
 * @returns {{ ip: string, userAgent: string }}
 */
export function getRequestMeta(request) {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}

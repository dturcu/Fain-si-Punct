/**
 * Unit tests for lib/audit-log.js.
 *
 * Verifies:
 *  - logAuditEvent inserts into the audit_logs table with the right payload shape
 *  - nulls are written for missing optional fields
 *  - metadata is JSON-stringified
 *  - insert errors are swallowed (audit logging must never throw)
 *  - getRequestMeta reads IP from x-forwarded-for / x-real-ip / falls back to 'unknown'
 */

const mockInsert = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({ insert: mockInsert })),
  },
}))

import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { supabaseAdmin } from '@/lib/supabase'

describe('logAuditEvent', () => {
  beforeEach(() => {
    mockInsert.mockReset()
    supabaseAdmin.from.mockClear()
    mockInsert.mockResolvedValue({ data: null, error: null })
  })

  it('writes to audit_logs table', async () => {
    await logAuditEvent('login_success', { userId: 'u1', email: 'a@b.com' })
    expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs')
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })

  it('maps fields to snake_case payload', async () => {
    await logAuditEvent('login_failed', {
      userId: 'u2',
      email: 'x@y.com',
      ip: '1.2.3.4',
      userAgent: 'curl/8',
      metadata: { reason: 'bad_password' },
    })
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.event_type).toBe('login_failed')
    expect(payload.user_id).toBe('u2')
    expect(payload.email).toBe('x@y.com')
    expect(payload.ip_address).toBe('1.2.3.4')
    expect(payload.user_agent).toBe('curl/8')
    expect(payload.metadata).toBe(JSON.stringify({ reason: 'bad_password' }))
    expect(typeof payload.created_at).toBe('string')
  })

  it('writes null for missing optional fields', async () => {
    await logAuditEvent('logout')
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.user_id).toBeNull()
    expect(payload.email).toBeNull()
    expect(payload.ip_address).toBeNull()
    expect(payload.user_agent).toBeNull()
    expect(payload.metadata).toBeNull()
  })

  it('swallows insert errors', async () => {
    mockInsert.mockRejectedValueOnce(new Error('DB down'))
    await expect(logAuditEvent('admin_action', { userId: 'u3' })).resolves.toBeUndefined()
  })

  it('swallows unexpected errors from supabase client', async () => {
    supabaseAdmin.from.mockImplementationOnce(() => {
      throw new Error('client broken')
    })
    await expect(logAuditEvent('payment_failed')).resolves.toBeUndefined()
  })
})

describe('getRequestMeta', () => {
  function makeReq(headers) {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] ?? null,
      },
    }
  }

  it('reads first IP from x-forwarded-for', () => {
    const meta = getRequestMeta(makeReq({ 'x-forwarded-for': '8.8.8.8, 10.0.0.1', 'user-agent': 'UA' }))
    expect(meta.ip).toBe('8.8.8.8')
    expect(meta.userAgent).toBe('UA')
  })

  it('falls back to x-real-ip when x-forwarded-for is missing', () => {
    const meta = getRequestMeta(makeReq({ 'x-real-ip': '7.7.7.7' }))
    expect(meta.ip).toBe('7.7.7.7')
  })

  it("returns 'unknown' when no IP headers are present", () => {
    const meta = getRequestMeta(makeReq({}))
    expect(meta.ip).toBe('unknown')
    expect(meta.userAgent).toBe('unknown')
  })
})

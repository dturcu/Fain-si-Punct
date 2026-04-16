import { supabaseAdmin } from '../supabase'

/**
 * Returns (refund request) queries.
 *
 * State machine enforced at the SQL CHECK + here:
 *   requested -> approved | rejected
 *   approved  -> refunded | cancelled
 *   (refunded, rejected, cancelled are terminal)
 */

const REASON_CODES = ['withdrawal', 'defective', 'not_as_described', 'wrong_item', 'other']
const TERMINAL = new Set(['refunded', 'rejected', 'cancelled'])

const ALLOWED_TRANSITIONS = {
  requested: ['approved', 'rejected', 'cancelled'],
  approved: ['refunded', 'cancelled'],
  rejected: [],
  refunded: [],
  cancelled: [],
}

export { REASON_CODES, TERMINAL, ALLOWED_TRANSITIONS }

export async function createReturnRequest({
  orderId,
  userId,
  guestSessionId,
  reasonCode,
  reasonNote,
  items,
}) {
  if (!REASON_CODES.includes(reasonCode)) {
    throw new Error(`Invalid reason_code: ${reasonCode}`)
  }

  const { data, error } = await supabaseAdmin
    .from('returns')
    .insert({
      order_id: orderId,
      user_id: userId || null,
      guest_session_id: guestSessionId || null,
      reason_code: reasonCode,
      reason_note: reasonNote || null,
      items,
      status: 'requested',
    })
    .select()
    .single()

  if (error) throw error
  return rowToReturn(data)
}

export async function getReturnById(id) {
  const { data, error } = await supabaseAdmin
    .from('returns')
    .select('*')
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw error
  return rowToReturn(data)
}

export async function getReturnsByOrder(orderId) {
  const { data, error } = await supabaseAdmin
    .from('returns')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToReturn)
}

export async function listReturns({ status, limit = 50, skip = 0 } = {}) {
  let query = supabaseAdmin.from('returns').select('*')
  if (status) query = query.eq('status', status)
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1)
  if (error) throw error
  return (data || []).map(rowToReturn)
}

export async function transitionReturn(id, nextStatus, { adminUserId, adminNote, refundAmount, refundMethod, refundExternalId } = {}) {
  const current = await getReturnById(id)
  if (!current) throw new Error('Return not found')

  const allowed = ALLOWED_TRANSITIONS[current.status] || []
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot transition return from ${current.status} to ${nextStatus}`)
  }

  const update = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }
  if (nextStatus === 'approved' || nextStatus === 'rejected') {
    update.decided_at = new Date().toISOString()
    if (adminUserId) update.decided_by = adminUserId
    if (adminNote !== undefined) update.admin_note = adminNote
  }
  if (nextStatus === 'refunded') {
    update.refunded_at = new Date().toISOString()
    if (refundAmount !== undefined) update.refund_amount = refundAmount
    if (refundMethod !== undefined) update.refund_method = refundMethod
    if (refundExternalId !== undefined) update.refund_external_id = refundExternalId
  }

  const { data, error } = await supabaseAdmin
    .from('returns')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return rowToReturn(data)
}

function rowToReturn(row) {
  if (!row) return null
  return {
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    guestSessionId: row.guest_session_id,
    reasonCode: row.reason_code,
    reasonNote: row.reason_note,
    items: row.items,
    refundAmount: row.refund_amount != null ? parseFloat(row.refund_amount) : null,
    refundMethod: row.refund_method,
    refundExternalId: row.refund_external_id,
    status: row.status,
    adminNote: row.admin_note,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

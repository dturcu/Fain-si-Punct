import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import { logAuditEvent, getRequestMeta } from '@/lib/audit-log'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

/**
 * DELETE /api/account
 * GDPR Article 17 — right to erasure.
 *
 * Strategy: anonymize PII, keep orders.
 * Romanian fiscal law requires invoice retention (up to 10 years), so we
 * cannot hard-delete orders. We scrub the personally-identifying fields
 * and mark the user row `is_active = false`.
 *
 * After this call, the user cannot log in (email is replaced with a
 * non-functional anon.<id>@deleted.local placeholder). Orders remain in
 * the admin system with the anonymized customer snapshot.
 */
export async function DELETE(request) {
  try {
    const token = getCookieToken(request)
    if (!token) return apiError(ERROR_CODES.UNAUTHORIZED)
    const decoded = verifyToken(token)
    if (!decoded) return apiError(ERROR_CODES.INVALID_TOKEN)

    const user = await getUserById(decoded.userId)
    if (!user) return apiError(ERROR_CODES.USER_NOT_FOUND)

    const userId = user.id
    const nowIso = new Date().toISOString()
    const anonEmail = `anon.${userId}@deleted.local`

    // Every write below is checked for errors. If any step fails we bail
    // with 500 — claiming "success: true" while PII remains would be a
    // GDPR Art. 17 violation worse than the original complaint.
    function check(label, { error }) {
      if (error) {
        error.erasureStep = label
        throw error
      }
    }

    // 1. Scrub the users row.
    check('users.update', await supabaseAdmin
      .from('users')
      .update({
        email: anonEmail,
        password: 'DISABLED',
        first_name: '[redacted]',
        last_name: '[redacted]',
        phone: null,
        address_street: null,
        address_city: null,
        address_state: null,
        address_zip: null,
        address_country: null,
        reset_token: null,
        reset_token_expires: null,
        is_active: false,
        updated_at: nowIso,
      })
      .eq('id', userId))

    // 2. Scrub customer snapshot on orders — keep totals/items for
    //    accounting; strip PII.
    check('orders.update', await supabaseAdmin
      .from('orders')
      .update({
        customer_name: '[redacted]',
        customer_email: anonEmail,
        customer_phone: null,
      })
      .eq('user_id', userId))

    // 3. Drop reviews (no legal retention need) and associated helpful_votes.
    const reviewsRes = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
    check('reviews.select', reviewsRes)
    const reviewIds = (reviewsRes.data || []).map((r) => r.id)
    if (reviewIds.length > 0) {
      check('helpful_votes.delete', await supabaseAdmin.from('helpful_votes').delete().in('review_id', reviewIds))
      check('reviews.delete', await supabaseAdmin.from('reviews').delete().eq('user_id', userId))
    }

    // 4. Clear cart.
    check('carts.delete', await supabaseAdmin.from('carts').delete().eq('user_id', userId))

    // 5. Anonymize audit-log rows — retain event_type + timestamp but
    //    strip email, IP, user-agent, metadata.
    check('audit_logs.update', await supabaseAdmin
      .from('audit_logs')
      .update({ email: null, ip_address: null, user_agent: null, metadata: null })
      .eq('user_id', userId))

    const { ip, userAgent } = getRequestMeta(request)
    // Final audit entry — uses anonymized email so it matches the new state.
    await logAuditEvent('admin_action', {
      userId,
      ip,
      userAgent,
      metadata: { action: 'account_erased', retainedOrders: true },
    })

    // Invalidate the session cookie.
    return Response.json(
      {
        success: true,
        message: 'Contul a fost sters. Comenzile sunt pastrate anonimizat pentru conformitate fiscala.',
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
        },
      }
    )
  } catch (error) {
    return handleApiError(error, 'account DELETE')
  }
}

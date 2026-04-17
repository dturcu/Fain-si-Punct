import { supabaseAdmin } from '@/lib/supabase'
import { getUserById, orderRowToObj } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'
import { randomUUID } from 'crypto'

function generateOrderNumber() {
  return 'ORD-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
}

async function requireAdmin(request) {
  const token = getCookieToken(request)
  if (!token) return { error: apiError(ERROR_CODES.UNAUTHORIZED) }
  const decoded = verifyToken(token)
  if (!decoded) return { error: apiError(ERROR_CODES.INVALID_TOKEN) }
  const user = await getUserById(decoded.userId)
  if (!user || user.role !== 'admin') return { error: apiError(ERROR_CODES.FORBIDDEN) }
  return { decoded, user }
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabaseAdmin.from('orders').select('*, order_items(*)')

    if (email) query = query.eq('customer_email', email)
    if (status) query = query.eq('status', status)

    if (search) {
      const term = search.replace(/[%_"'\\]/g, '')
      query = query.or(
        `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`
      )
    }

    const { data: orders, error } = await query
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const ordersWithItems = (orders || []).map((order) => {
      const { order_items: items, ...orderRow } = order
      return orderRowToObj(orderRow, items || [])
    })

    return Response.json({ success: true, data: ordersWithItems })
  } catch (error) {
    return handleApiError(error, 'orders GET')
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const body = await request.json()
    // Always use the authenticated user's ID, never trust client-supplied userId
    body.userId = auth.decoded.userId

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        ...orderObjToRow(body),
        order_number: generateOrderNumber(),
      })
      .select()
      .single()

    if (error) throw error

    return Response.json(
      { success: true, data: orderRowToObj(order, body.items || []) },
      { status: 201 }
    )
  } catch (error) {
    // Let handleApiError's Supabase code map classify validation-class errors
    // explicitly. Default to INTERNAL_ERROR so real 5xx issues aren't masked
    // as 422s.
    return handleApiError(error, 'orders POST')
  }
}

function orderObjToRow(body) {
  return {
    user_id: body.userId,
    total: body.total,
    status: body.status || 'pending',
    customer_name: body.customer?.name,
    customer_email: body.customer?.email,
    customer_phone: body.customer?.phone,
    shipping_street: body.shippingAddress?.street,
    shipping_city: body.shippingAddress?.city,
    shipping_state: body.shippingAddress?.state,
    shipping_zip: body.shippingAddress?.zip,
    shipping_country: body.shippingAddress?.country,
    payment_method: body.paymentMethod,
  }
}

// Kept as named export for any legacy imports — prefer importing from
// lib/supabase-queries directly in new code.
export { orderObjToRow }

import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const token = getCookieToken(request)
    if (!token) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const result = (orders || []).map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      total: parseFloat(row.total),
      status: row.status,
      paymentStatus: row.payment_status,
      createdAt: row.created_at,
    }))

    return Response.json({ success: true, data: result })
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to retrieve orders' }, { status: 500 })
  }
}

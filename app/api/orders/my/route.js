import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

export async function GET(request) {
  try {
    const token = getCookieToken(request)
    if (!token) return apiError(ERROR_CODES.UNAUTHORIZED)
    const decoded = verifyToken(token)
    if (!decoded) return apiError(ERROR_CODES.INVALID_TOKEN)

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const result = (orders || []).map(({ order_items: items, ...row }) => ({
      id: row.id,
      orderNumber: row.order_number,
      total: parseFloat(row.total),
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      items: (items || []).map((item) => ({
        productId: item.product_id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        image: item.image,
      })),
    }))

    return Response.json({ success: true, data: result })
  } catch (error) {
    return handleApiError(error, 'orders/my')
  }
}

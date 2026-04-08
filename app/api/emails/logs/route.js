import { supabaseAdmin } from '@/lib/supabase'
import { getUserById } from '@/lib/supabase-queries'
import { verifyToken, getCookieToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const token = getCookieToken(request)
    if (!token) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')
    const recipient = searchParams.get('recipient')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)

    let query = supabaseAdmin.from('email_logs').select('*', { count: 'exact' })

    if (type) query = query.eq('type', type)
    if (status) query = query.eq('status', status)
    if (orderId) query = query.eq('order_id', orderId)
    if (userId) query = query.eq('user_id', userId)
    if (recipient) query = query.ilike('recipient', `%${recipient}%`)

    const skip = (page - 1) * limit

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    return Response.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get email logs error:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch email logs' },
      { status: 500 }
    )
  }
}

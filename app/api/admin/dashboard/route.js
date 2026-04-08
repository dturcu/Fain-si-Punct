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

    const user = await getUserById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get total products
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact' })

    // Get total orders
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact' })

    // Get total revenue
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')

    const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0

    // Get recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get category stats
    const { data: categoryStats } = await supabaseAdmin
      .from('products')
      .select('category, price')

    const categoryMap = {}
    if (categoryStats) {
      categoryStats.forEach(product => {
        if (!categoryMap[product.category]) {
          categoryMap[product.category] = { count: 0, totalPrice: 0 }
        }
        categoryMap[product.category].count += 1
        categoryMap[product.category].totalPrice += parseFloat(product.price)
      })
    }

    const categories = Object.entries(categoryMap)
      .map(([name, data]) => ({
        _id: name,
        count: data.count,
        avgPrice: data.count > 0 ? parseFloat((data.totalPrice / data.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return Response.json({
      success: true,
      data: {
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        recentOrders: (recentOrders || []).map(o => ({
          _id: o.id,
          orderNumber: o.order_number,
          total: parseFloat(o.total),
          status: o.status,
          customer: { name: o.customer_name, email: o.customer_email },
          createdAt: o.created_at,
        })),
        categoryStats: categories,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return Response.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}

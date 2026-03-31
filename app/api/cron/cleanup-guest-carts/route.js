import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/cron/cleanup-guest-carts
 *
 * Deletes guest carts older than 30 days that were never converted to orders.
 * Runs daily at 3 AM via Vercel Cron.
 */
export async function GET(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = thirtyDaysAgo.toISOString()

    // Find old guest carts
    const { data: oldCarts, error: findError } = await supabaseAdmin
      .from('carts')
      .select('id')
      .not('guest_session_id', 'is', null)
      .is('user_id', null)
      .lt('updated_at', cutoff)

    if (findError) throw findError

    if (!oldCarts || oldCarts.length === 0) {
      return Response.json({
        success: true,
        deleted: 0,
        message: 'No stale guest carts found',
      })
    }

    const cartIds = oldCarts.map((c) => c.id)

    // Delete cart items first (FK constraint)
    const { error: itemsError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .in('cart_id', cartIds)

    if (itemsError) throw itemsError

    // Delete the carts
    const { error: cartsError } = await supabaseAdmin
      .from('carts')
      .delete()
      .in('id', cartIds)

    if (cartsError) throw cartsError

    console.log(`Cleaned up ${cartIds.length} stale guest carts`)

    return Response.json({
      success: true,
      deleted: cartIds.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Guest cart cleanup error:', error)
    return Response.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}

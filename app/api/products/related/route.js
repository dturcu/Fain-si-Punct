import { supabaseAdmin } from '@/lib/supabase'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/products/related?ids=<id1>,<id2>&limit=4
 *
 * Returns products in the same categories as the given IDs, excluding
 * the input set itself. Cheap, no aggregation — useful for
 * "Frequently Bought Together" / "Customers Also Bought" widgets.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = (searchParams.get('ids') || '').trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 12)
    if (!idsParam) {
      return Response.json({ success: true, data: [] })
    }
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
    if (ids.length === 0) {
      return Response.json({ success: true, data: [] })
    }

    // Pick categories from the input products.
    const { data: seedProducts } = await supabaseAdmin
      .from('products')
      .select('category')
      .in('id', ids)

    const categories = Array.from(
      new Set((seedProducts || []).map((p) => p.category).filter(Boolean))
    )

    if (categories.length === 0) {
      return Response.json({ success: true, data: [] })
    }

    const { data: related, error } = await supabaseAdmin
      .from('products')
      .select('id, name, image, price, avg_rating, review_count')
      .in('category', categories)
      .not('id', 'in', `(${ids.join(',')})`)
      .gt('stock', 0)
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) throw error

    return Response.json({
      success: true,
      data: (related || []).map((r) => ({
        id: r.id,
        name: r.name,
        image: r.image,
        price: parseFloat(r.price),
        avgRating: r.avg_rating != null ? parseFloat(r.avg_rating) : 0,
        reviewCount: r.review_count || 0,
      })),
    })
  } catch (error) {
    return handleApiError(error, 'products/related')
  }
}

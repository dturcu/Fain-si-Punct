import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Single aggregation query via Supabase RPC — replaces the old loop
    // that fetched all 15k products in 15 separate 1000-row pages
    const { data, error } = await supabaseAdmin
      .rpc('get_category_counts')

    if (error) {
      // Fallback: if the RPC doesn't exist yet, use a lightweight select
      // (only category column, no pagination loop)
      const { data: rows, error: fallbackError } = await supabaseAdmin
        .from('products')
        .select('category')

      if (fallbackError) throw fallbackError

      const counts = {}
      for (const row of rows || []) {
        const cat = row.category || 'Uncategorized'
        counts[cat] = (counts[cat] || 0) + 1
      }

      const categories = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      return Response.json({
        success: true,
        data: categories,
        total: rows?.length || 0,
      }, {
        headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
      })
    }

    const categories = (data || []).sort((a, b) => b.count - a.count)
    const total = categories.reduce((sum, c) => sum + c.count, 0)

    return Response.json({ success: true, data: categories, total }, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return Response.json(
      { success: false, error: 'Failed to retrieve categories' },
      { status: 500 }
    )
  }
}

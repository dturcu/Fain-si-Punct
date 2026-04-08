import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Fetch all categories by paginating (Supabase defaults to 1000 rows)
    const counts = {}
    let total = 0
    let offset = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('category')
        .range(offset, offset + pageSize - 1)

      if (error) throw error
      if (!data || data.length === 0) break

      for (const row of data) {
        const cat = row.category || 'Uncategorized'
        counts[cat] = (counts[cat] || 0) + 1
        total++
      }

      if (data.length < pageSize) break
      offset += pageSize
    }

    const categories = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return Response.json({ success: true, data: categories, total })
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

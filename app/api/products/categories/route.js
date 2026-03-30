import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('category')

    if (error) throw error

    // Count products per category
    const counts = {}
    let total = 0
    for (const row of data) {
      const cat = row.category || 'Uncategorized'
      counts[cat] = (counts[cat] || 0) + 1
      total++
    }

    const categories = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return Response.json({ success: true, data: categories, total })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

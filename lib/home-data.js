/**
 * Server-side data helpers for the home page.
 *
 * Keep these separate from the API route handlers so the home page can
 * call them directly from a server component without going through an
 * HTTP roundtrip (and avoiding self-referential fetch during build).
 */

import { supabaseAdmin } from './supabase'

/**
 * Minimal product projection for the home page card grid.
 * Mirrors the subset of rowToProduct used by app/page.js. Keeping a
 * narrow shape here (instead of pulling the full transform) means the
 * home data helper doesn't depend on the /api/products route's internals.
 */
function projectHomeCard(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    price: row.price != null ? parseFloat(row.price) : null,
    totalRrp: row.total_rrp != null ? parseFloat(row.total_rrp) : 0,
    image: row.image,
    images: row.images || [],
    avgRating: row.avg_rating != null ? parseFloat(row.avg_rating) : 0,
    reviewCount: row.review_count || 0,
  }
}

/**
 * Category counts for the home page carousel. Prefers the aggregation
 * RPC; falls back to a SELECT only if the RPC isn't deployed yet.
 */
export async function getHomeCategories() {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_category_counts')
    if (!error && data) {
      const categories = [...data].sort((a, b) => b.count - a.count)
      const total = categories.reduce((sum, c) => sum + c.count, 0)
      return { categories, total }
    }
  } catch {
    // fall through to fallback
  }

  const { data: rows, error: fallbackError } = await supabaseAdmin
    .from('products')
    .select('category')
  if (fallbackError) return { categories: [], total: 0 }

  const counts = {}
  for (const row of rows || []) {
    const cat = row.category || 'Uncategorized'
    counts[cat] = (counts[cat] || 0) + 1
  }
  const categories = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  return { categories, total: rows?.length || 0 }
}

/**
 * Featured products (top by rating) for the home page grid.
 */
export async function getFeaturedProducts(limit = 8) {
  // Narrow column list — products table may contain long description /
  // JSONB columns we don't need for card rendering. Matches projectHomeCard.
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, total_rrp, image, images, avg_rating, review_count')
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error || !data) return []
  return data.map(projectHomeCard)
}

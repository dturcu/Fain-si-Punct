import { supabaseAdmin } from '@/lib/supabase'
import { apiError, ERROR_CODES } from '@/lib/i18n-errors'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/products/search/autocomplete?q=<term>
 *
 * Fast prefix/substring suggestions against product names. Matches are
 * case-insensitive ilike on `name` (Postgres citext not assumed) with a
 * fallback that strips Romanian diacritics so "masina" matches "mașină"
 * even without pg_trgm. Returns up to 10 { id, name, image, price }.
 *
 * Response cached aggressively (public, s-maxage=60) since the catalog
 * changes rarely on a per-minute basis — Next.js middleware already rate-
 * limits so public caching is safe.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return Response.json({ success: true, data: [] }, {
        headers: { 'Cache-Control': 'public, s-maxage=60' },
      })
    }
    if (q.length > 80) {
      return apiError(ERROR_CODES.VALIDATION_FAILED, { details: 'q too long' })
    }

    // Escape ilike special chars.
    const escaped = q.replace(/[%_\\]/g, '\\$&')
    // First pass — exact substring.
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name, image, price')
      .ilike('name', `%${escaped}%`)
      .gt('stock', 0)
      .limit(10)

    if (error) throw error

    // If we got enough, ship. Otherwise try a diacritic-folded variant.
    let results = data || []
    if (results.length < 10 && /[ăâîșşţț]/i.test(q)) {
      const folded = q
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ş/g, 's').replace(/ţ/g, 't')
        .replace(/ș/g, 's').replace(/ț/g, 't')
      if (folded !== q) {
        const foldedEscaped = folded.replace(/[%_\\]/g, '\\$&')
        const { data: extra } = await supabaseAdmin
          .from('products')
          .select('id, name, image, price')
          .ilike('name', `%${foldedEscaped}%`)
          .gt('stock', 0)
          .limit(10)
        const seen = new Set(results.map((r) => r.id))
        for (const row of extra || []) {
          if (!seen.has(row.id)) results.push(row)
          if (results.length >= 10) break
        }
      }
    }

    return Response.json(
      {
        success: true,
        data: results.map((r) => ({
          id: r.id,
          name: r.name,
          image: r.image,
          price: parseFloat(r.price),
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch (error) {
    return handleApiError(error, 'products/search/autocomplete')
  }
}

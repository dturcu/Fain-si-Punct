import { supabaseAdmin } from '@/lib/supabase'

// Generic tags and patterns to exclude from subcategories
const BLOCKED_TAGS = new Set([
  'brand new',
  'budget-friendly',
  'mid-range',
  'new',
  'used',
  'refurbished',
  'sale',
  'popular',
  'trending',
  'featured',
  'best seller',
  'limited edition',
  'clearance',
  'premium',
  'basic',
  'standard',
  'pro',
  'lite',
])

const MIN_TAG_LENGTH = 4
const MIN_PRODUCT_COUNT = 3

// Detect brand-like patterns: all caps (e.g. "SAMSUNG"), or file extensions (e.g. ".jpg")
function isBrandLikeOrInvalid(tag) {
  // All uppercase words (likely brand names like "SAMSUNG", "LG", "HP")
  if (/^[A-Z][A-Z0-9\s&-]+$/.test(tag) && tag.length <= 20) return true
  // File extensions
  if (/^\.\w+$/.test(tag)) return true
  // Purely numeric
  if (/^\d+$/.test(tag)) return true
  // Contains file extension patterns
  if (/\.\w{2,4}$/.test(tag) && !tag.includes(' ')) return true
  return false
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return Response.json(
        { success: false, error: 'category parameter is required' },
        { status: 400 }
      )
    }

    const categoryLower = category.toLowerCase()

    // Paginate through all products in the category to get accurate tag counts
    // Supabase has a 1000-row limit per request
    const PAGE_SIZE = 1000
    let offset = 0
    let allTags = []
    let hasMore = true

    while (hasMore) {
      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select('tags')
        .eq('category', category)
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) throw error

      if (!products || products.length === 0) {
        hasMore = false
        break
      }

      for (const product of products) {
        if (product.tags && Array.isArray(product.tags)) {
          allTags.push(...product.tags)
        }
      }

      if (products.length < PAGE_SIZE) {
        hasMore = false
      } else {
        offset += PAGE_SIZE
      }
    }

    // Count tag occurrences
    const tagCounts = {}
    for (const tag of allTags) {
      if (!tag || typeof tag !== 'string') continue
      const trimmed = tag.trim()
      if (!trimmed) continue
      tagCounts[trimmed] = (tagCounts[trimmed] || 0) + 1
    }

    // Filter tags to get valid subcategories
    const subcategories = Object.entries(tagCounts)
      .filter(([tag, count]) => {
        // Must have minimum product count
        if (count < MIN_PRODUCT_COUNT) return false
        // Must be longer than minimum length
        if (tag.length < MIN_TAG_LENGTH) return false
        // Exclude blocked generic tags
        if (BLOCKED_TAGS.has(tag.toLowerCase())) return false
        // Exclude the category name itself
        if (tag.toLowerCase() === categoryLower) return false
        // Exclude brand-like patterns
        if (isBrandLikeOrInvalid(tag)) return false
        return true
      })
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return Response.json({
      success: true,
      data: subcategories,
    })
  } catch (error) {
    
    console.error('products/subcategories error:', error)

    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

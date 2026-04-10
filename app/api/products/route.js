import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'

async function requireAdmin(request) {
  const token = getCookieToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const user = await getUserById(decoded.userId)
  return user?.role === 'admin' ? user : null
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 20))
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const sort = searchParams.get('sort') || '-createdAt'
    const minPrice = parseFloat(searchParams.get('minPrice'))
    const maxPrice = parseFloat(searchParams.get('maxPrice'))
    const inStock = searchParams.get('inStock')

    const offset = (page - 1) * limit

    let query = supabaseAdmin.from('products').select('*', { count: 'exact' })

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      // Sanitize: strip characters that could break PostgREST filter syntax
      const sanitized = search.replace(/[%_(),."'\\]/g, '').trim()
      if (sanitized.length === 0) {
        // no-op: empty after sanitization
      } else if (sanitized.length >= 3) {
        // Use full-text search for multi-word queries (leverages GIN index)
        const ftsQuery = sanitized.split(/\s+/).filter(Boolean).join(' & ')
        query = query.or(`name.ilike.%${sanitized}%,search_vector.fts(romanian).${ftsQuery}`)
      } else {
        query = query.ilike('name', `%${sanitized}%`)
      }
    }

    if (!isNaN(minPrice)) {
      query = query.gte('price', minPrice)
    }

    if (!isNaN(maxPrice)) {
      query = query.lte('price', maxPrice)
    }

    if (inStock === '1') {
      query = query.gt('stock', 0)
    }

    if (tag) {
      // tags is a text array column; filter products that contain the given tag(s)
      // Support comma-separated tags - products must contain ALL specified tags
      const tags = tag.split(',').map((t) => t.trim()).filter(Boolean)
      if (tags.length > 0) {
        query = query.contains('tags', tags)
      }
    }

    // Handle sorting — only allow known sort fields
    const allowedSorts = ['createdAt', 'updatedAt', 'price', 'name', 'avgRating', 'reviewCount']
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    if (allowedSorts.includes(sortField)) {
      query = query.order(toSnakeCase(sortField), { ascending: !sort.startsWith('-') })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: products, count, error } = await query

    if (error) throw error

    return Response.json({
      success: true,
      data: products.map(rowToProduct),
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert(productToRow(body))
      .select()
      .single()

    if (error) throw error

    return Response.json(
      { success: true, data: rowToProduct(product) },
      { status: 201 }
    )
  } catch (error) {
    console.error('Products POST error:', error)
    return Response.json(
      { success: false, error: 'A apărut o eroare internă' },
      { status: 400 }
    )
  }
}

// Convert camelCase field names to snake_case for DB
function toSnakeCase(str) {
  const map = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    avgRating: 'avg_rating',
    reviewCount: 'review_count',
  }
  return map[str] || str
}

// Convert DB row to API response format (snake_case → camelCase)
function rowToProduct(row) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: parseFloat(row.price),
    category: row.category,
    stock: row.stock,
    avgRating: parseFloat(row.avg_rating),
    reviewCount: row.review_count,
    ratingDistribution: row.rating_distribution,
    image: row.image,
    images: row.images || [],
    sku: row.sku,
    tags: row.tags || [],
    manifestSku: row.manifest_sku,
    sourceName: row.source_name,
    asin: row.asin,
    ean: row.ean,
    barcode: row.barcode,
    brand: row.brand,
    subCategory: row.sub_category,
    condition: row.condition,
    grade: row.grade,
    weight: row.weight ? parseFloat(row.weight) : null,
    currency: row.currency,
    totalRrp: row.total_rrp ? parseFloat(row.total_rrp) : 0,
    variants: (row.product_variants || []).map(variantRowToObj),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function variantRowToObj(row) {
  if (!row) return null
  return {
    id: row.id,
    productId: row.product_id,
    color: row.color,
    size: row.size,
    stock: row.stock,
    priceOverride: row.price_override ? parseFloat(row.price_override) : null,
    image: row.image,
    sku: row.sku,
  }
}

// Convert API input to DB row format (camelCase → snake_case)
function productToRow(body) {
  const row = {}
  if (body.name !== undefined) row.name = body.name
  if (body.slug !== undefined) row.slug = body.slug
  if (body.description !== undefined) row.description = body.description
  if (body.price !== undefined) row.price = body.price
  if (body.category !== undefined) row.category = body.category
  if (body.stock !== undefined) row.stock = body.stock
  if (body.avgRating !== undefined) row.avg_rating = body.avgRating
  if (body.reviewCount !== undefined) row.review_count = body.reviewCount
  if (body.ratingDistribution !== undefined) row.rating_distribution = body.ratingDistribution
  if (body.image !== undefined) row.image = body.image
  if (body.images !== undefined) row.images = body.images
  if (body.sku !== undefined) row.sku = body.sku
  if (body.tags !== undefined) row.tags = body.tags
  if (body.brand !== undefined) row.brand = body.brand
  if (body.subCategory !== undefined) row.sub_category = body.subCategory
  if (body.condition !== undefined) row.condition = body.condition
  return row
}

export { rowToProduct, productToRow, variantRowToObj }

import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const sort = searchParams.get('sort') || '-createdAt'

    const offset = (page - 1) * limit

    let query = supabaseAdmin.from('products').select('*', { count: 'exact' })

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (tag) {
      // tags is a text array column; filter products that contain the given tag(s)
      // Support comma-separated tags - products must contain ALL specified tags
      const tags = tag.split(',').map((t) => t.trim()).filter(Boolean)
      if (tags.length > 0) {
        query = query.contains('tags', tags)
      }
    }

    // Handle sorting
    if (sort.startsWith('-')) {
      query = query.order(toSnakeCase(sort.slice(1)), { ascending: false })
    } else {
      query = query.order(toSnakeCase(sort), { ascending: true })
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
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
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
    return Response.json(
      { success: false, error: error.message },
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export { rowToProduct, productToRow }

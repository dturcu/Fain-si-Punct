import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, getCookieToken } from '@/lib/auth'
import { getUserById } from '@/lib/supabase-queries'
import {
  rowToProduct,
  productToRow,
  toSnakeCase,
} from '@/lib/mappers/products'

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

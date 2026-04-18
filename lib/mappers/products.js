const SORT_FIELD_MAP = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  avgRating: 'avg_rating',
  reviewCount: 'review_count',
}

export function toSnakeCase(str) {
  return SORT_FIELD_MAP[str] || str
}

export function variantRowToObj(row) {
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

export function rowToProduct(row) {
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

export function productToRow(body) {
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

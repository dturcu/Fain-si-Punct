import { supabaseAdmin } from '@/lib/supabase'

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('NEXT_PUBLIC_SITE_URL must be set in production') })() : 'http://localhost:3099')

  // Static pages
  const staticPages = [
    '', '/products', '/about', '/contact', '/blog',
    '/terms', '/privacy', '/cookies', '/returns', '/faq', '/careers',
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date().toISOString(),
    changeFrequency: path === '' ? 'daily' : 'monthly',
    priority: path === '' ? 1.0 : path === '/products' ? 0.9 : 0.5,
  }))

  // Product pages
  let productPages = []
  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5000)

    if (products) {
      productPages = products.map((p) => ({
        url: `${siteUrl}/products/${p.id}`,
        lastModified: p.updated_at || new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
    }
  } catch {
    // Supabase may be unreachable during build
  }

  // Category pages
  let categoryPages = []
  try {
    const { data: categories } = await supabaseAdmin
      .from('products')
      .select('category')
      .not('category', 'is', null)

    if (categories) {
      const unique = [...new Set(categories.map((c) => c.category).filter(Boolean))]
      categoryPages = unique.map((cat) => ({
        url: `${siteUrl}/products?category=${encodeURIComponent(cat)}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    }
  } catch {
    // ignore
  }

  return [...staticPages, ...productPages, ...categoryPages]
}

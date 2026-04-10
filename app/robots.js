export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('NEXT_PUBLIC_SITE_URL must be set in production') })() : 'http://localhost:3099')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/', '/account/', '/checkout/', '/cart/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

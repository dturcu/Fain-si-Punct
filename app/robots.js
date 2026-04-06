export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awesome-wilbur.vercel.app'

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

import { getSiteUrl } from '@/lib/site-url'

export default function robots() {
  const siteUrl = getSiteUrl()

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

export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fainsi-punct.ro'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/cart/',
          '/checkout/',
          '/auth/',
          '/orders/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

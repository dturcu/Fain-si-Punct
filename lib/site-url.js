/**
 * Canonical site URL resolver.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL   — explicit override (canonical prod value)
 *   2. https://$VERCEL_URL    — Vercel auto-exposes on every deploy
 *                               (production, preview, branch builds)
 *   3. http://localhost:3099  — local dev fallback
 *
 * Throws in production only if NONE of the above is set.
 *
 * One source of truth so app/layout.js, app/sitemap.js, app/robots.js,
 * and any per-route layout that composes canonical URLs stay in sync.
 */
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL or VERCEL_URL must be set in production')
  }
  return 'http://localhost:3099'
}

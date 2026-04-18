/**
 * Accessibility smoke tests powered by axe-core.
 *
 * Each scan targets a main customer path and asserts that there are zero
 * axe violations at `critical` or `serious` impact level against the
 * WCAG 2.0 / 2.1 A and AA rule sets.
 *
 * These tests exist to satisfy the EU Accessibility Act (EAA) — in force
 * since 2025-06-28 — which applies to e-commerce services sold to EU
 * consumers, including this Romanian shop.
 *
 * Third-party embeds (Stripe Elements, PayPal SDK iframe, Revolut widget)
 * are excluded because we do not control their markup; accessibility of
 * those widgets is the responsibility of the respective providers.
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const P0_IMPACTS = ['critical', 'serious']
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Exclude third-party iframes and noisy SEO-only markup that we do not own
const IGNORED_SELECTORS = [
  'iframe[src*="stripe.com"]',
  'iframe[src*="paypal.com"]',
  'iframe[src*="revolut.com"]',
  'script[type="application/ld+json"]',
]

/**
 * Fetch a real product id from the catalogue so the product-detail
 * route can be scanned against live data. If the API is unreachable,
 * the test using it will be skipped (not failed) so missing env vars
 * don't mask unrelated a11y issues.
 */
async function getFirstProductId(request, baseURL) {
  try {
    const res = await request.get(`${baseURL}/api/products?limit=1`, {
      timeout: 10_000,
    })
    if (!res.ok()) return null
    const body = await res.json()
    const first = body?.data?.[0]
    return first?.id || first?._id || null
  } catch {
    return null
  }
}

function summarizeViolations(violations) {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 3)
        .map((n) => `      target=${JSON.stringify(n.target)}\n      html=${n.html.slice(0, 180)}`)
        .join('\n')
      return (
        `- [${v.impact}] ${v.id}: ${v.help}\n` +
        `  help: ${v.helpUrl}\n` +
        `  nodes (${v.nodes.length} total, up to 3 shown):\n${nodes}`
      )
    })
    .join('\n')
}

async function runAxe(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude(IGNORED_SELECTORS)
    .analyze()

  const p0 = results.violations.filter((v) =>
    P0_IMPACTS.includes(v.impact)
  )

  if (p0.length > 0) {
    console.error(
      `\naxe P0 violations on ${label}:\n${summarizeViolations(p0)}\n`
    )
  }

  return p0
}

const routes = [
  { name: 'home', path: '/' },
  { name: 'product-listing', path: '/products' },
  { name: 'cart', path: '/cart' },
  { name: 'checkout', path: '/checkout' },
  { name: 'auth-login', path: '/auth/login' },
  { name: 'auth-register', path: '/auth/register' },
]

test.describe('Accessibility (axe-core, WCAG 2.1 AA)', () => {
  for (const route of routes) {
    test(`${route.name} (${route.path}) has no critical or serious violations`, async ({
      page,
    }) => {
      const response = await page.goto(route.path, { waitUntil: 'networkidle' })
      // If the dev server is booted but the route 500s due to missing env
      // (Supabase/Stripe), skip rather than fail — we still want the spec
      // to be committed and run elsewhere.
      if (!response || response.status() >= 500) {
        test.skip(
          true,
          `Route ${route.path} returned ${response?.status()} — likely missing env vars. Spec requires a functional dev server (Supabase + Stripe).`
        )
      }

      const p0 = await runAxe(page, route.path)
      expect(p0, `P0 a11y violations on ${route.path}`).toEqual([])
    })
  }

  test('product-detail (/products/[id]) has no critical or serious violations', async ({
    page,
    request,
    baseURL,
  }) => {
    const productId = await getFirstProductId(request, baseURL)
    if (!productId) {
      test.skip(
        true,
        'No products returned from /api/products — likely missing Supabase env. Spec requires a seeded database.'
      )
    }

    const response = await page.goto(`/products/${productId}`, {
      waitUntil: 'networkidle',
    })
    if (!response || response.status() >= 500) {
      test.skip(
        true,
        `Product detail returned ${response?.status()} — likely missing env vars.`
      )
    }

    const p0 = await runAxe(page, `/products/${productId}`)
    expect(p0, `P0 a11y violations on /products/${productId}`).toEqual([])
  })
})

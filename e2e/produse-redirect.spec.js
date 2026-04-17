import { test, expect } from '@playwright/test'

test('Romanian /produse/[categorie] alias redirects to /products?category=', async ({ page }) => {
  const response = await page.goto('/produse/electronice', { waitUntil: 'domcontentloaded' })
  // Navigate ends up on /products with the category query set.
  await expect(page).toHaveURL(/\/products\?category=/)
  // The Next.js server responds with 307/308 for the internal redirect.
  // (Status may be null if the browser followed; rely on final URL.)
  if (response) {
    // Chain should include the redirect. If available, status is 2xx on final hop.
    expect([200, 307, 308].includes(response.status())).toBeTruthy()
  }
})

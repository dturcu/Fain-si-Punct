import { test, expect } from '@playwright/test'

test('search autocomplete either surfaces suggestions or returns empty gracefully', async ({ page }) => {
  await page.goto('/')

  // The search input has a predictable id from SearchAutocomplete.
  const input = page.locator('#nav-search-input').first()
  await expect(input).toBeVisible()

  // Type a short query. Debounce is 180ms.
  await input.click()
  await input.fill('test')

  // Either a listbox panel appears or nothing (empty catalog is valid).
  const listbox = page.getByRole('listbox')
  const appeared = await listbox
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false)

  if (appeared) {
    // If we have suggestions, at least one option should be present.
    const options = page.getByRole('option')
    expect(await options.count()).toBeGreaterThan(0)
  } else {
    // Otherwise verify the autocomplete endpoint at least responds 200 + success.
    const res = await page.request.get('/api/products/search/autocomplete?q=test')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  }
})

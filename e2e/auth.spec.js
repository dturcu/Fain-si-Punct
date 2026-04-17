import { test, expect } from '@playwright/test'

test.describe('authentication', () => {
  test('login page renders and is keyboard accessible', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/parola/i)).toBeVisible()
    // Tab-through reaches the submit button.
    await page.getByLabel(/email/i).focus()
    await page.keyboard.press('Tab')
    // Whatever the next focusable is, should be visible and interactive.
    const active = page.locator(':focus')
    await expect(active).toBeVisible()
  })

  test('invalid credentials return Romanian INVALID_CREDENTIALS error', async ({ page, request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'does-not-exist@example.com', password: 'wrongpassword123' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    // Phase 1 i18n-errors: canonical { code, message } shape.
    expect(body.error?.code).toBe('INVALID_CREDENTIALS')
    expect(body.error?.message).toMatch(/Date de autentificare incorecte/i)
  })

  test('register rejects weak password with 422 + WEAK_PASSWORD', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { email: `smoke+${Date.now()}@example.com`, password: 'short' },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    expect(body.error?.code).toBe('WEAK_PASSWORD')
  })
})

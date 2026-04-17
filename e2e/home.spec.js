import { test, expect } from '@playwright/test'

test.describe('home page', () => {
  test('renders the hero + free shipping banner', async ({ page }) => {
    await page.goto('/')
    // Free-shipping ribbon sits above the navbar.
    await expect(page.getByText(/Livrare gratuita/i)).toBeVisible()
    // Hero copy from server-rendered home.
    await expect(
      page.getByRole('heading', { level: 1, name: /Descopera mii de produse/i })
    ).toBeVisible()
    // Testimonials section (static content).
    await expect(page.getByRole('heading', { name: /Ce spun clientii nostri/i })).toBeVisible()
  })

  test('shows cookie consent banner on first visit', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/')
    // Banner renders client-side; give it a beat.
    await expect(page.getByRole('dialog', { name: /Consimtamant cookies/i })).toBeVisible()
    // Three action buttons are present.
    await expect(page.getByRole('button', { name: /Accepta toate/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Refuza toate/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Personalizeaza/i })).toBeVisible()
  })

  test('ANPC and SOL UE footer links are present', async ({ page }) => {
    await page.goto('/')
    const anpc = page.getByRole('link', { name: 'ANPC-SAL' })
    const sol = page.getByRole('link', { name: 'SOL UE' })
    await expect(anpc).toBeVisible()
    await expect(sol).toBeVisible()
    await expect(anpc).toHaveAttribute('href', /anpc\.ro/)
    await expect(sol).toHaveAttribute('href', /consumers\/odr/)
  })
})

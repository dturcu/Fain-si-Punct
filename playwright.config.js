// @ts-check
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for smoke tests.
 *
 * Tests do NOT spin up the Next.js dev server themselves. Set the env
 * var PLAYWRIGHT_BASE_URL to point at a running preview (Vercel preview,
 * staging, or local `npm run dev`). Defaults to http://localhost:3000.
 *
 * Run locally:
 *   npm run dev &
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
 *
 * In CI: point at the Vercel preview deployment URL for the PR.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
})

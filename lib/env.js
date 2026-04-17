/**
 * Strict environment variable validator.
 *
 * Call assertEnv() at boot-critical points. In production, missing required
 * vars should fail-fast (throw), not silently return undefined to surface
 * later as cryptic "x is undefined" errors.
 *
 * Usage:
 *   import { assertEnv, isProd, isPreview } from '@/lib/env'
 *   assertEnv() // call once per cold start
 *
 * Environment model:
 *   NEXT_PUBLIC_SITE_URL — REQUIRED in production, falls back to
 *     https://$VERCEL_URL for Vercel preview deploys so preview and
 *     production have URL parity without manual mirroring.
 *   Everything else is classified as REQUIRED (boot fails everywhere) or
 *     PROD_REQUIRED (boot fails on Vercel production + preview; warned
 *     in dev). Preview is treated as prod-grade: we want parity, not a
 *     relaxed preview environment that masks missing config.
 *
 * Vercel's conventions:
 *   VERCEL_ENV = 'production' | 'preview' | 'development' (local vercel dev)
 *   NODE_ENV   = 'production' in both production and preview builds
 */

const REQUIRED = [
  'JWT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  // NEXT_PUBLIC_SITE_URL is enforced via resolveSiteUrl() in app/layout.js
  // with a VERCEL_URL fallback. Explicitly listed here for ops visibility
  // but the assertEnv() gate below special-cases it.
  'NEXT_PUBLIC_SITE_URL',
]

const PROD_REQUIRED = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
  'CRON_SECRET',
]

export function isProd() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

export function isPreview() {
  return process.env.VERCEL_ENV === 'preview'
}

/**
 * True when we're in a Vercel deploy (production OR preview). These are
 * treated identically by the validator so preview bugs mirror production
 * bugs rather than surface only after release.
 */
export function isVercelDeploy() {
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'
}

/**
 * NEXT_PUBLIC_SITE_URL has a legitimate Vercel fallback (VERCEL_URL),
 * so skip it when the fallback is available.
 */
function missingRequired() {
  return REQUIRED.filter((k) => {
    if (process.env[k]) return false
    if (k === 'NEXT_PUBLIC_SITE_URL' && process.env.VERCEL_URL) return false
    return true
  })
}

/**
 * Throws if any REQUIRED var is missing. On Vercel production OR preview,
 * also throws on missing PROD_REQUIRED — parity is enforced.
 * Safe to call repeatedly (idempotent).
 */
export function assertEnv() {
  const missing = missingRequired()
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }

  if (isVercelDeploy()) {
    const missingProd = PROD_REQUIRED.filter((k) => !process.env[k])
    if (missingProd.length > 0) {
      const scope = isPreview() ? 'preview' : 'production'
      throw new Error(
        `Missing ${scope}-required environment variables: ${missingProd.join(', ')}. ` +
          `Ensure Vercel Preview env vars mirror Production. See docs/deploy/vercel-preview.md.`
      )
    }
  } else if (process.env.NODE_ENV !== 'test') {
    // Local dev: warn but don't throw so contributors without full env can
    // still run `next dev`.
    const missingProd = PROD_REQUIRED.filter((k) => !process.env[k])
    if (missingProd.length > 0) {
      console.warn(
        `[env] Not required in dev but needed in prod/preview: ${missingProd.join(', ')}`
      )
    }
  }
}

/**
 * Get a required env var or throw with a clear error.
 * Prefer this over process.env.X for anything that must be set.
 */
export function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

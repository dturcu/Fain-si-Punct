/**
 * Strict environment variable validator.
 *
 * Call assertEnv() at boot-critical points. In production, missing required
 * vars should fail-fast (throw), not silently return undefined to surface
 * later as cryptic "x is undefined" errors.
 *
 * Usage:
 *   import { assertEnv, isProd } from '@/lib/env'
 *   assertEnv() // call once per cold start
 *
 * Variables are grouped by criticality:
 *   REQUIRED — must be set; boot fails without them.
 *   PROD_REQUIRED — required in production; warned in dev.
 *   OPTIONAL — reference only; not enforced.
 */

const REQUIRED = [
  'JWT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
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
  return process.env.NODE_ENV === 'production'
}

/**
 * Throws if any REQUIRED var is missing. In production, also throws on
 * missing PROD_REQUIRED. Safe to call repeatedly (idempotent).
 */
export function assertEnv() {
  const missingRequired = REQUIRED.filter((k) => !process.env[k])
  if (missingRequired.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingRequired.join(', ')}`
    )
  }

  if (isProd()) {
    const missingProd = PROD_REQUIRED.filter((k) => !process.env[k])
    if (missingProd.length > 0) {
      throw new Error(
        `Missing production-required environment variables: ${missingProd.join(', ')}`
      )
    }
  } else {
    // Dev-friendly warning, not throwing.
    const missingProd = PROD_REQUIRED.filter((k) => !process.env[k])
    if (missingProd.length > 0) {
      console.warn(
        `[env] Not required in dev but needed in prod: ${missingProd.join(', ')}`
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

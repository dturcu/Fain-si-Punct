#!/usr/bin/env node
/**
 * Verifies that a Vercel project's Preview env-var scope mirrors the
 * Production scope for every key we declare as REQUIRED / PROD_REQUIRED
 * in lib/env.js. Missing Preview vars are the reason preview deploys
 * have been failing after the Phase 1 env-strictness work.
 *
 * Needs:
 *   VERCEL_TOKEN   — personal access token (https://vercel.com/account/tokens)
 *   VERCEL_PROJECT — project id or slug (e.g. "shophub")
 *   VERCEL_TEAM    — team id (optional; omit for personal accounts)
 *
 * Exit codes:
 *   0 — parity OK
 *   1 — missing Preview vars (prints the list)
 *   2 — auth / network failure
 *
 * Usage:
 *   VERCEL_TOKEN=xxx VERCEL_PROJECT=shophub node scripts/check-vercel-env-parity.mjs
 *
 * This script is intentionally read-only — it does not mutate Vercel
 * config. Fixes must be applied through the Vercel dashboard or CLI.
 */

const REQUIRED = [
  'JWT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL', // VERCEL_URL fallback in code, but nice to have
]
const PROD_REQUIRED = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
  'CRON_SECRET',
]
const ALL = [...REQUIRED, ...PROD_REQUIRED]

const token = process.env.VERCEL_TOKEN
const project = process.env.VERCEL_PROJECT
const team = process.env.VERCEL_TEAM

if (!token || !project) {
  console.error('Missing VERCEL_TOKEN or VERCEL_PROJECT env var')
  process.exit(2)
}

const qs = team ? `?teamId=${encodeURIComponent(team)}` : ''
const url = `https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/env${qs}`

let envs
try {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    console.error(`Vercel API ${res.status}:`, await res.text())
    process.exit(2)
  }
  const body = await res.json()
  envs = body.envs || []
} catch (err) {
  console.error('Network error:', err.message)
  process.exit(2)
}

function hasScope(key, scope) {
  return envs.some((e) => e.key === key && e.target?.includes(scope))
}

const missingProd = ALL.filter((k) => !hasScope(k, 'production'))
const missingPreview = ALL.filter((k) => !hasScope(k, 'preview'))

let exitCode = 0
if (missingProd.length > 0) {
  console.error('❌ Missing in PRODUCTION scope:')
  for (const k of missingProd) console.error(`   - ${k}`)
  exitCode = 1
}
if (missingPreview.length > 0) {
  console.error('❌ Missing in PREVIEW scope (drift from production):')
  for (const k of missingPreview) console.error(`   - ${k}`)
  exitCode = 1
}

if (exitCode === 0) {
  console.log(`✅ All ${ALL.length} env vars set in both Production and Preview scopes.`)
}
process.exit(exitCode)

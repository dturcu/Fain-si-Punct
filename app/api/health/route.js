import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/health
 *
 * Deep health check. Probes each critical upstream with a short timeout
 * and returns a per-dependency status map. HTTP status:
 *   200 — every REQUIRED dependency healthy
 *   503 — at least one REQUIRED dependency unhealthy
 *
 * OPTIONAL dependencies (Stripe, SMTP, Redis) are reported but don't
 * affect HTTP status when absent — unconfigured env vars mean the
 * feature is intentionally off, not broken.
 *
 * Safe to hit publicly and from synthetic monitors. Does NOT leak stack
 * traces or sensitive connection strings.
 */
const CHECK_TIMEOUT_MS = 4_000

async function withTimeout(promise, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timeout`)), CHECK_TIMEOUT_MS)
  )
  return Promise.race([promise, timeout])
}

async function checkSupabase() {
  try {
    await withTimeout(
      supabaseAdmin.from('products').select('id').limit(1).then(({ error }) => {
        if (error) throw error
      }),
      'supabase'
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err.message || 'unknown' }
  }
}

async function checkUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return { ok: null, reason: 'not_configured' }
  try {
    const res = await withTimeout(
      fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      }),
      'upstash'
    )
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err.message || 'unknown' }
  }
}

async function checkStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return { ok: null, reason: 'not_configured' }
  try {
    // Cheapest Stripe call that proves the key works. GET /balance is
    // rate-limit-friendly and returns fast.
    const res = await withTimeout(
      fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      }),
      'stripe'
    )
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err.message || 'unknown' }
  }
}

async function checkSmtp() {
  // Full SMTP probe is heavyweight (opens a TCP connection per hit). We
  // check only that the config env vars are present; deep probe can be
  // scheduled separately.
  const host = process.env.SMTP_HOST
  if (!host) return { ok: null, reason: 'not_configured' }
  if (!process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { ok: false, reason: 'partially_configured' }
  }
  return { ok: true, reason: 'config_present' }
}

export async function GET(_request) {
  const started = Date.now()
  const [supabase, upstash, stripe, smtp] = await Promise.all([
    checkSupabase(),
    checkUpstash(),
    checkStripe(),
    checkSmtp(),
  ])

  // REQUIRED set — anything false fails the whole check.
  const required = { supabase }
  const optional = { upstash, stripe, smtp }

  const allRequiredOk = Object.values(required).every((r) => r.ok === true)

  return NextResponse.json(
    {
      healthy: allRequiredOk,
      elapsedMs: Date.now() - started,
      timestamp: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
      required,
      optional,
    },
    { status: allRequiredOk ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}

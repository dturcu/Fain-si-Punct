import { createClient } from '@supabase/supabase-js'

/**
 * Lazy-init Supabase clients. Env vars are checked at first use, not at
 * import time, so Next.js static page collection doesn't crash.
 */
let _supabase = null
let _supabaseAdmin = null

function ensureEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anon) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  if (!service) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  return { url, anon, service }
}

// Public client (for client-side, respects RLS)
export const supabase = new Proxy({}, {
  get(_, prop) {
    if (!_supabase) {
      const { url, anon } = ensureEnv()
      _supabase = createClient(url, anon)
    }
    return _supabase[prop]
  },
})

// Service role client (for server-side, bypasses RLS)
export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      const { url, service } = ensureEnv()
      _supabaseAdmin = createClient(url, service, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
    return _supabaseAdmin[prop]
  },
})

/**
 * Get the admin Supabase client for server-side operations.
 */
export function getDB() {
  return supabaseAdmin
}

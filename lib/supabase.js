import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Public client (for client-side, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client (for server-side, bypasses RLS)
// Must never fall back to anon key — that would silently break RLS enforcement
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for server-side operations')
}
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Get the admin Supabase client for server-side operations.
 * Replaces the old connectDB() pattern.
 */
export function getDB() {
  return supabaseAdmin
}

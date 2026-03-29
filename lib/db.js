import { supabaseAdmin } from './supabase.js'

/**
 * Get the Supabase admin client.
 * This replaces the old connectDB() function.
 * No connection management needed - Supabase handles it.
 */
export async function connectDB() {
  return supabaseAdmin
}

export { supabaseAdmin as db }

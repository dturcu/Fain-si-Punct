import { supabaseAdmin } from '../supabase'

/**
 * User queries — profile, email-based lookup, create, update.
 *
 * Split out of the monolithic lib/supabase-queries.js. The original module
 * re-exports everything here so existing imports keep working.
 */

export async function getUserById(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return userRowToObj(data)
}

export async function getUserByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error?.code === 'PGRST116') return null // Not found
  if (error) throw error
  const user = userRowToObj(data)
  // Include password hash for auth verification — callers that leak to
  // clients must strip this before responding.
  if (user && data.password) user.password = data.password
  return user
}

export async function createUser(email, passwordHash, firstName, lastName) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: 'customer',
    })
    .select()
    .single()

  if (error) throw error
  return userRowToObj(data)
}

export async function updateUserById(userId, updates) {
  const row = {}
  if (updates.firstName !== undefined) row.first_name = updates.firstName
  if (updates.lastName !== undefined) row.last_name = updates.lastName
  if (updates.phone !== undefined) row.phone = updates.phone
  if (updates.address !== undefined) {
    row.address_street = updates.address?.street
    row.address_city = updates.address?.city
    row.address_state = updates.address?.state
    row.address_zip = updates.address?.zip
    row.address_country = updates.address?.country
  }
  if (updates.emailPreferences !== undefined) {
    row.email_pref_order_confirmation = updates.emailPreferences?.orderConfirmation
    row.email_pref_shipping_updates = updates.emailPreferences?.shippingUpdates
    row.email_pref_promotions = updates.emailPreferences?.promotions
    row.email_pref_newsletter = updates.emailPreferences?.newsletter
    row.email_pref_updated_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(row)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return userRowToObj(data)
}

export function userRowToObj(row) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    address: {
      street: row.address_street,
      city: row.address_city,
      state: row.address_state,
      zip: row.address_zip,
      country: row.address_country,
    },
    role: row.role,
    isActive: row.is_active,
    emailPreferences: {
      orderConfirmation: row.email_pref_order_confirmation,
      shippingUpdates: row.email_pref_shipping_updates,
      promotions: row.email_pref_promotions,
      newsletter: row.email_pref_newsletter,
      updatedAt: row.email_pref_updated_at,
    },
    unsubscribeToken: row.unsubscribe_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

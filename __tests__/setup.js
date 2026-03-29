import { createClient } from '@supabase/supabase-js'

let supabase = null

/**
 * Connect to test Supabase database
 */
export async function connectTestDB() {
  if (supabase) {
    // Already connected
    return supabase
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-project.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

    supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection
    const { error } = await supabase.from('products').select('id').limit(1)
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`)
    }

    console.log('Connected to test database')
    return supabase
  } catch (error) {
    console.error('Test database connection error:', error)
    throw error
  }
}

/**
 * Disconnect from test Supabase database
 */
export async function disconnectTestDB() {
  supabase = null
  console.log('Disconnected from test database')
}

/**
 * Clean all tables in the database
 */
export async function cleanDatabase() {
  if (!supabase) {
    return
  }

  try {
    // Tables to clean (in reverse order of foreign key dependencies)
    const tables = [
      'helpful_votes',
      'reviews',
      'order_email_jobs',
      'order_email_logs',
      'email_logs',
      'cart_items',
      'carts',
      'saved_payment_methods',
      'payments',
      'order_items',
      'orders',
      'products',
      'users',
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', null)
      if (error && !error.message.includes('does not exist')) {
        console.warn(`Error cleaning table ${table}:`, error)
      }
    }

    console.log('Database cleaned')
  } catch (error) {
    console.error('Error cleaning database:', error)
  }
}

/**
 * Create test data in database
 * @param {string} tableName - Table name
 * @param {object|array} data - Data to insert
 */
export async function createTestData(tableName, data) {
  if (!supabase) {
    throw new Error('Database not connected')
  }

  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(Array.isArray(data) ? data : [data])
      .select()

    if (error) {
      throw error
    }

    return result
  } catch (error) {
    console.error(`Error creating test data in ${tableName}:`, error)
    throw error
  }
}

/**
 * Find test data in database
 * @param {string} tableName - Table name
 * @param {object} query - Query filter object
 */
export async function findTestData(tableName, query) {
  if (!supabase) {
    throw new Error('Database not connected')
  }

  try {
    let request = supabase.from(tableName).select('*')

    // Apply filters
    for (const [key, value] of Object.entries(query)) {
      request = request.eq(key, value)
    }

    const { data, error } = await request

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error(`Error finding test data in ${tableName}:`, error)
    throw error
  }
}

/**
 * Delete test data from database
 * @param {string} tableName - Table name
 * @param {object} query - Query filter object
 */
export async function deleteTestData(tableName, query) {
  if (!supabase) {
    throw new Error('Database not connected')
  }

  try {
    let request = supabase.from(tableName).delete()

    // Apply filters
    for (const [key, value] of Object.entries(query)) {
      request = request.eq(key, value)
    }

    const { error } = await request

    if (error) {
      throw error
    }
  } catch (error) {
    console.error(`Error deleting test data from ${tableName}:`, error)
    throw error
  }
}

/**
 * Global test setup
 */
export async function setupGlobalTests() {
  await connectTestDB()
  await cleanDatabase()
}

/**
 * Global test teardown
 */
export async function teardownGlobalTests() {
  await cleanDatabase()
  await disconnectTestDB()
}

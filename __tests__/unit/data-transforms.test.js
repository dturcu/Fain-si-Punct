/**
 * Unit tests for lib/supabase-queries.js
 *
 * The private transform functions (userRowToObj, orderRowToObj) are tested
 * indirectly by mocking @/lib/supabase and observing the shaped output
 * returned from the exported query helpers.
 *
 * NOTE: jest.mock() factories are hoisted to the top of the file by Babel/Jest,
 * so they cannot reference `const` variables declared in the module body
 * (temporal dead zone). We define the mock chain entirely inside the factory
 * and expose a shared state object that tests can mutate.
 */

// ─── Shared mock state ────────────────────────────────────────────────────────

// This object is mutated by resolveWith() in individual tests.
const mockState = { nextResult: { data: null, error: null } }

// ─── Supabase mock ────────────────────────────────────────────────────────────

jest.mock('@/lib/supabase', () => {
  // All Supabase builder methods are chainable. The terminal calls (single,
  // range) return the value stored in mockState.nextResult.
  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve(mockState.nextResult)),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn(() => Promise.resolve(mockState.nextResult)),
    delete: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
  }

  return { supabaseAdmin: chain }
})

// ─── Helper: set the next resolved value ─────────────────────────────────────

function resolveWith(data, error = null) {
  mockState.nextResult = { data, error }
}

// ─── Access the mock chain for call inspection ────────────────────────────────

import { supabaseAdmin } from '@/lib/supabase'

// ─── Imports (after mock) ─────────────────────────────────────────────────────

import {
  getUserById,
  getUserByEmail,
  getOrdersByUserId,
} from '@/lib/supabase-queries'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeUserRow(overrides = {}) {
  return {
    id: 'u-1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '0700000000',
    address_street: 'Str. Principala 1',
    address_city: 'Iasi',
    address_state: 'IS',
    address_zip: '700000',
    address_country: 'Romania',
    role: 'customer',
    is_active: true,
    email_pref_order_confirmation: true,
    email_pref_shipping_updates: true,
    email_pref_promotions: false,
    email_pref_newsletter: true,
    email_pref_updated_at: null,
    unsubscribe_token: 'tok-abc',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    ...overrides,
  }
}

function makeOrderRow(overrides = {}) {
  return {
    id: 'order-1',
    order_number: 'ORD-111',
    user_id: 'u-1',
    total: '150.00',
    status: 'pending',
    payment_method: 'stripe',
    payment_status: 'unpaid',
    customer_name: 'John Doe',
    customer_email: 'test@example.com',
    customer_phone: '0700000000',
    shipping_street: 'Str. 1',
    shipping_city: 'Iasi',
    shipping_state: 'IS',
    shipping_zip: '700000',
    shipping_country: 'Romania',
    payment_id: null,
    paid_at: null,
    tracking_number: null,
    tracking_url: null,
    last_email_sent_at: null,
    next_email_retry_at: null,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
    ...overrides,
  }
}

function makeOrderItemRow(overrides = {}) {
  return {
    product_id: 'prod-1',
    name: 'Test Product',
    price: '29.99',
    quantity: 2,
    image: 'https://example.com/img.jpg',
    ...overrides,
  }
}

// ─── getUserById ──────────────────────────────────────────────────────────────

describe('getUserById', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns a correctly shaped user object', async () => {
    resolveWith(makeUserRow())
    const user = await getUserById('u-1')

    expect(user).toMatchObject({
      id: 'u-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
    })
  })

  it('exposes both id and _id with the same value', async () => {
    resolveWith(makeUserRow({ id: 'u-99' }))
    const user = await getUserById('u-99')
    expect(user.id).toBe('u-99')
    expect(user._id).toBe('u-99')
  })

  it('maps address fields into a nested address object', async () => {
    resolveWith(makeUserRow())
    const user = await getUserById('u-1')
    expect(user.address).toEqual({
      street: 'Str. Principala 1',
      city: 'Iasi',
      state: 'IS',
      zip: '700000',
      country: 'Romania',
    })
  })

  it('maps email preferences into nested emailPreferences object', async () => {
    resolveWith(makeUserRow())
    const user = await getUserById('u-1')
    expect(user.emailPreferences).toMatchObject({
      orderConfirmation: true,
      shippingUpdates: true,
      promotions: false,
      newsletter: true,
    })
  })

  it('does not expose the password field', async () => {
    resolveWith(makeUserRow({ password: 'hashed_secret' }))
    const user = await getUserById('u-1')
    expect(user).not.toHaveProperty('password')
  })

  it('throws when Supabase returns a non-PGRST116 error', async () => {
    resolveWith(null, { code: 'PGRST500', message: 'DB error' })
    await expect(getUserById('u-bad')).rejects.toMatchObject({
      code: 'PGRST500',
    })
  })
})

// ─── getUserByEmail ───────────────────────────────────────────────────────────

describe('getUserByEmail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('converts the email to lowercase before querying', async () => {
    resolveWith(makeUserRow({ email: 'test@example.com' }))
    await getUserByEmail('TEST@EXAMPLE.COM')

    // Verify .eq('email', lowercased) was called
    const eqCalls = supabaseAdmin.eq.mock.calls
    const emailEqCall = eqCalls.find((c) => c[0] === 'email')
    expect(emailEqCall[1]).toBe('test@example.com')
  })

  it('returns null when the user is not found (PGRST116)', async () => {
    resolveWith(null, { code: 'PGRST116', message: 'Row not found' })
    const user = await getUserByEmail('nobody@nowhere.com')
    expect(user).toBeNull()
  })

  it('returns the user object when found', async () => {
    resolveWith(makeUserRow())
    const user = await getUserByEmail('test@example.com')
    expect(user).not.toBeNull()
    expect(user.email).toBe('test@example.com')
  })
})

// ─── getOrdersByUserId ────────────────────────────────────────────────────────

describe('getOrdersByUserId', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns an array', async () => {
    const orderRows = [{ ...makeOrderRow(), order_items: [makeOrderItemRow()] }]
    mockState.nextResult = { data: orderRows, error: null }

    const orders = await getOrdersByUserId('u-1')
    expect(Array.isArray(orders)).toBe(true)
  })

  it('returns an empty array when there are no orders', async () => {
    mockState.nextResult = { data: [], error: null }
    const orders = await getOrdersByUserId('u-1')
    expect(orders).toHaveLength(0)
  })

  it('each order has an items array', async () => {
    const orderRows = [{ ...makeOrderRow(), order_items: [makeOrderItemRow()] }]
    mockState.nextResult = { data: orderRows, error: null }

    const orders = await getOrdersByUserId('u-1')
    expect(Array.isArray(orders[0].items)).toBe(true)
  })

  it('maps order fields to camelCase', async () => {
    const orderRows = [
      { ...makeOrderRow({ order_number: 'ORD-999', total: '75.50' }), order_items: [] },
    ]
    mockState.nextResult = { data: orderRows, error: null }

    const orders = await getOrdersByUserId('u-1')
    const order = orders[0]

    expect(order.orderNumber).toBe('ORD-999')
    expect(order.total).toBe(75.5)
    expect(order.userId).toBe('u-1')
  })

  it('parses item prices as numbers', async () => {
    const orderRows = [
      {
        ...makeOrderRow(),
        order_items: [makeOrderItemRow({ price: '19.99', quantity: 3 })],
      },
    ]
    mockState.nextResult = { data: orderRows, error: null }

    const orders = await getOrdersByUserId('u-1')
    const item = orders[0].items[0]

    expect(typeof item.price).toBe('number')
    expect(item.price).toBe(19.99)
    expect(item.quantity).toBe(3)
  })

  it('throws when Supabase returns an error', async () => {
    mockState.nextResult = { data: null, error: { code: 'PGRST500', message: 'DB error' } }
    await expect(getOrdersByUserId('u-bad')).rejects.toMatchObject({
      code: 'PGRST500',
    })
  })
})

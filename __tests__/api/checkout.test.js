/**
 * API tests for app/api/checkout/route.js (POST handler)
 *
 * All external dependencies are mocked so no real I/O occurs.
 *
 * NOTE: jest.mock() factories are hoisted to the top of the file. Variables
 * declared with `const` after jest.mock() are in the temporal dead zone
 * inside the factory. We use `mockState` objects accessed via closure to
 * share state between the factory and the tests.
 */

// ─── Shared mock state ────────────────────────────────────────────────────────

const mockFns = {
  getCartByUserId: jest.fn(),
  clearCart: jest.fn(),
  getUserById: jest.fn(),
  createOrder: jest.fn(),
  getCookieToken: jest.fn(),
  verifyToken: jest.fn(),
  supabaseSingle: jest.fn(),
  addEmailJob: jest.fn(),
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/lib/supabase-queries', () => ({
  getCartByUserId: (...args) => mockFns.getCartByUserId(...args),
  clearCart: (...args) => mockFns.clearCart(...args),
  getUserById: (...args) => mockFns.getUserById(...args),
  createOrder: (...args) => mockFns.createOrder(...args),
}))

jest.mock('@/lib/auth', () => ({
  getCookieToken: (...args) => mockFns.getCookieToken(...args),
  verifyToken: (...args) => mockFns.verifyToken(...args),
}))

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    // single is routed through mockFns so tests can control per-call results
    single: (...args) => mockFns.supabaseSingle(...args),
  },
}))

jest.mock('@/lib/job-queue', () => ({
  addEmailJob: (...args) => mockFns.addEmailJob(...args),
}))

jest.mock('@/lib/templates/orderConfirmation', () => ({
  orderConfirmation: jest.fn().mockReturnValue('<html>order</html>'),
}))

// ─── Route import (after mocks) ───────────────────────────────────────────────

import { POST } from '@/app/api/checkout/route'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(body, headers = {}) {
  return {
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null
      },
    },
    json: jest.fn().mockResolvedValue(body),
  }
}

const validBody = {
  customer: {
    name: 'Ion Popescu',
    email: 'ion@example.com',
    phone: '0712345678',
  },
  shippingAddress: {
    street: 'Str. Unirii 10',
    city: 'Iasi',
    state: 'Iasi',
    zip: '700001',
    country: 'Romania',
  },
  paymentMethod: 'card',
}

const validCart = {
  id: 'cart-1',
  items: [
    { productId: 'prod-1', name: 'Widget', price: 50, quantity: 2, image: 'img.jpg' },
  ],
  total: 100,
}

const validOrder = {
  id: 'order-1',
  orderNumber: 'ORD-111',
  total: 115.99,
  items: validCart.items,
}

const validUser = {
  id: 'user-1',
  emailPreferences: { orderConfirmation: true },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Authenticated user
    mockFns.getCookieToken.mockReturnValue('valid-token')
    mockFns.verifyToken.mockReturnValue({ userId: 'user-1' })

    // Cart has one item
    mockFns.getCartByUserId.mockResolvedValue(validCart)

    // Stock check returns sufficient stock
    mockFns.supabaseSingle.mockResolvedValue({
      data: { stock: 10, name: 'Widget' },
      error: null,
    })

    // Order creation succeeds
    mockFns.createOrder.mockResolvedValue(validOrder)

    // User found, email queuing succeeds
    mockFns.getUserById.mockResolvedValue(validUser)
    mockFns.addEmailJob.mockResolvedValue({ id: 'job-1' })
    mockFns.clearCart.mockResolvedValue(undefined)
  })

  // ── Auth guards ────────────────────────────────────────────────────────────

  it('returns 400 (guest flow: missing guestItems) when no auth cookie', async () => {
    // The route supports guest checkout — no token → guest mode.
    // Without guestItems in the body the guest flow returns 400, not 401.
    mockFns.getCookieToken.mockReturnValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  it('returns 401 when a token is present but invalid', async () => {
    mockFns.getCookieToken.mockReturnValue('bad-token')
    mockFns.verifyToken.mockReturnValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
    expect((await res.json()).success).toBe(false)
  })

  // ── Field validation ───────────────────────────────────────────────────────

  it('returns 400 when customer name is missing', async () => {
    const res = await POST(makeRequest({
      ...validBody,
      customer: { ...validBody.customer, name: '' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  it('returns 400 when customer email is invalid', async () => {
    const res = await POST(makeRequest({
      ...validBody,
      customer: { ...validBody.customer, email: 'not-an-email' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  it('returns 400 when customer phone is missing', async () => {
    const res = await POST(makeRequest({
      ...validBody,
      customer: { ...validBody.customer, phone: '' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  it('returns 400 when a required address field is blank', async () => {
    const res = await POST(makeRequest({
      ...validBody,
      shippingAddress: { ...validBody.shippingAddress, city: '' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  it('returns 400 when payment method is invalid', async () => {
    const res = await POST(makeRequest({ ...validBody, paymentMethod: 'bitcoin' }))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  // ── Cart guards ────────────────────────────────────────────────────────────

  it('returns 400 when the cart is empty', async () => {
    mockFns.getCartByUserId.mockResolvedValue({ id: 'cart-1', items: [], total: 0 })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/cart/i)
  })

  it('returns 400 when a product is out of stock', async () => {
    mockFns.supabaseSingle.mockResolvedValue({
      data: { stock: 0, name: 'Widget' },
      error: null,
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  // ── Success ────────────────────────────────────────────────────────────────

  it('returns 201 with { success: true, data: order } on success', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it('calls createOrder with the correct userId', async () => {
    await POST(makeRequest(validBody))
    expect(mockFns.createOrder).toHaveBeenCalledWith(
      'user-1',
      expect.any(Array),
      expect.any(Number),
      expect.any(Object),
      expect.any(Object),
      expect.any(String),
      'card'
    )
  })

  it('clears the cart after a successful order', async () => {
    await POST(makeRequest(validBody))
    expect(mockFns.clearCart).toHaveBeenCalledWith('user-1')
  })

  it('accepts ramburs as a valid payment method', async () => {
    const res = await POST(makeRequest({ ...validBody, paymentMethod: 'ramburs' }))
    expect(res.status).toBe(201)
  })

  it('accepts revolut as a valid payment method', async () => {
    const res = await POST(makeRequest({ ...validBody, paymentMethod: 'revolut' }))
    expect(res.status).toBe(201)
  })
})

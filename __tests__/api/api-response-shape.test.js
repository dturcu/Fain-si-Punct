/**
 * API response shape consistency tests.
 *
 * Verifies that:
 *  - success responses include { success: true, data/user: ... }
 *  - error responses include { success: false, error: '...' }
 *  - correct HTTP status codes are returned for various error conditions
 *  - the /api/auth/me success response never leaks the password field
 *
 * NOTE: jest.mock() factories are hoisted. We use a shared `mockFns` object
 * to avoid the temporal dead zone issue with `const` declarations.
 */

// ─── Shared mock state ────────────────────────────────────────────────────────

const mockFns = {
  getCookieToken: jest.fn(),
  verifyToken: jest.fn(),
  supabaseSingle: jest.fn(),
  supabaseRange: jest.fn(),
  getCartByUserId: jest.fn(),
  addToCart: jest.fn(),
  getUserById: jest.fn(),
  updateUserById: jest.fn(),
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/lib/auth', () => ({
  getCookieToken: (...args) => mockFns.getCookieToken(...args),
  verifyToken: (...args) => mockFns.verifyToken(...args),
}))

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    range: (...args) => mockFns.supabaseRange(...args),
    single: (...args) => mockFns.supabaseSingle(...args),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  },
}))

jest.mock('@/lib/supabase-queries', () => ({
  getCartByUserId: (...args) => mockFns.getCartByUserId(...args),
  addToCart: (...args) => mockFns.addToCart(...args),
  getUserById: (...args) => mockFns.getUserById(...args),
  updateUserById: (...args) => mockFns.updateUserById(...args),
}))

// ─── Route imports (after mocks) ─────────────────────────────────────────────

import { GET as productsGET, POST as productsPOST } from '@/app/api/products/route'
import { GET as cartGET, POST as cartPOST } from '@/app/api/cart/route'
import { GET as meGET } from '@/app/api/auth/me/route'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(options = {}) {
  const { url = 'http://localhost/api/test', body, headers = {} } = options
  return {
    url,
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null
      },
    },
    json: jest.fn().mockResolvedValue(body ?? {}),
  }
}

function withAuth() {
  mockFns.getCookieToken.mockReturnValue('valid-token')
  mockFns.verifyToken.mockReturnValue({ userId: 'user-1' })
}

function withoutAuth() {
  mockFns.getCookieToken.mockReturnValue(null)
  mockFns.verifyToken.mockReturnValue(null)
}

// ─── GET /api/products ────────────────────────────────────────────────────────

describe('GET /api/products — response shape', () => {
  beforeEach(() => jest.clearAllMocks())

  it('success response has { success: true, data: [...], pagination: {...} }', async () => {
    mockFns.supabaseRange.mockResolvedValue({ data: [], count: 0, error: null })

    const res = await productsGET(makeRequest({ url: 'http://localhost/api/products' }))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toBeDefined()
  })

  it('error response has { success: false, error: string } with status 500', async () => {
    mockFns.supabaseRange.mockResolvedValue({
      data: null, count: 0, error: { message: 'DB down' },
    })

    const res = await productsGET(makeRequest({ url: 'http://localhost/api/products' }))
    const body = await res.json()

    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
    expect(res.status).toBe(500)
  })

  it('pagination includes total, page, limit and pages', async () => {
    mockFns.supabaseRange.mockResolvedValue({ data: [], count: 42, error: null })

    const res = await productsGET(
      makeRequest({ url: 'http://localhost/api/products?page=2&limit=10' })
    )
    const body = await res.json()

    expect(body.pagination).toMatchObject({
      total: 42,
      page: 2,
      limit: 10,
      pages: expect.any(Number),
    })
  })
})

// ─── POST /api/products ───────────────────────────────────────────────────────

describe('POST /api/products — response shape', () => {
  beforeEach(() => jest.clearAllMocks())

  it('success response has { success: true, data: {...} } with status 201', async () => {
    mockFns.supabaseSingle.mockResolvedValue({
      data: {
        id: 'p-1', name: 'Widget', price: '9.99', avg_rating: '4.5',
        review_count: 10, images: [], tags: [],
      },
      error: null,
    })
    const res = await productsPOST(makeRequest({ body: { name: 'Widget', price: 9.99 } }))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(res.status).toBe(201)
  })

  it('error response has { success: false, error: string } with status 400', async () => {
    mockFns.supabaseSingle.mockResolvedValue({
      data: null, error: { message: 'Duplicate slug' },
    })
    const res = await productsPOST(makeRequest({ body: { name: 'Widget' } }))
    const body = await res.json()

    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
    expect(res.status).toBe(400)
  })
})

// ─── GET /api/cart ────────────────────────────────────────────────────────────

describe('GET /api/cart — response shape', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 with { success: false } when unauthenticated', async () => {
    withoutAuth()
    const res = await cartGET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
  })

  it('success response has { success: true, data: {...} }', async () => {
    withAuth()
    mockFns.getCartByUserId.mockResolvedValue({ items: [], total: 0 })

    const res = await cartGET(makeRequest())
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it('returns 500 with { success: false } on unexpected error', async () => {
    withAuth()
    mockFns.getCartByUserId.mockRejectedValue(new Error('Unexpected DB failure'))

    const res = await cartGET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
  })
})

// ─── POST /api/cart ───────────────────────────────────────────────────────────

describe('POST /api/cart — response shape', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    withoutAuth()
    const res = await cartPOST(makeRequest({ body: { productId: 'p-1', quantity: 1 } }))

    expect(res.status).toBe(401)
    expect((await res.json()).success).toBe(false)
  })

  it('returns 404 when product is not found', async () => {
    withAuth()
    mockFns.supabaseSingle.mockResolvedValue({
      data: null, error: { message: 'Not found' },
    })

    const res = await cartPOST(makeRequest({ body: { productId: 'bad-id', quantity: 1 } }))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('success response has { success: true, data: {...} }', async () => {
    withAuth()
    mockFns.supabaseSingle.mockResolvedValue({
      data: { id: 'p-1', name: 'Widget', price: '9.99', image: 'img.jpg' },
      error: null,
    })
    mockFns.addToCart.mockResolvedValue({ id: 'cart-1', items: [], total: 9.99 })

    const res = await cartPOST(makeRequest({ body: { productId: 'p-1', quantity: 1 } }))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me — response shape', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    withoutAuth()
    const res = await meGET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
  })

  it('returns 401 when token is invalid', async () => {
    mockFns.getCookieToken.mockReturnValue('bad-token')
    mockFns.verifyToken.mockReturnValue(null)

    const res = await meGET(makeRequest())

    expect(res.status).toBe(401)
    expect((await res.json()).success).toBe(false)
  })

  it('returns 404 when user is not found', async () => {
    withAuth()
    mockFns.getUserById.mockResolvedValue(null)

    const res = await meGET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
  })

  it('success response has { success: true, user: {...} }', async () => {
    withAuth()
    mockFns.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@shop.ro',
      firstName: 'Ion',
      lastName: 'Pop',
      role: 'customer',
    })

    const res = await meGET(makeRequest())
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.user).toBeDefined()
    expect(body.user.email).toBe('user@shop.ro')
  })

  it('success response does not expose a password field', async () => {
    withAuth()
    mockFns.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@shop.ro',
      firstName: 'Ion',
      lastName: 'Pop',
      role: 'customer',
    })

    const res = await meGET(makeRequest())
    const body = await res.json()

    expect(body.user).not.toHaveProperty('password')
  })

  it('returns 500 with { success: false } on unexpected error', async () => {
    withAuth()
    mockFns.getUserById.mockRejectedValue(new Error('DB exploded'))

    const res = await meGET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
  })
})

// Jest setup file
// Add custom matchers, global configuration, etc.

// Suppress console logs during tests (optional)
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    // Allow specific error logs through
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Supabase connection error') ||
        args[0].includes('Upstash Redis connection error'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    // Allow specific warnings through
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Mock environment variables for tests
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
process.env.JWT_SECRET = 'test-secret-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-project.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
process.env.SMTP_HOST = 'smtp.test.com'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test@test.com'
process.env.SMTP_PASS = 'test-pass'
process.env.SENDER_EMAIL = 'noreply@test.com'
process.env.SENDER_NAME = 'Test Shop'
process.env.EMAIL_MAX_RETRIES = '4'

// Extend Jest matchers if needed
expect.extend({
  toBeValidUUID(received) {
    const isValid =
      typeof received === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(received)
    return {
      pass: isValid,
      message: () =>
        `expected ${received} to be a valid UUID`,
    }
  },

  toBeValidEmail(received) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received)
    return {
      pass: isValid,
      message: () => `expected ${received} to be a valid email address`,
    }
  },
})

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
      (args[0].includes('Not connected to MongoDB') ||
        args[0].includes('Redis connection error'))
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
process.env.MONGODB_URI = 'mongodb://localhost:27017/ecommerce-test'
process.env.SMTP_HOST = 'smtp.test.com'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test@test.com'
process.env.SMTP_PASS = 'test-pass'
process.env.SENDER_EMAIL = 'noreply@test.com'
process.env.SENDER_NAME = 'Test Shop'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.EMAIL_MAX_RETRIES = '4'

// Extend Jest matchers if needed
expect.extend({
  toBeValidMongoId(received) {
    const isValid =
      typeof received === 'string' && /^[0-9a-fA-F]{24}$/.test(received)
    return {
      pass: isValid,
      message: () =>
        `expected ${received} to be a valid MongoDB ObjectId`,
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

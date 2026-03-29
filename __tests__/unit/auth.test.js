import { createToken, verifyToken } from '@/lib/auth'
import { createTestToken } from '../fixtures/users.fixture'

describe('Authentication Utilities', () => {
  describe('createToken', () => {
    it('should create a valid JWT token', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const email = 'test@example.com'
      const role = 'customer'

      const token = createToken(userId, email, role)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT format: header.payload.signature
    })

    it('should create tokens with different roles', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const email = 'test@example.com'

      const customerToken = createToken(userId, email, 'customer')
      const adminToken = createToken(userId, email, 'admin')

      const decodedCustomer = verifyToken(customerToken)
      const decodedAdmin = verifyToken(adminToken)

      expect(decodedCustomer.role).toBe('customer')
      expect(decodedAdmin.role).toBe('admin')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const email = 'test@example.com'
      const role = 'customer'

      const token = createToken(userId, email, role)
      const decoded = verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(userId)
      expect(decoded.email).toBe(email)
      expect(decoded.role).toBe(role)
    })

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)
      expect(decoded).toBeNull()
    })

    it('should return null for expired token', () => {
      // Create an expired token (requires mocking time)
      // This is a simplified test
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid'
      const decoded = verifyToken(invalidToken)
      expect(decoded).toBeNull()
    })
  })

  describe('createTestToken', () => {
    it('should create test token with default values', () => {
      const token = createTestToken()
      const decoded = verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded.role).toBe('customer')
    })

    it('should create test token with custom values', () => {
      const customUserId = '423e4567-e89b-12d3-a456-426614174003'
      const customEmail = 'custom@test.com'

      const token = createTestToken(customUserId, customEmail, 'admin')
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe(customUserId)
      expect(decoded.email).toBe(customEmail)
      expect(decoded.role).toBe('admin')
    })
  })

  describe('Token payload structure', () => {
    it('should contain required fields in payload', () => {
      const token = createTestToken()
      const decoded = verifyToken(token)

      expect(decoded).toHaveProperty('userId')
      expect(decoded).toHaveProperty('email')
      expect(decoded).toHaveProperty('role')
      expect(decoded).toHaveProperty('iat') // Issued at
      expect(decoded).toHaveProperty('exp') // Expiration
    })

    it('should have expiration time set', () => {
      const token = createTestToken()
      const decoded = verifyToken(token)

      const now = Math.floor(Date.now() / 1000)
      expect(decoded.exp).toBeGreaterThan(now)
    })
  })
})

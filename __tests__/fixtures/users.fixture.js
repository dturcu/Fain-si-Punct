import { createToken } from '@/lib/auth'
import bcryptjs from 'bcryptjs'

/**
 * Test user fixtures
 */
export const testUsers = {
  customer: {
    _id: '507f1f77bcf86cd799439011',
    email: 'customer@test.com',
    password: 'hashed_password_123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-0123',
    role: 'customer',
    isActive: true,
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    emailPreferences: {
      orderConfirmation: true,
      shippingUpdates: true,
      promotions: false,
      newsletter: true,
    },
  },

  admin: {
    _id: '507f1f77bcf86cd799439012',
    email: 'admin@test.com',
    password: 'hashed_password_admin_123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
  },

  unsubscribed: {
    _id: '507f1f77bcf86cd799439013',
    email: 'unsubscribed@test.com',
    password: 'hashed_password_456',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'customer',
    emailPreferences: {
      orderConfirmation: false,
      shippingUpdates: false,
      promotions: false,
      newsletter: false,
    },
  },
}

/**
 * Create a test token for a user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
export function createTestToken(
  userId = testUsers.customer._id,
  email = testUsers.customer.email,
  role = 'customer'
) {
  return createToken(userId, email, role)
}

/**
 * Hash a password for testing
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return await bcryptjs.hash(password, 10)
}

/**
 * Create user data for signup tests
 */
export const newUserData = {
  email: 'newuser@test.com',
  password: 'securepassword123',
  firstName: 'New',
  lastName: 'User',
  phone: '555-0199',
}

import { createToken } from '@/lib/auth'
import bcryptjs from 'bcryptjs'

/**
 * Test user fixtures (using UUIDs for Supabase)
 */
export const testUsers = {
  customer: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'customer@test.com',
    password: 'hashed_password_123',
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-0123',
    role: 'customer',
    is_active: true,
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    email_preferences: {
      order_confirmation: true,
      shipping_updates: true,
      promotions: false,
      newsletter: true,
    },
  },

  admin: {
    id: '223e4567-e89b-12d3-a456-426614174001',
    email: 'admin@test.com',
    password: 'hashed_password_admin_123',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
  },

  unsubscribed: {
    id: '323e4567-e89b-12d3-a456-426614174002',
    email: 'unsubscribed@test.com',
    password: 'hashed_password_456',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'customer',
    email_preferences: {
      order_confirmation: false,
      shipping_updates: false,
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
  userId = testUsers.customer.id,
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

// Shipping
export const SHIPPING_THRESHOLD = 200  // free shipping above this (lei)
export const SHIPPING_COST = 15.99     // flat shipping cost (lei)

// Order
export const VALID_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
export const VALID_PAYMENT_METHODS = ['card', 'revolut', 'paypal', 'ramburs']

// Cart
export const MAX_QUANTITY_PER_ITEM = 10

// Currency
export const CURRENCY = 'RON'
export const CURRENCY_STRIPE = 'ron'  // Stripe uses lowercase ISO 4217

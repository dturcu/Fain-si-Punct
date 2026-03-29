/**
 * Test product fixtures (using UUIDs for Supabase)
 */
export const testProducts = {
  laptop: {
    id: '123e4567-e89b-12d3-a456-426614175000',
    name: 'Professional Laptop',
    slug: 'professional-laptop',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    category: 'Electronics',
    stock: 50,
    avg_rating: 4.5,
    review_count: 120,
    rating_distribution: {
      5: 70,
      4: 35,
      3: 10,
      2: 3,
      1: 2,
    },
    image: 'https://example.com/laptop.jpg',
    sku: 'LAPTOP-001',
    tags: ['electronics', 'computers', 'laptops'],
  },

  phone: {
    id: '223e4567-e89b-12d3-a456-426614175001',
    name: 'Smartphone Pro',
    slug: 'smartphone-pro',
    description: 'Latest smartphone with advanced features',
    price: 899.99,
    category: 'Electronics',
    stock: 100,
    avg_rating: 4.8,
    review_count: 250,
    rating_distribution: {
      5: 200,
      4: 40,
      3: 8,
      2: 1,
      1: 1,
    },
    image: 'https://example.com/phone.jpg',
    sku: 'PHONE-001',
    tags: ['electronics', 'phones', 'mobile'],
  },

  outOfStock: {
    id: '323e4567-e89b-12d3-a456-426614175002',
    name: 'Limited Edition Headphones',
    slug: 'limited-edition-headphones',
    description: 'Exclusive limited edition headphones',
    price: 299.99,
    category: 'Electronics',
    stock: 0,
    avg_rating: 0,
    review_count: 0,
    rating_distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
    image: 'https://example.com/headphones.jpg',
    sku: 'HEADPHONES-001',
    tags: ['electronics', 'audio'],
  },

  cheap: {
    id: '423e4567-e89b-12d3-a456-426614175003',
    name: 'USB Cable',
    slug: 'usb-cable',
    description: 'Standard USB-C charging cable',
    price: 9.99,
    category: 'Accessories',
    stock: 500,
    avg_rating: 3.5,
    review_count: 45,
    rating_distribution: {
      5: 25,
      4: 15,
      3: 4,
      2: 1,
      1: 0,
    },
    image: 'https://example.com/usb-cable.jpg',
    sku: 'USB-CABLE-001',
    tags: ['accessories', 'cables'],
  },
}

/**
 * New product data for create tests
 */
export const newProductData = {
  name: 'New Product',
  slug: 'new-product',
  description: 'A brand new test product',
  price: 199.99,
  category: 'Test',
  stock: 75,
  image: 'https://example.com/new-product.jpg',
  sku: 'NEW-PRODUCT-001',
  tags: ['test', 'new'],
}

/**
 * Updated product data for edit tests
 */
export const updatedProductData = {
  name: 'Updated Product Name',
  price: 249.99,
  stock: 50,
  description: 'Updated product description',
}

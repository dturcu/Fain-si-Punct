/**
 * Test product fixtures
 */
export const testProducts = {
  laptop: {
    _id: '607f1f77bcf86cd799439021',
    name: 'Professional Laptop',
    slug: 'professional-laptop',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    category: 'Electronics',
    stock: 50,
    avgRating: 4.5,
    reviewCount: 120,
    ratingDistribution: {
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
    _id: '607f1f77bcf86cd799439022',
    name: 'Smartphone Pro',
    slug: 'smartphone-pro',
    description: 'Latest smartphone with advanced features',
    price: 899.99,
    category: 'Electronics',
    stock: 100,
    avgRating: 4.8,
    reviewCount: 250,
    ratingDistribution: {
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
    _id: '607f1f77bcf86cd799439023',
    name: 'Limited Edition Headphones',
    slug: 'limited-edition-headphones',
    description: 'Exclusive limited edition headphones',
    price: 299.99,
    category: 'Electronics',
    stock: 0,
    avgRating: 0,
    reviewCount: 0,
    ratingDistribution: {
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
    _id: '607f1f77bcf86cd799439024',
    name: 'USB Cable',
    slug: 'usb-cable',
    description: 'Standard USB-C charging cable',
    price: 9.99,
    category: 'Accessories',
    stock: 500,
    avgRating: 3.5,
    reviewCount: 45,
    ratingDistribution: {
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

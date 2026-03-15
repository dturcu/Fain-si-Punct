import mongoose from 'mongoose'
import Product from '../models/Product.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce'

const categories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Toys',
  'Beauty',
  'Health',
  'Automotive',
  'Tools',
]

const adjectives = [
  'Premium', 'Deluxe', 'Professional', 'Ultra', 'Advanced',
  'Classic', 'Modern', 'Vintage', 'Eco-Friendly', 'Smart',
]

const nouns = [
  'Widget', 'Device', 'Tool', 'System', 'Solution',
  'Pro', 'Max', 'Ultra', 'Elite', 'Master',
]

function generateProducts(count) {
  const products = []

  for (let i = 1; i <= count; i++) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const category = categories[Math.floor(Math.random() * categories.length)]

    products.push({
      name: `${adjective} ${noun} ${i}`,
      slug: `${adjective.toLowerCase()}-${noun.toLowerCase()}-${i}`,
      description: `High-quality ${category.toLowerCase()} product with excellent features and durability.`,
      price: Math.floor(Math.random() * 1000) + 10,
      category,
      stock: Math.floor(Math.random() * 500),
      rating: Math.floor(Math.random() * 5 * 10) / 10,
      reviews: Math.floor(Math.random() * 1000),
      image: `https://via.placeholder.com/300x200?text=${i}`,
      sku: `SKU-${String(i).padStart(6, '0')}`,
      tags: [category, adjective, noun],
    })
  }

  return products
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing products
    await Product.deleteMany({})
    console.log('Cleared existing products')

    // Generate and insert 15k products in batches
    const batchSize = 1000
    const totalProducts = 15000

    for (let i = 0; i < totalProducts; i += batchSize) {
      const batch = generateProducts(Math.min(batchSize, totalProducts - i))
      await Product.insertMany(batch)
      console.log(`Inserted ${Math.min(i + batchSize, totalProducts)} products`)
    }

    console.log('✅ Seeding completed successfully!')
    console.log(`Created ${totalProducts} products`)

    // Show some stats
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ])

    console.log('\nProducts by category:')
    categoryStats.forEach((stat) => {
      console.log(
        `  ${stat._id}: ${stat.count} products (avg: $${stat.avgPrice.toFixed(2)})`
      )
    })

    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seed()

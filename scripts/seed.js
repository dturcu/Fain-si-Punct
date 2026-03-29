import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    console.log('Connecting to Supabase...')

    // Test connection
    const { error: connError } = await supabase.from('products').select('id').limit(1)
    if (connError) {
      console.error('Supabase connection error:', connError)
      process.exit(1)
    }
    console.log('✅ Connected to Supabase')

    // Clear existing products
    console.log('Clearing existing products...')
    const { error: deleteError } = await supabase.from('products').delete().neq('id', null)
    if (deleteError) {
      console.error('Error clearing products:', deleteError)
      process.exit(1)
    }
    console.log('✅ Cleared existing products')

    // Generate and insert 15k products in batches
    const batchSize = 1000
    const totalProducts = 15000

    for (let i = 0; i < totalProducts; i += batchSize) {
      const batch = generateProducts(Math.min(batchSize, totalProducts - i))
      const { error: insertError } = await supabase
        .from('products')
        .insert(batch)

      if (insertError) {
        console.error(`Error inserting batch at ${i}:`, insertError)
        process.exit(1)
      }

      console.log(`✅ Inserted ${Math.min(i + batchSize, totalProducts)} products`)
    }

    console.log('✅ Seeding completed successfully!')
    console.log(`Created ${totalProducts} products`)

    // Show category stats
    const { data: categoryStats, error: statsError } = await supabase
      .from('products')
      .select('category')

    if (!statsError && categoryStats) {
      const stats = {}
      let totalPrice = 0
      let totalCount = 0

      categoryStats.forEach((product) => {
        if (!stats[product.category]) {
          stats[product.category] = { count: 0, totalPrice: 0 }
        }
        stats[product.category].count += 1
      })

      // Get price stats per category
      const { data: priceData } = await supabase
        .from('products')
        .select('category, price')

      if (priceData) {
        const priceStats = {}
        priceData.forEach((product) => {
          if (!priceStats[product.category]) {
            priceStats[product.category] = { sum: 0, count: 0 }
          }
          priceStats[product.category].sum += product.price
          priceStats[product.category].count += 1
        })

        console.log('\nProducts by category:')
        Object.entries(stats)
          .sort(([, a], [, b]) => b.count - a.count)
          .forEach(([category, { count }]) => {
            const avgPrice = (priceStats[category].sum / priceStats[category].count).toFixed(2)
            console.log(`  ${category}: ${count} products (avg: $${avgPrice})`)
          })
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seed()

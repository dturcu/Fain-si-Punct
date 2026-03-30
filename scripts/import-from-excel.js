import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Parse Excel file and import products
 * Expected columns:
 * - Source.Name
 * - Product SKU
 * - Manifest SKU
 * - Product Title
 * - Product Description
 * - ASIN
 * - EAN
 * - Barcode
 * - Brand
 * - Category Name
 * - Sub Category Name
 * - Image 1, Image 2, Image 3, Image 4, Image 5, Image 6
 * - Quantity
 * - Condition
 * - Grade
 * - Unit Weight (kg)
 * - Currency
 * - Unit RRP
 * - Total RRP
 */
async function importFromExcel(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`)
      process.exit(1)
    }

    console.log(`📁 Reading Excel file: ${filePath}`)

    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet)

    console.log(`📊 Found ${rows.length} products in Excel`)

    if (rows.length === 0) {
      console.error('❌ No data found in Excel file')
      process.exit(1)
    }

    // Test Supabase connection
    console.log('🔗 Connecting to Supabase...')
    const { error: connError } = await supabase.from('products').select('id').limit(1)
    if (connError) {
      console.error('❌ Supabase connection error:', connError)
      process.exit(1)
    }
    console.log('✅ Connected to Supabase')

    // Clear existing products
    console.log('🗑️  Clearing existing products...')
    const { error: deleteError } = await supabase.from('products').delete().gte('created_at', '1970-01-01')
    if (deleteError) {
      console.error('❌ Error clearing products:', deleteError)
      process.exit(1)
    }
    console.log('✅ Cleared existing products')

    // Transform Excel rows to product documents
    const products = rows.map((row, index) => {
      try {
        // Get all image URLs
        const images = [
          row['Image 1'],
          row['Image 2'],
          row['Image 3'],
          row['Image 4'],
          row['Image 5'],
          row['Image 6'],
        ].filter((img) => img && img.trim())

        // Create slug from product title
        const slug = (row['Product Title'] || `product-${index}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        // Parse price - strip currency prefix (e.g., "lei12.9" → 12.9)
        const parsePrice = (val) => {
          if (!val) return 0
          const num = parseFloat(String(val).replace(/[^0-9.]/g, ''))
          return isNaN(num) ? 0 : num
        }
        const price = parsePrice(row['Unit RRP']) || parsePrice(row['Total RRP']) || 0

        // Parse quantity
        const stock = parseInt(row['Quantity']) || 0

        // Build category path
        const category = row['Category Name'] || 'Uncategorized'
        const subCategory = row['Sub Category Name'] ? `${category} > ${row['Sub Category Name']}` : category

        const product = {
          name: row['Product Title'] || 'Unknown Product',
          slug,
          description: row['Product Description'] || 'No description available',
          price: Math.max(0, price),
          category,
          stock: Math.max(0, stock),
          image: images[0] || null,
          images: images,
          sku: row['Product SKU'] || row['Manifest SKU'] || `SKU-${index}`,
          manifest_sku: row['Manifest SKU'],
          source_name: row['Source.Name'],
          asin: row['ASIN'],
          ean: row['EAN'],
          barcode: row['Barcode'],
          brand: row['Brand'] || 'Unknown Brand',
          sub_category: subCategory,
          condition: row['Condition'] || 'New',
          grade: row['Grade'],
          weight: parseFloat(row['Unit Weight (kg)']) || null,
          currency: row['Currency'] || 'USD',
          total_rrp: parsePrice(row['Total RRP']) || 0,
          tags: buildTags(row),
          // Initialize rating fields with defaults
          avg_rating: 0,
          review_count: 0,
          rating_distribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        }

        return product
      } catch (error) {
        console.warn(`⚠️  Error processing row ${index + 1}:`, error.message)
        return null
      }
    }).filter(p => p !== null) // Remove failed rows

    // Deduplicate by slug and sku
    const seenSlugs = new Set()
    const seenSkus = new Set()
    const deduped = []
    for (const p of products) {
      let slug = p.slug
      while (seenSlugs.has(slug)) {
        slug = slug + '-' + Math.random().toString(36).slice(2, 6)
      }
      p.slug = slug
      seenSlugs.add(slug)

      let sku = p.sku
      while (seenSkus.has(sku)) {
        sku = sku + '-' + Math.random().toString(36).slice(2, 6)
      }
      p.sku = sku
      seenSkus.add(sku)

      deduped.push(p)
    }
    const products_final = deduped

    console.log(`✅ Processed ${products_final.length} valid products (deduplicated)`)

    // Insert products in batches
    const batchSize = 1000
    let inserted = 0

    for (let i = 0; i < products_final.length; i += batchSize) {
      const batch = products_final.slice(i, i + batchSize)

      try {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert(batch)
          .select()

        if (insertError) {
          console.error(`❌ Error inserting batch at ${i}:`, insertError)
          // Try individual inserts as fallback
          for (const product of batch) {
            try {
              const { error: singleError } = await supabase
                .from('products')
                .insert([product])

              if (!singleError) {
                inserted++
              }
            } catch (err) {
              console.error(`Error inserting product ${product.sku}:`, err.message)
            }
          }
        } else {
          inserted += batch.length
        }

        console.log(`📦 Inserted ${inserted}/${products_final.length} products`)
      } catch (error) {
        console.error(`❌ Error inserting batch:`, error.message)
      }
    }

    console.log(`\n✅ Import completed successfully!`)
    console.log(`📊 Total products imported: ${inserted}`)

    // Show statistics - category stats
    const { data: categoryData, error: catError } = await supabase
      .from('products')
      .select('category, price, stock')

    if (!catError && categoryData) {
      const categoryStats = {}
      categoryData.forEach((product) => {
        if (!categoryStats[product.category]) {
          categoryStats[product.category] = { count: 0, totalPrice: 0, totalStock: 0 }
        }
        categoryStats[product.category].count += 1
        categoryStats[product.category].totalPrice += product.price || 0
        categoryStats[product.category].totalStock += product.stock || 0
      })

      console.log('\n📈 Products by category:')
      Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .forEach(([category, stats]) => {
          const avgPrice = (stats.totalPrice / stats.count).toFixed(2)
          const avgStock = (stats.totalStock / stats.count).toFixed(0)
          console.log(`  ${category}: ${stats.count} products | Avg Price: $${avgPrice} | Avg Stock: ${avgStock}`)
        })
    }

    // Show top brands
    const { data: brandData, error: brandError } = await supabase
      .from('products')
      .select('brand')

    if (!brandError && brandData) {
      const brandStats = {}
      brandData.forEach((product) => {
        const brand = product.brand || 'Unknown'
        brandStats[brand] = (brandStats[brand] || 0) + 1
      })

      const topBrands = Object.entries(brandStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)

      console.log('\n🏢 Top 10 brands:')
      topBrands.forEach(([brand, count]) => {
        console.log(`  ${brand}: ${count} products`)
      })
    }

    // Overall statistics
    if (categoryData) {
      const totalProducts = categoryData.length
      const totalStock = categoryData.reduce((sum, p) => sum + (p.stock || 0), 0)
      const prices = categoryData.map(p => p.price || 0).filter(p => p > 0)
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

      console.log('\n📊 Overall statistics:')
      console.log(`  Total Products: ${totalProducts}`)
      console.log(`  Total Stock: ${totalStock}`)
      console.log(`  Avg Price: $${avgPrice.toFixed(2)}`)
      console.log(`  Price Range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Import error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

/**
 * Build tags from product data
 */
function buildTags(row) {
  const tags = new Set()

  if (row['Category Name']) tags.add(row['Category Name'])
  if (row['Sub Category Name']) tags.add(row['Sub Category Name'])
  if (row['Brand']) tags.add(row['Brand'])
  if (row['Condition']) tags.add(row['Condition'])
  if (row['Source.Name']) tags.add(row['Source.Name'])

  // Add price-based tags
  const parseP = (v) => { if (!v) return 0; const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
  const price = parseP(row['Unit RRP']) || parseP(row['Total RRP']) || 0
  if (price > 0 && price < 50) tags.add('budget-friendly')
  if (price >= 50 && price < 200) tags.add('mid-range')
  if (price >= 200) tags.add('premium')

  return Array.from(tags)
}

// Get file path from command line arguments
const filePath = process.argv[2] || './products.xlsx'

console.log(`🚀 Starting Excel import...`)
console.log(`📁 File path: ${path.resolve(filePath)}`)
console.log('---')

importFromExcel(filePath)

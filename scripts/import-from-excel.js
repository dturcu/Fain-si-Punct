import mongoose from 'mongoose'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import Product from '../models/Product.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce'

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

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing products
    const deleteResult = await Product.deleteMany({})
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing products`)

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

        // Parse price
        const price = parseFloat(row['Unit RRP']) || parseFloat(row['Total RRP']) || 0

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
          manifestSku: row['Manifest SKU'],
          sourceName: row['Source.Name'],
          asin: row['ASIN'],
          ean: row['EAN'],
          barcode: row['Barcode'],
          brand: row['Brand'] || 'Unknown Brand',
          subCategory,
          condition: row['Condition'] || 'New',
          grade: row['Grade'],
          weight: parseFloat(row['Unit Weight (kg)']) || null,
          currency: row['Currency'] || 'USD',
          totalRrp: parseFloat(row['Total RRP']) || 0,
          tags: buildTags(row),
          // Initialize these with defaults
          avgRating: 0,
          reviewCount: 0,
          ratingDistribution: {
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

    console.log(`✅ Processed ${products.length} valid products`)

    // Insert products in batches
    const batchSize = 1000
    let inserted = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)

      try {
        const result = await Product.insertMany(batch, { ordered: false })
        inserted += result.length
        console.log(`📦 Inserted ${inserted}/${products.length} products`)
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - try inserting one by one
          console.warn(`⚠️  Some duplicates found in batch, attempting individual inserts...`)
          for (const product of batch) {
            try {
              await Product.create(product)
              inserted++
            } catch (err) {
              if (err.code !== 11000) {
                console.error(`Error inserting product ${product.sku}:`, err.message)
              }
            }
          }
        } else {
          console.error(`Error inserting batch:`, error.message)
        }
      }
    }

    console.log(`\n✅ Import completed successfully!`)
    console.log(`📊 Total products imported: ${inserted}`)

    // Show statistics
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgStock: { $avg: '$stock' },
        },
      },
      { $sort: { count: -1 } },
    ])

    console.log('\n📈 Products by category:')
    stats.forEach((stat) => {
      console.log(
        `  ${stat._id}: ${stat.count} products | Avg Price: $${stat.avgPrice.toFixed(2)} | Avg Stock: ${stat.avgStock.toFixed(0)}`
      )
    })

    // Show brands
    const brands = await Product.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    console.log('\n🏢 Top 10 brands:')
    brands.forEach((brand) => {
      console.log(`  ${brand._id}: ${brand.count} products`)
    })

    // Overall statistics
    const totalStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ])

    if (totalStats.length > 0) {
      const stats = totalStats[0]
      console.log('\n📊 Overall statistics:')
      console.log(`  Total Products: ${stats.totalProducts}`)
      console.log(`  Total Stock: ${stats.totalStock}`)
      console.log(`  Avg Price: $${stats.avgPrice.toFixed(2)}`)
      console.log(`  Price Range: $${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toFixed(2)}`)
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
  const price = parseFloat(row['Unit RRP']) || parseFloat(row['Total RRP']) || 0
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

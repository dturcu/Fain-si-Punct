import XLSX from 'xlsx'
import path from 'path'

/**
 * Create a sample Excel file for testing the import functionality
 */
function createSampleExcel() {
  const sampleData = [
    {
      'Source.Name': 'Amazon',
      'Product SKU': 'SKU-001',
      'Manifest SKU': 'MAN-001',
      'Product Title': 'Premium Wireless Headphones Pro',
      'Product Description': 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
      'ASIN': 'B08ABC12345',
      'EAN': '5901234567890',
      'Barcode': '123456789012',
      'Brand': 'AudioTech',
      'Category Name': 'Electronics',
      'Sub Category Name': 'Audio Equipment',
      'Image 1': 'https://via.placeholder.com/300x200?text=Headphones1',
      'Image 2': 'https://via.placeholder.com/300x200?text=Headphones2',
      'Image 3': 'https://via.placeholder.com/300x200?text=Headphones3',
      'Quantity': 150,
      'Condition': 'New',
      'Grade': 'A',
      'Unit Weight (kg)': 0.35,
      'Currency': 'USD',
      'Unit RRP': 249.99,
      'Total RRP': 249.99,
    },
    {
      'Source.Name': 'Alibaba',
      'Product SKU': 'SKU-002',
      'Manifest SKU': 'MAN-002',
      'Product Title': 'Smart Home LED Bulb 16M Colors',
      'Product Description': 'WiFi-enabled LED bulb with 16 million color options, voice control compatible.',
      'ASIN': 'B08DEF67890',
      'EAN': '5901234567891',
      'Barcode': '123456789013',
      'Brand': 'SmartHome',
      'Category Name': 'Home & Garden',
      'Sub Category Name': 'Lighting',
      'Image 1': 'https://via.placeholder.com/300x200?text=Bulb1',
      'Image 2': 'https://via.placeholder.com/300x200?text=Bulb2',
      'Quantity': 500,
      'Condition': 'New',
      'Grade': 'A',
      'Unit Weight (kg)': 0.1,
      'Currency': 'USD',
      'Unit RRP': 19.99,
      'Total RRP': 19.99,
    },
    {
      'Source.Name': 'eBay',
      'Product SKU': 'SKU-003',
      'Manifest SKU': 'MAN-003',
      'Product Title': 'Running Shoes Lightweight Comfort',
      'Product Description': 'Professional running shoes with advanced cushioning technology and breathable mesh.',
      'ASIN': 'B08GHI23456',
      'EAN': '5901234567892',
      'Barcode': '123456789014',
      'Brand': 'SportGear',
      'Category Name': 'Clothing',
      'Sub Category Name': 'Footwear',
      'Image 1': 'https://via.placeholder.com/300x200?text=Shoes1',
      'Image 2': 'https://via.placeholder.com/300x200?text=Shoes2',
      'Image 3': 'https://via.placeholder.com/300x200?text=Shoes3',
      'Quantity': 250,
      'Condition': 'New',
      'Grade': 'A',
      'Unit Weight (kg)': 0.45,
      'Currency': 'USD',
      'Unit RRP': 89.99,
      'Total RRP': 89.99,
    },
    {
      'Source.Name': 'Amazon',
      'Product SKU': 'SKU-004',
      'Manifest SKU': 'MAN-004',
      'Product Title': 'Stainless Steel Kitchen Knife Set',
      'Product Description': '5-piece professional kitchen knife set with precision cutting edges.',
      'ASIN': 'B08JKL34567',
      'EAN': '5901234567893',
      'Barcode': '123456789015',
      'Brand': 'ChefPro',
      'Category Name': 'Home & Garden',
      'Sub Category Name': 'Kitchen',
      'Image 1': 'https://via.placeholder.com/300x200?text=Knives1',
      'Quantity': 75,
      'Condition': 'New',
      'Grade': 'A',
      'Unit Weight (kg)': 2.5,
      'Currency': 'USD',
      'Unit RRP': 129.99,
      'Total RRP': 129.99,
    },
    {
      'Source.Name': 'Alibaba',
      'Product SKU': 'SKU-005',
      'Manifest SKU': 'MAN-005',
      'Product Title': 'Portable Power Bank 20000mAh',
      'Product Description': 'Fast charging power bank with dual USB ports and LED display.',
      'ASIN': 'B08MNO45678',
      'EAN': '5901234567894',
      'Barcode': '123456789016',
      'Brand': 'PowerMax',
      'Category Name': 'Electronics',
      'Sub Category Name': 'Accessories',
      'Image 1': 'https://via.placeholder.com/300x200?text=PowerBank1',
      'Image 2': 'https://via.placeholder.com/300x200?text=PowerBank2',
      'Quantity': 300,
      'Condition': 'New',
      'Grade': 'A',
      'Unit Weight (kg)': 0.38,
      'Currency': 'USD',
      'Unit RRP': 34.99,
      'Total RRP': 34.99,
    },
  ]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(sampleData)

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Source.Name
    { wch: 15 }, // Product SKU
    { wch: 15 }, // Manifest SKU
    { wch: 35 }, // Product Title
    { wch: 50 }, // Product Description
    { wch: 15 }, // ASIN
    { wch: 15 }, // EAN
    { wch: 15 }, // Barcode
    { wch: 15 }, // Brand
    { wch: 20 }, // Category Name
    { wch: 20 }, // Sub Category Name
    { wch: 30 }, // Image 1
    { wch: 30 }, // Image 2
    { wch: 30 }, // Image 3
    { wch: 12 }, // Quantity
    { wch: 15 }, // Condition
    { wch: 8 },  // Grade
    { wch: 18 }, // Unit Weight (kg)
    { wch: 12 }, // Currency
    { wch: 12 }, // Unit RRP
    { wch: 12 }, // Total RRP
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  const filePath = path.join(process.cwd(), 'sample-products.xlsx')
  XLSX.writeFile(wb, filePath)

  console.log(`✅ Sample Excel file created: ${filePath}`)
  console.log(`📊 Contains 5 sample products`)
  console.log('\nYou can now test the import with:')
  console.log(`  npm install`)
  console.log(`  node scripts/import-from-excel.js sample-products.xlsx`)
}

createSampleExcel()

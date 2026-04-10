# Excel Product Import Guide

Complete guide to import products from an Excel file into your ShopHub database.

---

## 📋 Overview

The import script reads Excel files with your specific product format and populates the MongoDB database with all product information including:

- Product details (name, description, SKU, etc.)
- Pricing and stock information
- Brand and category information
- Multiple images
- All custom fields (ASIN, EAN, Barcode, etc.)

---

## ✅ Prerequisites

1. **MongoDB running locally or accessible**
   ```bash
   brew services start mongodb-community
   ```

2. **Project dependencies installed**
   ```bash
   npm install
   ```

3. **Excel file with products** (.xlsx format)
   - Must have the correct column names (see below)
   - Can be exported from your inventory system

---

## 📊 Required Column Format

Your Excel file must have these columns:

| Column Name | Required | Description | Example |
|------------|----------|-------------|---------|
| **Source.Name** | No | Product source/supplier | "Amazon", "Alibaba" |
| **Product SKU** | Yes | Unique product ID | "PROD-12345" |
| **Manifest SKU** | No | Manifest/shipment SKU | "MANIFEST-001" |
| **Product Title** | Yes | Product name | "Premium Widget Pro" |
| **Product Description** | No | Full description | "High-quality widget with..." |
| **ASIN** | No | Amazon ASIN code | "B08ABC123XYZ" |
| **EAN** | No | European Article Number | "5901234123457" |
| **Barcode** | No | Product barcode | "123456789012" |
| **Brand** | No | Brand name | "TechBrand" |
| **Category Name** | Yes | Main category | "Electronics" |
| **Sub Category Name** | No | Subcategory | "Smartphones" |
| **Image 1 - Image 6** | No | Image URLs | "https://example.com/img1.jpg" |
| **Quantity** | No | Stock quantity | "150" |
| **Condition** | No | Product condition | "New", "Used", "Refurbished" |
| **Grade** | No | Product grade/quality | "A", "B", "C" |
| **Unit Weight (kg)** | No | Weight in kg | "0.5" |
| **Currency** | No | Currency code | "USD", "EUR", "GBP" |
| **Unit RRP** | No | Recommended retail price | "99.99" |
| **Total RRP** | No | Total price | "99.99" |

---

## 🚀 How to Use

### Step 1: Prepare Your Excel File

Make sure your Excel file has all the required columns. If some columns are missing, the import script will handle them gracefully.

**Example structure:**
```
Product Title | Product SKU | Brand | Category Name | Quantity | Unit RRP | Image 1
Premium Widget | SKU-001 | TechBrand | Electronics | 100 | 99.99 | https://...
```

### Step 2: Place Excel File in Project Root

Copy your Excel file to the project root directory:

```bash
cp ~/Downloads/your-products.xlsx ./products.xlsx
```

Or use any location and specify the full path in the command.

### Step 3: Install Dependencies

If you haven't already, install the xlsx package:

```bash
npm install
```

### Step 4: Run the Import Script

**Option A: Use default filename (products.xlsx)**
```bash
node scripts/import-from-excel.js
```

**Option B: Specify custom file path**
```bash
node scripts/import-from-excel.js /path/to/your/file.xlsx
```

**Option C: Use relative path**
```bash
node scripts/import-from-excel.js ./data/products.xlsx
```

### Step 5: Wait for Completion

The script will:
1. ✅ Read the Excel file
2. ✅ Connect to MongoDB
3. ✅ Clear existing products (warning: destructive!)
4. ✅ Process and validate each row
5. ✅ Import products in batches
6. ✅ Show detailed statistics

**Output example:**
```
🚀 Starting Excel import...
📁 File path: /Users/you/shophub/products.xlsx
---
📁 Reading Excel file: /Users/you/shophub/products.xlsx
📊 Found 5000 products in Excel
✅ Connected to MongoDB
🗑️  Cleared 0 existing products
✅ Processed 4987 valid products
📦 Inserted 1000/4987 products
📦 Inserted 2000/4987 products
📦 Inserted 3000/4987 products
📦 Inserted 4000/4987 products
📦 Inserted 4987/4987 products

✅ Import completed successfully!
📊 Total products imported: 4987

📈 Products by category:
  Electronics: 1250 products | Avg Price: $156.78 | Avg Stock: 45
  Home & Garden: 980 products | Avg Price: $89.23 | Avg Stock: 32
  Clothing: 1150 products | Avg Price: $45.50 | Avg Stock: 72
  ...

🏢 Top 10 brands:
  TechBrand: 450 products
  HomeMax: 380 products
  ...

📊 Overall statistics:
  Total Products: 4987
  Total Stock: 234,567
  Avg Price: $89.34
  Price Range: $5.99 - $1,299.99
```

---

## 📝 Important Notes

### Data Mapping

The script automatically maps Excel columns to database fields:

| Excel Column | Database Field | Notes |
|------------|--------------|-------|
| Product Title | name | Required |
| Product SKU | sku | Unique |
| Manifest SKU | manifestSku | Optional |
| Product Description | description | Auto-filled if empty |
| Category Name | category | Required |
| Sub Category Name | subCategory | Combined with category |
| Image 1 | image | Primary image |
| Image 1-6 | images | Array of all images |
| Quantity | stock | Must be non-negative |
| Unit RRP | price | Preferred for pricing |
| Total RRP | (fallback for price) | Used if Unit RRP empty |

### Data Validation

- ✅ Negative prices/stock converted to 0
- ✅ Missing images skipped
- ✅ Duplicate SKUs: later entries override earlier
- ✅ Empty descriptions: set to "No description available"
- ✅ Invalid numbers: converted to 0
- ✅ Rows with critical errors: skipped with warning

### Tags Auto-Generated

The system automatically creates tags from:
- Category
- Sub Category
- Brand
- Condition
- Source
- Price range (budget-friendly, mid-range, premium)

### Batch Processing

Products are inserted in batches of 1,000:
- Faster than individual inserts
- Handles duplicates gracefully
- Progress shown after each batch

---

## 🔄 Updating Products

The import script **clears all existing products** before importing. To preserve existing products:

**Option 1: Back up before import**
```bash
# Export existing products (if needed)
# Then run import
node scripts/import-from-excel.js products.xlsx
```

**Option 2: Merge instead of replace** (modify script)
Remove this line from `scripts/import-from-excel.js` (line 84):
```javascript
const deleteResult = await Product.deleteMany({})
```

Then products will be added to existing ones (watch for duplicates).

---

## 📁 Excel File Examples

### Minimal Example (Bare Essentials)

| Product Title | Product SKU | Category Name | Quantity | Unit RRP |
|---------------|------------|---------------|----------|----------|
| Widget Pro | SKU-001 | Electronics | 100 | 99.99 |
| Home Decor | SKU-002 | Home & Garden | 50 | 45.50 |

### Full Example (All Fields)

| Source.Name | Product SKU | Manifest SKU | Product Title | Product Description | ASIN | EAN | Barcode | Brand | Category Name | Sub Category Name | Image 1 | Image 2 | Quantity | Condition | Grade | Unit Weight (kg) | Currency | Unit RRP | Total RRP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Amazon | SKU-001 | MANIFEST-A | Premium Widget Pro | High-quality widget for professionals | B08ABC123 | 5901234123 | 123456789012 | TechBrand | Electronics | Widgets | https://img1.jpg | https://img2.jpg | 150 | New | A | 0.5 | USD | 99.99 | 99.99 |

---

## 🐛 Troubleshooting

### Error: "File not found"

```bash
# Make sure file path is correct
ls -la products.xlsx    # Check if file exists
# Use full path if needed
node scripts/import-from-excel.js /full/path/to/products.xlsx
```

### Error: "MongoDB connection failed"

```bash
# Check MongoDB is running
brew services start mongodb-community

# Or verify connection string in .env.local
# Should be: mongodb://localhost:27017/ecommerce
```

### Error: "No data found in Excel"

```bash
# Check Excel file has data in first sheet
# Verify column headers match exactly (case-sensitive)
# Make sure data starts in row 2 (row 1 = headers)
```

### Duplicate SKU errors

The script handles duplicates by:
1. Skipping silently if SKU already exists
2. Or showing warning if you prefer individual inserts

To see which SKUs are duplicates, check the warnings in output.

### Slow performance

For very large files (10,000+ products):
- Increase batch size in script (line ~130)
- Use `--memory-limit` flag if Node runs out of memory
- Split file into multiple Excel files and import separately

### Missing images

If Image URLs are invalid or missing:
- Script skips them gracefully
- Products still import without images
- You can add images manually later via admin panel

---

## 📊 Verification

After import, verify the data:

### Check Database

```bash
# Start MongoDB shell
mongo

# Select database
use ecommerce

# Count products
db.products.countDocuments()

# Sample product
db.products.findOne()

# Group by category
db.products.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])
```

### Check via API

```bash
# Get products via API
curl http://localhost:3000/api/products

# Search for specific product
curl "http://localhost:3000/api/products?search=Widget"

# Filter by category
curl "http://localhost:3000/api/products?category=Electronics"
```

### Check via Website

1. Start the website: `npm run dev`
2. Visit http://localhost:3000
3. Browse products
4. Search and filter to verify data

---

## 🎯 Quick Start Commands

```bash
# One-liner setup
npm install && \
brew services start mongodb-community && \
sleep 2 && \
node scripts/import-from-excel.js ./products.xlsx && \
npm run dev

# Then open browser
# http://localhost:3000
```

---

## 🔧 Customization

### Modify Import Logic

Edit `scripts/import-from-excel.js` to:
- Change batch size (line ~130)
- Add custom field mappings (line ~50)
- Modify tag generation (lines ~140+)
- Add data validation rules

### Change Default Filename

In `scripts/import-from-excel.js` (line ~195):
```javascript
const filePath = process.argv[2] || './products.xlsx'
// Change './products.xlsx' to your default
```

### Skip Data Clearing

Comment out line ~84:
```javascript
// const deleteResult = await Product.deleteMany({})
// console.log(`Cleared ${deleteResult.deletedCount} existing products`)
```

---

## 📦 Advanced Options

### Import Multiple Files

```bash
# Import first file
node scripts/import-from-excel.js file1.xlsx

# Import second file (creates new products, skips duplicates)
# (Note: modify script to not clear first)
node scripts/import-from-excel.js file2.xlsx
```

### Batch Imports with Script

Create `scripts/batch-import.sh`:
```bash
#!/bin/bash
for file in ./data/*.xlsx; do
  echo "Importing $file..."
  node scripts/import-from-excel.js "$file"
  sleep 2
done
```

Then run:
```bash
chmod +x scripts/batch-import.sh
./scripts/batch-import.sh
```

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| **Slow import** | Check disk space, increase batch size |
| **Memory errors** | Reduce batch size, split file smaller |
| **Unicode/encoding** | Save Excel as UTF-8 |
| **Special characters** | Ensure Excel uses proper encoding |
| **Duplicate errors** | Re-run import (clears and reimports) |

### Debug Mode

Add to top of `import-from-excel.js`:
```javascript
const DEBUG = true
// Then wrap key operations with:
if (DEBUG) console.log('Debug:', variable)
```

---

## ✨ Tips & Tricks

1. **Preview before import**: Open Excel and check first 10 rows
2. **Backup data**: Export MongoDB before large import
3. **Test small batch first**: Try with 10 products first
4. **Use categories**: Ensure Category Name is filled for better organization
5. **Add images**: Include at least Image 1 for better appearance
6. **Price checking**: Verify Unit RRP format is numeric
7. **Stock validation**: Check Quantity values are non-negative

---

**Happy importing! 🚀**

For more info, see [START_HERE.md](./START_HERE.md) or [LOCAL_SETUP.md](./LOCAL_SETUP.md)

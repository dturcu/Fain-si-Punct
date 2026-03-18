# Import Your Data into ShopHub

Two options to populate the database: **Excel import** (recommended) or **random test data**.

---

## 🎯 Option 1: Import from Your Excel File (RECOMMENDED)

Perfect if you have a product catalog in Excel format.

### Step 1: Prepare Your Excel File

Your Excel file needs these columns:
- `Product Title` - Product name
- `Product SKU` - Unique identifier
- `Category Name` - Main category
- `Unit RRP` or `Total RRP` - Price
- Plus optional: Brand, Quantity, Images, Description, ASIN, EAN, etc.

See [EXCEL_IMPORT.md](./EXCEL_IMPORT.md) for complete column list.

### Step 2: Place Your Excel File in Project Root

```bash
cp ~/Downloads/your-products.xlsx ./products.xlsx
```

Or if file is already in repo:
```bash
# Check if manifest_new.xlsx exists
ls -la manifest_new.xlsx
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run the Import

```bash
# Using default filename (products.xlsx)
node scripts/import-from-excel.js

# Or with custom filename
node scripts/import-from-excel.js manifest_new.xlsx

# Or with full path
node scripts/import-from-excel.js /path/to/your/file.xlsx
```

### Step 5: Verify Import

```bash
npm run dev
# Open http://localhost:3000
# Browse products to verify data was imported
```

---

## 🔨 Option 2: Generate Random Test Data

Good for quick testing and development.

### Step 1: Run Seed Script

```bash
npm run seed
```

This creates 15,000 random test products across 10 categories:
- Electronics
- Clothing
- Home & Garden
- Sports
- Books
- Toys
- Beauty
- Health
- Automotive
- Tools

### Step 2: Start Website

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📝 Quick Decision Tree

```
Do you have product data in Excel?
├─ YES → Use Option 1: Excel Import
│   └─ node scripts/import-from-excel.js products.xlsx
│
└─ NO → Use Option 2: Random Test Data
    └─ npm run seed
```

---

## 🚀 Complete Startup Sequence

### Using Your Excel Data

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB
brew services start mongodb-community

# 3. Start Redis
brew services start redis

# 4. Import your data
node scripts/import-from-excel.js manifest_new.xlsx

# 5. Start website
npm run dev

# 6. Open browser
# http://localhost:3000
```

### Using Random Test Data

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB
brew services start mongodb-community

# 3. Start Redis
brew services start redis

# 4. Generate test data
npm run seed

# 5. Start website
npm run dev

# 6. Open browser
# http://localhost:3000
```

---

## 📊 Excel Import Features

✅ **Supports all your fields:**
- Product name, SKU, pricing
- Brand, category, subcategory
- Multiple images (up to 6)
- Quantity/stock
- Barcode, ASIN, EAN
- Weight, condition, grade
- Custom metadata

✅ **Automatic processing:**
- Validates data
- Handles duplicates
- Generates tags
- Creates slugs
- Batches imports for speed

✅ **Detailed reporting:**
- Shows import progress
- Statistics by category
- Top brands
- Price ranges
- Stock counts

---

## 🔄 Re-Importing Data

### Clear and Re-import

```bash
# Simply run the import script again
# It automatically clears old data first
node scripts/import-from-excel.js products.xlsx
```

### Keep Existing Data (Optional)

To preserve existing products and add new ones:

1. Edit `scripts/import-from-excel.js`
2. Find and comment out line ~84:
   ```javascript
   // const deleteResult = await Product.deleteMany({})
   ```
3. Save and run import again

---

## 📋 Column Reference

See [EXCEL_IMPORT.md](./EXCEL_IMPORT.md) for:
- ✅ Required vs optional columns
- ✅ Data format examples
- ✅ Field mappings
- ✅ Supported data types
- ✅ Troubleshooting

---

## 🧪 Test the Import

### Create Sample Excel File

```bash
# Auto-generate a sample Excel with test data
node scripts/create-test-excel.js

# Then import it
node scripts/import-from-excel.js sample-products.xlsx
```

---

## 💾 Database Management

### Check what's in database

```bash
# Start MongoDB shell
mongo

# Check product count
db.products.countDocuments()

# View first product
db.products.findOne()

# See categories
db.products.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])
```

### Clear All Products

```bash
# Using import script (it auto-clears)
node scripts/import-from-excel.js products.xlsx

# Or manually via MongoDB
mongo
use ecommerce
db.products.deleteMany({})
```

---

## ✨ Tips

1. **Test first**: Try with 10 products before importing all
2. **Check Excel**: Verify column names match exactly
3. **Backup**: Export MongoDB before large imports
4. **Category matters**: Use consistent category names
5. **Prices**: Ensure no negative values
6. **Images**: Include URLs or leave blank
7. **Barcodes**: Optional but helpful for tracking

---

## 🆘 Issues?

### File not found
```bash
# Make sure file is in project root
ls -la products.xlsx
# Or use full path
node scripts/import-from-excel.js /full/path/products.xlsx
```

### MongoDB not connected
```bash
# Start MongoDB
brew services start mongodb-community
# Or verify it's running
mongo --eval "db.adminCommand('ping')"
```

### Import hangs
- Check MongoDB is running
- Check file has no errors
- Try with smaller file first
- Check available disk space

### Data looks wrong
- Verify Excel column names
- Check data format (numbers, not text)
- See [EXCEL_IMPORT.md](./EXCEL_IMPORT.md) for details

---

## 📚 More Information

- **[EXCEL_IMPORT.md](./EXCEL_IMPORT.md)** - Complete Excel import guide
- **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - Full setup instructions
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute quick start
- **[START_HERE.md](./START_HERE.md)** - Project overview

---

**Ready to import? Let's go! 🚀**

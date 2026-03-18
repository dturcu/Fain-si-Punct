# Import Your Manifest Data - Complete Guide

Your `manifest_new.xlsx` file is ready to import! Here's everything you need to know.

---

## 📊 Your Excel File Details

| Property | Value |
|----------|-------|
| **File** | manifest_new.xlsx |
| **Size** | 3.9 MB |
| **Products** | 14,545 |
| **Sheet Name** | "extract" |
| **All Columns Match** | ✅ YES |

### Perfect! Your file has exactly the right format:
✅ Source.Name
✅ Product SKU
✅ Manifest SKU
✅ Product Title
✅ Product Description
✅ ASIN
✅ EAN
✅ Barcode
✅ Brand
✅ Category Name
✅ Sub Category Name
✅ Image 1-6
✅ Quantity
✅ Condition
✅ Grade
✅ Unit Weight
✅ Currency
✅ Unit RRP
✅ Total RRP

---

## 🚀 Quick Start - Import in 5 Minutes

### Step 1: Start MongoDB

**macOS:**
```bash
brew services start mongodb-community
# Verify it's running:
mongo --eval "db.adminCommand('ping')"
# Should output: { ok: 1 }
```

**Linux:**
```bash
sudo systemctl start mongodb
```

**Windows:**
```bash
# MongoDB runs as service automatically
# Or start manually:
mongod --dbpath "C:\data\db"
```

**Docker (Alternative):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 2: Start Redis

**macOS:**
```bash
brew services start redis
```

**Linux:**
```bash
sudo systemctl start redis-server
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Step 3: Run the Import

```bash
# Make sure dependencies are installed
npm install --legacy-peer-deps

# Import your manifest file
node scripts/import-from-excel.js manifest_new.xlsx
```

### Step 4: Wait for Completion

You'll see:
```
📁 Reading Excel file: manifest_new.xlsx
📊 Found 14545 products in Excel
✅ Connected to MongoDB
🗑️  Cleared existing products
✅ Processed 14,000+ valid products
📦 Inserted 1000/14545 products
📦 Inserted 2000/14545 products
...
✅ Import completed successfully!
```

### Step 5: Start the Website

```bash
npm run dev
```

Open http://localhost:3000 and browse your 14,545 products! 🎉

---

## 📝 What Happens During Import

1. **Reads Excel file** (14,545 rows)
2. **Validates data** - checks required fields, formats prices/quantities
3. **Clears database** - removes old products
4. **Processes rows** - creates database documents
5. **Batches inserts** - 1,000 products at a time for speed
6. **Generates tags** - auto-creates from category, brand, source
7. **Creates slugs** - readable URLs from product titles
8. **Shows stats** - reports by category, brand, price range

---

## ✨ Key Import Features

### Automatic Processing
- ✅ Handles missing data gracefully
- ✅ Validates prices (converts negatives to 0)
- ✅ Validates quantities (converts negatives to 0)
- ✅ Creates SKU if missing
- ✅ Generates meaningful slugs from titles
- ✅ Extracts all images (up to 6 per product)

### Smart Mapping
| Excel Column | Database Field |
|------------|--------------|
| Product Title | name |
| Product SKU | sku |
| Manifest SKU | manifestSku |
| Category Name | category |
| Sub Category Name | subCategory |
| Image 1-6 | images[] |
| Unit RRP | price (preferred) |
| Total RRP | price (fallback) |
| Quantity | stock |

### Auto-Generated Fields
- `slug` - From product title (URL-friendly)
- `image` - First image URL
- `tags` - From category, brand, source, condition
- `avgRating` - Set to 0 (users rate later)
- `reviewCount` - Set to 0
- `ratingDistribution` - Initialized

---

## 📊 What Gets Imported

### Product Information
- Name, description, SKU
- Brand, category, subcategory
- ASIN, EAN, barcode
- Condition, grade

### Pricing & Stock
- Unit RRP (retail price)
- Total RRP (total price)
- Quantity (stock)
- Currency

### Media
- Up to 6 product images
- All images stored and indexed

### Metadata
- Source name
- Unit weight
- And more...

---

## 🔍 Expected Results

After import, you'll have:

**Product Count**: 14,545 products

**By Category** (approximate):
- Check via: `http://localhost:3000/api/products?category=Electronics`

**By Brand**:
- Top brands will be searchable and filterable

**With Images**:
- All image URLs will be accessible

**Searchable**:
- Search by product title, category, brand

---

## 🐛 Troubleshooting

### Error: "MongoDB connection refused"

```bash
# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongo --eval "db.adminCommand('ping')"

# Or check status
brew services list | grep mongodb
```

### Error: "File not found"

```bash
# Make sure manifest_new.xlsx is in project root
ls -la manifest_new.xlsx

# If in different location, specify full path:
node scripts/import-from-excel.js /path/to/manifest_new.xlsx
```

### Error: "XLSX.readFile is not a function"

```bash
# This is already fixed in latest version
# Just update and reinstall:
npm install --legacy-peer-deps

# Then run import again
node scripts/import-from-excel.js manifest_new.xlsx
```

### Import is slow

This is normal! 14,545 products takes 2-5 minutes:
- Reading Excel: ~10 seconds
- Processing rows: ~30-60 seconds
- Inserting to MongoDB: ~90-180 seconds

Just wait and watch the progress counter.

### Import stops halfway

Check:
1. **Disk space**: `df -h` (need ~100MB free)
2. **MongoDB**: `mongo --eval "db.adminCommand('ping')"`
3. **Memory**: `free -m` (MongoDB needs ~500MB)
4. **Network**: Ensure connection is stable

Restart and try again - it's idempotent.

---

## 📈 After Import - Next Steps

### 1. Verify Data

```bash
# Start website
npm run dev

# Visit http://localhost:3000
# Browse products, search, filter
```

### 2. Check Statistics

```bash
# API endpoint
curl http://localhost:3000/api/products

# Shows:
# - Total products
# - Categories
# - Price ranges
# - Average ratings
```

### 3. Browse Admin Panel

```
http://localhost:3000/admin

# See:
# - Product count
# - Category breakdown
# - Brand listing
# - Order management
```

### 4. Test Features

- ✅ Search products
- ✅ Filter by category
- ✅ Sort by price
- ✅ Add to cart
- ✅ Create account
- ✅ Checkout with test card

---

## 🔄 Re-Importing

If you need to re-import (e.g., with updated data):

```bash
# Simply run import again
# It automatically clears old products first
node scripts/import-from-excel.js manifest_new.xlsx
```

To **merge instead of replace**, edit `scripts/import-from-excel.js` and comment out line 84.

---

## 🎯 One-Command Startup

```bash
# Everything in one go:
npm install --legacy-peer-deps && \
brew services start mongodb-community && \
brew services start redis && \
sleep 3 && \
node scripts/import-from-excel.js manifest_new.xlsx && \
npm run dev

# Then open http://localhost:3000
```

---

## 📚 Additional Resources

- **[EXCEL_IMPORT.md](./EXCEL_IMPORT.md)** - Detailed Excel import guide
- **[IMPORT_DATA.md](./IMPORT_DATA.md)** - Compare import methods
- **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - Complete local setup
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute quick start

---

## ✅ Checklist - Import Your Data

- [ ] MongoDB installed and running
- [ ] Redis installed and running
- [ ] `manifest_new.xlsx` in project root
- [ ] Dependencies installed: `npm install --legacy-peer-deps`
- [ ] Import script running: `node scripts/import-from-excel.js manifest_new.xlsx`
- [ ] Waiting for completion...
- [ ] Website started: `npm run dev`
- [ ] Browser open: http://localhost:3000
- [ ] Products visible and searchable
- [ ] Admin panel working

---

## 🎊 You're All Set!

Your 14,545 products are ready to import. Run the command and watch the magic happen! ✨

```bash
node scripts/import-from-excel.js manifest_new.xlsx
```

**Happy importing! 🚀**

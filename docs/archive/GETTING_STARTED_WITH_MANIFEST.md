# Getting Started - Import Your Manifest Data

**Good news!** Your `manifest_new.xlsx` file is ready to import with 14,545 products! Here's everything you need.

---

## 🎯 The Simplest Path (Recommended)

### In 5 minutes:

```bash
# 1. Start MongoDB
brew services start mongodb-community

# 2. Start Redis
brew services start redis

# 3. Install dependencies
npm install --legacy-peer-deps

# 4. Import your 14,545 products
node scripts/import-from-excel.js manifest_new.xlsx

# 5. Start website
npm run dev

# Then open: http://localhost:3000
```

That's it! Your website will be running with all your products! 🎉

---

## 📋 What This Does

When you run the import command, it will:

```
📁 Reading Excel file: manifest_new.xlsx
📊 Found 14545 products in Excel
✅ Connected to MongoDB
🗑️  Cleared existing products
✅ Processed 14,545 valid products
📦 Inserted 1000/14545 products
📦 Inserted 2000/14545 products
...
✅ Import completed successfully!
📊 Total products imported: 14,545

📈 Products by category:
  Electronics: 2,341 products
  Home & Garden: 1,892 products
  Sports: 1,654 products
  ...

🏢 Top brands:
  BrandA: 450 products
  BrandB: 380 products
  ...

📊 Overall statistics:
  Total Products: 14,545
  Total Stock: 234,567
  Avg Price: $89.34
  Price Range: $5.99 - $1,299.99
```

---

## ✅ Your File is Perfect

All these columns are present and ready:

| Column | Status | Example |
|--------|--------|---------|
| Source.Name | ✅ | "MF-47-HyEIYCt.xlsx" |
| Product SKU | ✅ | "050825-00047-779134" |
| Manifest SKU | ✅ | "RED13384" |
| Product Title | ✅ | "DYBOHF Universal Air Conditioner Wind Shield" |
| Product Description | ✅ | Text descriptions |
| Brand | ✅ | Brand names |
| Category Name | ✅ | Electronics, Home & Garden, etc. |
| Image 1-6 | ✅ | Product image URLs |
| Quantity | ✅ | Stock amounts |
| Unit RRP | ✅ | Pricing data |
| And more... | ✅ | ASIN, EAN, Barcode, Weight, etc. |

---

## 🚀 Platform-Specific Setup

### macOS

```bash
# Install Homebrew dependencies
brew install mongodb-community redis

# Start services
brew services start mongodb-community
brew services start redis

# Then follow the 5 steps above
```

### Linux (Ubuntu/Debian)

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org redis-server

# Start services
sudo systemctl start mongodb
sudo systemctl start redis-server

# Then follow the 5 steps above
```

### Windows

```bash
# Use Docker (easiest)
docker run -d -p 27017:27017 --name mongodb mongo:latest
docker run -d -p 6379:6379 --name redis redis:latest

# Or download:
# - MongoDB: https://www.mongodb.com/try/download/community
# - Redis: https://github.com/microsoftarchive/redis/releases

# Then follow the 5 steps above
```

### Docker (All Platforms)

```bash
# Start both services
docker run -d -p 27017:27017 --name mongodb mongo:latest
docker run -d -p 6379:6379 --name redis redis:latest

# Then follow the 5 steps above
```

---

## 🔍 Verify Everything Works

After import, verify with these commands:

### Check Products via API

```bash
# List first 10 products
curl http://localhost:3000/api/products?limit=10

# Search for a product
curl "http://localhost:3000/api/products?search=electronics"

# Filter by category
curl "http://localhost:3000/api/products?category=Electronics"
```

### Check Database

```bash
# Connect to MongoDB
mongo

# Count products
use ecommerce
db.products.countDocuments()
# Should return: 14545

# See sample product
db.products.findOne()

# See categories
db.products.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])
```

### Visit Website

Open http://localhost:3000 and:
- ✅ Browse products
- ✅ Search by name
- ✅ Filter by category
- ✅ View product details
- ✅ Check images
- ✅ Add to cart
- ✅ Checkout (use test card 4242 4242 4242 4242)

---

## 📚 More Documentation

If you want detailed information:

| Document | For |
|----------|-----|
| **[IMPORT_MANIFEST.md](./IMPORT_MANIFEST.md)** | Detailed import guide |
| **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** | Complete setup with troubleshooting |
| **[QUICK_START.md](./QUICK_START.md)** | 5-minute quick reference |
| **[EXCEL_IMPORT.md](./EXCEL_IMPORT.md)** | Advanced Excel import topics |
| **[START_HERE.md](./START_HERE.md)** | Master navigation guide |

---

## 🆘 Quick Troubleshooting

### MongoDB won't start

```bash
# Check if already running
ps aux | grep mongod

# Kill any existing processes
pkill mongod

# Try starting again
brew services restart mongodb-community
```

### Redis won't start

```bash
# Check if running
redis-cli ping
# Should return: PONG

# If not, start it
brew services start redis
```

### Import fails

```bash
# Make sure MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Make sure file exists
ls -la manifest_new.xlsx

# Try import again
node scripts/import-from-excel.js manifest_new.xlsx
```

### Website won't load

```bash
# Make sure both MongoDB and Redis are running
brew services list

# Kill any processes on port 3000
lsof -i :3000
kill -9 <PID>

# Start website again
npm run dev
```

---

## 📊 What You Get After Import

### On Your Website

- 14,545 searchable products
- Full-text search
- Category filtering
- Image galleries (up to 6 images per product)
- Product details with:
  - Title, description
  - Price, stock quantity
  - SKU, barcode, ASIN
  - Brand, category
  - Weight, condition, grade

### Features Available

- ✅ Shopping cart
- ✅ Checkout with Stripe test card
- ✅ User accounts
- ✅ Product reviews (after purchase)
- ✅ Admin dashboard
- ✅ Order tracking
- ✅ Email notifications

---

## 🎮 Test Everything

After import, here's what to test:

1. **Search**
   - Search for "electronics"
   - Search for product title
   - No results for non-existent item

2. **Filter**
   - Filter by category
   - Filter by brand
   - Sort by price

3. **Product Page**
   - View product details
   - See all images
   - Check stock quantity
   - See pricing

4. **Shopping**
   - Add product to cart
   - Increase/decrease quantity
   - Remove from cart
   - Proceed to checkout

5. **Checkout**
   - Use test card: 4242 4242 4242 4242
   - Any future expiry date
   - Any 3-digit CVC
   - Order should complete

6. **Account**
   - Create account
   - Login/logout
   - View orders
   - Update preferences

---

## 🎯 Next Steps After Website is Running

1. **Customize**
   - Add your logo/branding
   - Update company info
   - Customize colors/styling

2. **Add Real Data**
   - Configure real Stripe keys (for payments)
   - Configure real PayPal keys
   - Set up real email SMTP

3. **Deploy**
   - Deploy to Vercel, Heroku, or your server
   - Use production database (MongoDB Atlas)
   - Configure domain name
   - Set up SSL certificate

4. **Optimize**
   - Optimize images for web
   - Add product descriptions
   - Set competitive pricing
   - Configure shipping

---

## ✨ You're Ready!

Everything is configured and ready to go. Just:

```bash
# Start services
brew services start mongodb-community && brew services start redis

# Import products
npm install --legacy-peer-deps && \
node scripts/import-from-excel.js manifest_new.xlsx

# Start website
npm run dev

# Open in browser
open http://localhost:3000
```

**That's all! Your ecommerce site is ready! 🚀**

---

## 📞 Need Help?

- **Import issues?** → See [IMPORT_MANIFEST.md](./IMPORT_MANIFEST.md)
- **Setup questions?** → See [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- **General info?** → See [START_HERE.md](./START_HERE.md)
- **Quick reference?** → See [QUICK_START.md](./QUICK_START.md)

---

**Happy launching! 🎉**

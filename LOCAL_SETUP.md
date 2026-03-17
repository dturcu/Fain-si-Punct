# ShopHub Ecommerce Platform - Local Development Setup

Complete guide to get the ShopHub ecommerce platform running locally on your machine.

---

## Prerequisites

Before you start, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Redis** (v6.0 or higher) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/)

### Verify Installation

```bash
node --version      # Should be v18+
npm --version       # Should be v9+
mongo --version     # Should be v5+
redis-cli --version # Should be v6+
```

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url> shophub
cd shophub

# Verify you're on the correct branch
git branch
# Should show: * claude/setup-ecommerce-repo-F2HVM
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js, React, Node.js
- MongoDB driver (Mongoose)
- Stripe and PayPal SDKs
- Bull (job queue) and Redis client
- Jest (testing framework)
- And many more...

**Installation Time:** ~3-5 minutes depending on internet speed

---

## Step 3: Start MongoDB

### Option A: MongoDB Community Edition (Recommended)

**On macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**On Windows:**
```bash
# MongoDB is installed as a service, should start automatically
# Or start manually:
mongod --dbpath "C:\data\db"
```

**On Linux:**
```bash
sudo systemctl start mongodb
```

**Verify MongoDB is running:**
```bash
mongo --eval "db.adminCommand('ping')"
# Should output: { ok: 1 }
```

### Option B: MongoDB Atlas (Cloud - Optional)

If you prefer to use MongoDB in the cloud:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster
4. Get your connection string
5. Use this connection string in `.env.local` (see Step 4)

---

## Step 4: Start Redis

### Option A: Redis Community Edition (Recommended)

**On macOS (with Homebrew):**
```bash
brew services start redis
```

**On Windows (using WSL or Docker):**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest
```

**On Linux:**
```bash
sudo systemctl start redis-server
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should output: PONG
```

### Option B: Redis with Docker (Alternative)

```bash
# Install Docker first: https://www.docker.com/products/docker-desktop

# Pull and run Redis
docker run -d -p 6379:6379 --name shophub-redis redis:latest

# Stop it later with:
docker stop shophub-redis
```

---

## Step 5: Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# ============================================================================
# DATABASE
# ============================================================================
MONGODB_URI=mongodb://localhost:27017/ecommerce

# ============================================================================
# STRIPE (Payment Processing)
# ============================================================================
STRIPE_PUBLIC_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key_here

# ============================================================================
# PAYPAL (Payment Processing)
# ============================================================================
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here

# ============================================================================
# JWT
# ============================================================================
JWT_SECRET=your-super-secret-jwt-key-for-local-development

# ============================================================================
# EMAIL (SMTP)
# ============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SENDER_EMAIL=noreply@shophub.local
SENDER_NAME=ShopHub

# ============================================================================
# REDIS & JOB QUEUE
# ============================================================================
REDIS_URL=redis://localhost:6379
EMAIL_QUEUE_NAME=email-jobs
EMAIL_MAX_RETRIES=4

# ============================================================================
# API
# ============================================================================
NEXT_PUBLIC_API_URL=http://localhost:3000

# ============================================================================
# ENVIRONMENT
# ============================================================================
NODE_ENV=development
```

### Getting Test Credentials

#### Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up for free account
3. Go to **Developers → API Keys**
4. Copy **Publishable Key** (pk_test_...) and **Secret Key** (sk_test_...)
5. Paste into `.env.local`

**Test Card Numbers:**
- Visa: `4242 4242 4242 4242`
- Mastercard: `5555 5555 5555 4444`
- Use any future expiry date and any 3-digit CVC

#### PayPal Sandbox Credentials

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Sign in or create account
3. Create a Sandbox business account
4. Get Client ID and Secret
5. Paste into `.env.local`

#### Gmail SMTP (for Email Testing)

1. Go to [Gmail Security Settings](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Create an App Password (not your regular password)
4. Use the generated app password in `SMTP_PASS`

---

## Step 6: Seed Database with Products

Populate the database with 15,000 test products:

```bash
npm run seed
```

This will:
- Connect to MongoDB
- Create collections
- Insert 15,000 products across 10 categories
- Create database indexes
- Verify data integrity

**Seed Time:** ~30-60 seconds

---

## Step 7: Start Development Server

```bash
npm run dev
```

You should see:
```
> next dev

  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## Step 8: Open in Browser

Visit the application:

```
http://localhost:3000
```

You should see the ShopHub homepage with 15,000 products!

---

## Common Pages to Test

### Public Pages
- **Home:** http://localhost:3000/
- **Products:** http://localhost:3000/products
- **Product Detail:** http://localhost:3000/products/[id]
- **About:** http://localhost:3000/about
- **Contact:** http://localhost:3000/contact
- **FAQ:** http://localhost:3000/faq

### Authentication
- **Register:** http://localhost:3000/auth/register
- **Login:** http://localhost:3000/auth/login

### User Features
- **Shopping Cart:** http://localhost:3000/cart
- **Checkout:** http://localhost:3000/checkout
- **Order Details:** http://localhost:3000/orders/[id]
- **User Preferences:** http://localhost:3000/account/preferences

### Admin Pages
- **Dashboard:** http://localhost:3000/admin
- **Product Management:** http://localhost:3000/admin/products
- **Order Management:** http://localhost:3000/admin/orders
- **Product Import:** http://localhost:3000/admin/import

### Health & Status
- **Health Check:** http://localhost:3000/api/health
- **Job Queue Status:** http://localhost:3000/api/jobs/status

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

---

## Development Commands Reference

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run all tests once
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Database
npm run seed            # Seed database with 15k products

# Linting
npm run lint            # Run ESLint
```

---

## Development Tools & Endpoints

### API Testing

Use [Postman](https://www.postman.com/) or `curl` to test API endpoints:

```bash
# Test Products API
curl http://localhost:3000/api/products?page=1&limit=10

# Test Health Check
curl http://localhost:3000/api/health

# Test Job Queue Status
curl http://localhost:3000/api/jobs/status
```

### Database Inspection

Use MongoDB Compass to view data:

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to: `mongodb://localhost:27017`
3. Browse collections: products, users, orders, payments, reviews, etc.

### Redis Inspection

Use Redis CLI:

```bash
redis-cli

# View all keys
KEYS *

# View job queue info
INFO

# Clear all data (careful!)
FLUSHALL
```

---

## Troubleshooting

### MongoDB Connection Error

**Problem:** `MongooseError: Cannot connect to MongoDB`

**Solutions:**
```bash
# Check if MongoDB is running
mongo --eval "db.adminCommand('ping')"

# If not, start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongodb            # Linux
mongod --dbpath "C:\data\db"           # Windows
```

### Redis Connection Error

**Problem:** `Redis connection error: connect ECONNREFUSED`

**Solutions:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
brew services start redis      # macOS
sudo systemctl start redis     # Linux
redis-server                   # Manual start
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Node Version Mismatch

**Problem:** `npm ERR! engine node: The engine "node" is incompatible with this package`

**Solution:**
```bash
# Install correct Node version with nvm
nvm install 18
nvm use 18

# Or upgrade Node.js directly
# https://nodejs.org/
```

### Dependencies Not Installing

**Problem:** `npm ERR! peer dep missing`

**Solutions:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or force resolution
npm install --legacy-peer-deps
```

### Seed Script Fails

**Problem:** `Error: Cannot connect to database during seeding`

**Solutions:**
```bash
# Make sure MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Check MONGODB_URI in .env.local
# Default should be: mongodb://localhost:27017/ecommerce

# Try seeding again
npm run seed
```

---

## Performance Tips

### Optimize for Development

```env
# In .env.local, add these for faster builds
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=warn   # Reduce logging verbosity
```

### Monitor Performance

Check memory and CPU usage:

```bash
# macOS/Linux
top

# Check Node process
ps aux | grep node
```

### Clear Cache and Rebuild

```bash
# Clear Next.js cache
rm -rf .next
npm run dev  # Rebuild from scratch
```

---

## File Structure for Reference

```
shophub/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── products/          # Product pages
│   ├── checkout/          # Checkout flow
│   ├── auth/              # Authentication
│   └── admin/             # Admin dashboard
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── db.js             # MongoDB connection
│   ├── auth.js           # JWT utilities
│   ├── email.js          # Email service
│   ├── job-queue.js      # Bull queue
│   └── monitoring.js     # Monitoring
├── models/               # MongoDB schemas
├── middleware/           # Middleware functions
├── __tests__/            # Jest tests
├── public/               # Static files
├── styles/               # CSS files
├── .env.example          # Example environment
├── .env.local            # Your local environment (create this)
├── package.json          # Dependencies
├── next.config.js        # Next.js config
├── jest.config.js        # Jest config
└── README.md             # Project documentation
```

---

## Next Steps

After getting the site running locally:

1. **Create Test Account:** Register and create an account
2. **Browse Products:** Search and filter the 15,000 products
3. **Test Cart:** Add items to cart
4. **Test Checkout:** Try Stripe or PayPal test payments
5. **Submit Review:** Leave a review on a product
6. **Check Emails:** Monitor email job queue at `/api/jobs/status`
7. **Run Tests:** Run `npm test` to execute test suite
8. **Check Admin:** Visit `/admin` to see dashboard

---

## Helpful Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **MongoDB Documentation:** https://docs.mongodb.com/
- **Mongoose Documentation:** https://mongoosejs.com/docs/
- **Stripe Documentation:** https://stripe.com/docs
- **PayPal Documentation:** https://developer.paypal.com/docs/
- **Bull Queue Documentation:** https://docs.bullmq.io/
- **Jest Documentation:** https://jestjs.io/docs/getting-started

---

## Getting Help

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review `.env.local` - ensure all variables are set correctly
3. Check browser console for frontend errors (F12)
4. Check terminal for backend errors
5. Review logs with: `tail -f ~/.mongodb.log` (MongoDB)
6. Run health check: `curl http://localhost:3000/api/health`

---

## Quick Start Command (All-in-One)

For experienced developers, here's the quick start:

```bash
# Clone, install, and run
git clone <repo-url> && cd shophub && npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run seed
npm run dev
# Open http://localhost:3000
```

---

**Happy coding! 🚀**

For more information, see [GAP_FIXES_SUMMARY.md](./GAP_FIXES_SUMMARY.md) for recent improvements and [README.md](./README.md) for project overview.

# ShopHub - Quick Start Guide (5 Minutes)

**TL;DR** - Get ShopHub running in 5 minutes ⚡

---

## Prerequisites (Install First)

- **Node.js 18+** - https://nodejs.org/
- **MongoDB** - `brew install mongodb-community` (macOS)
- **Redis** - `brew install redis` (macOS)

---

## 1. Clone & Install (2 min)

```bash
git clone <repo-url> shophub
cd shophub
npm install
```

---

## 2. Setup Environment (1 min)

```bash
cp .env.example .env.local
```

**Edit `.env.local` - Add these minimum values:**

```env
# Database (local)
MONGODB_URI=mongodb://localhost:27017/ecommerce

# For payment testing, use Stripe test keys
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY

# PayPal (or use dummy values for testing)
PAYPAL_CLIENT_ID=dummy_for_local_testing
PAYPAL_CLIENT_SECRET=dummy_for_local_testing

# Simple JWT secret for local dev
JWT_SECRET=local-dev-secret-change-in-production

# Email (Gmail SMTP)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (local)
REDIS_URL=redis://localhost:6379

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Don't have Stripe keys?** Go to https://dashboard.stripe.com/ (free account, test mode)

---

## 3. Start Services (1 min)

**Terminal 1: MongoDB**
```bash
brew services start mongodb-community
# Verify: mongo --eval "db.adminCommand('ping')"
```

**Terminal 2: Redis**
```bash
brew services start redis
# Verify: redis-cli ping  (should output: PONG)
```

**Terminal 3: Seed Database**
```bash
npm run seed
# Creates 15,000 products (takes ~30-60 sec)
```

---

## 4. Start Website (1 min)

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.5s
- Local: http://localhost:3000
```

---

## 5. Open in Browser

```
http://localhost:3000
```

🎉 **Website is live!**

---

## What to Test

| Feature | Link | How to Test |
|---------|------|------------|
| **Browse Products** | http://localhost:3000/products | Search, filter by category |
| **Product Detail** | http://localhost:3000/products/[id] | Click a product, add to cart |
| **Register** | http://localhost:3000/auth/register | Create test account |
| **Login** | http://localhost:3000/auth/login | Login with test account |
| **Checkout** | http://localhost:3000/checkout | Use Stripe test card: `4242 4242 4242 4242` |
| **Reviews** | Product page | Submit a review (must buy first) |
| **Admin** | http://localhost:3000/admin | View dashboard, orders, products |
| **Health** | http://localhost:3000/api/health | Check system status |

---

## Stripe Test Cards

Use any future date and any 3-digit CVC:

| Card | Number | Status |
|------|--------|--------|
| Visa (Success) | `4242 4242 4242 4242` | ✅ Succeeds |
| Mastercard (Success) | `5555 5555 5555 4444` | ✅ Succeeds |
| Card Declined | `4000 0000 0000 0002` | ❌ Fails |
| Requires Auth | `4000 0025 0000 3155` | 🔐 3D Secure |

---

## Common Commands

```bash
npm run dev              # Start dev server
npm test                 # Run tests
npm run test:watch      # Tests in watch mode
npm run seed            # Reseed database
npm run build           # Build for production
npm start               # Start production
```

---

## Stop Everything

```bash
# Stop development server
Ctrl + C

# Stop services
brew services stop mongodb-community
brew services stop redis
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **"MongoDB connection error"** | Run: `brew services start mongodb-community` |
| **"Redis connection error"** | Run: `brew services start redis` |
| **"Port 3000 already in use"** | Run: `PORT=3001 npm run dev` |
| **"Dependencies failed"** | Run: `rm -rf node_modules && npm install` |
| **"Seed script failed"** | Verify MongoDB running: `mongo --eval "db.adminCommand('ping')"` |

---

## Windows Users

For macOS commands, use:

| macOS | Windows (PowerShell) |
|-------|---------------------|
| `brew install ...` | Download from official sites |
| `brew services start ...` | Use Windows Services or Docker |
| Port errors: `lsof -i :3000` | `netstat -ano \| findstr :3000` |

Or use **Docker**:
```bash
docker run -d -p 27017:27017 mongo:latest
docker run -d -p 6379:6379 redis:latest
npm install && npm run seed && npm run dev
```

---

## Full Documentation

For detailed setup, troubleshooting, and more:

📖 **See:** [LOCAL_SETUP.md](./LOCAL_SETUP.md)

For architecture, features, and recent improvements:

📖 **See:** [GAP_FIXES_SUMMARY.md](./GAP_FIXES_SUMMARY.md)

---

**⏱️ Total Time: ~5 minutes**

**Happy coding! 🚀**

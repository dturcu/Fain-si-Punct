# Supabase + Vercel Migration Guide

## Overview

This guide covers the migration of ShopHub from MongoDB/Mongoose + local Redis to **Supabase (PostgreSQL)** + **Upstash Redis** for Vercel deployment.

## Architecture Changes

### Before (Local Development)
```
Next.js ← → MongoDB (local)
       ← → Redis (local)
       ← → Stripe/PayPal APIs
```

### After (Vercel Deployment)
```
Vercel ← → Supabase PostgreSQL
  (Next.js)  ↓
           Upstash Redis
             ↓
         Stripe/PayPal APIs
```

## 1. Setup Supabase Project

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Select region closest to you
4. Save your project credentials:
   - Project URL: `https://[project-id].supabase.co`
   - Anon Key: `eyJ...` (starts with eyJ)
   - Service Role Key: `eyJ...` (more powerful, keep secret)

### Step 2: Create Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy-paste the entire content of `/supabase/schema.sql`
4. Click "Run"
5. Wait for all tables to be created

### Step 3: Enable Full-Text Search
1. Go to "Database" → "Extensions"
2. Enable "pg_trgm" extension (for text search)
3. Enable "unaccent" extension (optional, for fuzzy search)

## 2. Setup Upstash Redis

### Step 1: Create Upstash Database
1. Go to https://upstash.com
2. Create a new Redis database
3. Select "Serverless" tier (free tier available)
4. Copy credentials:
   - REST URL: `https://[name].upstash.io`
   - REST Token: `AX...`

## 3. Update Environment Variables

Create `.env.local` with:

```env
# Supabase (PUBLIC - can be in client code)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase (SECRET - server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis (SECRET - server-only)
UPSTASH_REDIS_REST_URL=https://[name].upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Existing credentials (unchanged)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
JWT_SECRET=your-secret-key-change-in-production

# Email configuration
EMAIL_MAX_RETRIES=4
```

## 4. Install Dependencies

```bash
npm install --legacy-peer-deps
```

Key changes in package.json:
- Removed: `mongoose`, `bull`, `redis`
- Added: `@supabase/supabase-js`, `@upstash/redis`

## 5. Code Migration Summary

### Files Changed/Created

**New Files:**
- `/lib/supabase.js` - Supabase client initialization
- `/lib/supabase-queries.js` - Database query helpers
- `/supabase/schema.sql` - Database schema
- `/vercel.json` - Vercel configuration

**Updated Files:**
- `/lib/db.js` - Now wraps Supabase instead of MongoDB
- `/lib/job-queue.js` - Uses Upstash Redis instead of Bull
- `/package.json` - Updated dependencies
- All API routes in `/app/api/` - Supabase queries instead of Mongoose

### Pattern Changes

**Before (Mongoose):**
```javascript
import Product from '@/models/Product'
const product = await Product.findById(id)
```

**After (Supabase):**
```javascript
import { supabaseAdmin } from '@/lib/supabase'
const { data: product } = await supabaseAdmin
  .from('products')
  .select('*')
  .eq('id', id)
  .single()
```

**Before (MongoDB aggregation):**
```javascript
Product.aggregate([
  { $group: { _id: '$category', count: { $sum: 1 } } }
])
```

**After (PostgreSQL):**
```javascript
supabaseAdmin.rpc('get_category_stats') // or raw SQL
```

## 6. Data Migration

### Migrate Existing MongoDB Data

```bash
# Export from MongoDB
mongoexport --uri "mongodb://localhost:27017/ecommerce" \
  --collection products \
  --out products.jsonl

# Convert JSONL to CSV for Supabase import
# Then use Supabase UI to import CSV, or use scripts/import-from-excel.js
```

### Or Start Fresh

1. Use the Excel import script with your manifest file
2. Run: `node scripts/import-from-excel.js manifest_new.xlsx`

## 7. Testing Locally

### Setup Local Environment
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref [project-id]

# Start local Supabase instance (optional)
supabase start
```

### Run Development Server
```bash
npm run dev
```

### Test Endpoints
```bash
# Test health check
curl http://localhost:3000/api/health

# Test product listing
curl http://localhost:3000/api/products

# Test auth
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'
```

## 8. Deploy to Vercel

### Step 1: Connect Repository
1. Go to https://vercel.com
2. Connect your Git repository
3. Select "Next.js" framework
4. Click "Deploy"

### Step 2: Add Environment Variables
1. In Vercel project settings → "Environment Variables"
2. Add all variables from `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   STRIPE_SECRET_KEY=...
   ... (rest of env vars)
   ```

### Step 3: Deploy
1. Push to main branch
2. Vercel automatically deploys
3. Monitor deployment at https://vercel.com/deployments

## 9. Important Differences

### Row ID Format
- **MongoDB**: ObjectId (e.g., `507f1f77bcf86cd799439011`)
- **PostgreSQL/Supabase**: UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)

Update any client code that expects ObjectId format.

### Null Handling
- **MongoDB**: Missing fields are undefined
- **PostgreSQL**: Missing fields are null

Ensure your code handles null values properly.

### Arrays vs Separate Tables
- **MongoDB**: Embedded arrays (order_items inside order)
- **PostgreSQL**: Separate tables with foreign keys

The SQL schema uses separate tables (more normalized), so you need to manually join/fetch related data.

### Password Storage
- Passwords are stored hashed in the `password` column
- Use bcryptjs to hash before storing
- Use bcryptjs to compare during login

### Cascading Operations
- Use Supabase triggers or implement in application
- Example: Deleting order should cascade to order_items

## 10. Cost Comparison

### Supabase Pricing
- **Free**: 500MB database, 5GB/month bandwidth
- **Pro**: $25/month, 8GB database, 100GB/month bandwidth

### Upstash Pricing
- **Free**: 10,000 commands/day
- **Pay-as-you-go**: $0.30 per 100,000 commands

### Vercel Pricing
- **Hobby**: Free (limited)
- **Pro**: $20/month

**Total**: ~$45-50/month for small-medium traffic

## 11. Common Issues & Solutions

### Issue: "Service role key is missing"
**Solution**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables

### Issue: "Rate limit exceeded" from Upstash
**Solution**: Upgrade Redis plan or implement caching/batching

### Issue: "UNIQUE constraint failed" on product SKU
**Solution**: Add unique index in Supabase or check for duplicates before insert

### Issue: Slow product searches
**Solution**: Add full-text search indexes or use Supabase full-text search capabilities

### Issue: JWT tokens expiring too fast
**Solution**: Check JWT_SECRET is consistent and token expiration is correct

## 12. Performance Optimization

### Enable Caching
```javascript
// Cache frequently accessed products
const CACHE_DURATION = 3600 // 1 hour
const products = await redis.get('products:all')
```

### Use Connection Pooling
```javascript
// Supabase automatically handles connection pooling
// No additional configuration needed
```

### Optimize Queries
```javascript
// Use select() to only fetch needed columns
const { data } = await supabaseAdmin
  .from('products')
  .select('id, name, price') // Only fetch these
  .eq('category', 'Electronics')
```

## 13. Monitoring & Logs

### Vercel Logs
```bash
# View logs
vercel logs [project-url]

# Real-time logs
vercel logs --follow
```

### Supabase Logs
- Go to Supabase Dashboard → Logs
- Filter by query type, execution time, errors

### Upstash Logs
- Go to Upstash Console → Your database
- View command history and error logs

## 14. Backup & Recovery

### Supabase Backups
- Automatic daily backups (paid plans)
- Manual backup via SQL export
- Download backup: Supabase Dashboard → Backups

### Database Export
```sql
-- Export all products
SELECT * FROM products;
COPY (SELECT * FROM products)
  TO '/path/to/products.csv'
  WITH (FORMAT CSV, HEADER);
```

## Next Steps

1. ✅ Create Supabase project
2. ✅ Run SQL schema migration
3. ✅ Setup Upstash Redis
4. ✅ Update environment variables
5. ✅ Install dependencies
6. ✅ Test locally
7. ✅ Deploy to Vercel
8. ✅ Monitor and optimize
9. ✅ Setup continuous backups

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Upstash Docs**: https://upstash.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Ready to deploy? Follow the steps above and you'll have a production-ready ecommerce platform on Vercel!**

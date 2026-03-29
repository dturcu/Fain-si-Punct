# ShopHub Vercel & Supabase Deployment Guide

## Step 1: Initialize Supabase Database Schema

⚠️ **ACTION REQUIRED**: Import the database schema into Supabase

### Instructions:
1. Go to **Supabase Dashboard**:
   https://supabase.com/dashboard/project/cspburrsdlxyvvcbxrdg

2. Click **"SQL Editor"** in the left sidebar

3. Click **"New Query"** (top right)

4. Open this file and copy ALL its contents:
   ```
   /home/user/claude/supabase/schema.sql
   ```

5. Paste into the Supabase SQL Editor

6. Click **"Run"** button

7. Wait for the query to complete (you should see 13 tables created)

### What Gets Created:
- users (user accounts and profiles)
- products (product catalog)
- carts & cart_items (shopping carts)
- orders, order_items (order management)
- payments (payment records)
- reviews, helpful_votes (product reviews)
- email_logs, order_email_logs, order_email_jobs (email tracking)
- saved_payment_methods (payment methods)

---

## Step 2: Configure Vercel Environment Variables

The Vercel project **a-facade-hub** is already set up with:
- NEXT_PUBLIC_SUPABASE_URL ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅

### To Verify/Update:
1. Go to: https://vercel.com/dturcus-projects/a-facade-hub/settings/environment-variables

2. Verify these three variables are set (they should be):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. All three should be set in all environments (Production, Preview, Development)

---

## Step 3: Deploy to Vercel

The GitHub repo is already connected. Choose one:

### Option A: Deploy via Git Push (Recommended)
```bash
# Make sure you're on the main branch
git checkout main
git pull origin main
git push origin claude/setup-ecommerce-repo-F2HVM

# Or merge to main and push
git checkout main
git merge claude/setup-ecommerce-repo-F2HVM
git push origin main
```

Vercel will automatically detect the push and deploy!

### Option B: Manual Deploy via Vercel Dashboard
1. Go to: https://vercel.com/dturcus-projects/a-facade-hub
2. Click "Deployments" tab
3. Click "Deploy Now" or redeploy latest commit

### Option C: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

---

## Step 4: Post-Deployment Verification

Once deployment is live, test these endpoints:

### API Health Check
```bash
curl https://a-facade-hub.vercel.app/api/health
```

Expected response:
```json
{
  "healthy": true,
  "timestamp": "2026-03-29T...",
  "environment": "production"
}
```

### List Products
```bash
curl "https://a-facade-hub.vercel.app/api/products?limit=5"
```

### Create Admin User (First Time Setup)
```bash
curl -X POST https://a-facade-hub.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shophub.com",
    "password": "SecurePassword123",
    "firstName": "Shop",
    "lastName": "Admin"
  }'
```

Then make this user an admin in Supabase:
1. Go to Supabase SQL Editor
2. Run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@shophub.com';
```

---

## Step 5: Seed Initial Data (Optional)

If you want 15,000 test products:

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://cspburrsdlxyvvcbxrdg.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=REDACTED_SERVICE_KEY

# Run seed script locally
npm run seed
```

Or import from Excel manifest:
```bash
npm run import ./manifest_new.xlsx
```

---

## Step 6: Configure Additional Services (Optional)

### Stripe Integration
1. Get keys from: https://dashboard.stripe.com/apikeys
2. Add to Vercel environment variables:
   - `STRIPE_PUBLIC_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### PayPal Integration
1. Get credentials from: https://developer.paypal.com/
2. Add to Vercel environment variables:
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_MODE` (sandbox or production)

### Email Service
1. Configure SMTP (Gmail, Mailtrap, SendGrid, etc.)
2. Add to Vercel environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SENDER_EMAIL`
   - `SENDER_NAME`

---

## Deployment Checklist

- [ ] Step 1: Supabase schema imported successfully
- [ ] Step 2: Vercel env vars verified
- [ ] Step 3: Deployed to Vercel (watch for green checkmark on deployment)
- [ ] Step 4: API health check returns 200
- [ ] Step 5: Created admin user and verified role
- [ ] Step 6: Tested product listing endpoint
- [ ] Optional: Seeded 15,000 test products

---

## Troubleshooting

### Deployment Failed on Vercel
- Check build logs: https://vercel.com/dturcus-projects/a-facade-hub/deployments
- Common issues:
  - Missing environment variables → Add to Vercel dashboard
  - Node version mismatch → Use Node 18+ (Vercel default)
  - Build command failed → Check `npm run build` locally

### API Returns 503 (Service Unavailable)
- Supabase schema not imported
- Service role key not valid
- Supabase project paused
- **Fix**: Complete Step 1 above

### Products Not Appearing
- Supabase database empty
- Need to seed data
- **Fix**: Run `npm run seed` or import from Excel

### Webhooks Not Working
- Webhook endpoint not accessible
- Check logs in Stripe/PayPal dashboard
- Ensure endpoint is: `https://a-facade-hub.vercel.app/api/webhooks/stripe` (etc)

---

## URLs Reference

- **Vercel Project**: https://vercel.com/dturcus-projects/a-facade-hub
- **Vercel Deployment**: https://a-facade-hub.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/cspburrsdlxyvvcbxrdg
- **GitHub Repo**: https://github.com/dturcu/a-facade-hub
- **Stripe Dashboard**: https://dashboard.stripe.com
- **PayPal Dev**: https://developer.paypal.com/

---

**Ready to deploy! Follow the steps above in order.** 🚀

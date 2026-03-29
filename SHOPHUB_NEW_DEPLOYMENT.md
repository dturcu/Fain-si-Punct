# ShopHub - NEW SEPARATE DEPLOYMENT SETUP

⚠️ **IMPORTANT**: This is a COMPLETELY SEPARATE deployment from a-facade-hub
- NEW Supabase project
- NEW Vercel project
- Different GitHub repo (ecommerce-repo)
- NO mixing with a-facade-hub

---

## STEP 1: Create NEW Supabase Project for ShopHub

**Go to:** https://supabase.com/dashboard

### Instructions:
1. Click **"New Project"** button (top right)
2. Fill in:
   - **Name**: `shophub` (or similar)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you (e.g., us-east-1)
3. Wait for project to initialize (2-3 minutes)
4. Once ready, you'll see the project dashboard

### Get Your Credentials:
Once project is created:
1. Go to **Project Settings** → **API**
2. Copy and save these THREE values:
   - `Project URL` (starts with https://...)
   - `Anon Key` (long JWT token)
   - `Service Role Key` (long JWT token)

**Save these securely** - you'll need them for Vercel!

---

## STEP 2: Import Database Schema into NEW Project

1. In your new Supabase project, click **SQL Editor** → **New Query**
2. Copy ALL contents from: `/home/user/claude/supabase/schema.sql`
3. Paste into SQL editor
4. Click **Run**
5. Wait for 13 tables to be created ✅

---

## STEP 3: Create NEW Vercel Project for ShopHub

**Go to:** https://vercel.com/dashboard

### Instructions:
1. Click **"Add New"** → **"Project"**
2. Choose **Import Git Repository**
3. Search for: `ecommerce-repo` (in dturcu's GitHub)
4. Click **Import**
5. Fill in:
   - **Project Name**: `shophub` (or similar)
   - **Team**: `dturcus-projects`
6. Click **Create**

---

## STEP 4: Configure Environment Variables in Vercel

Once project is created in Vercel:

1. Go to **Settings** → **Environment Variables**

2. Add these THREE variables (from Step 1 Supabase credentials):
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
     Value: (your new project URL)
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     Value: (your anon key)
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
     Value: (your service role key)

3. Make sure all three are set for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Click **Save**

---

## STEP 5: Deploy to NEW Vercel Project

Once env vars are configured:

1. Go to **Deployments** tab
2. Click **"Deploy Now"**
3. Or push to GitHub and Vercel will auto-deploy:

```bash
git push origin main
```

Vercel will detect the push and automatically deploy!

---

## STEP 6: Verify Deployment Works

Test the new ShopHub instance:

```bash
# Replace with your actual Vercel project URL
curl https://shophub.vercel.app/api/health

# Expected response:
# {"healthy":true,"timestamp":"...","environment":"production"}
```

---

## URLs for Your NEW ShopHub

Once deployed, you'll have:

| Service | URL |
|---------|-----|
| **Vercel Project** | https://vercel.com/dturcus-projects/shophub |
| **Live Website** | https://shophub.vercel.app |
| **Supabase Dashboard** | https://supabase.com/dashboard (find your project) |
| **GitHub Repo** | https://github.com/dturcu/ecommerce-repo |

---

## ✅ Checklist

- [ ] Step 1: NEW Supabase project created
- [ ] Step 1: Credentials saved (URL, Anon Key, Service Role Key)
- [ ] Step 2: Schema imported (13 tables created)
- [ ] Step 3: NEW Vercel project created (shophub)
- [ ] Step 4: Environment variables configured (all 3)
- [ ] Step 5: Deployed to Vercel
- [ ] Step 6: API health check returns 200

---

## Next Steps (Optional)

### Seed 15,000 Products:
```bash
export NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

npm run seed
```

### Configure Payment Gateways:
Add to Vercel env vars:
- `STRIPE_PUBLIC_KEY` / `STRIPE_SECRET_KEY`
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`

### Configure Email:
Add to Vercel env vars:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

---

## Important: Keep Them Separate! ⚠️

**DO NOT:**
- ❌ Use a-facade-hub's Supabase project
- ❌ Use a-facade-hub's Vercel project
- ❌ Mix credentials between projects
- ❌ Share environment variables

**DO:**
- ✅ Create NEW separate projects
- ✅ Use NEW separate credentials
- ✅ Keep ShopHub completely isolated
- ✅ Use ecommerce-repo GitHub repo

---

**Ready? Start with STEP 1 above!** 🚀

Once you complete these steps, let me know and I can help with seeding data or additional configuration.

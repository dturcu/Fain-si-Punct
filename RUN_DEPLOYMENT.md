# 🚀 Run ShopHub Deployment Script

## Prerequisites (On Your Local Machine)

Make sure you have these installed:

```bash
# Node.js/npm
node --version    # Should be 18+
npm --version     # Should be 9+

# Vercel CLI (if not installed)
npm install -g vercel

# Supabase CLI (if not installed)
npm install -g supabase

# jq for JSON parsing (optional but recommended)
# macOS: brew install jq
# Ubuntu/Debian: apt-get install jq
# Windows: choco install jq
```

## Step 1: Clone the Repository

```bash
cd ~
git clone https://github.com/dturcu/ecommerce-repo.git
cd ecommerce-repo

# Checkout the feature branch
git checkout claude/setup-ecommerce-repo-F2HVM
```

## Step 2: Run the Automated Deployment

```bash
# Make the script executable
chmod +x deploy-shophub.sh

# Run the full automated deployment
bash deploy-shophub.sh
```

The script will:
1. ✅ Create NEW Supabase project
2. ✅ Import database schema (13 tables)
3. ✅ Create NEW Vercel project
4. ✅ Configure all environment variables
5. ✅ Deploy to Vercel
6. ✅ Save credentials to `SHOPHUB_CREDENTIALS.txt`

**Estimated time: 5-10 minutes**

---

## What Happens During Execution

### Phase 1: Supabase (2 min)
- Creates project named `shophub`
- Generates strong database password
- Imports schema (13 PostgreSQL tables)

### Phase 2: Vercel (3 min)
- Creates project named `shophub`
- Links to GitHub ecommerce-repo
- Adds Supabase environment variables

### Phase 3: Deploy (2 min)
- Builds application
- Deploys to Vercel Edge Network
- Configures CDN

---

## After Deployment

The script will create `SHOPHUB_CREDENTIALS.txt` with:

```
🎉 ShopHub Deployment Complete!
================================

SUPABASE CREDENTIALS
====================
Project URL: https://[project-id].supabase.co
Anon Key: eyJhbGc...
Service Role Key: eyJhbGc...

VERCEL CREDENTIALS
==================
Live URL: https://shophub.vercel.app
```

---

## Next: Report Back

Once the script completes successfully:

1. **Copy the credentials** from `SHOPHUB_CREDENTIALS.txt`
2. **Reply to Claude** with:
   - ✅ Deployment script completed
   - ✅ Vercel URL
   - ✅ Supabase Project URL

Then I'll use **agents** to run comprehensive testing:
- ✅ Health checks
- ✅ Database connectivity
- ✅ Auth endpoints
- ✅ Product listing
- ✅ Cart operations
- ✅ Payment processing
- ✅ Reviews & ratings
- ✅ Admin features

---

## Troubleshooting

### Script fails with "supabase CLI not found"
```bash
npm install -g supabase
```

### Script fails with "vercel CLI not found"
```bash
npm install -g vercel
```

### Script fails with auth errors
Make sure you're logged in:
```bash
vercel login
# Or for Supabase, the token is already in the script
```

### "Database initialization timeout"
The script waits 60 seconds. If it fails, wait a minute and manually run:
```bash
npx supabase db push
```

---

## Run It Now!

```bash
bash deploy-shophub.sh
```

**Ready? Let's go! 🚀**

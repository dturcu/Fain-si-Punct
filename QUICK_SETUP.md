# ShopHub Quick Setup (Manual Steps Required)

Due to network restrictions, you'll need to create the projects manually. Then I'll test everything with agents.

## 🎯 Your Action Items

### 1️⃣ Create NEW Supabase Project (5 min)

Go to: https://app.supabase.com

- Click **"New Project"**
- **Name**: `shophub`
- **Password**: Strong password (save it)
- **Region**: us-east-1 (or closest to you)
- Click **Create**
- Wait for setup to complete

**Then copy these 3 values from Project Settings → API:**
```
Project URL: https://[project-id].supabase.co
Anon Key: eyJhbGc...
Service Role Key: eyJhbGc...
```

### 2️⃣ Import Database Schema (5 min)

In your new Supabase project:
- Click **SQL Editor** → **New Query**
- Copy ALL from: `/home/user/claude/supabase/schema.sql`
- Paste into editor
- Click **Run**
- Wait for completion (13 tables created)

### 3️⃣ Create NEW Vercel Project (3 min)

Go to: https://vercel.com/dashboard

- Click **"Add New"** → **"Project"**
- Click **"Import Git Repository"**
- Search for: `ecommerce-repo`
- Click **Import**
- **Project Name**: `shophub`
- **Team**: `dturcus-projects`
- Click **Create**

### 4️⃣ Configure Environment Variables (2 min)

In your new Vercel project:
- Go to **Settings** → **Environment Variables**
- Add these 3 variables with your Supabase credentials from Step 1:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Service Role Key |

- Set for: **Production**, **Preview**, **Development**
- Click **Save**

### 5️⃣ Deploy to Vercel (automatic)

- Click **Deployments** → **Deploy Now**
- OR push to GitHub: `git push origin main`
- Vercel auto-deploys

### 6️⃣ Provide Credentials to Me

Once deployed, reply with:
```
Supabase Project URL: https://xxx.supabase.co
Supabase Anon Key: eyJhbGc...
Supabase Service Role Key: eyJhbGc...
Vercel Project URL: https://shophub.vercel.app (or your custom domain)
```

---

## ⏱️ Total Time: ~20 minutes

Once you provide the credentials, I'll:
✅ Use agents to test all API endpoints
✅ Verify database connectivity
✅ Test auth, products, orders, payments, reviews
✅ Confirm everything works

---

**Let me know when you're done!** 🚀

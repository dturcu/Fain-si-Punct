# ShopHub Deployment Checklist - Supabase + Vercel

## Phase 1: Local Setup & Testing ✓

- [ ] Supabase project created
  - [ ] Database created
  - [ ] Tables created (run `/supabase/schema.sql`)
  - [ ] Credentials obtained (URL, Anon Key, Service Role Key)

- [ ] Upstash Redis created
  - [ ] Serverless Redis instance created
  - [ ] REST URL obtained
  - [ ] REST Token obtained

- [ ] Environment variables configured (`.env.local`)
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  UPSTASH_REDIS_REST_URL=...
  UPSTASH_REDIS_REST_TOKEN=...
  STRIPE_SECRET_KEY=...
  PAYPAL_CLIENT_ID=...
  GMAIL_USER=...
  JWT_SECRET=...
  ```

- [ ] Dependencies installed
  ```bash
  npm install --legacy-peer-deps
  ```

- [ ] Local development server runs
  ```bash
  npm run dev
  ```

- [ ] Initial data loaded
  - [ ] Excel import tested: `node scripts/import-from-excel.js manifest_new.xlsx`
  - [ ] Or seed script tested: `npm run seed`
  - [ ] Sample products visible in API

- [ ] API endpoints tested locally
  - [ ] GET /api/health → 200 OK
  - [ ] GET /api/products → products returned
  - [ ] POST /api/auth/register → user created
  - [ ] POST /api/auth/login → token returned
  - [ ] GET /api/auth/me → user data returned
  - [ ] POST /api/cart → item added to cart
  - [ ] POST /api/checkout → order created

## Phase 2: Prepare for Vercel Deployment

- [ ] All API routes migrated to Supabase
  - [ ] Products routes ✓
  - [ ] Auth routes ✓
  - [ ] Cart routes ✓
  - [ ] Checkout route ✓
  - [ ] Orders routes ✓
  - [ ] Health check ✓
  - [ ] Reviews routes (PENDING)
  - [ ] Payments routes (PENDING)
  - [ ] Webhooks routes (PENDING)
  - [ ] Admin routes (PENDING)
  - [ ] Email routes (PENDING)

- [ ] Scripts updated
  - [ ] seed.js migrated to Supabase (PENDING)
  - [ ] import-from-excel.js migrated to Supabase (PENDING)

- [ ] No references to mongoose in codebase
  ```bash
  grep -r "mongoose" --include="*.js" --include="*.jsx" app/
  grep -r "connectDB" --include="*.js" --include="*.jsx" app/ | grep -v "lib/db.js"
  ```

- [ ] No references to Bull/local Redis in routes
  ```bash
  grep -r "bull" --include="*.js" app/
  grep -r "redis.create" --include="*.js" app/
  ```

- [ ] Environment variables documented
  - [ ] `.env.example` created with all required variables
  - [ ] Sensitive keys noted (Service Role Key, Redis Token)

- [ ] Git repository clean
  ```bash
  git status
  ```
  - [ ] All changes committed
  - [ ] No uncommitted files

## Phase 3: Vercel Project Setup

- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] New project created from repository
  - [ ] Framework: Next.js
  - [ ] Build command: `npm run build`
  - [ ] Install command: `npm install --legacy-peer-deps`
  - [ ] Development command: `npm run dev`

## Phase 4: Vercel Environment Variables

- [ ] All environment variables added to Vercel project settings
  - [ ] Under "Settings" → "Environment Variables"
  - [ ] Added for all environments (Production, Preview, Development)
  - [ ] Verified sensitive keys are not public

  Required variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  STRIPE_SECRET_KEY
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  PAYPAL_CLIENT_ID
  PAYPAL_CLIENT_SECRET
  GMAIL_USER
  GMAIL_APP_PASSWORD
  JWT_SECRET
  EMAIL_MAX_RETRIES
  ```

## Phase 5: Test Vercel Deployment

- [ ] Build test successful
  - [ ] Check Vercel deployment logs
  - [ ] No build errors
  - [ ] Build time acceptable

- [ ] Preview URL accessible
  - [ ] Health check endpoint works: `/api/health`
  - [ ] Homepage loads
  - [ ] Products API returns data
  - [ ] Authentication works
  - [ ] Cart operations work

- [ ] Supabase connection verified
  - [ ] Data persists between requests
  - [ ] User registration creates database records
  - [ ] Orders are stored in database

## Phase 6: Production Deployment

- [ ] Final testing on preview URL
  - [ ] All endpoints working
  - [ ] Payment flow tested (Stripe test card: 4242 4242 4242 4242)
  - [ ] Email sending tested (if configured)
  - [ ] Image uploads working

- [ ] Domain configured (if using custom domain)
  - [ ] Domain DNS records set
  - [ ] SSL certificate enabled
  - [ ] Redirects configured

- [ ] Monitoring setup
  - [ ] Vercel analytics enabled
  - [ ] Supabase monitoring dashboard accessed
  - [ ] Error logging configured

- [ ] Backup strategy confirmed
  - [ ] Supabase daily backups enabled
  - [ ] Redis backups configured (if paid plan)
  - [ ] Disaster recovery plan documented

- [ ] Promote to production
  - [ ] Merge to main branch
  - [ ] Vercel automatically deploys to production
  - [ ] Production URL accessible
  - [ ] DNS updated if needed

## Phase 7: Post-Deployment

- [ ] Monitor production deployment
  - [ ] Check error logs hourly
  - [ ] Monitor database query performance
  - [ ] Monitor Redis queue status
  - [ ] Monitor API response times

- [ ] Real product data migration (if not done yet)
  - [ ] Export old MongoDB data (if applicable)
  - [ ] Transform to CSV format
  - [ ] Import via Supabase UI or script
  - [ ] Verify data integrity

- [ ] Notify users
  - [ ] Send system migration notice (if self-hosted before)
  - [ ] Announce new features
  - [ ] Gather feedback

- [ ] Performance optimization
  - [ ] Enable image optimization (Next.js Image component)
  - [ ] Enable caching headers
  - [ ] Optimize Supabase queries
  - [ ] Configure Redis caching for frequently accessed data

- [ ] Security hardening
  - [ ] Enable Row Level Security (RLS) in Supabase
  - [ ] Configure authentication policies
  - [ ] Set up API rate limiting
  - [ ] Enable CORS restrictions

## Phase 8: Ongoing Maintenance

- [ ] Weekly monitoring
  - [ ] Check error logs
  - [ ] Review performance metrics
  - [ ] Verify backups completed

- [ ] Monthly maintenance
  - [ ] Update dependencies
  - [ ] Review security advisories
  - [ ] Optimize slow queries
  - [ ] Clean up old logs

- [ ] Quarterly review
  - [ ] Capacity planning (database storage, bandwidth)
  - [ ] Cost analysis
  - [ ] Performance benchmarking
  - [ ] Security audit

## Troubleshooting During Deployment

### Build Fails with "MODULE_NOT_FOUND"
- Ensure `npm install --legacy-peer-deps` runs successfully
- Check `.gitignore` doesn't exclude necessary files

### Health Check Endpoint 503
- Verify Supabase environment variables are set in Vercel
- Check database status in Supabase dashboard
- Check firewall/IP whitelist settings

### Users can't log in
- Verify password hashing is working (bcryptjs)
- Check database schema (users table exists)
- Verify JWT_SECRET is consistent across all environments

### Cart items not persisting
- Check Supabase database triggers are executing
- Verify cart_items table has data
- Check for cascading delete issues

### Slow product listing
- Add database indexes (already in schema)
- Consider enabling query caching
- Check Supabase query plan in dashboard

### Out of memory errors
- Check Redis connection limit
- Consider upgrading Upstash plan
- Implement connection pooling

## Cost Monitoring

### Monthly Cost Estimate
- **Supabase Pro**: $25
- **Upstash Pro**: $20 (estimate)
- **Vercel Pro**: $20
- **Total**: ~$65/month

Monitor actual usage:
- Supabase: Check storage and bandwidth usage
- Upstash: Check commands/day (free tier: 10,000/day)
- Vercel: Check function invocations and bandwidth

## Rollback Plan

If deployment fails or critical issues arise:

1. **Immediate**: Revert code to last working commit
2. **Database**: Restore from Supabase backup
3. **Cache**: Clear Redis cache via dashboard
4. **Vercel**: Redeploy from previous successful build

Steps:
```bash
# Rollback code
git revert [commit-hash]
git push

# Vercel will automatically redeploy

# If needed, manually trigger deployment
# Go to Vercel dashboard → Deployments → Redeploy
```

## Success Criteria

- ✅ Application loads without errors
- ✅ All API endpoints respond correctly
- ✅ User registration/login works
- ✅ Products are searchable and browsable
- ✅ Shopping cart persists across sessions
- ✅ Checkout creates orders
- ✅ Payment processing works (Stripe test)
- ✅ Database queries are performant
- ✅ Background jobs (emails) process
- ✅ Admin dashboard accessible
- ✅ Error tracking in place
- ✅ Monitoring configured

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Status**: ○ In Progress  ○ Complete  ○ Failed

**Notes**:
```
[Document any issues, deviations, or important notes here]
```

---

For detailed setup instructions, see [SUPABASE_VERCEL_MIGRATION.md](./SUPABASE_VERCEL_MIGRATION.md)

# Deployment Guide

## Prerequisites

- **Supabase** project (free tier works for development)
- **Vercel** account
- **Upstash** Redis instance
- **Stripe** account (for card payments)
- **Node.js** 20+ (for local development)

Optional (Romanian market integrations):
- **Revolut Business** account
- **PayPal Business** account
- **Sameday** courier account
- **Oblio.eu** account (invoicing)

## 1. Database Setup (Supabase)

1. Create a new project at [app.supabase.com](https://app.supabase.com)
2. Go to **SQL Editor** in the Supabase dashboard
3. Run the schema migration:
   - Open `supabase/schema.sql` from this repository
   - Paste and execute in the SQL Editor
4. Run the checkout function:
   - Open `supabase/checkout.sql`
   - Paste and execute in the SQL Editor
5. Note your project credentials from **Settings > API**:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`)

## 2. Redis Setup (Upstash)

1. Create a Redis database at [console.upstash.com](https://console.upstash.com)
2. Select the **REST API** connection type (required for Vercel Edge)
3. Note your credentials:
   - REST URL (`UPSTASH_REDIS_REST_URL`)
   - REST Token (`UPSTASH_REDIS_REST_TOKEN`)

## 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all required values. See `.env.example` for the complete list with descriptions.

3. At minimum, you need:
   - Supabase URL, anon key, and service role key
   - Upstash Redis REST URL and token
   - JWT secret (generate a secure random string)
   - Stripe keys (for card payments)
   - SMTP credentials (for transactional emails)

## 4. Local Verification

Before deploying, verify the setup works locally:

```bash
npm install
npm run dev
```

Check:
- [ ] Homepage loads at `http://localhost:3000`
- [ ] Products API responds: `http://localhost:3000/api/products`
- [ ] Auth endpoints work (register, login)
- [ ] Database connection is active (no Supabase errors in console)

## 5. Vercel Deployment

### Connect Repository

1. Go to [vercel.com](https://vercel.com) and import the Git repository
2. Vercel auto-detects Next.js -- no build configuration needed

### Set Environment Variables

1. In the Vercel project dashboard, go to **Settings > Environment Variables**
2. Add every variable from `.env.example` with production values
3. Key differences for production:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL` = your production domain
   - Use live Stripe keys (`pk_live_*`, `sk_live_*`) instead of test keys
   - `PAYPAL_MODE=production` with live PayPal credentials
   - `REVOLUT_ENVIRONMENT=production` with live Revolut keys
   - `SAMEDAY_ENVIRONMENT=production` with live Sameday credentials

### Deploy

1. Push to the main branch or trigger a manual deploy
2. Vercel builds and deploys automatically

## 6. Post-Deploy Configuration

### Webhook Endpoints

After deployment, configure webhook URLs with each payment provider:

| Provider | Webhook URL | Dashboard |
|----------|-------------|-----------|
| Stripe | `https://yourdomain.com/api/webhooks/stripe` | Stripe Dashboard > Developers > Webhooks |
| PayPal | `https://yourdomain.com/api/webhooks/paypal` | PayPal Developer > Webhooks |
| Revolut | `https://yourdomain.com/api/webhooks/revolut` | Revolut Business > API Settings |

### Cron Jobs

The email processing cron is configured in `vercel.json`. Verify it's active in Vercel dashboard under **Settings > Cron Jobs**.

## 7. Post-Deploy Verification

- [ ] Homepage loads correctly
- [ ] User registration and login work
- [ ] Product listing displays data
- [ ] Cart operations function
- [ ] Checkout flow completes (use Stripe test mode first if needed)
- [ ] Webhooks are received (check provider dashboards for delivery status)
- [ ] Emails are sent (check email logs in database)
- [ ] Admin dashboard is accessible (with admin account)
- [ ] Rate limiting is active (check Redis for rate limit keys)
- [ ] HTTPS is enforced on all routes

## Troubleshooting

### Common Issues

**"Failed to fetch" on API routes**
- Verify `NEXT_PUBLIC_API_URL` matches your deployment URL
- Check Vercel function logs for errors

**Database connection errors**
- Confirm Supabase URL and keys are correct
- Check if Supabase project is paused (free tier pauses after inactivity)

**Webhook failures**
- Verify webhook URLs include the full path (e.g., `/api/webhooks/stripe`)
- Check webhook secrets match between provider dashboard and environment variables
- Review Vercel function logs for webhook handler errors

**Email not sending**
- Verify SMTP credentials
- Check email logs table for error messages
- Confirm Upstash Redis is connected (email queue dependency)

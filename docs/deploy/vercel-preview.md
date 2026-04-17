# Vercel preview and production — keeping parity

Goal: preview builds (on PRs and branches) behave exactly like production. If something breaks in preview, it would have broken in production — catching it a PR early is the whole point of the preview environment.

## Required env vars per scope

Every var below must exist in **both** the Production and Preview scopes in the Vercel dashboard (`Project → Settings → Environment Variables`). Phase 1's `lib/env.js` fails boot in both scopes if any of these are missing.

### Always required (REQUIRED)

| Var | Notes |
|---|---|
| `JWT_SECRET` | 32+ random bytes. Use `openssl rand -hex 32`. **Preview may use a different secret from production** — it should, so leaked preview tokens can't impersonate production users. |
| `NEXT_PUBLIC_SUPABASE_URL` | Points at your staging Supabase project for Preview, production Supabase for Production. **Use separate projects** so PR testing doesn't pollute prod data. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Per-project anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Per-project service-role key. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO / JSON-LD / OpenGraph. If unset in Preview, `app/layout.js` falls back to `https://$VERCEL_URL` automatically — safe, just means URLs in OG tags will be the preview URL. Set it to the production domain in Production. |

### Required on Vercel deploys (PROD_REQUIRED)

Treated identically in Production and Preview so preview bugs mirror production bugs:

| Var | Notes |
|---|---|
| `UPSTASH_REDIS_REST_URL` | **Separate Upstash database for Preview** recommended — avoids Preview rate-limit counters colliding with real traffic. |
| `UPSTASH_REDIS_REST_TOKEN` | Matches the URL above. |
| `STRIPE_SECRET_KEY` | **Stripe test-mode key in Preview**, live key in Production. Never charge real cards from a PR. |
| `STRIPE_WEBHOOK_SECRET` | Separate webhook secret per scope (Stripe → Webhooks → one endpoint per env). |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Test publishable key in Preview, live publishable key in Production. |
| `CRON_SECRET` | Random token used by Vercel Cron to authenticate into `/api/cron/*`. Can be the same across scopes or different — doesn't affect user-facing traffic. |

### Optional (but recommended for Preview parity)

| Var | Notes |
|---|---|
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Use a separate Sentry project for Preview so prod dashboards stay clean. |
| `SAMEDAY_USERNAME` / `SAMEDAY_PASSWORD` / `SAMEDAY_ENVIRONMENT=sandbox` | Sandbox creds in Preview, production creds in Production. |
| `OBLIO_API_KEY` / `OBLIO_API_SECRET` | Same split. |
| `REVOLUT_API_KEY` + `REVOLUT_ENVIRONMENT=sandbox` | Sandbox keys in Preview. |
| `SMTP_*` | Use Mailtrap or a test SMTP in Preview so real customers don't get test emails. |

## Why Preview has been failing

Before this fix, Preview builds errored during `next build`:

1. `app/layout.js` threw when `NEXT_PUBLIC_SITE_URL` was unset. Now it falls back to `https://$VERCEL_URL`.
2. `lib/env.js` `assertEnv()` classified `VERCEL_ENV=preview` as non-prod and skipped `PROD_REQUIRED` checks. That was wrong — we want parity. Now preview is treated as prod-grade for validation.
3. The home page pre-renders with direct Supabase calls during build, so missing Supabase env vars in the Preview scope caused the build to crash. Code can't work around this — you must set them.

So **the code now accepts a minimal Preview config** (only the REQUIRED set, with `NEXT_PUBLIC_SITE_URL` falling back to `VERCEL_URL`), but **if you want full parity** (which we want), copy everything from Production into Preview with the scope-specific values above.

## Verifying parity

Run the audit script after changes:

```bash
VERCEL_TOKEN=$(cat ~/.vercel-token) \
  VERCEL_PROJECT=shophub \
  node scripts/check-vercel-env-parity.mjs
```

Exit code `0` = parity OK. `1` = drift (prints missing keys per scope). `2` = auth/network failure.

Get a Vercel token at <https://vercel.com/account/tokens>.

## CI wiring (future)

The check script doesn't run in CI today — the GitHub Action would need `VERCEL_TOKEN` in secrets and the right project/team IDs. Add it to `.github/workflows/ci.yml` once you're comfortable putting the token in `gh secret set`.

## Troubleshooting

- **Preview build fails with "Missing required environment variables"** — `lib/env.js` is telling you exactly what's missing per scope. Set them in Vercel.
- **Preview build succeeds but API routes 500 with Supabase errors** — Supabase keys set but pointing at wrong project, or RLS policies differ between prod and staging Supabase projects.
- **PR Stripe webhooks land in Production account** — Preview has the production Stripe keys. Split them.
- **OG image / canonical URL shows the Vercel preview URL, not the branded domain** — expected when `NEXT_PUBLIC_SITE_URL` is unset in Preview; set it explicitly if you care about accurate preview OG tags.

# Fain si Punct

Romanian ecommerce platform for wholesale-imported consumer goods.

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19
- **Database:** Supabase (PostgreSQL)
- **Cache/Queue:** Upstash Redis
- **Payments:** Stripe, PayPal, Revolut
- **Shipping:** Sameday Courier
- **Invoicing:** Oblio.eu
- **Email:** Nodemailer (SMTP)
- **Auth:** JWT (HttpOnly cookies)
- **Deploy:** Vercel

## Project Structure

```
app/            # Next.js App Router (pages + API routes)
  api/          # REST API endpoints
  auth/         # Login, register, password reset
  products/     # Product listing and detail
  cart/         # Shopping cart
  checkout/     # Checkout flow
  orders/       # Order tracking
  admin/        # Admin dashboard
components/     # React components
lib/            # Core libraries
  supabase.js   # Supabase client
  auth.js       # JWT auth helpers
  revolut.js    # Revolut payments
  oblio.js      # Romanian invoicing
  sameday.js    # Sameday courier
middleware.js   # Edge middleware (auth guards, rate limiting)
supabase/       # Database schema + functions
scripts/        # Data import and seeding
seo/            # SEO audit, keywords, brand voice
styles/         # CSS modules
__tests__/      # Jest tests
```

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project
- Upstash Redis instance

### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/dturcu/Fain-si-Punct.git
   cd Fain-si-Punct
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase, Upstash, and payment provider credentials
   ```

3. Initialize database:
   - Run `supabase/schema.sql` in Supabase SQL Editor
   - Run `supabase/checkout.sql` for transactional checkout function

4. Start development:
   ```bash
   npm run dev
   ```

### Data Import

Import products from Excel:
```bash
npm run import -- manifest_new.xlsx
```

Seed test data:
```bash
npm run seed
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `/api/auth/*` | Login, register, password reset |
| `/api/products/*` | Product listing, detail, categories |
| `/api/cart/*` | Cart CRUD |
| `/api/checkout` | Transactional checkout |
| `/api/orders/*` | Order management |
| `/api/payments/*` | Payment intent creation |
| `/api/webhooks/*` | Stripe, PayPal, Revolut webhooks |
| `/api/shipping/*` | Sameday courier integration |
| `/api/billing/*` | Oblio invoicing |

## Payment Methods

- **Card** (via Stripe)
- **Revolut Pay**
- **PayPal**
- **Ramburs** (cash on delivery)

## Environment Variables

See `.env.example` for all required configuration.

## License

Private

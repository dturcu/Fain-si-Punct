# Architecture

## System Overview

```
Client (Browser)
    |
    v
Vercel Edge Network
    |
    v
middleware.js
  - Auth guards (JWT verification)
  - Rate limiting (Upstash Redis sliding window)
  - Input sanitization
  - CSP / CORS headers
    |
    v
Next.js App Router
  - API Routes (app/api/)
  - Server Components (app/)
    |
    +---> Supabase PostgreSQL (data)
    +---> Upstash Redis (cache, job queue)
    +---> Stripe API (card payments)
    +---> Revolut Business API (RON payments)
    +---> PayPal SDK (PayPal payments)
    +---> Sameday API (courier/AWB)
    +---> Oblio API (invoicing/e-factura)
    +---> SMTP (transactional email)
```

## Authentication

Cookie-only JWT implementation. No localStorage tokens.

- **Algorithm:** HS256
- **Storage:** HttpOnly cookie, Secure flag, SameSite=Lax
- **Guest sessions:** Separate `guest_session` cookie for anonymous cart persistence
- **Session resolution:** `getSessionContext()` in `lib/auth.js` resolves authenticated user or guest session from the request
- **Token lifecycle:** Issued on login/register, cleared on logout, verified on every authenticated request via Edge middleware
- **Admin routes:** Protected by additional role check in middleware after JWT verification

## Database

Supabase PostgreSQL with 13 tables. Schema defined in `supabase/schema.sql`.

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts, bcrypt password hashes, roles |
| `products` | Product catalog with categories, pricing, stock |
| `orders` | Order records with status tracking |
| `order_items` | Line items per order |
| `payments` | Payment records (all providers) |
| `reviews` | Product reviews with ratings |
| `carts` | User and guest shopping carts |
| `cart_items` | Cart line items |
| `email_logs` | Transactional email audit trail |

### Transactional Checkout

The `process_checkout` RPC function in `supabase/checkout.sql` handles checkout atomically:

1. Validates cart items and stock availability
2. Creates order and order_items records
3. Decrements product stock
4. Clears the cart
5. Returns order details

All steps execute in a single database transaction. If any step fails, the entire operation rolls back.

## Payment Flow

### Payment Method Enum

Unified across the codebase: `card`, `revolut`, `paypal`, `ramburs`

### Provider Mapping

| Method | Provider | Integration |
|--------|----------|-------------|
| `card` | Stripe | Payment Intents API, Stripe Elements on client |
| `revolut` | Revolut Business | Revolut Checkout API, RON currency |
| `paypal` | PayPal | Orders API, PayPal SDK buttons on client |
| `ramburs` | None (COD) | Marked as paid on delivery confirmation |

### Flow

1. Client selects payment method during checkout
2. API creates payment intent with the corresponding provider
3. Client completes payment via provider's UI (Stripe Elements, Revolut widget, PayPal buttons)
4. Provider sends webhook to confirm payment status
5. Webhook handler updates payment and order records
6. For `ramburs` (COD): order is created with pending payment, marked paid when courier confirms delivery

### Webhook Endpoints

- `/api/webhooks/stripe` -- Stripe signature verification via `STRIPE_WEBHOOK_SECRET`
- `/api/webhooks/paypal` -- PayPal webhook verification
- `/api/webhooks/revolut` -- Revolut webhook verification via `REVOLUT_WEBHOOK_SECRET`

## Email Pipeline

Three-stage asynchronous email delivery:

1. **Enqueue:** API route pushes email job to Upstash Redis queue with template ID and context data
2. **Process:** Vercel cron job (`api/cron/process-emails`) polls the queue, renders templates, sends via Nodemailer SMTP
3. **Log:** Delivery status recorded in `email_logs` table

### Components

- **Queue:** Upstash Redis list with configurable retry (max 4 attempts)
- **Transport:** Nodemailer with SMTP (configurable host/port/auth)
- **Templates:** Located in `lib/templates/` -- order confirmation, password reset, welcome email, etc.
- **Cron trigger:** Vercel cron invokes the processing endpoint on schedule

## Romanian Integrations

### Revolut (Payments)

- RON currency support for the Romanian market
- Revolut Business API for payment creation and capture
- Configuration: `REVOLUT_API_KEY`, `REVOLUT_ENVIRONMENT` (sandbox/production), `NEXT_PUBLIC_REVOLUT_PUBLIC_ID`
- Implementation: `lib/revolut.js`

### Sameday Courier (Shipping)

- Romanian courier service for domestic delivery
- AWB (airway bill) generation for shipments
- Pickup point and service configuration
- Configuration: `SAMEDAY_USERNAME`, `SAMEDAY_PASSWORD`, `SAMEDAY_ENVIRONMENT`, `SAMEDAY_PICKUP_POINT_ID`, `SAMEDAY_SERVICE_ID`
- Implementation: `lib/sameday.js`

### Oblio (Invoicing)

- Romanian e-factura compliant invoicing
- Automatic invoice generation on order completion
- Configuration: `OBLIO_API_KEY`, `OBLIO_API_SECRET`, `OBLIO_COMPANY_CIF`
- Implementation: `lib/oblio.js`

## Rate Limiting

Upstash Redis sliding window algorithm, enforced in Edge middleware (`middleware.js`).

### Thresholds

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Login | 10 requests | 15 minutes |
| Register | 5 requests | 1 hour |
| Checkout | 10 requests | 1 hour |
| Payments | 20 requests | 1 hour |
| Reviews | 30 requests | 1 hour |
| General API | 100 requests | 15 minutes |

Rate limit state is keyed by IP address. Exceeded limits return `429 Too Many Requests`.

## Security

### Headers

- **CSP:** Content Security Policy restricting script sources, frame ancestors, and form actions
- **CORS:** Configured for the application domain only

### Input Protection

- XSS sanitization on all user inputs (`middleware/input-sanitizer.js`)
- General input validation with schema-based payload checking
- Request payload size limit (configurable via `MAX_PAYLOAD_SIZE`)

### Authentication Security

- Passwords hashed with bcrypt (salt rounds configured server-side)
- JWT tokens in HttpOnly cookies (not accessible to JavaScript)
- Secure flag enforced in production (HTTPS only)
- SameSite=Lax prevents CSRF in cross-origin contexts

### Route Protection

- Edge middleware verifies JWT on all `/api/*` routes except public endpoints
- Admin routes (`/admin/*`, `/api/admin/*`) require `role: 'admin'` in JWT payload
- Guest routes (cart, product browsing) fall back to guest session

# Payment Integration Setup Guide

This document provides comprehensive setup and configuration instructions for the Payment Integration Phase of the ecommerce platform.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Stripe Setup](#stripe-setup)
4. [PayPal Setup](#paypal-setup)
5. [Database Setup](#database-setup)
6. [API Routes](#api-routes)
7. [Webhook Configuration](#webhook-configuration)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Overview

The payment integration supports two payment methods:
- **Stripe**: For credit/debit card payments
- **PayPal**: For PayPal and alternative payment methods

### Architecture

```
User → PaymentForm (React Component)
  ├── Stripe Method
  │   ├── createPaymentIntent (API) → Stripe
  │   ├── Stripe Elements (Client-side)
  │   └── confirmPayment (API) → Stripe
  │
  └── PayPal Method
      ├── createPayPalOrder (API) → PayPal
      ├── PayPal SDK Buttons (Client-side)
      └── captureOrder (API) → PayPal

Payment Records → Database
Webhooks → Webhook handlers → Order status updates
```

---

## Environment Variables

### Required Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY

# PayPal Configuration
PAYPAL_MODE=sandbox  # Use 'sandbox' for testing, 'production' for live
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_CLIENT_SECRET
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000  # Update in production

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your-jwt-secret-key-change-in-production
```

### Variable Descriptions

| Variable | Type | Description |
|----------|------|-------------|
| `STRIPE_PUBLIC_KEY` | String | Stripe publishable key for client-side use |
| `STRIPE_SECRET_KEY` | String | Stripe secret key (server-side only) |
| `STRIPE_WEBHOOK_SECRET` | String | Secret for verifying Stripe webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | String | Public key exposed to frontend |
| `PAYPAL_MODE` | String | 'sandbox' for testing, 'production' for live |
| `PAYPAL_CLIENT_ID` | String | PayPal Client ID for authentication |
| `PAYPAL_CLIENT_SECRET` | String | PayPal Client Secret (server-side only) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | String | Public Client ID for frontend SDK |
| `NEXT_PUBLIC_API_URL` | String | Your application's base URL |

---

## Stripe Setup

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete email verification
3. Set up your account details

### 2. Get API Keys

1. Navigate to Dashboard → Developers → API Keys
2. You'll see two key sets:
   - **Publishable Key** (`pk_test_...`) - Safe to expose in frontend
   - **Secret Key** (`sk_test_...`) - Keep secret, server-side only

3. Copy both keys to `.env.local`:
   ```bash
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
   ```

### 3. Enable Webhooks

For webhook handling, you need to create a webhook endpoint:

1. Go to Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the webhook secret and add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 4. Stripe CLI for Local Testing

Install Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
# macOS:
brew install stripe/stripe-cli/stripe

# Linux/Windows: Download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
```

### 5. Test Card Numbers

Use these card numbers in test mode:

| Card Type | Number | Expiry | CVC |
|-----------|--------|--------|-----|
| Success | 4242 4242 4242 4242 | Any future | Any 3 digits |
| Decline | 4000 0000 0000 0002 | Any future | Any 3 digits |
| Requires 3D Secure | 4000 2500 0003 4010 | Any future | Any 3 digits |

---

## PayPal Setup

### 1. Create PayPal Account

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Click "Sign Up" and create an account
3. Verify your email

### 2. Get API Credentials

1. Navigate to Apps & Credentials
2. Make sure "Sandbox" is selected (for testing)
3. Under "Accounts", create a Business account:
   - Click "Create Account"
   - Select "Business" account type
   - Note the email (you'll use this to login in sandbox)

4. Get your credentials:
   - **Sandbox Client ID** - Copy and add to `.env.local`:
     ```bash
     PAYPAL_CLIENT_ID=Sandbox_ClientID
     NEXT_PUBLIC_PAYPAL_CLIENT_ID=Sandbox_ClientID
     ```
   - **Sandbox Secret** - Copy and add to `.env.local`:
     ```bash
     PAYPAL_CLIENT_SECRET=Sandbox_Secret
     ```

### 3. Enable Webhooks

1. Go to Apps & Credentials → Sandbox
2. Under "Accounts", click on your Business account
3. Go to "Webhook Preferences"
4. Click "Add Webhook"
5. Enter webhook URL: `https://yourdomain.com/api/webhooks/paypal`
6. Select events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
7. Copy the webhook ID (if needed) to `.env.local`

### 4. Test with Sandbox Accounts

PayPal provides test accounts:

1. Go to Apps & Credentials → Sandbox
2. Under "Accounts", you'll see:
   - **Business Account**: Use to receive payments
   - **Personal Account**: Use as buyer

3. Login to [sandbox.paypal.com](https://sandbox.paypal.com) with test account email
4. Test account emails follow pattern: `sb-xxxxx@business.example.com`

### 5. Set Environment

```bash
PAYPAL_MODE=sandbox  # for testing
```

For production:
```bash
PAYPAL_MODE=production
PAYPAL_CLIENT_ID=Live_ClientID
PAYPAL_CLIENT_SECRET=Live_Secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=Live_ClientID
```

---

## Database Setup

### Payment Model Indexes

The Payment model includes the following indexes for optimal query performance:

```javascript
// Created automatically:
- { orderId: 1, type: 1 }
- { externalId: 1 }
- { status: 1, type: 1 }
- { createdAt: 1 }
```

### MongoDB Collections

**payments** collection structure:
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,           // Reference to Order
  type: 'stripe' | 'paypal',
  externalId: String,          // Stripe PI ID or PayPal Order ID
  amount: Number,              // In cents
  currency: String,            // USD, EUR, etc.
  status: 'pending' | 'processing' | 'succeeded' | 'failed',
  paymentMethod: String,       // 'card' or 'paypal'
  metadata: Object,            // Additional data
  webhookVerified: Boolean,    // Safety flag
  errorMessage: String,        // Error details if failed
  retryCount: Number,          // Number of retry attempts
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Routes

### POST /api/payments/create-intent

Create a payment intent for Stripe or PayPal.

**Request:**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "method": "stripe" | "paypal"
}
```

**Response (Stripe):**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "publicKey": "pk_test_xxx"
}
```

**Response (PayPal):**
```json
{
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "paypalOrderId": "3SZ70Z4Z...",
  "clientId": "AEj..."
}
```

### POST /api/payments/confirm

Confirm a payment after client-side processing.

**Request:**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "paymentMethod": "stripe" | "paypal",
  "paymentIntentId": "pi_xxx",     // For Stripe
  "paypalOrderId": "3SZ70Z4Z..."   // For PayPal
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "507f1f77bcf86cd799439011",
  "paymentStatus": "paid",
  "message": "Payment confirmed successfully"
}
```

### POST /api/webhooks/stripe

Handle Stripe webhook events (automatic).

**Events handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

### POST /api/webhooks/paypal

Handle PayPal IPN/webhook events (automatic).

**Events handled:**
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`

---

## Webhook Configuration

### Stripe Webhooks

Stripe webhooks are verified using HMAC signatures. The verification is automatic:

```javascript
// In /api/webhooks/stripe/route.js
const event = constructWebhookEvent(body, signature)
```

**Webhook Flow:**
1. Stripe sends POST to your webhook endpoint with signature header
2. Backend verifies signature using `STRIPE_WEBHOOK_SECRET`
3. Payment record is updated
4. Order status is synchronized

### PayPal Webhooks

PayPal uses IPN (Instant Payment Notification). Note that PayPal webhooks require additional verification:

```javascript
// Simplified in /api/webhooks/paypal/route.js
// In production, use full verification with PayPal API
```

**Webhook Flow:**
1. PayPal sends POST to your webhook endpoint
2. Webhook is parsed and matched to payment record
3. Payment and order records are updated

---

## Testing

### Local Testing Setup

1. **Start MongoDB:**
   ```bash
   mongod
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create test .env.local:**
   ```bash
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...

   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=Sandbox_...
   PAYPAL_CLIENT_SECRET=Sandbox_...
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=Sandbox_...

   NEXT_PUBLIC_API_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=test-secret
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Test Stripe locally (in another terminal):**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Testing Stripe Payments

1. Navigate to checkout page
2. Select "Credit/Debit Card" payment method
3. Click "Create Order" or similar
4. In payment form, use test card: `4242 4242 4242 4242`
5. Any future expiry date and CVC
6. Complete payment
7. Verify payment shows as "succeeded"

### Testing PayPal Payments

1. Navigate to checkout page
2. Select "PayPal" payment method
3. Click PayPal button
4. You'll be redirected to PayPal sandbox login
5. Login with sandbox buyer account
6. Approve payment
7. Verify payment shows as "paid"

### Testing Error Scenarios

**Stripe Decline:**
- Use card: `4000 0000 0000 0002`
- Should trigger `payment_intent.payment_failed` webhook

**PayPal Decline:**
- Use buyer account with insufficient funds (in sandbox)
- Should trigger `PAYMENT.CAPTURE.DENIED` webhook

### Manual Testing Checklist

- [ ] Create order via checkout API
- [ ] Create Stripe payment intent
- [ ] Complete Stripe payment with test card
- [ ] Verify payment webhook received
- [ ] Verify order status updated to 'paid'
- [ ] Create PayPal order
- [ ] Complete PayPal payment with sandbox account
- [ ] Verify PayPal webhook received
- [ ] Test error handling for failed payments
- [ ] Test idempotent webhook processing
- [ ] Verify no duplicate payments on retry

---

## Deployment

### Pre-Deployment Checklist

- [ ] Obtain live Stripe keys
  - Go to Settings → API Keys (Live)
  - Copy live Publishable and Secret keys

- [ ] Obtain live PayPal keys
  - Switch to Production in PayPal Developer Dashboard
  - Copy live Client ID and Secret

- [ ] Configure environment variables on hosting platform
  - Add all `.env.local` variables to production environment

- [ ] Update webhooks in Stripe Dashboard
  - Change webhook endpoint URL to production domain
  - Update webhook secret if needed

- [ ] Update webhooks in PayPal
  - Change webhook URL to production domain

- [ ] Update NEXT_PUBLIC_API_URL
  - Change from `http://localhost:3000` to production domain

### Production Environment Variables

```bash
# Stripe (LIVE)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (production)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...

# PayPal (LIVE)
PAYPAL_MODE=production
PAYPAL_CLIENT_ID=Live_...
PAYPAL_CLIENT_SECRET=Live_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=Live_...

# General
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### Post-Deployment Verification

1. **Test Stripe payment** with real card (use $0.01 charge and refund)
2. **Test PayPal payment** with live account
3. **Verify webhooks** are being received:
   - Check Stripe Dashboard → Logs
   - Check PayPal IPN History
4. **Monitor error logs** for any issues
5. **Set up alerts** for failed payments

---

## Troubleshooting

### Stripe Issues

**"Invalid API Key"**
- Verify `STRIPE_SECRET_KEY` is correct
- Ensure it's not accidentally using public key

**"Webhook signature verification failed"**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure webhook endpoint is accessible
- Check that endpoint accepts POST requests

**"Payment intent not found"**
- Verify payment was created before payment element rendered
- Check database for payment record

### PayPal Issues

**"Invalid Client ID"**
- Verify `PAYPAL_CLIENT_ID` is correct
- Check if sandbox/production mode matches

**"Order not found"**
- Ensure order was created with correct ID format
- Verify order exists in database

**"Webhooks not received"**
- Verify webhook URL is accessible from PayPal servers
- Check firewall/security group rules
- Enable webhooks in PayPal dashboard

### General Issues

**"Authentication failed"**
- Verify JWT token is being sent in Authorization header
- Check token hasn't expired

**"Order status not updating"**
- Verify webhook is being received (check logs)
- Check webhook handler is executing
- Verify database connection is working

---

## Security Considerations

1. **Never commit API keys** - Always use environment variables
2. **Verify webhook signatures** - Always verify webhooks are from Stripe/PayPal
3. **Use HTTPS** - All endpoints must use HTTPS in production
4. **PCI Compliance** - Never handle raw card data, always use Stripe/PayPal
5. **Rate limiting** - Implement rate limiting on payment endpoints
6. **Logging** - Log all payment events but never log sensitive data
7. **Error messages** - Don't expose payment details in error messages

---

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/elements)
- [PayPal Integration](https://developer.paypal.com/docs/checkout/)
- [PayPal SDK Reference](https://developer.paypal.com/sdk/js/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Last Updated:** 2026-03-17
**Version:** 1.0

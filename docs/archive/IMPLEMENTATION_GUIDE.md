# Ecommerce Platform - Feature Implementation Guide

## Overview
This document tracks the implementation of 3 major features for the ecommerce platform:
1. **Payment Integration** (Stripe + PayPal)
2. **Reviews & Ratings System**
3. **Email Notifications** (Gmail SMTP)

## Architecture

### Phase 1: Payment Integration (Stripe + PayPal)
**Status:** In Progress
**Estimated Duration:** 30-37 hours
**Owner:** Agent-Payment

**Components:**
- Payment model and database schema
- Stripe API integration with webhook handling
- PayPal integration with express checkout
- Payment confirmation and error handling
- Checkout page with dual payment methods
- Order confirmation pages

**Files to Create:**
- `models/Payment.js`
- `models/PaymentMethod.js` (for tracking user's saved payment methods)
- `app/api/payments/create-intent/route.js`
- `app/api/payments/confirm/route.js`
- `app/api/payments/stripe-webhook/route.js`
- `app/api/payments/paypal-webhook/route.js`
- `app/api/orders/[id]/page.js` (order confirmation)
- `lib/stripe.js` (Stripe utility)
- `lib/paypal.js` (PayPal utility)
- `components/PaymentForm.js`
- `components/StripeCheckout.js`
- `components/PayPalCheckout.js`

**Files to Modify:**
- `models/Order.js` (add payment fields)
- `app/checkout/page.js` (integrate payment forms)
- `app/api/checkout/route.js` (require payment)

**Environment Variables Needed:**
```
# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...

# General
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Database Changes:**
```javascript
// Payment collection
{
  orderId: ObjectId,
  type: 'stripe' | 'paypal',
  externalId: String,
  amount: Number,
  currency: String,
  status: 'pending' | 'processing' | 'succeeded' | 'failed',
  paymentMethod: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date,
  webhookVerified: Boolean
}

// Order model additions
{
  paymentId: ObjectId,
  paymentStatus: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded',
  paymentMethod: 'stripe' | 'paypal',
  paidAt: Date
}
```

**Testing Checklist:**
- [ ] Create Stripe test payment intent
- [ ] Handle Stripe payment success/failure
- [ ] Verify Stripe webhook signature
- [ ] Create PayPal transaction
- [ ] Handle PayPal IPN webhook
- [ ] Process refunds
- [ ] Error handling and retry logic
- [ ] Test card numbers (Stripe)
- [ ] Test accounts (PayPal sandbox)

---

### Phase 2: Reviews & Ratings System
**Status:** Pending
**Estimated Duration:** 23-28 hours
**Owner:** Agent-Reviews

**Components:**
- Review model with ratings
- Review API endpoints (CRUD)
- Review aggregation (avg rating, count)
- Frontend review components
- Review moderation and verification

**Files to Create:**
- `models/Review.js`
- `app/api/products/[id]/reviews/route.js`
- `app/api/reviews/[id]/route.js`
- `app/api/reviews/[id]/helpful/route.js`
- `components/ReviewForm.js`
- `components/ReviewList.js`
- `components/StarRating.js`
- `lib/review-stats.js` (aggregation)

**Files to Modify:**
- `models/Product.js` (update rating calculation)
- `app/products/[id]/page.js` (display reviews)
- `app/api/products/[id]/route.js` (include review stats)

**Environment Variables:** None needed

**Database Changes:**
```javascript
// Review collection
{
  productId: ObjectId,  // indexed
  userId: ObjectId,     // indexed
  orderId: ObjectId,    // verify purchase
  rating: Number (1-5), // indexed
  title: String,
  comment: String,
  verified: Boolean,    // purchased flag
  helpful: Number,      // upvote count
  createdAt: Date,
  updatedAt: Date
}

// Unique index: (productId, userId)
// Indexes: productId, rating, createdAt

// Product model additions
{
  avgRating: Number,
  reviewCount: Number,
  ratingDistribution: { 5: 10, 4: 8, 3: 2, 2: 0, 1: 0 }
}
```

**Testing Checklist:**
- [ ] Create review for purchased product
- [ ] Prevent duplicate reviews (same user, product)
- [ ] Verify purchase before showing review form
- [ ] Calculate average rating correctly
- [ ] Filter helpful/unhelpful votes
- [ ] Update product rating on review changes
- [ ] Pagination for review list
- [ ] Sort by helpful, recent, rating

---

### Phase 3: Email Notifications
**Status:** Pending
**Estimated Duration:** 18-23 hours
**Owner:** Agent-Email

**Components:**
- Email service integration (Gmail SMTP)
- Email templates for different events
- Email queue and sending logic
- User email preferences
- Email logging and tracking

**Files to Create:**
- `lib/email.js` (email service)
- `lib/templates/order-confirmation.js`
- `lib/templates/shipping-update.js`
- `lib/templates/password-reset.js`
- `lib/templates/welcome.js`
- `models/EmailLog.js`
- `app/api/emails/send/route.js`
- `app/api/users/[id]/preferences/route.js`
- `components/EmailPreferences.js`

**Files to Modify:**
- `models/User.js` (add email preferences)
- `models/Order.js` (add email tracking)
- `app/api/orders/[id]/status/route.js` (send notifications)
- `app/api/checkout/route.js` (send confirmation)
- `app/admin/orders/page.js` (add email controls)

**Environment Variables Needed:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SENDER_EMAIL=noreply@yourecommerce.com
SENDER_NAME=ShopHub

# Optional
MAILGUN_DOMAIN=...
MAILGUN_API_KEY=...
SENDGRID_API_KEY=...
```

**Database Changes:**
```javascript
// User model additions
{
  emailPreferences: {
    orderConfirmation: Boolean,
    shippingUpdates: Boolean,
    promotions: Boolean,
    newsletter: Boolean,
    updatedAt: Date
  }
}

// EmailLog collection
{
  recipient: String,
  type: 'order_confirmation' | 'shipping_update' | 'password_reset' | 'welcome',
  orderId: ObjectId,
  userId: ObjectId,
  subject: String,
  sentAt: Date,
  status: 'sent' | 'failed' | 'bounced',
  error: String,
  metadata: Object,
  createdAt: Date
}
```

**Testing Checklist:**
- [ ] Send test email via Gmail SMTP
- [ ] Render email templates with variables
- [ ] Handle SMTP errors gracefully
- [ ] Queue emails for async sending
- [ ] Log all email sends
- [ ] Honor user email preferences
- [ ] Verify user can update preferences
- [ ] Admin can manually resend emails
- [ ] Test with real email addresses

---

## Implementation Order

1. **Phase 1 - Payments** (Foundation for orders)
2. **Phase 2 - Reviews** (Independent, enhances products)
3. **Phase 3 - Email** (Depends on payments & orders)

All phases can run in parallel for most tasks.

---

## Git Workflow

**Branch:** `claude/setup-ecommerce-repo-F2HVM`

**Commits per Phase:**
1. Payment integration commits
2. Reviews system commits
3. Email notification commits

Each commit should be atomic and well-documented.

---

## Testing Strategy

### Local Development
```bash
# Install all dependencies first
npm install

# Stripe: Use test keys and test card numbers
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# PayPal: Use sandbox accounts
PAYPAL_MODE=sandbox

# Email: Use mailtrap.io for testing
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=465
SMTP_USER=...
SMTP_PASS=...

# Database: Use local MongoDB or test instance
MONGODB_URI=mongodb://localhost:27017/ecommerce_test
```

### Testing Tools
- **Stripe:** stripe/stripe-cli for webhook testing
- **PayPal:** Developer Sandbox
- **Email:** mailtrap.io (captures emails without sending)
- **Database:** MongoDB Compass for inspection

### Test Card Numbers (Stripe)
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 2500 0003 4010

---

## Deployment Checklist

### Before Going Live
- [ ] Replace test keys with production keys
- [ ] Configure real SMTP credentials
- [ ] Update NEXT_PUBLIC_API_URL to production domain
- [ ] Enable Stripe webhooks for production
- [ ] Enable PayPal webhooks for production
- [ ] Configure email sender domain (DKIM, SPF)
- [ ] Set up email rate limiting
- [ ] Test full payment flow in production
- [ ] Set up error monitoring/logging
- [ ] Configure backups for email logs
- [ ] Document recovery procedures

---

## Development Notes

### Security Considerations
1. **Never commit API keys** - Use environment variables
2. **Verify webhooks** - Always check signatures
3. **PCI Compliance** - Use Stripe/PayPal (don't store card data)
4. **SMTP Security** - Use app passwords, not main account
5. **Email Headers** - Add SPF/DKIM to prevent spoofing
6. **Review Spam** - Consider moderation queue

### Performance Optimization
1. **Email Queue** - Use Bull or Bee-Queue for async emails
2. **Review Aggregation** - Cache ratings, batch updates
3. **Payment Webhooks** - Use message queue for high volume
4. **Database Indexes** - Create all indexes before launch

### Error Handling
1. **Payment Failures** - Implement retry logic with exponential backoff
2. **Email Failures** - Queue failed emails, retry with delay
3. **Webhook Failures** - Store and replay webhooks
4. **Database Failures** - Connection pooling and error recovery

---

## Monitoring & Maintenance

### Key Metrics to Track
- Payment success rate
- Average review rating by category
- Email delivery rate
- Failed payment count
- Review moderation queue size

### Regular Tasks
- Monitor failed emails and retry
- Review payment disputes/chargebacks
- Moderate reviews for inappropriate content
- Backup email logs
- Update payment and email service dependencies

---

## References

- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Integration](https://developer.paypal.com)
- [Nodemailer](https://nodemailer.com)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)

---

**Last Updated:** 2026-03-17
**Status:** Implementation in progress

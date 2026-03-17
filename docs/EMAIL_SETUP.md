# Email Notification System - Setup & Documentation

## Overview

The ShopHub ecommerce platform includes a comprehensive email notification system built with Nodemailer and Gmail SMTP. This system handles transactional emails, order notifications, shipping updates, and user preferences management.

## Features

- **Transactional Emails**: Order confirmations, shipping notifications, password resets, welcome emails
- **Email Templates**: Responsive, branded HTML templates for each email type
- **Email Preferences**: Users can customize which emails they receive
- **Email Logging**: Complete audit trail of all sent emails for debugging and compliance
- **Admin Controls**: Manually resend failed emails, view email history, update statuses with tracking
- **Error Handling**: Graceful failure with retry capability for failed emails
- **Security**: Uses environment variables for credentials, supports unsubscribe tokens

## Email Types

### 1. Order Confirmation
- **Trigger**: Automatically sent when an order is successfully created during checkout
- **Recipient**: Customer email from order
- **Content**: Order number, items, total, shipping address, tracking link
- **Preference Key**: `orderConfirmation`

### 2. Shipping Update
- **Trigger**: When order status changes to "shipped" (if tracking info provided)
- **Recipient**: Customer email from order
- **Content**: Tracking number, tracking URL, estimated delivery date, timeline
- **Preference Key**: `shippingUpdates`

### 3. Password Reset
- **Trigger**: When user requests password reset
- **Recipient**: User email address
- **Content**: Reset link with 1-hour expiration, security notice
- **Preference Key**: N/A (always sent for security)

### 4. Welcome Email
- **Trigger**: After user registration (optional - not yet integrated)
- **Recipient**: New user email
- **Content**: Welcome message, account setup tips, call to action
- **Preference Key**: `newsletter` (optional)

## Setup Instructions

### 1. Gmail Configuration

#### Create a Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" in the left sidebar
3. Scroll to "How you sign in to Google"
4. Enable "2-Step Verification" if not already enabled
5. Go back to Security settings
6. Find "App passwords" (appears after 2FA is enabled)
7. Select "Mail" and "Windows Computer"
8. Google will generate a 16-character password
9. Copy this password

#### Alternative: Use OAuth2 (More Secure)

For production, consider implementing OAuth2 authentication instead of app passwords. This requires additional configuration but is more secure.

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Sender Configuration
SENDER_EMAIL=noreply@yourecommerce.com
SENDER_NAME=ShopHub

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Production Settings:**
```env
SMTP_PORT=587  # or 465 for SSL
SMTP_SECURE=false  # or true if using port 465
SENDER_EMAIL=noreply@yourdomain.com  # Use your domain
```

### 3. Alternative Email Providers

The system is flexible and supports any SMTP provider:

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
SENDER_EMAIL=noreply@yourdomain.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASS=your-mailgun-password
SENDER_EMAIL=noreply@yourdomain.com
```

#### Mailtrap (Development/Testing)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SENDER_EMAIL=noreply@yourdomain.com
```

## API Endpoints

### Send Email (Admin Only)
```
POST /api/emails/send
```
**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Email Subject",
  "htmlContent": "<h1>Email content</h1>",
  "type": "order_confirmation|shipping_update|password_reset|welcome|promotional",
  "orderId": "order_id_optional",
  "userId": "user_id_optional",
  "metadata": {
    "orderNumber": "ORD-123",
    "trackingNumber": "TRK-456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "message-id-from-smtp",
    "logId": "email-log-document-id",
    "status": "sent|failed"
  }
}
```

### Resend Failed Email (Admin Only)
```
POST /api/emails/resend
```
**Request Body:**
```json
{
  "emailLogId": "email-log-document-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "new-message-id",
    "status": "sent|failed",
    "retryCount": 2
  }
}
```

### Get Email Logs (Admin Only)
```
GET /api/emails/logs?type=order_confirmation&status=sent&orderId=order_id&limit=50&page=1
```

**Query Parameters:**
- `type`: Filter by email type
- `status`: Filter by status (sent, failed, bounced, pending_retry)
- `orderId`: Filter by order
- `userId`: Filter by user
- `recipient`: Filter by recipient email (regex search)
- `limit`: Results per page (default: 50)
- `page`: Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "log-id",
        "recipient": "user@example.com",
        "type": "order_confirmation",
        "subject": "Order Confirmation - ORD-123",
        "status": "sent",
        "sentAt": "2026-03-17T10:00:00Z",
        "retryCount": 0,
        "metadata": {}
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "pages": 2
    }
  }
}
```

### Get User Preferences
```
GET /api/users/[id]/preferences
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderConfirmation": true,
    "shippingUpdates": true,
    "promotions": false,
    "newsletter": true,
    "updatedAt": "2026-03-17T10:00:00Z"
  }
}
```

### Update User Preferences
```
PUT /api/users/[id]/preferences
```
**Request Body:**
```json
{
  "orderConfirmation": true,
  "shippingUpdates": true,
  "promotions": false,
  "newsletter": true
}
```

## Email Events & Triggers

| Event | Email Type | When Triggered | User Can Opt Out |
|-------|-----------|----------------|------------------|
| Order Placed | Order Confirmation | After successful checkout | Yes |
| Order Shipped | Shipping Update | When admin updates status to "shipped" | Yes |
| Password Reset | Password Reset | When user requests reset | No |
| Welcome | Welcome Email | After registration | Yes |

## Email Templates

All templates are located in `/lib/templates/`:

### orderConfirmation.js
- Displays full order details
- Shows item breakdown with prices
- Includes shipping address
- Provides tracking link
- Branded footer with company info

### shippingUpdate.js
- Shows tracking number and link
- Includes estimated delivery date
- Displays delivery timeline
- Confirms shipping address
- Encourages customer action

### passwordReset.js
- One-click reset link
- Expiration notice
- Security warnings
- Instructions for alternative methods
- Professional security-focused design

### welcome.js
- Warm greeting
- Account setup tips
- Feature highlights
- Call to action to browse products
- Unsubscribe management

## Testing

### Development Testing with Mailtrap

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Create a new inbox
3. Get SMTP credentials from the "Show Credentials" button
4. Update `.env.local` with Mailtrap credentials
5. Send test emails - they'll appear in Mailtrap dashboard

### Testing with Gmail

1. Create a test Gmail account
2. Enable 2-Step Verification
3. Generate an app password
4. Use credentials in `.env.local`
5. Test emails will arrive in the account's inbox

### Manual Testing via API

```bash
# Test order confirmation email
curl -X POST http://localhost:3000/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Order Confirmation",
    "htmlContent": "<h1>Test</h1>",
    "type": "order_confirmation",
    "metadata": {"orderNumber": "TEST-001"}
  }'
```

### Testing Email Preferences

```bash
# Get preferences
curl http://localhost:3000/api/users/user_id/preferences

# Update preferences
curl -X PUT http://localhost:3000/api/users/user_id/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "orderConfirmation": true,
    "shippingUpdates": false,
    "promotions": false,
    "newsletter": true
  }'
```

## Database Schema

### EmailLog Collection

```javascript
{
  _id: ObjectId,
  recipient: String,           // Email address
  type: String,               // order_confirmation, shipping_update, etc.
  orderId: ObjectId,          // Reference to Order
  userId: ObjectId,           // Reference to User
  subject: String,            // Email subject
  sentAt: Date,               // When sent
  status: String,             // sent, failed, bounced, pending_retry
  error: String,              // Error message if failed
  retryCount: Number,         // Number of retry attempts
  nextRetryAt: Date,          // When to retry next
  messageId: String,          // SMTP message ID
  metadata: Object,           // Custom data (orderNumber, trackingNumber, etc.)
  createdAt: Date,
  updatedAt: Date
}
```

### User.emailPreferences

```javascript
{
  orderConfirmation: Boolean,  // Default: true
  shippingUpdates: Boolean,    // Default: true
  promotions: Boolean,         // Default: true
  newsletter: Boolean,         // Default: true
  updatedAt: Date,
  unsubscribeToken: String     // For email unsubscribe links
}
```

### Order Email Tracking

```javascript
{
  emailLog: [ObjectId],        // References to EmailLog documents
  lastEmailSentAt: Date,       // When last email was sent
  nextEmailRetryAt: Date,      // When to retry failed emails
  trackingNumber: String,      // Shipping tracking number
  trackingUrl: String          // Link to tracking page
}
```

## Email Preferences UI

Located at `/app/account/preferences/page.js`:
- Users can toggle each email type on/off
- Changes saved to database immediately
- Visual feedback on success
- Clear descriptions of each preference

Admin can manage user preferences via API.

## Production Deployment

### SPF & DKIM Configuration

To prevent emails from going to spam, configure SPF and DKIM records with your domain provider:

#### SPF (Sender Policy Framework)
Add to DNS:
```
v=spf1 include:sendgrid.net ~all
```
Or for Gmail:
```
v=spf1 include:google.com ~all
```

#### DKIM (DomainKeys Identified Mail)
Your email provider will provide DKIM public key. Add to DNS TXT records.

### Email Deliverability

- Use a proper domain email address (not free Gmail)
- Implement SPF/DKIM/DMARC
- Monitor bounce rates
- Keep unsubscribe links functional
- Never use purchased email lists
- Honor all opt-out requests

### Error Monitoring

In production, implement error monitoring (e.g., Sentry) to track:
- Email send failures
- SMTP connection errors
- Rate limiting issues
- Bounce/invalid email errors

### Rate Limiting

Consider implementing rate limiting to prevent:
- Spam
- DOS attacks
- Quota exhaustion

Example: Max 100 emails per hour per user

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials**
   ```javascript
   // In /lib/email.js, use verifyConnection()
   import { verifyConnection } from '@/lib/email'

   const isConnected = await verifyConnection()
   console.log('Connected:', isConnected)
   ```

2. **Check environment variables**
   - Ensure `.env.local` is in root directory
   - Restart dev server after changes
   - Use `console.log(process.env.SMTP_USER)` to debug

3. **Gmail app password issues**
   - Verify 2FA is enabled
   - Generate new app password
   - Ensure no spaces in password

4. **Check email logs**
   ```bash
   curl http://localhost:3000/api/emails/logs?status=failed
   ```

### Emails Going to Spam

1. Configure SPF/DKIM records
2. Use "From" email matching your domain
3. Include unsubscribe link
4. Monitor spam complaints
5. Use reputable sending domain

### Rate Limiting Errors

- Reduce email frequency
- Implement queue system (Bull, Bee-Queue)
- Use transient retry with backoff
- Monitor provider rate limits

## Integration Examples

### Send Welcome Email After Registration

```javascript
// In app/api/auth/register/route.js
import { sendWelcomeEmail } from '@/lib/email'

const user = await User.create(userData)
const userName = `${userData.firstName} ${userData.lastName}`

try {
  await sendWelcomeEmail(user.email, userName)
} catch (err) {
  console.error('Welcome email failed:', err)
  // Don't fail registration if email fails
}
```

### Send Password Reset Email

```javascript
// In password reset handler
import { sendPasswordReset } from '@/lib/email'

const resetToken = generateResetToken()
const resetLink = `${process.env.NEXT_PUBLIC_API_URL}/reset-password?token=${resetToken}`

await sendPasswordReset(email, resetLink, '1 hour')
```

### Update Order Status with Email

```javascript
// In admin interface or background job
import { sendShippingNotification } from '@/lib/email'

order.status = 'shipped'
order.trackingNumber = 'TRK123'
order.trackingUrl = 'https://tracking.carrier.com/TRK123'

await sendShippingNotification(
  order,
  order.trackingNumber,
  order.trackingUrl,
  order.customer.email
)

await order.save()
```

## Future Enhancements

- [ ] Email queue with Bull or Bee-Queue for high volume
- [ ] Support for multiple sender addresses
- [ ] Email A/B testing
- [ ] Unsubscribe link functionality
- [ ] Email analytics (opens, clicks)
- [ ] Batch email sending
- [ ] SMS notifications as alternative
- [ ] Email template preview/testing in admin
- [ ] Email scheduling (send later)
- [ ] Webhook support for bounce/complaint handling

## Support & Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SMTP Configuration Best Practices](https://documentation.mailgun.com/en/latest/quickstart-sending.html)
- [Email Template Design](https://litmus.com/blog/email-html-boilerplate)
- [Email Deliverability Guide](https://returnil.com/email-deliverability)

---

**Last Updated:** March 17, 2026
**System Version:** 1.0.0

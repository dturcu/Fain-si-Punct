import nodemailer from 'nodemailer'

// Initialize transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' ? true : false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Retry configuration
const RETRY_DELAYS = [
  1000 * 60, // 1 minute
  1000 * 60 * 5, // 5 minutes
  1000 * 60 * 15, // 15 minutes
  1000 * 60 * 60, // 1 hour
]

/**
 * Send email with retry logic and error handling
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 * @param {object} metadata - Additional metadata for logging
 * @returns {Promise<object>} - Result with success status and message ID
 */
export async function sendEmail(to, subject, htmlContent, metadata = {}) {
  try {
    // Validate email
    if (!to || !subject || !htmlContent) {
      throw new Error('Missing required email parameters: to, subject, htmlContent')
    }

    // Validate recipient to prevent header injection (no newlines, valid format)
    if (typeof to !== 'string' || /[\r\n]/.test(to) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Invalid recipient email address')
    }

    const mailOptions = {
      from: `${process.env.SENDER_NAME || 'Fain si Punct'} <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
      // Add headers for SPF/DKIM
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
      },
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date(),
    }
  }
}

/**
 * Send order confirmation email
 * @param {object} order - Order object with items, total, customer, shippingAddress
 * @param {string} userEmail - User email address
 * @returns {Promise<object>} - Send result
 */
export async function sendOrderConfirmation(order, userEmail) {
  const { orderConfirmation } = require('./templates/orderConfirmation')

  const htmlContent = orderConfirmation(order)
  const subject = `Order Confirmation - ${order.orderNumber}`

  const result = await sendEmail(userEmail, subject, htmlContent, {
    type: 'order_confirmation',
    orderId: order._id?.toString(),
    orderNumber: order.orderNumber,
  })

  return result
}

/**
 * Send shipping notification email
 * @param {object} order - Order object
 * @param {string} trackingNumber - Tracking number
 * @param {string} trackingUrl - Tracking URL
 * @param {string} userEmail - User email address
 * @returns {Promise<object>} - Send result
 */
export async function sendShippingNotification(order, trackingNumber, trackingUrl, userEmail) {
  const { shippingUpdate } = require('./templates/shippingUpdate')

  const htmlContent = shippingUpdate(order, trackingNumber, trackingUrl)
  const subject = `Your Order is Shipping - ${order.orderNumber}`

  const result = await sendEmail(userEmail, subject, htmlContent, {
    type: 'shipping_update',
    orderId: order._id?.toString(),
    orderNumber: order.orderNumber,
    trackingNumber,
  })

  return result
}

/**
 * Send password reset email
 * @param {string} email - User email address
 * @param {string} resetLink - Password reset link
 * @param {string} expiresIn - Expiration time (e.g., "1 hour")
 * @returns {Promise<object>} - Send result
 */
export async function sendPasswordReset(email, resetLink, expiresIn = '1 hour') {
  const { passwordReset } = require('./templates/passwordReset')

  const htmlContent = passwordReset(resetLink, expiresIn)
  const subject = 'Password Reset Request'

  const result = await sendEmail(email, subject, htmlContent, {
    type: 'password_reset',
    email,
  })

  return result
}

/**
 * Send welcome email after registration
 * @param {string} email - User email address
 * @param {string} userName - User's name
 * @returns {Promise<object>} - Send result
 */
export async function sendWelcomeEmail(email, userName) {
  const { welcome } = require('./templates/welcome')

  const htmlContent = welcome(userName)
  const subject = 'Welcome to Fain si Punct!'

  const result = await sendEmail(email, subject, htmlContent, {
    type: 'welcome',
    email,
    userName,
  })

  return result
}

/**
 * Verify SMTP connection (useful for testing)
 * @returns {Promise<boolean>} - Connection status
 */
export async function verifyConnection() {
  try {
    await transporter.verify()
    console.log('SMTP connection verified')
    return true
  } catch (error) {
    console.error('SMTP connection verification failed:', error)
    return false
  }
}

export default {
  sendEmail,
  sendOrderConfirmation,
  sendShippingNotification,
  sendPasswordReset,
  sendWelcomeEmail,
  verifyConnection,
}

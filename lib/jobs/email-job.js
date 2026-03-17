import {
  sendOrderConfirmation,
  sendShippingUpdate,
  sendPasswordReset,
  sendWelcomeEmail,
} from '@/lib/email'
import EmailLog from '@/models/EmailLog'
import Order from '@/models/Order'

/**
 * Email job processor for Bull queue
 * Handles sending emails with built-in retry logic
 */
export async function emailJobHandler(job) {
  const { type, recipient, subject, html, orderId, userId, metadata } = job.data

  console.log(`Processing email job ${job.id}: ${type} to ${recipient}`)

  try {
    // Send email
    const result = await sendEmailByType(type, {
      recipient,
      subject,
      html,
      metadata,
    })

    // Log successful send
    await EmailLog.create({
      recipient,
      type,
      subject,
      status: 'sent',
      sentAt: new Date(),
      orderId,
      userId,
      messageId: result.messageId || null,
      metadata: metadata || {},
    })

    // Update order with email tracking if it's an order email
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        lastEmailSentAt: new Date(),
      })
    }

    console.log(`Email sent successfully: job ${job.id}`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error(`Error in email job ${job.id}:`, error.message)

    // Log failed send
    await EmailLog.create({
      recipient,
      type,
      subject,
      status: 'failed',
      error: error.message,
      sentAt: new Date(),
      retryCount: job.attemptsMade,
      nextRetryAt:
        job.attemptsMade < (process.env.EMAIL_MAX_RETRIES || 4)
          ? new Date(Date.now() + getBackoffDelay(job.attemptsMade))
          : null,
      orderId,
      userId,
      metadata: metadata || {},
    })

    // Throw to trigger Bull retry logic
    throw error
  }
}

/**
 * Send email based on type
 */
async function sendEmailByType(type, { recipient, subject, html, metadata }) {
  switch (type) {
    case 'order_confirmation':
      return await sendOrderConfirmationDirect(recipient, html, metadata)

    case 'shipping_update':
      return await sendShippingUpdateDirect(recipient, html, metadata)

    case 'password_reset':
      return await sendPasswordResetDirect(recipient, html, metadata)

    case 'welcome':
      return await sendWelcomeDirect(recipient, html, metadata)

    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}

/**
 * Direct email sending functions (wrapper for lib/email.js)
 */
async function sendOrderConfirmationDirect(recipient, html, metadata) {
  // Use nodemailer directly or existing email function
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const info = await transporter.sendMail({
    from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
    to: recipient,
    subject: `Order Confirmation - ${metadata?.orderNumber || 'Order'}`,
    html,
  })

  return info
}

async function sendShippingUpdateDirect(recipient, html, metadata) {
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const info = await transporter.sendMail({
    from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
    to: recipient,
    subject: `Shipping Update - ${metadata?.orderNumber || 'Your Order'}`,
    html,
  })

  return info
}

async function sendPasswordResetDirect(recipient, html, metadata) {
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const info = await transporter.sendMail({
    from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
    to: recipient,
    subject: 'Password Reset Request',
    html,
  })

  return info
}

async function sendWelcomeDirect(recipient, html, metadata) {
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const info = await transporter.sendMail({
    from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
    to: recipient,
    subject: `Welcome to ${process.env.SENDER_NAME}!`,
    html,
  })

  return info
}

/**
 * Calculate exponential backoff delay
 * @param {number} attemptsMade - Number of attempts made
 * @returns {number} Delay in milliseconds
 */
function getBackoffDelay(attemptsMade) {
  // Exponential backoff: 2s, 4s, 8s, 16s
  return 2000 * Math.pow(2, attemptsMade)
}

export default emailJobHandler

import mongoose from 'mongoose'

const EmailLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['order_confirmation', 'shipping_update', 'password_reset', 'welcome', 'promotional'],
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'bounced', 'pending_retry'],
      default: 'pending_retry',
      index: true,
    },
    error: String,
    retryCount: {
      type: Number,
      default: 0,
    },
    nextRetryAt: Date,
    messageId: String, // From Nodemailer
    metadata: {
      trackingNumber: String,
      trackingUrl: String,
      orderNumber: String,
      userName: String,
      customData: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying
EmailLogSchema.index({ recipient: 1, type: 1, status: 1 })
EmailLogSchema.index({ userId: 1, type: 1 })
EmailLogSchema.index({ orderId: 1 })
EmailLogSchema.index({ status: 1, nextRetryAt: 1 })
EmailLogSchema.index({ createdAt: -1 })

// Compound index for finding failed emails to retry
EmailLogSchema.index({ status: 1, retryCount: 1, nextRetryAt: 1 })

export default mongoose.models.EmailLog || mongoose.model('EmailLog', EmailLogSchema)

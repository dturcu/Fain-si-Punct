import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['stripe', 'paypal'],
      required: true,
    },
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: String,
    metadata: {
      type: Object,
      default: {},
    },
    webhookVerified: {
      type: Boolean,
      default: false,
    },
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

// Create indexes for common queries
PaymentSchema.index({ orderId: 1, type: 1 })
PaymentSchema.index({ externalId: 1 })
PaymentSchema.index({ status: 1, type: 1 })
PaymentSchema.index({ createdAt: 1 })

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

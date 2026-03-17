import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    customer: {
      name: String,
      email: String,
      phone: String,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'processing', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal'],
    },
    paidAt: Date,
    emailLog: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailLog',
      },
    ],
    lastEmailSentAt: Date,
    nextEmailRetryAt: Date,
    trackingNumber: String,
    trackingUrl: String,
  },
  { timestamps: true }
)

OrderSchema.index({ orderNumber: 1 })
OrderSchema.index({ 'customer.email': 1 })
OrderSchema.index({ status: 1 })

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)

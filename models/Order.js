import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
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
  },
  { timestamps: true }
)

OrderSchema.index({ orderNumber: 1 })
OrderSchema.index({ 'customer.email': 1 })
OrderSchema.index({ status: 1 })

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)

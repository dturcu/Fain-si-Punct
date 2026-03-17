import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    helpfulVotes: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        type: { type: String, enum: ['helpful', 'unhelpful'] },
      },
    ],
  },
  { timestamps: true }
)

// Unique compound index to prevent duplicate reviews
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

// Index for fetching reviews sorted by rating and date
ReviewSchema.index({ productId: 1, rating: -1 })
ReviewSchema.index({ productId: 1, createdAt: -1 })

// Index for helpful sorting
ReviewSchema.index({ productId: 1, helpful: -1 })

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema)

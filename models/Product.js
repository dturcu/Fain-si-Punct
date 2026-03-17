import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    ratingDistribution: {
      type: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
      default: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    image: String,
    sku: {
      type: String,
      unique: true,
    },
    tags: [String],
  },
  { timestamps: true }
)

// Indexes for optimal query performance with 15k products
ProductSchema.index({ category: 1, price: 1 })
ProductSchema.index({ name: 'text', description: 'text' })

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)

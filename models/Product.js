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
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
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

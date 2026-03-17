import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: String,
    lastName: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    savedPaymentMethods: [
      {
        id: String,
        type: {
          type: String,
          enum: ['stripe', 'paypal'],
        },
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number,
        isDefault: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    emailPreferences: {
      orderConfirmation: {
        type: Boolean,
        default: true,
      },
      shippingUpdates: {
        type: Boolean,
        default: true,
      },
      promotions: {
        type: Boolean,
        default: true,
      },
      newsletter: {
        type: Boolean,
        default: true,
      },
      updatedAt: Date,
    },
    unsubscribeToken: String,
  },
  { timestamps: true }
)

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Don't return password in JSON
UserSchema.methods.toJSON = function () {
  const { password, ...user } = this.toObject()
  return user
}

export default mongoose.models.User || mongoose.model('User', UserSchema)

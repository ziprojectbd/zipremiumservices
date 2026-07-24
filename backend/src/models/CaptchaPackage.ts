import mongoose from 'mongoose';

const captchaPackageSchema = new mongoose.Schema(
  {
    // Reference to our order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CaptchaOrder',
      required: true,
      unique: true,
    },
    // Customer info
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    // Plan details
    planId: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },
    creditsRemaining: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    // CaptchaMaster references
    captchaMasterPackageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    captchaMasterOrderId: {
      type: String,
      default: null,
    },
    captchaApiKey: {
      type: String,
      default: null,
    },
    // Status
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active',
      index: true,
    },
    // Expiry
    expiresAt: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for duplicate prevention — one active package per plan per customer
captchaPackageSchema.index(
  { customerEmail: 1, planId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
  }
);

const CaptchaPackage =
  mongoose.models.CaptchaPackage ||
  mongoose.model('CaptchaPackage', captchaPackageSchema);

export default CaptchaPackage;

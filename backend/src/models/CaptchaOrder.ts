import mongoose from 'mongoose';

const captchaOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      default: 'gateway',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    captchaMasterOrderId: {
      type: String,
      default: null,
    },
    captchaMasterPackageId: {
      type: String,
      default: null,
    },
    paymentGatewayRef: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate completed purchase of same plan by same customer
captchaOrderSchema.index(
  { customerEmail: 1, planId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'completed' },
  }
);

// Generate order number
captchaOrderSchema.pre('save', async function () {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `CM-${timestamp}-${random}`;
  }
});

const CaptchaOrder =
  mongoose.models.CaptchaOrder ||
  mongoose.model('CaptchaOrder', captchaOrderSchema);

export default CaptchaOrder;

import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  usageLimit: {
    type: Number,
    default: 0,
    min: 0,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  applicableCategories: {
    type: [String],
    default: [],
  },
  applicableProducts: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  // Track which customer (email) has used this coupon for which product
  usedBy: [{
    email: { type: String, required: true, lowercase: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  }],
}, {
  timestamps: true,
});

couponSchema.set('toJSON', { virtuals: true });
couponSchema.set('toObject', { virtuals: true });

if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon;
}

export default mongoose.model('Coupon', couponSchema);

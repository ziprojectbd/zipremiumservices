import mongoose from 'mongoose';

const campaignProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'fixed_price', 'buy_x_get_y', 'free_shipping'],
  },
  discountValue: {
    type: Number,
    min: 0,
  },
  buyX: Number,
  getY: Number,
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  bannerImage: {
    type: String,
    default: '',
  },
  mobileBanner: {
    type: String,
    default: '',
  },
  campaignLogo: {
    type: String,
    default: '',
  },
  colorTheme: {
    type: String,
    default: '#ef4444',
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'expired'],
    default: 'draft',
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
  autoEnd: {
    type: Boolean,
    default: true,
  },
  // Discount configuration
  discountType: {
    type: String,
    enum: [
      'percentage',
      'fixed_amount',
      'fixed_price',
      'buy_x_get_y',
      'free_shipping',
      'bundle_discount',
      'spend_x_save_y',
      'coupon_required',
      'auto_apply',
    ],
    required: true,
  },
  discountValue: {
    type: Number,
    min: 0,
    default: 0,
  },
  // Buy X Get Y
  buyX: {
    type: Number,
    min: 1,
    default: null,
  },
  getY: {
    type: Number,
    min: 1,
    default: null,
  },
  // Spend X Save Y
  minSpend: {
    type: Number,
    min: 0,
    default: null,
  },
  saveAmount: {
    type: Number,
    min: 0,
    default: null,
  },
  // Coupon code for coupon_required type
  couponCode: {
    type: String,
    trim: true,
    default: null,
  },
  // Campaign targeting
  targetType: {
    type: String,
    enum: [
      'specific_products',
      'categories',
      'brands',
      'entire_store',
      'new_arrivals',
      'featured',
    ],
    default: 'specific_products',
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  applicableCategories: [{
    type: String,
    trim: true,
  }],
  // Per-product discount overrides
  productDiscounts: [campaignProductSchema],
  // Max discount amount (for percentage type)
  maxDiscountAmount: {
    type: Number,
    min: 0,
    default: null,
  },
  // Customer purchase limit
  customerPurchaseLimit: {
    type: Number,
    min: 0,
    default: 0,
  },
  // Stock-aware campaign
  totalStock: {
    type: Number,
    min: 0,
    default: 0,
  },
  usedStock: {
    type: Number,
    min: 0,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

campaignSchema.index({ status: 1, isActive: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });
campaignSchema.index({ priority: -1 });

// Auto-set status based on dates
campaignSchema.pre('save', function () {
  const now = new Date();
  if (this.autoStart && this.startDate && now >= this.startDate && this.endDate && now < this.endDate) {
    this.status = 'active';
  }
  if (this.autoEnd && this.endDate && now >= this.endDate) {
    this.status = 'expired';
  }
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

campaignSchema.virtual('remainingStock').get(function () {
  if (this.totalStock <= 0) return -1;
  return Math.max(0, this.totalStock - this.usedStock);
});

campaignSchema.virtual('isRunning').get(function () {
  return this.status === 'active' && this.isActive && !this.isDeleted;
});

campaignSchema.virtual('timeRemaining').get(function () {
  if (!this.endDate) return null;
  return this.endDate.getTime() - Date.now();
});

// Compute effective price for a product given original price
campaignSchema.methods.getEffectivePrice = function (originalPrice: number): {
  discountPrice: number;
  discountPercent: number;
  amountSaved: number;
} | null {
  if (!originalPrice || originalPrice <= 0) return null;

  let discountPrice = originalPrice;
  let discountPercent = 0;

  switch (this.discountType) {
    case 'percentage':
      discountPercent = Math.min(100, this.discountValue || 0);
      discountPrice = originalPrice * (1 - discountPercent / 100);
      if (this.maxDiscountAmount) {
        const saved = originalPrice - discountPrice;
        if (saved > this.maxDiscountAmount) {
          discountPrice = originalPrice - this.maxDiscountAmount;
        }
      }
      break;
    case 'fixed_amount':
      discountPrice = Math.max(0, originalPrice - (this.discountValue || 0));
      discountPercent = ((originalPrice - discountPrice) / originalPrice) * 100;
      break;
    case 'fixed_price':
      discountPrice = Math.min(originalPrice, this.discountValue || 0);
      discountPercent = ((originalPrice - discountPrice) / originalPrice) * 100;
      break;
    default:
      return null;
  }

  const amountSaved = originalPrice - discountPrice;
  return {
    discountPrice: Math.round(discountPrice * 100) / 100,
    discountPercent: Math.round(discountPercent * 100) / 100,
    amountSaved: Math.round(amountSaved * 100) / 100,
  };
};

export default mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);

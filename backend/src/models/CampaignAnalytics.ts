import mongoose from 'mongoose';

const campaignAnalyticsSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  addToCarts: {
    type: Number,
    default: 0,
  },
  orders: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  discountGiven: {
    type: Number,
    default: 0,
  },
  uniqueCustomers: {
    type: [String],
    default: [],
  },
  productSales: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: String,
    quantity: Number,
    revenue: Number,
    discountGiven: Number,
  }],
}, {
  timestamps: true,
});

campaignAnalyticsSchema.index({ campaignId: 1, date: -1 });

campaignAnalyticsSchema.set('toJSON', { virtuals: true });
campaignAnalyticsSchema.set('toObject', { virtuals: true });

export default mongoose.models.CampaignAnalytics || mongoose.model('CampaignAnalytics', campaignAnalyticsSchema);

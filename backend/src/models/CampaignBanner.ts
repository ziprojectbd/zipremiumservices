import mongoose from 'mongoose';

const campaignBannerSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    default: '',
    trim: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  mobileImageUrl: {
    type: String,
    default: '',
  },
  link: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['hero', 'featured', 'sidebar', 'popup'],
    default: 'hero',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
  },
  buttonLink: {
    type: String,
    default: '',
  },
  backgroundColor: {
    type: String,
    default: '',
  },
  textColor: {
    type: String,
    default: '#ffffff',
  },
}, {
  timestamps: true,
});

campaignBannerSchema.index({ isActive: 1, order: 1 });
campaignBannerSchema.index({ type: 1, isActive: 1 });

campaignBannerSchema.set('toJSON', { virtuals: true });
campaignBannerSchema.set('toObject', { virtuals: true });

export default mongoose.models.CampaignBanner || mongoose.model('CampaignBanner', campaignBannerSchema);

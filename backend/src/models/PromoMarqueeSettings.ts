import mongoose, { Model } from 'mongoose';

interface IPromoMarqueeSettings {
  enabled: boolean;
  message: string;
  updatedAt: Date;
}

interface PromoMarqueeSettingsModel extends Model<IPromoMarqueeSettings> {
  getSettings(): Promise<IPromoMarqueeSettings>;
}

const PromoMarqueeSettingsSchema = new mongoose.Schema<IPromoMarqueeSettings>({
  enabled: {
    type: Boolean,
    default: true,
    required: true
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one promo marquee settings document exists
PromoMarqueeSettingsSchema.statics.getSettings = async function(): Promise<IPromoMarqueeSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      enabled: true,
      message: ''
    });
  }
  return settings;
};

export default (mongoose.models.PromoMarqueeSettings as PromoMarqueeSettingsModel) || mongoose.model<IPromoMarqueeSettings, PromoMarqueeSettingsModel>('PromoMarqueeSettings', PromoMarqueeSettingsSchema);

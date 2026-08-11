import mongoose from 'mongoose';

const captchaMasterSettingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'global',
  },
  discountPercent: {
    type: Number,
    default: 20,
    min: 0,
    max: 100,
  },
  discountEnabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Delete cached model in dev hot-reload
if (mongoose.models.CaptchaMasterSettings) {
  delete mongoose.models.CaptchaMasterSettings;
}

export default mongoose.model('CaptchaMasterSettings', captchaMasterSettingsSchema);

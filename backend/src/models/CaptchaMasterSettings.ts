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
  exchangeRate: {
    type: Number,
    default: 110,
    min: 1,
  },
  resellerApiKey: {
    type: String,
    default: '',
    trim: true,
  },
  // Name sent to CaptchaMaster with every purchase so the completion email
  // greets the recipient with this text instead of falling back to the
  // reseller store name ("ZI PREMIUM SERVICES").
  emailGreetingName: {
    type: String,
    default: 'Dear Customer',
    trim: true,
  },
}, {
  timestamps: true,
});

// Delete cached model in dev hot-reload
if (mongoose.models.CaptchaMasterSettings) {
  delete mongoose.models.CaptchaMasterSettings;
}

export default mongoose.model('CaptchaMasterSettings', captchaMasterSettingsSchema);

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
  // Optional override for the greeting in the CaptchaMaster completion email.
  //
  // Empty by default so each customer is greeted by their own name (taken from
  // the order / their account). Generic greetings such as "Dear Customer" are
  // ignored by the delivery code, and the reseller store name is never used as
  // a customer name.
  emailGreetingName: {
    type: String,
    default: '',
    trim: true,
  },
  // Product image shown on every Captcha Solver Api plan card.
  //
  // The plans are generated from the reseller's pricing list, which carries no
  // artwork of its own, so one image is configured here and applied to all of
  // them. Empty falls back to the bundled default in the UI.
  productImageUrl: {
    type: String,
    default: '',
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

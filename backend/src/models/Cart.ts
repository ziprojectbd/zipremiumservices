import mongoose from 'mongoose';

export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  priceBDT?: number;
  priceUSDT?: number;
  quantity: number;
  dbId?: string;
  link?: string;
  smmProvider?: string;
  smmServiceId?: string;
  productType?: string;
  captchamasterPlanId?: string;
  category?: string;
  details?: string;
  features?: string[];
  stock?: number;
  originalPrice?: number;
  customData?: Record<string, unknown>;
  addons?: { key?: string; label?: string; description?: string; pricePercent?: number; defaultSelected?: boolean }[];
}

export interface ICart {
  _id: mongoose.Types.ObjectId;
  userEmail: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  priceBDT: {
    type: Number,
    default: null,
  },
  priceUSDT: {
    type: Number,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  dbId: {
    type: String,
  },
  link: {
    type: String,
    default: '',
  },
  smmProvider: {
    type: String,
    default: '',
  },
  smmServiceId: {
    type: String,
    default: '',
  },
  // CaptchaMaster products: 'captchamaster' + the reseller plan id. Without
  // these fields Mongoose strict mode silently strips them, so the plan id
  // vanished before checkout and auto-delivery never fired.
  productType: {
    type: String,
    default: '',
  },
  captchamasterPlanId: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: '',
  },
  details: {
    type: String,
    default: '',
  },
  features: {
    type: [String],
    default: [],
  },
  stock: {
    type: Number,
    default: 0,
  },
  originalPrice: {
    type: Number,
    default: 0,
  },
  // Buyer-entered values for the product's order fields, plus the selected
  // optional add-ons (`customData.addons`). Mongoose strict mode strips unknown
  // fields, so without this declaration the selection was lost on every cart
  // reload — the same class of bug that previously dropped the captcha plan id.
  customData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // The product's available add-ons, copied onto the line so the cart can render
  // the checkboxes (and show the percentage) without a second product fetch.
  addons: {
    type: [{
      key: { type: String, trim: true },
      label: { type: String, trim: true },
      description: { type: String, trim: true },
      pricePercent: { type: Number, default: 0 },
      defaultSelected: { type: Boolean, default: false },
    }],
    default: [],
  },
});

const cartSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'Please provide a user email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  items: {
    type: [cartItemSchema],
    default: [],
  },
}, {
  timestamps: true,
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;

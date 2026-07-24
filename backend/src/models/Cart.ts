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
  category?: string;
  details?: string;
  features?: string[];
  stock?: number;
  originalPrice?: number;
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

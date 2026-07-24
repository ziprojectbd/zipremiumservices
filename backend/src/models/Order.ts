import mongoose from 'mongoose';
import {
  PAYMENT_METHODS,
  MOBILE_PAYMENT_METHODS,
  CRYPTO_PAYMENT_METHOD,
} from '../config/constants.js';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: false,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false,
    default: null,
  },
  customerEmail: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  username: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  customerWallet: {
    type: String,
    required: false,
    default: '',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  productName: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  productCategory: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['USDT', 'BDT'],
    default: 'USDT',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'delivered', 'rejected'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'bkash',
  },
  source: {
    type: String,
    enum: ['checkout', 'admin'],
    default: 'checkout',
  },
  txHash: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod === CRYPTO_PAYMENT_METHOD && this.paidVia === 'network';
    },
    default: '',
    trim: true,
  },
  paymentNumber: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod && this.paymentMethod !== CRYPTO_PAYMENT_METHOD && this.paymentMethod !== 'cod';
    },
    default: '',
    trim: true,
  },
  transactionId: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod && this.paymentMethod !== CRYPTO_PAYMENT_METHOD && this.paymentMethod !== 'cod';
    },
    default: '',
    trim: true,
  },
  cryptoCurrency: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod === CRYPTO_PAYMENT_METHOD;
    },
    default: '',
    trim: true,
  },
  paidVia: {
    type: String,
    enum: ['network', 'uid', ''],
    required: function(this: any) {
      return this.paymentMethod === CRYPTO_PAYMENT_METHOD;
    },
    default: '',
  },
  selectedNetwork: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod === CRYPTO_PAYMENT_METHOD && this.paidVia === 'network';
    },
    default: '',
    trim: true,
  },
  selectedPlatform: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod === CRYPTO_PAYMENT_METHOD && this.paidVia === 'uid';
    },
    default: '',
    trim: true,
  },
  walletAddress: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod === CRYPTO_PAYMENT_METHOD && this.paidVia === 'network';
    },
    default: '',
    trim: true,
  },
  senderUid: {
    type: String,
    required: function(this: any) {
      return this.paymentMethod === CRYPTO_PAYMENT_METHOD && this.paidVia === 'uid';
    },
    default: '',
    trim: true,
  },
  // P2P Trade specific fields
  p2pToken: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  p2pNetwork: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  p2pWalletAddress: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  couponCode: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  discountAmount: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  discountType: {
    type: String,
    required: false,
    default: '',
  },
  deliveryNote: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  // IP geolocation fields (captured at order creation)
  ipAddress: {
    type: String,
    required: false,
    default: '',
  },
  country: {
    type: String,
    required: false,
    default: '',
  },
  countryCode: {
    type: String,
    required: false,
    default: '',
  },
  countryFlag: {
    type: String,
    required: false,
    default: '',
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    usdtAmount: {
      type: Number,
      required: true,
    },
    productName: {
      type: String,
      required: false,
      default: '',
    },
    category: {
      type: String,
      required: false,
      default: '',
    },
    link: {
      type: String,
      required: false,
      default: '',
    },
    smmServiceId: {
      type: String,
      required: false,
      default: '',
    },
    smmProvider: {
      type: String,
      required: false,
      default: '',
    },
    smmOrderId: {
      type: String,
      required: false,
      default: '',
    },
    details: {
      type: String,
      required: false,
      default: '',
    },
    customData: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: {},
    },
  }],
}, {
  timestamps: true,
});

// Unique index on transactionId to prevent duplicate mobile payment hashes
orderSchema.index({ transactionId: 1 }, {
  unique: true,
  partialFilterExpression: {
    transactionId: { $type: 'string', $ne: '' }
  }
});

// Generate order number before saving
orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(3, '0')}`;
  }

  if (typeof this.paymentMethod === 'string') {
    // Normalize to lowercase so all payment methods are stored consistently
    this.paymentMethod = this.paymentMethod.toLowerCase().trim();
  }
  if (typeof this.paidVia === 'string') {
    const paidVia = this.paidVia.toLowerCase();
    if (['', 'network', 'uid'].includes(paidVia)) {
      this.paidVia = paidVia as '' | 'network' | 'uid';
    }
  }

  // Keep new and legacy fields aligned for backward compatibility.
  if (!this.email && this.customerEmail) {
    this.email = this.customerEmail;
  }
  if (!this.customerEmail && this.email) {
    this.customerEmail = this.email;
  }
  if (!this.productId && this.product) {
    this.productId = this.product;
  }

  // Keep non-applicable fields empty by payment flow.
  // Mobile payments (everything except paycrypto and cod): clear crypto fields
  if (this.paymentMethod && this.paymentMethod !== CRYPTO_PAYMENT_METHOD && this.paymentMethod !== 'cod') {
    this.cryptoCurrency = '';
    this.paidVia = '';
    this.selectedNetwork = '';
    this.selectedPlatform = '';
    this.walletAddress = '';
    this.senderUid = '';
    this.txHash = '';
    if (!this.customerWallet && this.paymentNumber) {
      this.customerWallet = this.paymentNumber;
    }
  }

  if (this.paymentMethod === CRYPTO_PAYMENT_METHOD) {
    this.paymentNumber = '';
    this.transactionId = '';
    this.customerWallet = this.walletAddress || this.senderUid || this.customerWallet || '';

    if (this.paidVia === 'network') {
      this.selectedPlatform = '';
      this.senderUid = '';
    }

    if (this.paidVia === 'uid') {
      this.selectedNetwork = '';
      this.walletAddress = '';
      this.txHash = '';
    }
  }

  // COD: clear both mobile and crypto fields
  if (this.paymentMethod === 'cod') {
    this.paymentNumber = '';
    this.transactionId = '';
    this.cryptoCurrency = '';
    this.paidVia = '';
    this.selectedNetwork = '';
    this.selectedPlatform = '';
    this.walletAddress = '';
    this.senderUid = '';
    this.txHash = '';
  }

});

// Virtual for formatted amount
orderSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for status with color
orderSchema.virtual('statusInfo').get(function() {
  const statusMap = {
    pending: { color: 'yellow', label: 'Pending' },
    approved: { color: 'green', label: 'Approved' },
    delivered: { color: 'emerald', label: 'Delivered' },
    rejected: { color: 'red', label: 'Rejected' },
    processing: { color: 'blue', label: 'Processing' },
    completed: { color: 'green', label: 'Completed' },
    cancelled: { color: 'red', label: 'Cancelled' },
    refunded: { color: 'gray', label: 'Refunded' }
  };
  return statusMap[this.status as keyof typeof statusMap] || statusMap.pending;
});

// Virtual for formatted date
orderSchema.virtual('formattedDate').get(function() {
  const baseDate = this.createdAt || new Date();
  return baseDate.toISOString().split('T')[0];
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model('Order', orderSchema);

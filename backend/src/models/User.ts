import mongoose from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin' | 'customer' | 'trader';
  status: 'active' | 'inactive' | 'suspended';
  image?: string | null;
  isTrader: boolean;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  totalSpent?: number;
  totalOrders?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'trader', 'admin'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  image: {
    type: String,
    default: null,
  },
  isTrader: {
    type: Boolean,
    default: false,
  },
  kycStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  // IP geolocation fields (captured at registration)
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
}, {
  timestamps: true,
});

userSchema.index({ role: 1 });
userSchema.index({ kycStatus: 1 });
// email already indexed via unique: true on the field

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

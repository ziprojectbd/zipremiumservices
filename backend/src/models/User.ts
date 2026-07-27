import mongoose from 'mongoose';

export interface ILoginHistoryEntry {
  ip: string;
  device?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  failureReason?: string;
}

export interface IRefreshTokenEntry {
  token: string;
  device?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}

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

  // Security fields
  loginAttempts: number;
  lockUntil: Date | null;
  refreshTokens: IRefreshTokenEntry[];
  loginHistory: ILoginHistoryEntry[];
  lastLogin: Date | null;
  lastLoginIp: string;
}

const loginHistorySchema = new mongoose.Schema<ILoginHistoryEntry>({
  ip: { type: String, required: true },
  device: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
  failureReason: { type: String, default: '' },
}, { _id: false });

const refreshTokenSchema = new mongoose.Schema<IRefreshTokenEntry>({
  token: { type: String, required: true },
  device: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { _id: false });

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
  // Security fields
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  refreshTokens: {
    type: [refreshTokenSchema],
    default: [],
  },
  loginHistory: {
    type: [loginHistorySchema],
    default: [],
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  lastLoginIp: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

userSchema.index({ role: 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'refreshTokens.token': 1 });
userSchema.index({ 'loginHistory.timestamp': 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // Auto-expire login history after 90 days

// Virtual: check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    delete ret.refreshTokens;
    delete ret.loginHistory;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  avatar: {
    type: String,
    default: null,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  totalSpentBDT: {
    type: Number,
    default: 0,
  },
  totalSpentUSDT: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  lastOrderDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Virtual for formatted total spent
customerSchema.virtual('formattedTotalSpent').get(function() {
  return `$${this.totalSpent.toFixed(2)}`;
});

// Virtual for customer status with color
customerSchema.virtual('statusInfo').get(function() {
  const statusMap = {
    active: { color: 'green', label: 'Active' },
    inactive: { color: 'gray', label: 'Inactive' },
    suspended: { color: 'red', label: 'Suspended' }
  };
  return statusMap[this.status as keyof typeof statusMap] || statusMap.inactive;
});

customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);

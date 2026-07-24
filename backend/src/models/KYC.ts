import mongoose from 'mongoose';

export interface IKYC {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  fullName: string;
  phone: string;
  nidNumber: string;
  dateOfBirth: string;
  country: string;
  address: string;
  district: string;
  upazila: string;
  city: string;
  postCode: string;
  nidFront: string;
  nidBack: string;
  selfieImage: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KYCSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  nidNumber: {
    type: String,
    required: [true, 'NID number is required'],
    trim: true,
  },
  dateOfBirth: {
    type: String,
    required: [true, 'Date of birth is required'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
  },
  upazila: {
    type: String,
    required: [true, 'Upazila is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  postCode: {
    type: String,
    required: [true, 'Post code is required'],
    trim: true,
  },
  nidFront: {
    type: String,
    required: [true, 'NID front image is required'],
  },
  nidBack: {
    type: String,
    required: [true, 'NID back image is required'],
  },
  selfieImage: {
    type: String,
    required: [true, 'Selfie with NID image is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: String,
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

KYCSchema.index({ email: 1 });
KYCSchema.index({ status: 1 });

const KYC = mongoose.models.KYC || mongoose.model('KYC', KYCSchema);

export default KYC;

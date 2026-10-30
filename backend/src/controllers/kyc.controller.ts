import KYC from '@models/KYC';
import User from '@models/User';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

// POST /kyc/submit
export const submitKYC = asyncHandler(async (req, res) => {
  const userId = req.user!._id;
  const {
    fullName,
    phone,
    nidNumber,
    dateOfBirth,
    country,
    address,
    district,
    upazila,
    city,
    postCode,
    nidFront,
    nidBack,
    selfieImage,
  } = req.body;

  // Required field check
  if (!fullName || !phone || !nidNumber || !country || !address || !district || !upazila || !city || !postCode || !nidFront || !nidBack || !selfieImage) {
    return res.status(400).json(error('All required fields must be provided'));
  }

  // Check existing KYC
  const existingKYC = await KYC.findOne({ userId });

  if (existingKYC) {
    if (existingKYC.status === 'pending') {
      return res.status(400).json(error('KYC submission is already pending review'));
    }
    if (existingKYC.status === 'approved') {
      return res.status(400).json(error('Your KYC has already been approved. You are already a trader.'));
    }
  }

  let kyc;

  if (existingKYC && existingKYC.status === 'rejected') {
    // Update the rejected record, resetting to pending
    Object.assign(existingKYC, {
      fullName,
      phone,
      nidNumber,
      dateOfBirth,
      country,
      address,
      district,
      upazila,
      city,
      postCode,
      nidFront,
      nidBack,
      selfieImage,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      submittedAt: new Date(),
    });
    kyc = await existingKYC.save();
  } else {
    // Create new KYC record
    kyc = await KYC.create({
      userId,
      email: req.user!.email,
      fullName,
      phone,
      nidNumber,
      dateOfBirth,
      country,
      address,
      district,
      upazila,
      city,
      postCode,
      nidFront,
      nidBack,
      selfieImage,
      status: 'pending',
    });
  }

  // Update user's KYC status
  await User.findByIdAndUpdate(userId, { kycStatus: 'pending' });

  return res.status(201).json(success(kyc, 'KYC submitted successfully'));
});

// GET /kyc/status
export const getKYCStatus = asyncHandler(async (req, res) => {
  const userId = req.user!._id;

  const user = await User.findById(userId).select('-password');
  if (!user) {
    return res.status(404).json(error('User not found'));
  }

  const kyc = await KYC.findOne({ userId });

  return res.json(success({
    role: user.role,
    isTrader: user.isTrader,
    kycStatus: user.kycStatus,
    kyc: kyc || null,
  }));
});

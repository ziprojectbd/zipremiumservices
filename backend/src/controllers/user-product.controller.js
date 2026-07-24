import UserProduct from '../models/UserProduct.js';
import connectDB from '../db/connect.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/user-products
export const getUserProducts = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, status } = req.query;
  const query = {};

  if (email) {
    query.contactEmail = email.toLowerCase().trim();
  }
  if (status) {
    query.status = status;
  }

  const products = await UserProduct.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return res.json(success(products));
});

// POST /api/user-products
export const createUserProduct = asyncHandler(async (req, res) => {
  await connectDB();

  const {
    name,
    description,
    price,
    currency,
    condition,
    count,
    paymentMethod,
    paymentDetails,
    images,
    contactEmail,
    contactPhone,
    location,
    userName,
  } = req.body;

  if (!name || !description || !price || !paymentMethod || !paymentDetails || !contactEmail || !contactPhone) {
    return res.status(400).json(error('Missing required fields'));
  }

  const product = await UserProduct.create({
    name,
    description,
    price,
    currency: currency || 'BDT',
    condition: condition || 'new',
    count: parseInt(count, 10) || 1,
    paymentMethod,
    paymentDetails,
    images: images || [],
    contactEmail,
    contactPhone,
    location: location || '',
    userName: userName || '',
    status: 'pending',
  });

  return res.status(201).json(success(product, 'Product submitted successfully'));
});

// PUT /api/user-products/:id
export const updateUserProduct = asyncHandler(async (req, res) => {
  await connectDB();

  const { status: newStatus, adminNotice } = req.body;

  if (newStatus && !['pending', 'approved', 'rejected'].includes(newStatus)) {
    return res.status(400).json(error('Invalid status'));
  }

  const update = {};
  if (newStatus) {
    update.status = newStatus;
    update.statusUpdatedAt = new Date();
  }
  if (adminNotice !== undefined) {
    update.adminNotice = adminNotice;
  }

  const product = await UserProduct.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });

  if (!product) {
    return res.status(404).json(error('Product submission not found'));
  }

  return res.json(success(product, `Submission ${newStatus || 'updated'}`));
});

// DELETE /api/user-products/:id
export const deleteUserProduct = asyncHandler(async (req, res) => {
  await connectDB();

  const product = await UserProduct.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json(error('Product submission not found'));
  }

  return res.json(success(null, 'Submission deleted'));
});

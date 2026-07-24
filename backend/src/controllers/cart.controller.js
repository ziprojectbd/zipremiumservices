import connectDB from '../db/connect.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Cart from '../models/Cart.js';

// GET /cart - Get cart by email
export const getCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email } = req.query;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const cart = await Cart.findOne({ userEmail: email.toLowerCase() }).lean();

  return res.json(success(cart || { items: [] }));
});

// POST /cart - Create or fully replace a cart (upsert)
export const createCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, items } = req.body;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const cart = await Cart.findOneAndUpdate(
    { userEmail: email.toLowerCase() },
    { items: items || [] },
    { upsert: true, new: true },
  ).lean();

  return res.json(success(cart));
});

// PUT /cart - Update an existing cart (no upsert)
export const updateCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, items } = req.body;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const cart = await Cart.findOneAndUpdate(
    { userEmail: email.toLowerCase() },
    { items: items || [] },
    { new: true },
  ).lean();

  if (!cart) {
    return res.status(404).json(error('Cart not found'));
  }

  return res.json(success(cart));
});

// DELETE /cart - Delete a cart
export const deleteCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email } = req.query;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  await Cart.findOneAndDelete({ userEmail: email.toLowerCase() });

  return res.json(success(null, 'Cart cleared'));
});

import Review from '../models/Review.js';
import connectDB from '../db/connect.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ---------------------------------------------------------------------------
// GET /reviews — Get approved reviews for a product
// ---------------------------------------------------------------------------
export const getReviews = asyncHandler(async (req, res) => {
  await connectDB();

  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json(error('productId query parameter is required'));
  }

  const reviews = await Review.find({ productId, approved: true })
    .sort({ createdAt: -1 })
    .lean();

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
        ) / 10
      : 0;

  return res.json(
    success(reviews, { totalReviews, averageRating })
  );
});

// ---------------------------------------------------------------------------
// POST /reviews — Create a new review
// ---------------------------------------------------------------------------
export const createReview = asyncHandler(async (req, res) => {
  await connectDB();

  const { productId, customerName, customerEmail, rating, comment } = req.body;

  // Validate required fields
  if (!productId) {
    return res.status(400).json(error('Product ID is required'));
  }
  if (!customerName || !customerName.trim()) {
    return res.status(400).json(error('Customer name is required'));
  }
  if (!customerEmail || !customerEmail.trim()) {
    return res.status(400).json(error('Customer email is required'));
  }
  if (rating === undefined || rating === null) {
    return res.status(400).json(error('Rating is required'));
  }
  if (!comment || !comment.trim()) {
    return res.status(400).json(error('Review comment is required'));
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json(error('Rating must be an integer between 1 and 5'));
  }

  // Check for duplicate review from same email on same product
  const existing = await Review.findOne({
    productId,
    customerEmail: customerEmail.toLowerCase().trim(),
  }).lean();

  if (existing) {
    return res
      .status(409)
      .json(error('You have already submitted a review for this product'));
  }

  const review = await Review.create({
    productId,
    customerName: customerName.trim(),
    customerEmail: customerEmail.toLowerCase().trim(),
    rating: ratingNum,
    comment: comment.trim(),
    approved: true,
  });

  return res.status(201).json(success(review, 'Review submitted'));
});

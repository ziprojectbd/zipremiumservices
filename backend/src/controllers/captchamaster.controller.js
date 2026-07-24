import CaptchaPackage from '../models/CaptchaPackage.js';
import CaptchaOrder from '../models/CaptchaOrder.js';
import { success, error, paginated } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /captchamaster/packages
export const getCustomerPackages = asyncHandler(async (req, res) => {
  const { email, page: rawPage, limit: rawLimit, search } = req.query;

  if (!email) {
    return res.status(400).json(error('email query parameter is required'));
  }

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { customerEmail: email.toLowerCase().trim() };

  if (search) {
    filter.$or = [
      { planName: { $regex: search, $options: 'i' } },
      { status: { $regex: search, $options: 'i' } },
    ];
  }

  const [packages, total] = await Promise.all([
    CaptchaPackage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CaptchaPackage.countDocuments(filter),
  ]);

  return res.json(paginated(packages, total, page, limit));
});

// GET /captchamaster/orders
export const getCustomerOrders = asyncHandler(async (req, res) => {
  const { email, page: rawPage, limit: rawLimit } = req.query;

  if (!email) {
    return res.status(400).json(error('email query parameter is required'));
  }

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { customerEmail: email.toLowerCase().trim() };

  const [orders, total] = await Promise.all([
    CaptchaOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CaptchaOrder.countDocuments(filter),
  ]);

  return res.json(paginated(orders, total, page, limit));
});

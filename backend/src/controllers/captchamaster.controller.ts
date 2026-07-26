import CaptchaPackage from '@models/CaptchaPackage';
import CaptchaOrder from '@models/CaptchaOrder';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

// GET /captchamaster/packages
export const getCustomerPackages = asyncHandler(async (req, res) => {
  const { email, page: rawPage, limit: rawLimit, search } = req.query;

  if (!email) {
    return res.status(400).json(error('email query parameter is required'));
  }

  const page = Math.max(1, parseInt(rawPage as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(rawLimit as string, 10) || 10));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { customerEmail: (email as string).toLowerCase().trim() };

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

  const page = Math.max(1, parseInt(rawPage as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(rawLimit as string, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { customerEmail: (email as string).toLowerCase().trim() };

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

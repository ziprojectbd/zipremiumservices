import CaptchaPackage from '@models/CaptchaPackage';
import CaptchaOrder from '@models/CaptchaOrder';
import CaptchaApiKey from '@models/CaptchaApiKey';
import CaptchaMasterSettings from '@models/CaptchaMasterSettings';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import crypto from 'crypto';

// GET /api/admin/captchamaster/stats
export const getAdminCaptchaStats = asyncHandler(async (req, res) => {
  await connectDB();

  const [
    totalPackages,
    totalApiKeys,
    activePackages,
    totalOrders,
  ] = await Promise.all([
    CaptchaPackage.countDocuments(),
    CaptchaApiKey.countDocuments(),
    CaptchaPackage.countDocuments({ status: 'active' }),
    CaptchaOrder.countDocuments(),
  ]);

  // Aggregate credits and usage
  const creditsAgg = await CaptchaPackage.aggregate([
    { $group: { _id: null, total: { $sum: '$credits' }, used: { $sum: '$creditsUsed' } } },
  ]);

  // Count customers with packages
  const uniqueCustomers = await CaptchaPackage.distinct('customerEmail');

  return res.json(
    success({
      credits: creditsAgg[0]?.total || 0,
      totalUsed: creditsAgg[0]?.used || 0,
      totalCustomers: uniqueCustomers.length,
      totalPackages,
      totalApiKeys,
      totalSuccess: activePackages,
      totalFailed: 0,
      localOrders: totalOrders,
      localActivePackages: activePackages,
    })
  );
});

// GET /api/admin/captchamaster/packages
export const getAdminCaptchaPackages = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.search) {
    query.$or = [
      { planName: { $regex: req.query.search, $options: 'i' } },
      { customerEmail: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [packages, total] = await Promise.all([
    CaptchaPackage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CaptchaPackage.countDocuments(query),
  ]);

  return res.json(
    success({
      data: packages.map((p) => ({
        id: p._id.toString(),
        planId: p.planId,
        planName: p.planName,
        credits: p.credits,
        price: p.price,
        customerEmail: p.customerEmail,
        status: p.status,
        expiresAt: p.expiresAt || '',
        createdAt: p.createdAt,
        startDate: p.activatedAt || p.createdAt,
        endDate: p.expiresAt || '',
        key: p.captchaApiKey || '',
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  );
});

// DELETE /api/admin/captchamaster/packages/:id
export const deleteAdminCaptchaPackage = asyncHandler(async (req, res) => {
  await connectDB();

  const pkg = await CaptchaPackage.findByIdAndDelete(req.params.id);

  if (!pkg) {
    return res.status(404).json(error('Package not found'));
  }

  return res.json(success(null, 'Package deleted'));
});

// GET /api/admin/captchamaster/api-keys
export const getAdminCaptchaApiKeys = asyncHandler(async (req, res) => {
  await connectDB();

  const keys = await CaptchaApiKey.find().sort({ createdAt: -1 }).lean();

  return res.json(
    success(
      keys.map((k) => ({
        id: k._id.toString(),
        name: k.name,
        key: k.key,
        status: k.status,
        createdAt: k.createdAt,
        lastUsed: k.lastUsed || undefined,
      }))
    )
  );
});

// POST /api/admin/captchamaster/api-keys
export const createAdminCaptchaApiKey = asyncHandler(async (req, res) => {
  await connectDB();

  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json(error('Name is required'));
  }

  const rawKey = `cm_${crypto.randomBytes(24).toString('hex')}`;

  const apiKey = await CaptchaApiKey.create({ name: name.trim(), key: rawKey });

  return res.status(201).json(
    success({
      id: apiKey._id.toString(),
      name: apiKey.name,
      key: apiKey.key,
      status: apiKey.status,
      createdAt: apiKey.createdAt,
    })
  );
});

// PUT /api/admin/captchamaster/api-keys/:id/regenerate
export const regenerateAdminCaptchaApiKey = asyncHandler(async (req, res) => {
  await connectDB();

  const rawKey = `cm_${crypto.randomBytes(24).toString('hex')}`;

  const apiKey = await CaptchaApiKey.findByIdAndUpdate(
    req.params.id,
    { key: rawKey, lastUsed: null },
    { new: true }
  );

  if (!apiKey) {
    return res.status(404).json(error('API key not found'));
  }

  return res.json(
    success({
      id: apiKey._id.toString(),
      name: apiKey.name,
      key: apiKey.key,
      status: apiKey.status,
      createdAt: apiKey.createdAt,
    })
  );
});

// DELETE /api/admin/captchamaster/api-keys/:id
export const deleteAdminCaptchaApiKey = asyncHandler(async (req, res) => {
  await connectDB();

  const apiKey = await CaptchaApiKey.findByIdAndDelete(req.params.id);

  if (!apiKey) {
    return res.status(404).json(error('API key not found'));
  }

  return res.json(success(null, 'API key deleted'));
});

// Helper — singleton settings getter (creates default doc on first access)
async function getCaptchaGlobalSettings() {
  let doc = await CaptchaMasterSettings.findById('global').lean();
  if (!doc) {
    const created = await CaptchaMasterSettings.create({ _id: 'global' });
    doc = created.toObject();
  }
  return doc;
}

// GET /api/admin/captchamaster/settings — fetch discount settings
export const getAdminCaptchaSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await getCaptchaGlobalSettings();

  return res.json(
    success({
      discountPercent: settings.discountPercent,
      discountEnabled: settings.discountEnabled,
      exchangeRate: settings.exchangeRate,
    })
  );
});

// PUT /api/admin/captchamaster/settings — update discount settings
export const updateAdminCaptchaSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const { discountPercent, discountEnabled, exchangeRate } = req.body;

  const update: Record<string, unknown> = {};
  if (discountPercent !== undefined) {
    const pct = Number(discountPercent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json(error('discountPercent must be a number between 0 and 100'));
    }
    update.discountPercent = pct;
  }
  if (discountEnabled !== undefined) {
    update.discountEnabled = Boolean(discountEnabled);
  }
  if (exchangeRate !== undefined) {
    const rate = Number(exchangeRate);
    if (Number.isNaN(rate) || rate < 1) {
      return res.status(400).json(error('exchangeRate must be a number greater than 0'));
    }
    update.exchangeRate = rate;
  }

  const settings = await CaptchaMasterSettings.findByIdAndUpdate('global', update, { new: true, upsert: true });

  return res.json(
    success({
      discountPercent: settings.discountPercent,
      discountEnabled: settings.discountEnabled,
      exchangeRate: settings.exchangeRate,
    })
  );
});

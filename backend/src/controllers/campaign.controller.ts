import Campaign from '@models/Campaign';
import connectDB from '@db/connect';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import Product from '@models/Product';

/**
 * Generate a URL-friendly slug from a string.
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET /campaigns — List campaigns (paginated)
export const listCampaigns = asyncHandler(async (req, res) => {
  await connectDB();

  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 50));
  const skip = (page - 1) * limit;

  const { status, search, includeDeleted } = req.query;

  // Build filter
  const filter: Record<string, unknown> = {};

  // Soft-delete handling
  if (includeDeleted !== 'true') {
    filter.isDeleted = { $ne: true };
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const escaped = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { slug: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  const total = await Campaign.countDocuments(filter);
  const data = await Campaign.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json(paginated(data, total, page, limit));
});

// POST /campaigns — Create a campaign
export const createCampaign = asyncHandler(async (req, res) => {
  await connectDB();

  const { name, slug, ...rest } = req.body;

  if (!name || !(name as string).trim()) {
    return res.status(400).json(error('Campaign name is required'));
  }

  // Auto-generate slug from name if not provided
  let finalSlug = slug ? (slug as string).trim() : '';
  if (!finalSlug) {
    finalSlug = slugify(name as string);
  }

  // Handle duplicate slug gracefully
  const existing = await Campaign.findOne({ slug: finalSlug });
  if (existing) {
    return res.status(409).json(error('A campaign with this slug already exists'));
  }

  const campaign = await Campaign.create({
    name: (name as string).trim(),
    slug: finalSlug,
    ...rest,
  });

  return res.status(201).json(success(campaign, 'Campaign created'));
});

// GET /campaigns/active — Public endpoint for active campaigns
export const getActiveCampaigns = asyncHandler(async (req, res) => {
  await connectDB();

  const now = new Date();

  // Find active campaigns: not deleted, is active, status is active or within date range
  const campaigns = await Campaign.find({
    isDeleted: { $ne: true },
    isActive: true,
    $or: [
      { status: 'active' },
      { startDate: { $lte: now }, endDate: { $gt: now } },
      { startDate: { $lte: now }, endDate: null },
    ],
  })
    .sort({ priority: -1, startDate: -1 })
    .lean();

  return res.json(success(campaigns, 'Active campaigns'));
});

// GET /campaigns/:slug — Public endpoint to get campaign with its products
export const getCampaignBySlug = asyncHandler(async (req, res) => {
  await connectDB();

  const { slug } = req.params;
  const limit = parseInt(req.query.limit as string, 10) || 12;

  const campaign = await Campaign.findOne({ slug, isDeleted: { $ne: true } }).lean();

  if (!campaign) {
    return res.status(404).json(error('Campaign not found'));
  }

  // Get product IDs from applicableProducts and productDiscounts
  const productIds: string[] = [
    ...(campaign.applicableProducts || []),
    ...(campaign.productDiscounts || []).map((pd: any) => pd.productId),
  ];

  // Remove duplicates
  const uniqueIds = [...new Set(productIds.map(String))];

  let products: any[] = [];

  if (uniqueIds.length > 0) {
    const rawProducts = await Product.find({
      _id: { $in: uniqueIds },
      available: { $ne: false },
    })
      .limit(limit)
      .lean();

    const rawProductIds = new Set(rawProducts.map((r: any) => String(r._id)));
    const discountMap = new Map<string, any>();
    (campaign.productDiscounts || []).forEach((pd: any) => {
      if (rawProductIds.has(String(pd.productId))) {
        discountMap.set(String(pd.productId), pd);
      }
    });

    products = rawProducts.map((p: any) => {
      const pid = String(p._id);
      const pdOverride = discountMap.get(pid);

      // Determine the effective discount for this product
      const discountType = pdOverride?.discountType || campaign.discountType;
      const discountValue = pdOverride?.discountValue ?? campaign.discountValue;

      let originalPrice: number = p.priceBDT || p.price || 0;
      let discountPrice: number = originalPrice;
      let discountPercent: number = 0;
      let amountSaved: number = 0;

      if (discountType === 'percentage' && discountValue > 0) {
        discountPercent = Math.min(100, discountValue);
        discountPrice = originalPrice * (1 - discountPercent / 100);
        if (campaign.maxDiscountAmount) {
          const saved = originalPrice - discountPrice;
          if (saved > campaign.maxDiscountAmount) {
            discountPrice = originalPrice - campaign.maxDiscountAmount;
          }
        }
        amountSaved = originalPrice - discountPrice;
      } else if (discountType === 'fixed_amount' && discountValue > 0) {
        discountPrice = Math.max(0, originalPrice - discountValue);
        amountSaved = originalPrice - discountPrice;
        discountPercent = originalPrice > 0 ? (amountSaved / originalPrice) * 100 : 0;
      } else if (discountType === 'fixed_price' && discountValue > 0) {
        discountPrice = Math.min(originalPrice, discountValue);
        amountSaved = originalPrice - discountPrice;
        discountPercent = originalPrice > 0 ? (amountSaved / originalPrice) * 100 : 0;
      }

      return {
        ...p,
        campaignPrice: discountPrice,
        campaignDiscount: Math.round(discountPercent * 100) / 100,
        campaignAmountSaved: Math.round(amountSaved * 100) / 100,
        campaignBadge: campaign.name,
        campaignSlug: campaign.slug,
        campaignColor: campaign.colorTheme,
        campaignDiscountType: discountType,
      };
    });
  }

  return res.json(success({ campaign, products }, 'Campaign products'));
});

import Campaign from '@models/Campaign';
import connectDB from '@db/connect';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';

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

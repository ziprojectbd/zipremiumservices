import Campaign from '@models/Campaign';
import connectDB from '@db/connect';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import Product from '@models/Product';
import { isWeeklyCampaignActive } from '@services/cartExpiration.weekly';
import { roundCurrency } from '@utils/currency';

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

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validate discount configuration: percentage 0-100, fixed_amount positive.
 * Returns an error message string or null if valid.
 */
function validateDiscountConfig(
  discountType: string,
  discountValue: number,
  maxDiscountAmount: number | null,
): string | null {
  if (!discountType) return 'Discount type is required';
  if (discountType === 'percentage') {
    if (discountValue == null || discountValue <= 0 || discountValue > 100) {
      return 'Percentage discount must be between 0 and 100';
    }
    if (maxDiscountAmount != null && maxDiscountAmount < 0) {
      return 'Maximum discount amount must be positive';
    }
  } else if (discountType === 'fixed_amount') {
    if (discountValue == null || discountValue <= 0) {
      return 'Fixed discount amount must be positive';
    }
    if (maxDiscountAmount != null && maxDiscountAmount < 0) {
      return 'Maximum discount amount must be positive';
    }
  }
  return null;
}

/**
 * Validate weekly schedule entries:
 * - Each window must have valid start < end (unless crossing midnight)
 * - No duplicate windows for same day
 * - No overlapping windows for same day
 * Returns an error message string or null if valid.
 */
function validateWeeklySchedule(
  schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
): string | null {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return null; // Weekly schedule is optional for weekly_special? Actually required.
  }

  const byDay = new Map<number, Array<{ startTime: string; endTime: string; idx: number }>>();

  for (const [idx, slot] of schedule.entries()) {
    if (!slot.dayOfWeek && slot.dayOfWeek !== 0) {
      return `Window ${idx + 1}: day of week is required`;
    }
    if (!slot.startTime) {
      return `Window ${idx + 1}: start time is required`;
    }
    if (!slot.endTime) {
      return `Window ${idx + 1}: end time is required`;
    }

    // Validate HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(slot.startTime)) {
      return `Window ${idx + 1}: invalid start time format (use HH:MM)`;
    }
    if (!timeRegex.test(slot.endTime)) {
      return `Window ${idx + 1}: invalid end time format (use HH:MM)`;
    }

    const day = Number(slot.dayOfWeek);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push({ startTime: slot.startTime, endTime: slot.endTime, idx });
  }

  // Check for duplicates and overlaps within each day
  for (const [day, windows] of byDay.entries()) {
    // Sort by start time
    windows.sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        const a = windows[i];
        const b = windows[j];

        // Check duplicate (same start and end)
        if (a.startTime === b.startTime && a.endTime === b.endTime) {
          return `Day ${day}: duplicate time window ${a.startTime}-${a.endTime}`;
        }

        // Check overlap
        // Window crosses midnight if endTime <= startTime
        const aCrossesMidnight = a.endTime <= a.startTime;
        const bCrossesMidnight = b.endTime <= b.startTime;

        if (aCrossesMidnight && bCrossesMidnight) {
          // Both cross midnight - they overlap by definition (both cover late night + early morning)
          return `Day ${day}: overlapping time windows ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}`;
        }

        if (aCrossesMidnight) {
          // A covers [startA, 24:00) and [00:00, endA)
          // B is normal [startB, endB)
          // Overlap if B starts before A ends (after midnight) OR B starts at/after A's start
          if (b.startTime < a.endTime || b.startTime >= a.startTime) {
            return `Day ${day}: overlapping time windows ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}`;
          }
        } else if (bCrossesMidnight) {
          // B covers [startB, 24:00) and [00:00, endB)
          // A is normal [startA, endA)
          if (a.startTime < b.endTime || a.startTime >= b.startTime) {
            return `Day ${day}: overlapping time windows ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}`;
          }
        } else {
          // Both normal: overlap if one starts before the other ends
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            return `Day ${day}: overlapping time windows ${a.startTime}-${a.endTime} and ${b.startTime}-${b.endTime}`;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Validate that recurrence end date does not extend beyond global end date.
 */
function validateRecurrenceEnd(
  weeklyRecurrenceEndDate: string | null,
  endDate: string | null,
): string | null {
  if (!weeklyRecurrenceEndDate || !endDate) return null;
  if (new Date(weeklyRecurrenceEndDate) > new Date(endDate)) {
    return 'Recurrence end date must not be after the campaign end date';
  }
  return null;
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

  const {
    name, slug, discountType, discountValue, maxDiscountAmount,
    campaignType, weeklySchedule, weeklyRecurrenceStartDate, weeklyRecurrenceEndDate, endDate, ...rest
  } = req.body;

  if (!name || !(name as string).trim()) {
    return res.status(400).json(error('Campaign name is required'));
  }

  // Validate discount config for percentage/fixed_amount types
  if (discountType === 'percentage' || discountType === 'fixed_amount') {
    const err = validateDiscountConfig(
      discountType as string,
      Number(discountValue),
      maxDiscountAmount != null ? Number(maxDiscountAmount) : null,
    );
    if (err) return res.status(400).json(error(err));
  }

  // Validate weekly schedule for weekly_special campaigns
  if (campaignType === 'weekly_special') {
    const schedErr = validateWeeklySchedule(weeklySchedule || []);
    if (schedErr) return res.status(400).json(error(schedErr));

    // Recurrence start date is required for weekly_special campaigns
    if (!weeklyRecurrenceStartDate) {
      return res.status(400).json(error('Recurrence Start Date & Time is required for Weekly Special campaigns'));
    }

    // Recurrence start must be before recurrence end (if both set)
    if (weeklyRecurrenceStartDate && weeklyRecurrenceEndDate) {
      if (new Date(weeklyRecurrenceStartDate) >= new Date(weeklyRecurrenceEndDate)) {
        return res.status(400).json(error('Recurrence start date must be before recurrence end date'));
      }
    }

    const recurErr = validateRecurrenceEnd(
      weeklyRecurrenceEndDate || null,
      endDate || null,
    );
    if (recurErr) return res.status(400).json(error(recurErr));
  }

  // Round discount value to eliminate floating-point artifacts:
  // - Percentage: whole number (0 decimals)
  // - Fixed amount: 2 decimal places
  let sanitizedDiscountValue = discountValue;
  if (discountValue != null) {
    const dv = Number(discountValue);
    if (discountType === 'percentage') {
      sanitizedDiscountValue = Math.round(dv);
    } else {
      sanitizedDiscountValue = roundCurrency(dv, 2);
    }
  }

  let sanitizedMaxDiscount = maxDiscountAmount;
  if (maxDiscountAmount != null) {
    sanitizedMaxDiscount = roundCurrency(Number(maxDiscountAmount), 2);
  }

  // Auto-generate slug from name if not provided
  let finalSlug = slug ? (slug as string).trim() : '';
  if (!finalSlug) {
    finalSlug = slugify(name as string);
  }

  // Handle duplicate slug gracefully by appending a counter suffix
  let slugSuffix = 0;
  let uniqueSlug = finalSlug;
  while (await Campaign.findOne({ slug: uniqueSlug })) {
    slugSuffix += 1;
    uniqueSlug = `${finalSlug}-${slugSuffix}`;
  }
  finalSlug = uniqueSlug;

  const campaign = await Campaign.create({
    name: (name as string).trim(),
    slug: finalSlug,
    ...rest,
    discountType,
    discountValue: sanitizedDiscountValue,
    maxDiscountAmount: sanitizedMaxDiscount,
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

  // For weekly_special campaigns, additionally check if current time
  // falls within a configured weekly window.
  const filtered = campaigns.filter((c: any) => {
    if (c.campaignType !== 'weekly_special') return true;
    return isWeeklyCampaignActive(c, now, c.weeklyTimezone || 'Asia/Dhaka');
  });

  return res.json(success(filtered, 'Active campaigns'));
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

// PUT /campaigns/:id — Update a campaign
export const updateCampaign = asyncHandler(async (req, res) => {
  await connectDB();

  const { id } = req.params;
  const {
    discountType, discountValue, maxDiscountAmount,
    campaignType, weeklySchedule, weeklyRecurrenceStartDate, weeklyRecurrenceEndDate, endDate, ...rest
  } = req.body;

  // Validate discount config for percentage/fixed_amount types
  if (discountType === 'percentage' || discountType === 'fixed_amount') {
    const err = validateDiscountConfig(
      discountType as string,
      Number(discountValue),
      maxDiscountAmount != null ? Number(maxDiscountAmount) : null,
    );
    if (err) return res.status(400).json(error(err));
  }

  // Validate weekly schedule for weekly_special campaigns
  if (campaignType === 'weekly_special') {
    const schedErr = validateWeeklySchedule(weeklySchedule || []);
    if (schedErr) return res.status(400).json(error(schedErr));

    // Recurrence start date is required for weekly_special campaigns
    if (!weeklyRecurrenceStartDate) {
      return res.status(400).json(error('Recurrence Start Date & Time is required for Weekly Special campaigns'));
    }

    // Recurrence start must be before recurrence end (if both set)
    if (weeklyRecurrenceStartDate && weeklyRecurrenceEndDate) {
      if (new Date(weeklyRecurrenceStartDate) >= new Date(weeklyRecurrenceEndDate)) {
        return res.status(400).json(error('Recurrence start date must be before recurrence end date'));
      }
    }

    const recurErr = validateRecurrenceEnd(
      weeklyRecurrenceEndDate || null,
      endDate || null,
    );
    if (recurErr) return res.status(400).json(error(recurErr));
  }

  // Round discount value to eliminate floating-point artifacts
  let sanitizedDiscountValue = discountValue;
  if (discountValue != null) {
    const dv = Number(discountValue);
    if (discountType === 'percentage') {
      sanitizedDiscountValue = Math.round(dv);
    } else {
      sanitizedDiscountValue = roundCurrency(dv, 2);
    }
  }

  let sanitizedMaxDiscount = maxDiscountAmount;
  if (maxDiscountAmount != null) {
    sanitizedMaxDiscount = roundCurrency(Number(maxDiscountAmount), 2);
  }

  const campaign = await Campaign.findByIdAndUpdate(
    id,
    {
      ...rest,
      $set: {
        ...rest,
        discountType,
        discountValue: sanitizedDiscountValue,
        maxDiscountAmount: sanitizedMaxDiscount,
      },
    },
    { new: true, runValidators: true },
  );

  if (!campaign) {
    return res.status(404).json(error('Campaign not found'));
  }

  return res.json(success(campaign, 'Campaign updated'));
});

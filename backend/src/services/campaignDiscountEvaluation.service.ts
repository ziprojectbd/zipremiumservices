/**
 * Campaign Discount Evaluation Service
 *
 * Evaluates all eligible campaigns for a cart, applies priority and
 * compatibility rules, and returns a deterministic discount breakdown.
 *
 * All pricing comes from trusted server-side data. Client-provided
 * discounts, totals, or expiration timestamps are never trusted.
 */

import Campaign from '@models/Campaign';
import Coupon from '@models/Coupon';
import { roundCurrency } from '@utils/currency';
import { selectApplicableCampaignDiscount } from '@utils/campaignDiscount';
import { TZDate } from '@utils/timezone';

export interface CartLineInput {
  productId: string;
  dbId: string;
  basePrice: number;
  quantity: number;
  category?: string;
}

export interface PaymentMethodInput {
  code: string | null;
  isEnabled: boolean;
}

export interface DiscountResultLine {
  productId: string;
  dbId: string;
  basePrice: number;
  discountedPrice: number;
  quantity: number;
  discountAmount: number;
  discountPercent: number;
  appliedCampaignId: string | null;
  appliedCampaignName: string | null;
  appliedCampaignType: string | null;
  breakdown: Array<{ source: string; label: string; amount: number }>;
}

export interface CartDiscountEvaluation {
  subtotal: number;
  totalDiscount: number;
  payableTotal: number;
  lines: DiscountResultLine[];
  appliedCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    campaignType: string;
    discountAmount: number;
  }>;
  appliedCoupon: {
    code: string;
    discountAmount: number;
    discountType: string;
  } | null;
  breakdown: Array<{ source: string; label: string; amount: number }>;
}

/**
 * Compute weekly campaign active state at `now`.
 * Handles day-of-week + start/end time windows, including midnight-crossing
 * schedules (e.g. Friday 22:00 to Saturday 02:00).
 */
function isWeeklyCampaignActive(
  campaign: Record<string, unknown>,
  now: Date,
  tz: string,
): boolean {
  const schedule = (campaign.weeklySchedule as unknown[]) || [];
  if (!schedule.length) return false;

  // Convert now to the campaign timezone
  const nowInTz = new TZDate(now, tz);
  const dayOfWeek = nowInTz.getDay(); // 0=Sunday ... 6=Saturday
  const timeStr = nowInTz.toTimeString().slice(0, 5); // HH:MM

  for (const rawSlot of schedule) {
    const slot = rawSlot as Record<string, unknown>;
    if (Number(slot.dayOfWeek) !== dayOfWeek) continue;

    const start = String(slot.startTime);
    const end = String(slot.endTime);

    let inWindow: boolean;
    if (end <= start) {
      // Crosses midnight: e.g. 22:00 to 02:00
      inWindow = timeStr >= start || timeStr < end;
    } else {
      inWindow = timeStr >= start && timeStr < end;
    }

    if (inWindow) {
      // Check recurrence end date
      if (campaign.weeklyRecurrenceEndDate) {
        if (new Date(campaign.weeklyRecurrenceEndDate as string) <= now) return false;
      }
      return true;
    }
  }
  return false;
}

/**
 * Evaluate all eligible discounts for a cart.
 *
 * Priority rules (lower number = higher priority):
 *   1. special_offer (existing campaign discounts on products)
 *   2. payment_method (discount for using a specific gateway method)
 *   3. bulk_quantity (quantity-tier discounts per product)
 *   4. weekly_special (recurring weekly schedule discounts)
 *
 * Coupons are evaluated separately and applied last to the cart subtotal.
 *
 * Stacking rules:
 *   - If a campaign has `stackableWithCoupons: false`, coupon is not applied
 *   - If campaigns have `stackable: false` with each other, only highest
 *     priority eligible campaign applies
 *   - Per-line, at most one campaign discount applies (highest priority)
 *   - Cart-level coupon can stack with per-line campaign discounts unless
 *     explicitly disabled
 */
export async function evaluateCartDiscounts({
  lines,
  paymentMethod,
  couponCode,
  couponDiscount,
  couponType,
  now,
  tz = 'Asia/Dhaka',
}: {
  lines: CartLineInput[];
  paymentMethod: PaymentMethodInput;
  couponCode?: string | null;
  couponDiscount?: number;
  couponType?: string | null;
  now?: Date;
  tz?: string;
}): Promise<CartDiscountEvaluation> {
  const runNow = now || new Date();

  // Fetch all potentially relevant campaigns (active status + date range)
  const allCampaigns = await Campaign.find({
    isDeleted: { $ne: true },
    isActive: true,
    $or: [
      { status: 'active' },
      { status: 'scheduled', startDate: { $lte: runNow }, $or: [{ endDate: null }, { endDate: { $gt: runNow } }] },
    ],
  }).lean();

  // ---- 1. Special offer campaigns (per-product) ----
  const specialCampaigns = allCampaigns.filter((c) => c.campaignType === 'special_offer');

  // ---- 2. Payment method campaigns ----
  const paymentMethodCampaigns = allCampaigns.filter(
    (c) => c.campaignType === 'payment_method' &&
      c.eligiblePaymentMethods &&
      c.eligiblePaymentMethods.includes(paymentMethod.code || '') &&
      paymentMethod.isEnabled,
  );

  // ---- 3. Bulk quantity campaigns ----
  const bulkQuantityCampaigns = allCampaigns.filter((c) => c.campaignType === 'bulk_quantity');

  // ---- 4. Weekly special campaigns ----
  const weeklyCampaigns = allCampaigns.filter(
    (c) => c.campaignType === 'weekly_special' && isWeeklyCampaignActive(c, runNow, tz),
  );

  // Combine all campaign discounts, sorted by priority (ascending)
  const allEligibleCampaigns = [
    ...specialCampaigns.map((c) => ({ ...c, _priority: 1 })),
    ...paymentMethodCampaigns.map((c) => ({ ...c, _priority: 2 })),
    ...bulkQuantityCampaigns.map((c) => ({ ...c, _priority: 3 })),
    ...weeklyCampaigns.map((c) => ({ ...c, _priority: 4 })),
  ].sort((a, b) => a._priority - b._priority);

  // ---- Evaluate per-line discounts ----
  const evaluatedLines: DiscountResultLine[] = [];
  const appliedCampaignMap = new Map<string, { discountAmount: number; name: string; type: string }>();

  for (const line of lines) {
    let bestLineDiscount: {
      campaignId: string;
      campaignName: string;
      campaignType: string;
      discountedPrice: number;
      discountAmount: number;
      discountPercent: number;
      breakdown: Array<{ source: string; label: string; amount: number }>;
    } | null = null;

    for (const campaign of allEligibleCampaigns) {
      // Check product/category eligibility
      if (!isCampaignEligibleForProduct(campaign, line)) continue;

      // Bulk quantity: only applies if quantity is within a tier
      if (campaign.campaignType === 'bulk_quantity') {
        const tier = findBulkTier(campaign, line.quantity);
        if (!tier) continue;
        const discounted = applyBulkTierDiscount(line.basePrice, line.quantity, tier);
        if (!discounted) continue;
        const candidate = {
          campaignId: String(campaign._id),
          campaignName: String(campaign.name),
          campaignType: campaign.campaignType,
          discountedPrice: discounted.price,
          discountAmount: discounted.totalDiscount,
          discountPercent: discounted.percent,
          breakdown: [{
            source: 'bulk_quantity',
            label: `Bulk ${tier.minQty}+ qty`,
            amount: discounted.totalDiscount,
          }],
        };
        if (!bestLineDiscount || candidate.discountAmount > bestLineDiscount.discountAmount) {
          bestLineDiscount = candidate;
        }
        continue;
      }

      // Payment method: applies to entire cart subtotal, not per line
      // (handled separately below)
      if (campaign.campaignType === 'payment_method') continue;

      // Weekly special: same as special offer but time-windowed
      if (campaign.campaignType === 'weekly_special') {
        const effective = selectApplicableCampaignDiscount({
          productId: line.productId,
          basePrice: line.basePrice,
          campaigns: [campaign],
          now: runNow,
        });
        if (!effective) continue;
        const candidate = {
          campaignId: effective.campaignId,
          campaignName: String(campaign.name),
          campaignType: campaign.campaignType,
          discountedPrice: effective.discountPrice,
          discountAmount: effective.amountSaved * line.quantity,
          discountPercent: effective.discountPercent,
          breakdown: [{
            source: 'weekly_special',
            label: `Weekly ${campaign.name}`,
            amount: effective.amountSaved * line.quantity,
          }],
        };
        if (!bestLineDiscount || candidate.discountAmount > bestLineDiscount.discountAmount) {
          bestLineDiscount = candidate;
        }
        continue;
      }

      // Special offer: standard per-product campaign discount
      const effective = selectApplicableCampaignDiscount({
        productId: line.productId,
        basePrice: line.basePrice,
        campaigns: [campaign],
        now: runNow,
      });
      if (!effective) continue;

      const candidate = {
        campaignId: effective.campaignId,
        campaignName: String(campaign.name),
        campaignType: campaign.campaignType,
        discountedPrice: effective.discountPrice,
        discountAmount: effective.amountSaved * line.quantity,
        discountPercent: effective.discountPercent,
        breakdown: [{
          source: 'special_offer',
          label: campaign.name,
          amount: effective.amountSaved * line.quantity,
        }],
      };
      if (!bestLineDiscount || candidate.discountAmount > bestLineDiscount.discountAmount) {
        bestLineDiscount = candidate;
      }
    }

    const finalPrice = bestLineDiscount
      ? bestLineDiscount.discountedPrice * line.quantity
      : line.basePrice * line.quantity;
    const lineDiscount = bestLineDiscount
      ? bestLineDiscount.discountAmount
      : 0;

    if (bestLineDiscount) {
      appliedCampaignMap.set(bestLineDiscount.campaignId, {
        discountAmount: bestLineDiscount.discountAmount,
        name: bestLineDiscount.campaignName,
        type: bestLineDiscount.campaignType,
      });
    }

    evaluatedLines.push({
      productId: line.productId,
      dbId: line.dbId,
      basePrice: line.basePrice,
      discountedPrice: bestLineDiscount ? bestLineDiscount.discountedPrice : line.basePrice,
      quantity: line.quantity,
      discountAmount: lineDiscount,
      discountPercent: bestLineDiscount ? bestLineDiscount.discountPercent : 0,
      appliedCampaignId: bestLineDiscount ? bestLineDiscount.campaignId : null,
      appliedCampaignName: bestLineDiscount ? bestLineDiscount.campaignName : null,
      appliedCampaignType: bestLineDiscount ? bestLineDiscount.campaignType : null,
      breakdown: bestLineDiscount ? bestLineDiscount.breakdown : [],
    });
  }

  // ---- Payment method discount (cart-level, applied to subtotal) ----
  let paymentMethodDiscountAmount = 0;
  let paymentMethodCampaignName = '';
  for (const campaign of paymentMethodCampaigns) {
    // Check if campaign applies to eligible products in cart
    const applicableLines = evaluatedLines.filter((l) =>
      isCampaignEligibleForProduct(campaign, { productId: l.productId, dbId: l.dbId, basePrice: l.discountedPrice, quantity: l.quantity }),
    );
    if (!applicableLines.length) continue;

    const applicableSubtotal = applicableLines.reduce(
      (sum, l) => sum + l.discountedPrice * l.quantity, 0,
    );

    let discountAmount = 0;
    if (campaign.paymentMethodDiscountType === 'percentage') {
      discountAmount = applicableSubtotal * (Number(campaign.paymentMethodDiscountValue) / 100);
    } else if (campaign.paymentMethodDiscountType === 'fixed_amount') {
      discountAmount = Number(campaign.paymentMethodDiscountValue);
    }
    if (campaign.paymentMethodMaxDiscount) {
      discountAmount = Math.min(discountAmount, campaign.paymentMethodMaxDiscount);
    }

    if (discountAmount > paymentMethodDiscountAmount) {
      paymentMethodDiscountAmount = discountAmount;
      paymentMethodCampaignName = String(campaign.name);
      appliedCampaignMap.set(String(campaign._id), {
        discountAmount,
        name: paymentMethodCampaignName,
        type: 'payment_method',
      });
    }
  }

  // ---- Cart-level coupon (applied last) ----
  let couponResult: { code: string; discountAmount: number; discountType: string } | null = null;
  let couponDiscountAmount = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode }).lean();
    if (coupon && isCouponValid(coupon, runNow)) {
      // Check stacking compatibility with campaigns
      const stackingDisabled = allEligibleCampaigns.some(
        (c) => c.stackableWithCoupons === false,
      );
      if (!stackingDisabled) {
        const couponSubtotal = evaluatedLines.reduce(
          (sum, l) => sum + l.discountedPrice * l.quantity, 0,
        );
        if (coupon.minOrderAmount && couponSubtotal < coupon.minOrderAmount) {
          // Coupon not applicable due to min spend
        } else {
          if (coupon.discountType === 'percentage') {
            couponDiscountAmount = couponSubtotal * (Number(coupon.discountValue) / 100);
          } else {
            couponDiscountAmount = Number(coupon.discountValue);
          }
          if (coupon.maxDiscountAmount) {
            couponDiscountAmount = Math.min(couponDiscountAmount, coupon.maxDiscountAmount);
          }
          couponResult = {
            code: String(coupon.code),
            discountAmount: roundCurrency(couponDiscountAmount),
            discountType: String(coupon.discountType),
          };
        }
      }
    }
  }

  const lineSubtotal = evaluatedLines.reduce((sum, l) => sum + l.basePrice * l.quantity, 0);
  const lineDiscountTotal = evaluatedLines.reduce((sum, l) => sum + l.discountAmount, 0);
  const discountedSubtotal = lineSubtotal - lineDiscountTotal - paymentMethodDiscountAmount;
  const finalSubtotal = Math.max(0, roundCurrency(discountedSubtotal));
  const totalDiscount = lineDiscountTotal + paymentMethodDiscountAmount + couponDiscountAmount;
  const payableTotal = roundCurrency(Math.max(0, finalSubtotal - couponDiscountAmount));

  const appliedCampaigns = Array.from(appliedCampaignMap.entries()).map(
    ([campaignId, info]) => ({
      campaignId,
      campaignName: info.name,
      campaignType: info.type,
      discountAmount: roundCurrency(info.discountAmount),
    }),
  );

  const breakdown: Array<{ source: string; label: string; amount: number }> = [];
  for (const line of evaluatedLines) {
    for (const b of line.breakdown) {
      breakdown.push({ ...b, amount: roundCurrency(b.amount) });
    }
  }
  if (paymentMethodDiscountAmount > 0) {
    breakdown.push({ source: 'payment_method', label: paymentMethodCampaignName, amount: roundCurrency(paymentMethodDiscountAmount) });
  }
  if (couponDiscountAmount > 0 && couponResult) {
    breakdown.push({ source: 'coupon', label: couponResult.code, amount: roundCurrency(couponDiscountAmount) });
  }

  return {
    subtotal: roundCurrency(lineSubtotal),
    totalDiscount: roundCurrency(totalDiscount),
    payableTotal,
    lines: evaluatedLines,
    appliedCampaigns,
    appliedCoupon: couponResult,
    breakdown,
  };
}

function isCampaignEligibleForProduct(
  campaign: Record<string, unknown>,
  line: { productId: string; dbId: string; basePrice: number; quantity: number; category?: string },
): boolean {
  const targetType = String(campaign.targetType || 'specific_products');
  const applicableProducts = (campaign.applicableProducts as unknown[]) || [];
  const applicableCategories = (campaign.applicableCategories as unknown[]) || [];

  if (targetType === 'entire_store') return true;

  if (targetType === 'specific_products' || targetType === 'categories') {
    const productMatches = applicableProducts.some(
      (p: unknown) => String(p) === line.productId || String(p) === line.dbId,
    );
    if (productMatches) return true;

    if (line.category && applicableCategories.includes(line.category)) {
      return true;
    }
    return false;
  }

  return false;
}

function findBulkTier(
  campaign: Record<string, unknown>,
  quantity: number,
): Record<string, unknown> | null {
  const tiers = (campaign.bulkQuantityTiers as unknown[]) as Record<string, unknown>[];
  const matching = tiers.filter((tier) => {
    const min = Number(tier.minQty);
    const max = tier.maxQty ? Number(tier.maxQty) : Infinity;
    return quantity >= min && quantity <= max;
  });
  if (!matching.length) return null;
  return matching.reduce((best, tier) => {
    const bestVal = Number(best.discountValue);
    const curVal = Number(tier.discountValue);
    return curVal > bestVal ? tier : best;
  }, matching[0]);
}

function applyBulkTierDiscount(
  basePrice: number,
  quantity: number,
  tier: Record<string, unknown>,
): { price: number; totalDiscount: number; percent: number } | null {
  const lineTotal = basePrice * quantity;
  let discountAmount = 0;
  let discountPercent = 0;

  if (tier.discountType === 'percentage') {
    discountPercent = Number(tier.discountValue);
    discountAmount = lineTotal * (discountPercent / 100);
  } else if (tier.discountType === 'fixed_amount') {
    discountAmount = Number(tier.discountValue) * quantity;
  }

  if (tier.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(tier.maxDiscountAmount));
  }

  discountAmount = Math.max(0, discountAmount);
  const price = Math.max(0, lineTotal - discountAmount) / quantity;

  return {
    price: roundCurrency(price),
    totalDiscount: roundCurrency(discountAmount),
    percent: discountPercent,
  };
}

function isCouponValid(
  coupon: Record<string, unknown> | undefined,
  now: Date,
): boolean {
  if (!coupon) return false;
  if (coupon.isActive !== true) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt as string) < now) return false;
  if (Number(coupon.usageLimit || 0) > 0 && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit || 0)) return false;
  return true;
}

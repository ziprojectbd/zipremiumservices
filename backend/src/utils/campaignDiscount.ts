/**
 * Server-side campaign discount computation shared by cart validation and
 * order creation.
 *
 * Campaigns are trusted only from the database. A campaign applies to a
 * product when the product is listed in `applicableProducts` and the campaign
 * is currently running (status active, isActive, not deleted, started, and not
 * past its end date). Status alone is not trusted: a campaign whose end date
 * passed but was never re-saved can still read `status: 'active'`, so the
 * date range is checked explicitly against `now`.
 *
 * The effective price mirrors `Campaign.getEffectivePrice` so plain (lean)
 * documents and full model instances behave identically.
 */

import Campaign from '@models/Campaign';

export interface CampaignPriceResult {
  campaignId: string;
  campaignSlug: string;
  discountType: string;
  discountPrice: number;
  discountPercent: number;
  amountSaved: number;
}

function computeEffectivePrice(
  campaign: { discountType?: string; discountValue?: number; maxDiscountAmount?: number },
  basePrice: number,
): { discountType: string; discountPrice: number; discountPercent: number; amountSaved: number } | null {
  if (!basePrice || basePrice <= 0) return null;

  let discountPrice = basePrice;
  let discountPercent = 0;

  switch (campaign.discountType) {
    case 'percentage':
      discountPercent = Math.min(100, Number(campaign.discountValue) || 0);
      discountPrice = basePrice * (1 - discountPercent / 100);
      if (campaign.maxDiscountAmount) {
        const saved = basePrice - discountPrice;
        if (saved > campaign.maxDiscountAmount) {
          discountPrice = basePrice - campaign.maxDiscountAmount;
        }
      }
      break;
    case 'fixed_amount':
      discountPrice = Math.max(0, basePrice - (Number(campaign.discountValue) || 0));
      discountPercent = basePrice > 0 ? ((basePrice - discountPrice) / basePrice) * 100 : 0;
      break;
    case 'fixed_price':
      discountPrice = Math.min(basePrice, Number(campaign.discountValue) || 0);
      discountPercent = basePrice > 0 ? ((basePrice - discountPrice) / basePrice) * 100 : 0;
      break;
    case 'coupon_required':
      // Coupon Required: no direct discount from the campaign. The customer
      // must provide a valid coupon code at checkout; the coupon's own discount
      // is applied separately. Return base price so the line isn't free.
      discountPrice = basePrice;
      discountPercent = 0;
      break;
    default:
      return null;
  }

  const amountSaved = basePrice - discountPrice;
  return {
    discountType: campaign.discountType,
    discountPrice: Math.round(discountPrice * 100) / 100,
    discountPercent: Math.round(discountPercent * 100) / 100,
    amountSaved: Math.round(amountSaved * 100) / 100,
  };
}

/**
 * Return the best (lowest) applicable campaign discount for a product, or null
 * when no running campaign covers it. `campaigns` should be pre-fetched to
 * avoid querying inside a loop.
 */
export function selectApplicableCampaignDiscount({
  productId,
  basePrice,
  campaigns,
  now,
}: {
  productId: string;
  basePrice: number;
  campaigns: Array<Record<string, unknown>>;
  now: Date;
}): CampaignPriceResult | null {
  if (!basePrice || basePrice <= 0) return null;

  let best: CampaignPriceResult | null = null;

  for (const campaign of campaigns) {
    if (campaign.isDeleted === true || campaign.isActive !== true) continue;
    if (campaign.status !== 'active') continue;
    if (campaign.startDate && new Date(campaign.startDate as string) > now) continue;
    if (campaign.endDate && new Date(campaign.endDate as string) <= now) continue;

    const applicableProducts = (campaign.applicableProducts as unknown[]) || [];
    const applies = applicableProducts.some((p: unknown) => p?.toString() === productId);
    if (!applies) continue;

    const effective =
      typeof (campaign as any).getEffectivePrice === 'function'
        ? (campaign as any).getEffectivePrice(basePrice)
        : computeEffectivePrice(campaign as Record<string, unknown>, basePrice);
    if (!effective) continue;

    const result: CampaignPriceResult = {
      campaignId: String((campaign._id ?? campaign.id ?? '') as unknown as string),
      campaignSlug: String((campaign.slug ?? '') as unknown as string),
      discountType: campaign.discountType,
      ...effective,
    };
    if (!best || result.discountPrice < best.discountPrice) {
      best = result;
    }
  }

  return best;
}

import connectDB from '@db/connect';
import Cart from '@models/Cart';
import Product from '@models/Product';
import Campaign from '@models/Campaign';
import Coupon from '@models/Coupon';
import { roundCurrency } from '@utils/currency';
import { selectApplicableCampaignDiscount } from '@utils/campaignDiscount';
import { isWeeklyCampaignActive } from './cartExpiration.weekly';

export interface SanitizeCartInput {
  items: Array<Record<string, unknown>>;
  cartCouponCode?: string | null;
  cartCouponDiscount?: number;
  cartCouponType?: string | null;
  paymentMethodCode?: string | null;
  paymentMethodIsEnabled?: boolean;
  now?: Date;
}

export interface SanitizeCartCoupon {
  code: string;
  discount: number;
  type: string;
}

export interface SanitizeCartResult {
  items: Array<Record<string, unknown>>;
  removedItems: Array<Record<string, unknown>>;
  couponCleared: boolean;
  paymentMethodDiscountCleared: boolean;
  coupon: SanitizeCartCoupon | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  itemCount: number;
}

/**
 * Sanitize a cart's discounted items against trusted campaign/coupon data.
 *
 * - Campaign-discounted items whose campaign is not currently running are
 *   removed (the discounted line is dropped; the product can be re-added at its
 *   regular price).
 *   Active campaign items have their price re-derived from the database, so a
 *   stale client-supplied discount can never survive.
 * - Per-item coupon discounts whose coupon is invalid are removed.
 * - A cart-level coupon that is expired/disabled/exhausted is cleared and the
 *   cart is recalculated without it.
 *
 * Client-provided prices, discount amounts and expiration timestamps are never
 * trusted.
 */
export async function sanitizeCart(input: SanitizeCartInput): Promise<SanitizeCartResult> {
  await connectDB();
  const now = input.now || new Date();

  // Load currently-running campaigns once.
  const campaigns = await Campaign.find({
    isDeleted: { $ne: true },
    isActive: true,
    status: 'active',
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gt: now } }],
  }).lean();

  // Index coupons by code for cart-level and per-item checks.
  const couponCodes = new Set<string>();
  if (input.cartCouponCode) couponCodes.add(input.cartCouponCode);
  for (const item of input.items) {
    if (item.couponCode) couponCodes.add(String(item.couponCode));
  }
  const coupons = couponCodes.size
    ? await Coupon.find({ code: { $in: [...couponCodes] } }).lean()
    : [];
  const couponByCode = new Map<string, Record<string, unknown>>(
    coupons.map((c) => [String(c.code), c]),
  );

  // Pre-fetch product base prices for items that need price re-derivation.
  const neededProductIds = new Set<string>();
  for (const item of input.items) {
    if (item.discountSource === 'campaign' && item.campaignId && !item.originalPrice) {
      neededProductIds.add(String(item.dbId || item.productId || item.id));
    }
  }
  const products = neededProductIds.size
    ? await Product.find({ _id: { $in: [...neededProductIds] } }).lean()
    : [];
  const productById = new Map<string, Record<string, unknown>>(
    products.map((p) => [String(p._id), p]),
  );

  const removedItems: Array<Record<string, unknown>> = [];
  const cleanedItems: Array<Record<string, unknown>> = [];

  let couponCleared = false;
  let paymentMethodDiscountCleared = false;
  let effectiveCouponCode = input.cartCouponCode ? String(input.cartCouponCode) : null;
  let effectiveCouponDiscount = Number(input.cartCouponDiscount) || 0;
  let effectiveCouponType = input.cartCouponType ? String(input.cartCouponType) : '';

  // Validate the cart-level coupon once.
  if (effectiveCouponCode && !isCouponValid(couponByCode.get(effectiveCouponCode), now)) {
    effectiveCouponCode = null;
    effectiveCouponDiscount = 0;
    effectiveCouponType = '';
    couponCleared = true;
  }

  // Load all campaigns that could apply to these items (including new types).
  const allCampaigns = await Campaign.find({
    isDeleted: { $ne: true },
    isActive: true,
    $or: [
      { status: 'active' },
      { status: 'scheduled', startDate: { $lte: now }, $or: [{ endDate: null }, { endDate: { $gt: now } }] },
    ],
  }).lean();

  const weeklyTz = 'Asia/Dhaka';

  for (const rawItem of input.items) {
    const item = { ...rawItem };
    let remove = false;

    if (item.discountSource === 'campaign' || item.discountSource === 'weekly_special') {
      const campaignId = String(item.campaignId || '');
      const campaign = allCampaigns.find(
        (c) => String(c._id?.toString?.() ?? c.id ?? '') === campaignId,
      );
      if (!campaign || !isCampaignRunning(campaign, now)) {
        remove = true;
      } else if (campaign.campaignType === 'weekly_special') {
        if (!isWeeklyCampaignActive(campaign, now, weeklyTz)) {
          remove = true;
        } else {
          const productId = String(item.dbId || item.productId || item.id);
          const basePrice =
            Number(item.originalPrice ?? 0) || basePriceOfProduct(item, productById) || 0;
          const discount = selectApplicableCampaignDiscount({
            productId,
            basePrice,
            campaigns: [campaign],
            now,
          });
          if (!discount) {
            remove = true;
          } else {
            item.price = discount.discountPrice;
            item.originalPrice = basePrice;
            item.campaignId = discount.campaignId;
            item.campaignSlug = discount.campaignSlug;
            item.discountType = discount.discountType;
            item.expiresAt = campaign.endDate ? new Date(campaign.endDate as string) : null;
          }
        }
      } else {
        const productId = String(item.dbId || item.productId || item.id);
        const basePrice =
          Number(item.originalPrice ?? 0) || basePriceOfProduct(item, productById) || 0;
        const discount = selectApplicableCampaignDiscount({
          productId,
          basePrice,
          campaigns: [campaign],
          now,
        });
        if (!discount) {
          remove = true;
        } else {
          item.price = discount.discountPrice;
          item.originalPrice = basePrice;
          item.campaignId = discount.campaignId;
          item.campaignSlug = discount.campaignSlug;
          item.discountType = discount.discountType;
          item.expiresAt = campaign.endDate ? new Date(campaign.endDate as string) : null;
        }
      }
    } else if (item.discountSource === 'payment_method') {
      const campaignId = String(item.campaignId || '');
      const campaign = allCampaigns.find(
        (c) => String(c._id?.toString?.() ?? c.id ?? '') === campaignId &&
          c.campaignType === 'payment_method',
      );
      const methodCode = input.paymentMethodCode ? String(input.paymentMethodCode) : '';
      const methodEnabled = input.paymentMethodIsEnabled !== false;
      const eligible =
        campaign &&
        methodEnabled &&
        campaign.eligiblePaymentMethods &&
        campaign.eligiblePaymentMethods.includes(methodCode);
      if (!eligible) {
        remove = true;
        paymentMethodDiscountCleared = true;
      } else {
        const qty = Math.max(1, Number((item as Record<string, unknown>).quantity || 1));
        const basePrice =
          Number(item.originalPrice ?? 0) || basePriceOfProduct(item, productById) || 0;
        let discountAmount = 0;
        if (campaign.paymentMethodDiscountType === 'percentage') {
          discountAmount = basePrice * qty * (Number(campaign.paymentMethodDiscountValue) / 100);
        } else if (campaign.paymentMethodDiscountType === 'fixed_amount') {
          discountAmount = Number(campaign.paymentMethodDiscountValue) * qty;
        }
        if (campaign.paymentMethodMaxDiscount) {
          discountAmount = Math.min(discountAmount, campaign.paymentMethodMaxDiscount);
        }
        item.price = Math.max(0, basePrice - discountAmount / qty);
        item.expiresAt = null;
        item.discountType = 'payment_method';
      }
    } else if (item.discountSource === 'bulk_quantity') {
      const campaignId = String(item.campaignId || '');
      const campaign = allCampaigns.find(
        (c) => String(c._id?.toString?.() ?? c.id ?? '') === campaignId &&
          c.campaignType === 'bulk_quantity',
      );
      const qty = Math.max(1, Number((item as Record<string, unknown>).quantity || 1));
      if (!campaign) {
        remove = true;
      } else {
        const tier = findBulkTier(campaign, qty);
        if (!tier) {
          remove = true; // quantity no longer in any tier
        } else {
          const basePrice =
            Number(item.originalPrice ?? 0) || basePriceOfProduct(item, productById) || 0;
          const discounted = applyBulkTierDiscount(basePrice, qty, tier);
          if (!discounted) {
            remove = true;
          } else {
            item.price = discounted.price;
            item.originalPrice = basePrice;
            item.expiresAt = null;
            item.discountType = 'bulk_quantity';
          }
        }
      }
    } else if (item.discountSource === 'coupon' && item.couponCode) {
      const coupon = couponByCode.get(String(item.couponCode));
      if (!coupon || !isCouponValid(coupon, now)) {
        remove = true;
      } else {
        item.expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt as string) : null;
        item.discountType = 'coupon';
      }
    }

    if (remove) {
      removedItems.push(item);
      continue;
    }
    cleanedItems.push(item);
  }

  const subtotal = roundCurrency(
    cleanedItems.reduce((sum, item) => {
      const isSmm = item.smmProvider === 'oneservicebd';
      const unit = Number(item.priceBDT ?? item.price ?? 0);
      const qty = isSmm ? (Number(item.quantity) || 1) / 1000 : (Number(item.quantity) || 1);
      return sum + unit * qty;
    }, 0),
  );

  const discountAmount = roundCurrency(effectiveCouponDiscount);
  const total = roundCurrency(Math.max(0, subtotal - discountAmount));

  return {
    items: cleanedItems,
    removedItems,
    couponCleared,
    paymentMethodDiscountCleared,
    coupon: effectiveCouponCode
      ? { code: effectiveCouponCode, discount: effectiveCouponDiscount, type: effectiveCouponType }
      : null,
    subtotal,
    discountAmount,
    total,
    itemCount: cleanedItems.length,
  };
}

function isCampaignRunning(campaign: Record<string, unknown>, now: Date): boolean {
  if (campaign.isDeleted === true || campaign.isActive !== true) return false;
  if (campaign.status !== 'active') return false;
  if (campaign.startDate && new Date(campaign.startDate as string) > now) return false;
  if (campaign.endDate && new Date(campaign.endDate as string) <= now) return false;
  return true;
}

function isCouponValid(coupon: Record<string, unknown> | undefined, now: Date): boolean {
  if (!coupon) return false;
  if (coupon.isActive !== true) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt as string) < now) return false;
  if (Number(coupon.usageLimit || 0) > 0 && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit || 0)) return false;
  return true;
}

function basePriceOfProduct(
  item: Record<string, unknown>,
  productById: Map<string, Record<string, unknown>>,
): number {
  const product = productById.get(String(item.dbId || item.productId || item.id));
  if (!product) return 0;
  return Number(product.priceBDT ?? product.price ?? 0) || 0;
}

/**
 * Background cleanup: scan every cart and strip expired discounted items and
 * expired cart-level coupons. Persists only carts that actually changed.
 */
export async function expireCartDiscountsAcrossAllCarts(now?: Date): Promise<{
  cartsScanned: number;
  cartsUpdated: number;
  itemsRemoved: number;
}> {
  await connectDB();
  const runNow = now || new Date();

  const carts = await Cart.find({}).lean();
  let cartsUpdated = 0;
  let itemsRemoved = 0;

  for (const cart of carts) {
    const result = await sanitizeCart({
      items: (cart.items || []) as Array<Record<string, unknown>>,
      cartCouponCode: cart.couponCode || undefined,
      cartCouponDiscount: cart.couponDiscount,
      cartCouponType: cart.couponType,
      now: runNow,
    });

    if (result.removedItems.length > 0 || result.couponCleared) {
      await Cart.findOneAndUpdate(
        { userEmail: cart.userEmail },
        {
          items: result.items,
          couponCode: result.coupon ? result.coupon.code : '',
          couponDiscount: result.coupon ? result.coupon.discount : 0,
          couponType: result.coupon ? result.coupon.type : '',
        },
      );
      cartsUpdated += 1;
      itemsRemoved += result.removedItems.length;
    }
  }

  return { cartsScanned: carts.length, cartsUpdated, itemsRemoved };
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

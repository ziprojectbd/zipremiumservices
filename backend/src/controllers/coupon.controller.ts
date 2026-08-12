import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import Coupon from '@models/Coupon';
import { roundCurrency } from '@utils/currency';

// POST /coupons/validate - Validate a coupon code
export const validateCoupon = asyncHandler(async (req, res) => {
  await connectDB();

  const { code, items, totalAmount, email } = req.body;

  if (!code) {
    return res.status(400).json(error('Coupon code is required'));
  }

  // The schema stores codes in uppercase, so normalise the input
  const coupon = await Coupon.findOne({ code: (code as string).toUpperCase() }).lean();

  if (!coupon) {
    return res.status(404).json(error('Invalid coupon code'));
  }

  // Per-customer check: the same customer may not reuse this coupon on a
  // product it was already used for (a completed/finalized usage).
  if (typeof email === 'string' && email.trim()) {
    const normalizedEmail = email.trim().toLowerCase();
    const usedProducts = (coupon.usedBy as Array<{ email: string; productId: unknown }> | undefined)
      ?.filter((entry) => entry.email === normalizedEmail)
      .map((entry) => entry.productId?.toString());

    const itemProductIds = (items && Array.isArray(items) ? items : [])
      .map((item: any) => (item?.dbId ?? item?.productId ?? item?._id ?? item?.id)?.toString())
      .filter(Boolean);

    if (
      usedProducts &&
      usedProducts.length > 0 &&
      itemProductIds.length > 0 &&
      itemProductIds.some((pid: string) => usedProducts.includes(pid))
    ) {
      return res.status(400).json(error('You have already used this coupon for a product in your cart'));
    }
  }

  // Check coupon is active
  if (!coupon.isActive) {
    return res.status(400).json(error('Coupon is no longer active'));
  }

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(400).json(error('Coupon has expired'));
  }

  // Check usage limit
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json(error('Coupon usage limit has been reached'));
  }

  // Check minimum order amount
  if (
    totalAmount !== undefined &&
    totalAmount !== null &&
    coupon.minOrderAmount > 0 &&
    (totalAmount as number) < coupon.minOrderAmount
  ) {
    return res
      .status(400)
      .json(
        error(
          `Minimum order amount of ${coupon.minOrderAmount.toFixed(2)} is required`,
        ),
      );
  }

  // Check category / product restrictions when items are provided
  if (items && Array.isArray(items) && items.length > 0) {
    const hasCategoryRestriction =
      (coupon.applicableCategories as unknown as string[])?.length > 0;
    const hasProductRestriction =
      (coupon.applicableProducts as unknown as string[])?.length > 0;

    if (hasCategoryRestriction || hasProductRestriction) {
      let isValidForItems = false;

      for (const item of items) {
        // Skip items without enough data
        if (!item) continue;

        // Category check
        if (!isValidForItems && hasCategoryRestriction && item.category) {
          isValidForItems = (coupon.applicableCategories as string[]).includes(item.category);
        }

        // Product ID check (dbId holds the product's ObjectId as a string)
        if (
          !isValidForItems &&
          hasProductRestriction &&
          item.dbId
        ) {
          isValidForItems = (coupon.applicableProducts as unknown as string[]).some(
            (pid: unknown) => pid?.toString() === item.dbId.toString(),
          );
        }

        if (isValidForItems) break;
      }

      if (!isValidForItems) {
        return res
          .status(400)
          .json(error('Coupon is not applicable to the selected items'));
      }
    }
  }

  // Calculate discount
  let discountAmount = 0;
  let discountedTotal = totalAmount !== undefined && totalAmount !== null ? (totalAmount as number) : undefined;

  if (discountedTotal !== undefined) {
    const amount = totalAmount as number;

    if (coupon.discountType === 'percentage') {
      discountAmount = roundCurrency((amount * coupon.discountValue) / 100);
      // Cap at maxDiscountAmount when configured
      if (coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      // Flat discount
      discountAmount = coupon.discountValue;
      // Cap at maxDiscountAmount when configured
      if (coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    }

    // Never discount more than the total
    discountAmount = Math.min(discountAmount, amount);
    discountedTotal = roundCurrency(Math.max(0, amount - discountAmount));
  }

  return res.json(
    success({
      valid: true,
      coupon,
      discountAmount,
      discountType: coupon.discountType,
      discountedTotal,
    }),
  );
});

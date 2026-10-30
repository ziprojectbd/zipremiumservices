import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import Cart from '@models/Cart';
import { sanitizeCart } from '@services/cartExpiration.service';

// Normalize a cart item received from the client before it is persisted:
// never trust client-provided discount prices/expirations; the server
// re-derives discount provenance and strips anything already expired.
function normalizeIncomingItems(items: unknown[]): Array<Record<string, unknown>> {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const i = item as Record<string, unknown>;
    return {
      productId: i.productId || i.dbId || i.id || '',
      name: i.name || '',
      price: Number(i.price || 0),
      priceBDT: i.priceBDT !== undefined ? Number(i.priceBDT) : undefined,
      priceUSDT: i.priceUSDT !== undefined ? Number(i.priceUSDT) : undefined,
      quantity: Math.max(1, Number(i.quantity || 1)),
      dbId: i.dbId || '',
      link: i.link || '',
      smmProvider: i.smmProvider || '',
      smmServiceId: i.smmServiceId || '',
      productType: i.productType || '',
      captchamasterPlanId: i.captchamasterPlanId || '',
      category: i.category || '',
      details: i.details || '',
      features: Array.isArray(i.features) ? i.features : [],
      stock: i.stock !== undefined ? Number(i.stock) : 0,
      originalPrice: i.originalPrice !== undefined ? Number(i.originalPrice) : undefined,
      customData: i.customData || {},
      addons: Array.isArray(i.addons) ? i.addons : [],
      // Discount provenance is recorded but re-validated on save; client
      // prices/expirations are not trusted.
      campaignId: i.campaignId || '',
      campaignSlug: i.campaignSlug || '',
      couponCode: i.couponCode || '',
      discountSource:
        i.discountSource === 'campaign' ||
        i.discountSource === 'coupon' ||
        i.discountSource === 'payment_method' ||
        i.discountSource === 'bulk_quantity' ||
        i.discountSource === 'weekly_special'
          ? i.discountSource
          : 'none',
      expiresAt: i.expiresAt ? new Date(i.expiresAt as unknown as string) : null,
    };
  });
}

// GET /cart - Get cart by email (expired discounted items are stripped server-side)
export const getCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email } = req.query;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const userEmail = (email as string).toLowerCase();
  const cart = await Cart.findOne({ userEmail }).lean();

  if (!cart) {
    return res.json(success({ items: [], coupon: null, removedItems: [] }));
  }

  const result = await sanitizeCart({
    items: (cart.items || []) as Array<Record<string, unknown>>,
    cartCouponCode: cart.couponCode || undefined,
    cartCouponDiscount: cart.couponDiscount,
    cartCouponType: cart.couponType,
    paymentMethodCode: undefined,
    paymentMethodIsEnabled: true,
  });

  // Persist the cleaned cart so stale state is not served again.
  if (result.removedItems.length > 0 || result.couponCleared || result.paymentMethodDiscountCleared) {
    await Cart.findOneAndUpdate(
      { userEmail },
      {
        items: result.items,
        couponCode: result.coupon ? result.coupon.code : '',
        couponDiscount: result.coupon ? result.coupon.discount : 0,
        couponType: result.coupon ? result.coupon.type : '',
      },
    );
  }

  return res.json(
    success({
      items: result.items,
      coupon: result.coupon,
      removedItems: result.removedItems,
      paymentMethodDiscountCleared: result.paymentMethodDiscountCleared,
      subtotal: result.subtotal,
      discountAmount: result.discountAmount,
      total: result.total,
      itemCount: result.itemCount,
    }),
  );
});

// POST /cart/validate - Run expiration/eligibility checks and return the
// cart as it should be (expired discounted items removed, totals recalculated).
// Called by the frontend on cart open, restore, before checkout, and after
// returning from the payment gateway.
export const validateCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, items, couponCode, couponDiscount, couponType, paymentMethodCode, paymentMethodIsEnabled } = req.body;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const userEmail = (email as string).toLowerCase();
  const normalizedItems = normalizeIncomingItems(items);

  const result = await sanitizeCart({
    items: normalizedItems,
    cartCouponCode: couponCode || undefined,
    cartCouponDiscount: couponDiscount,
    cartCouponType: couponType || undefined,
    paymentMethodCode: paymentMethodCode || undefined,
    paymentMethodIsEnabled: paymentMethodIsEnabled !== false,
  });

  // Persist the sanitized cart for logged-in users so every tab/device sees
  // the same cleaned state.
  if (normalizedItems.length || result.removedItems.length || result.couponCleared || result.paymentMethodDiscountCleared) {
    await Cart.findOneAndUpdate(
      { userEmail },
      {
        items: result.items,
        couponCode: result.coupon ? result.coupon.code : '',
        couponDiscount: result.coupon ? result.coupon.discount : 0,
        couponType: result.coupon ? result.coupon.type : '',
      },
      { upsert: true },
    );
  }

  return res.json(
    success({
      items: result.items,
      coupon: result.coupon,
      removedItems: result.removedItems,
      paymentMethodDiscountCleared: result.paymentMethodDiscountCleared,
      subtotal: result.subtotal,
      discountAmount: result.discountAmount,
      total: result.total,
      itemCount: result.itemCount,
    }),
  );
});

// POST /cart - Create or fully replace a cart (upsert)
export const createCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, items, couponCode, couponDiscount, couponType, paymentMethodCode, paymentMethodIsEnabled } = req.body;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const userEmail = (email as string).toLowerCase();
  const normalizedItems = normalizeIncomingItems(items);

  const result = await sanitizeCart({
    items: normalizedItems,
    cartCouponCode: couponCode || undefined,
    cartCouponDiscount: couponDiscount,
    cartCouponType: couponType || undefined,
    paymentMethodCode: paymentMethodCode || undefined,
    paymentMethodIsEnabled: paymentMethodIsEnabled !== false,
  });

  const cart = await Cart.findOneAndUpdate(
    { userEmail },
    {
      items: result.items,
      couponCode: result.coupon ? result.coupon.code : '',
      couponDiscount: result.coupon ? result.coupon.discount : 0,
      couponType: result.coupon ? result.coupon.type : '',
    },
    { upsert: true, new: true },
  ).lean();

  return res.json(
    success({
      cart,
      items: result.items,
      coupon: result.coupon,
      removedItems: result.removedItems,
      paymentMethodDiscountCleared: result.paymentMethodDiscountCleared,
      subtotal: result.subtotal,
      discountAmount: result.discountAmount,
      total: result.total,
      itemCount: result.itemCount,
    }),
  );
});

// PUT /cart - Update an existing cart (no upsert)
export const updateCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, items, couponCode, couponDiscount, couponType, paymentMethodCode, paymentMethodIsEnabled } = req.body;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const userEmail = (email as string).toLowerCase();
  const normalizedItems = normalizeIncomingItems(items);

  const result = await sanitizeCart({
    items: normalizedItems,
    cartCouponCode: couponCode || undefined,
    cartCouponDiscount: couponDiscount,
    cartCouponType: couponType || undefined,
    paymentMethodCode: paymentMethodCode || undefined,
    paymentMethodIsEnabled: paymentMethodIsEnabled !== false,
  });

  const cart = await Cart.findOneAndUpdate(
    { userEmail },
    {
      items: result.items,
      couponCode: result.coupon ? result.coupon.code : '',
      couponDiscount: result.coupon ? result.coupon.discount : 0,
      couponType: result.coupon ? result.coupon.type : '',
    },
    { new: true },
  ).lean();

  if (!cart) {
    return res.status(404).json(error('Cart not found'));
  }

  return res.json(
    success({
      cart,
      items: result.items,
      coupon: result.coupon,
      removedItems: result.removedItems,
      paymentMethodDiscountCleared: result.paymentMethodDiscountCleared,
      subtotal: result.subtotal,
      discountAmount: result.discountAmount,
      total: result.total,
      itemCount: result.itemCount,
    }),
  );
});

// DELETE /cart - Delete a cart
export const deleteCart = asyncHandler(async (req, res) => {
  await connectDB();

  const { email } = req.query;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  await Cart.findOneAndDelete({ userEmail: (email as string).toLowerCase() });

  return res.json(success(null, 'Cart cleared'));
});

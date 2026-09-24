import Product from '@models/Product';
import Order from '@models/Order';
import Category from '@models/Category';
import Coupon from '@models/Coupon';
import Campaign from '@models/Campaign';
import CaptchaPackage from '@models/CaptchaPackage';
import KYC from '@models/KYC';
import Footer from '@models/Footer';
import PaymentSettings from '@models/PaymentSettings';
import MaintenanceSettings from '@models/MaintenanceSettings';
import SideSliderSettings from '@models/SideSliderSettings';
import PopupManagement from '@models/PopupManagement';
import PopupSettings from '@models/PopupSettings';
import PromoMarqueeSettings from '@models/PromoMarqueeSettings';
import PromoOffer from '@models/PromoOffer';
import connectDB from '@db/connect';
import { success, error, paginated } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { bustMaintenanceCache } from '@middlewares/maintenance';
import { emitMaintenanceUpdate } from '@socket/index.js';

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

// GET /api/admin/products
// GET /api/admin/products/stats
export const getAdminProductStats = asyncHandler(async (req, res) => {
  await connectDB();

  const [totalProducts, totalCategories, featuredCount, lowStockCount, totalSales, totalRevenue] =
    await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments({ featured: true }),
      Product.countDocuments({ stock: { $lte: 5, $gte: 1 } }),
      Product.aggregate([{ $group: { _id: null, total: { $sum: '$sales' } } }]),
      Product.aggregate([{ $group: { _id: null, total: { $sum: '$revenue' } } }]),
    ]);

  // Top product by sales
  const topProduct = await Product.findOne().sort({ sales: -1 }).select('name sales revenue').lean();

  return res.json(
    success({
      totalProducts,
      totalCategories,
      featuredCount,
      lowStockCount,
      totalSales: (totalSales[0] as { total?: number } | undefined)?.total || 0,
      totalRevenue: (totalRevenue[0] as { total?: number } | undefined)?.total || 0,
      topProduct: topProduct
        ? { name: topProduct.name, sales: topProduct.sales, revenue: topProduct.revenue }
        : null,
    })
  );
});

export const getAdminProducts = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.category) query.category = req.query.category;
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// GET /api/admin/products/:id
export const getAdminProductById = asyncHandler(async (req, res) => {
  await connectDB();
  const id = req.params.id as string;
  if (!id) return res.status(400).json(error('Product ID is required'));
  const product = await Product.findById(id).lean();
  if (!product) return res.status(404).json(error('Product not found'));
  return res.json(success(product));
});

// POST /api/admin/products
export const createAdminProduct = asyncHandler(async (req, res) => {
  await connectDB();

  const { name, category, price, priceBDT, priceUSDT, description, stock, imageUrl, available } = req.body;

  if (!name || !category || (price === undefined && priceBDT === undefined && priceUSDT === undefined)) {
    return res.status(400).json(error('Name, category, and at least one price field are required'));
  }

  try {
    const product = await Product.create({
      name,
      category,
      price: price || 0,
      priceBDT: priceBDT || 0,
      priceUSDT: priceUSDT || 0,
      description,
      stock: stock ?? 0,
      imageUrl: imageUrl || '',
      available: available ?? true,
      ...req.body,
    });

    return res.status(201).json(success(product, 'Product created'));
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(400).json(error('A product with this name already exists'));
    }
    throw err;
  }
});

// PUT /api/admin/products/:id
export const updateAdminProduct = asyncHandler(async (req, res) => {
  await connectDB();

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return res.status(404).json(error('Product not found'));
  }

  return res.json(success(product, 'Product updated'));
});

// DELETE /api/admin/products/:id
export const deleteAdminProduct = asyncHandler(async (req, res) => {
  await connectDB();

  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json(error('Product not found'));
  }

  return res.json(success(null, 'Product deleted'));
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// GET /api/admin/orders/stats
export const getAdminOrderStats = asyncHandler(async (req, res) => {
  await connectDB();

  const [totalOrders, pendingOrders, approvedOrders, deliveredOrders, rejectedOrders, todayOrders, revenueAgg] =
    await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'approved' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'rejected' }),
      Order.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Order.aggregate([
        { $match: { paymentStatus: 'verified' } },
        {
          $group: {
            _id: '$currency',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

  let revenueUSDT = 0;
  let revenueBDT = 0;
  for (const r of revenueAgg) {
    if (r._id === 'USDT') revenueUSDT = r.total;
    else if (r._id === 'BDT') revenueBDT = r.total;
  }

  // Top payment methods
  const paymentMethods = await Order.aggregate([
    { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  return res.json(
    success({
      totalOrders,
      pendingOrders,
      approvedOrders,
      deliveredOrders,
      rejectedOrders,
      todayOrders,
      revenueUSDT,
      revenueBDT,
      paymentMethods: paymentMethods.map((p) => ({ method: p._id, count: p.count })),
    })
  );
});

// GET /api/admin/orders
export const getAdminOrders = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.search) {
    query.$or = [
      { email: { $regex: req.query.search, $options: 'i' } },
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// GET /api/admin/orders/:id
export const getAdminOrderById = asyncHandler(async (req, res) => {
  await connectDB();

  const id = req.params.id as string;
  if (!id) {
    return res.status(400).json(error('Order ID is required'));
  }

  let order = null;

  // Try MongoDB ObjectId lookup first
  if (id.length === 24 && /^[a-f0-9]+$/i.test(id)) {
    order = await Order.findById(id).lean();
  }

  // Fallback to orderNumber string (e.g. "ORD-107")
  if (!order) {
    order = await Order.findOne({ orderNumber: id }).lean();
  }

  if (!order) {
    return res.status(404).json(error('Order not found'));
  }

  // Attach captcha package if applicable
  const key = (order as Record<string, unknown>).captchaApiKey as string;
  if (key) {
    try {
      const pkg = await CaptchaPackage.findOne({ captchaApiKey: key }).lean();
      if (pkg) (order as Record<string, unknown>).captchaPackage = pkg;
    } catch {
      // Non-blocking
    }
  }

  return res.json(success(order));
});

// POST /api/admin/orders
export const createAdminOrder = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, product, productName, amount, currency, paymentMethod, status, items } = req.body;

  if (!email || !amount) {
    return res.status(400).json(error('Email and amount are required'));
  }

  const order = await Order.create({
    email,
    product,
    productName: productName || '',
    amount,
    currency: currency || 'USDT',
    paymentMethod: paymentMethod || 'bkash',
    status: status || 'pending',
    source: 'admin',
    items: items || [],
    ...req.body,
  });

  return res.status(201).json(success(order, 'Order created'));
});

// PUT /api/admin/orders/:id
export const updateAdminOrder = asyncHandler(async (req, res) => {
  await connectDB();

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json(error('Order not found'));
  }

  const { action } = req.body;

  if (action) {
    switch (action) {
      case 'verify_payment':
        order.paymentStatus = 'verified';
        // Increment product sales & revenue
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            const productId = item.product?.toString();
            if (productId && productId.length === 24 && /^[a-f0-9]+$/i.test(productId)) {
              await Product.findByIdAndUpdate(productId, {
                $inc: {
                  sales: item.quantity || 1,
                  revenue: item.price || 0,
                },
              });
            }
          }
        }

        // Finalize coupon usage exactly once (payment verified). This is the
        // only place coupon usage is recorded — order creation only reserves.
        if (order.couponCode) {
          await finalizeCouponUsage(order);
        }
        break;
      case 'reject_payment':
        order.paymentStatus = 'rejected';
        order.status = 'rejected';
        // Payment rejected → coupon usage is NOT consumed. The coupon stays
        // valid for a retry while it remains valid.
        order.couponFinalized = false;
        break;
      case 'approve_order':
        order.status = 'approved';
        break;
      case 'deliver_order': {
        // Idempotency: if already delivered with a key, skip API call
        if (order.status === 'delivered' && order.captchaApiKey) {
          break;
        }

        // ------------------------------------------------------------------
        // Delivery instructions (download/install link).
        //
        // Products that are fulfilled by sending the customer somewhere (a
        // browser-extension install page, for example) carry deliveryLink /
        // deliveryLinkLabel / deliveryMessage. They are copied onto the order
        // here so the value is frozen at fulfilment time — editing or deleting
        // the product afterwards never changes what the customer already saw.
        // ------------------------------------------------------------------
        {
          const candidateIds = [
            ...(order.items || []).map((item: any) => item?.product || item?.productId),
            (order as any).product,
            (order as any).productId,
          ]
            .map((id: unknown) => String(id ?? ''))
            .filter((id: string) => id.length === 24 && /^[a-f0-9]+$/i.test(id));

          if (candidateIds.length) {
            const products = await Product.find({ _id: { $in: candidateIds } })
              .select('deliveryLink deliveryLinkLabel deliveryMessage')
              .lean();
            const withLink = products.find((p: any) => String(p.deliveryLink || '').trim());
            if (withLink) {
              (order as any).deliveryLink = withLink.deliveryLink || '';
              (order as any).deliveryLinkLabel = withLink.deliveryLinkLabel || '';
              (order as any).deliveryMessage = withLink.deliveryMessage || '';
            }
          }
        }

        // ------------------------------------------------------------------
        // Detect a CaptchaMaster line item and resolve its reseller plan id.
        //
        // The plan id can live in several places depending on how the order
        // was created (storefront checkout, ZI-Pay flow, or an admin-created
        // DB product). A captcha item is detected by productType OR by its
        // category / `cm-` product id so a missing productType can never make
        // us silently deliver without buying the package.
        // ------------------------------------------------------------------
        let captchamasterPlanId = '';
        let captchaItemDetected = false;
        let captchaItemName = '';
        let captchaPlanCode = '';

        if (order.items?.length) {
          for (const item of order.items) {
            const itemAny = item as any;
            const itemPlanId =
              itemAny?.captchamasterPlanId || itemAny?.customData?.captchamasterPlanId || '';
            const itemType = itemAny?.productType || itemAny?.customData?.productType || '';
            const itemCategory = String(itemAny?.category || itemAny?.productCategory || '');
            const itemProductId = String(itemAny?.product || itemAny?.productId || '');
            const itemName = String(itemAny?.productName || itemAny?.name || '');

            // Detection must be PRECISE: a regular product whose name merely
            // mentions "captcha" (e.g. "CaptchaMaster Bot", "Kolotibablo
            // Captcha Full Setup") is NOT a reseller package. Only an explicit
            // captchamaster type, the exact storefront category, or a `cm-`
            // product id counts.
            const normalizedCategory = itemCategory.toLowerCase().replace(/\s+/g, ' ').trim();
            const isStorefrontCaptcha = normalizedCategory === 'captcha solver api';
            const looksLikeCaptcha =
              itemType === 'captchamaster' ||
              isStorefrontCaptcha ||
              itemProductId.startsWith('cm-');

            if (looksLikeCaptcha) {
              captchaItemDetected = true;
              if (!captchaItemName) captchaItemName = itemName || itemCategory || 'Captcha package';
              if (!captchaPlanCode) {
                captchaPlanCode = extractCaptchaPlanCode(itemProductId, itemName);
              }

              if (itemPlanId) {
                captchamasterPlanId = itemPlanId;
                break;
              }
            }

            // Fallback: DB product lookup (admin-created captchamaster products)
            const pid = itemAny.product?.toString();
            if (pid && pid.length === 24 && /^[a-f0-9]+$/i.test(pid)) {
              const prod = await Product.findById(pid).lean();
              if (prod?.productType === 'captchamaster') {
                captchaItemDetected = true;
                if (!captchaItemName) captchaItemName = prod.name || 'Captcha package';
                if (!captchaPlanCode) {
                  captchaPlanCode =
                    prod.captchamasterPlanId || extractCaptchaPlanCode(pid, prod.name || '');
                }
                if (prod.captchamasterPlanId) {
                  captchamasterPlanId = prod.captchamasterPlanId;
                  break;
                }
              }
            }
          }
        }

        // Recovery: older orders were created before the cart persisted the
        // plan id. The plan CODE (e.g. "D1") is still embedded in the item
        // name / product id ("cm-D1"), so resolve it against the live reseller
        // pricing plans. This lets legacy orders deliver instead of failing.
        if (captchaItemDetected && !captchamasterPlanId && captchaPlanCode) {
          const resolved = await resolveCaptchaPlanIdByCode(captchaPlanCode);
          if (resolved) {
            captchamasterPlanId = resolved;
            // Backfill the order items so future retries are O(1) and the
            // plan id is visible in the admin panel.
            if (order.items?.length) {
              for (const item of order.items) {
                const itemAny = item as any;
                if (!itemAny.captchamasterPlanId) {
                  const code = extractCaptchaPlanCode(
                    String(itemAny.product || itemAny.productId || ''),
                    String(itemAny.productName || itemAny.name || '')
                  );
                  if (code && code === captchaPlanCode) {
                    itemAny.captchamasterPlanId = resolved;
                    itemAny.productType = 'captchamaster';
                  }
                }
              }
            }
          }
        }

        // A captcha order with no resolvable plan id must NOT be marked
        // delivered — that showed customers a "delivered" status while no
        // package was ever purchased. Fail loudly so the admin can fix the
        // order/item data and retry.
        if (captchaItemDetected && !captchamasterPlanId) {
          (order as any).delivery = {
            provider: 'captchamaster',
            status: 'failed',
            errorMessage:
              `Captcha plan id missing for "${captchaItemName}". ` +
              'The order item has no captchamasterPlanId — re-add the item to the cart or set it on the product.',
          };
          await order.save();
          return res
            .status(400)
            .json(
              error(
                `Cannot deliver: Captcha plan id is missing for "${captchaItemName}". ` +
                  'Re-create the order from the Captcha pricing page so the plan id is captured.'
              )
            );
        }

        // Call CaptchaMaster API for captchamaster products
        if (captchaItemDetected && captchamasterPlanId) {
          const customerEmail = (order as any).email || (order as any).customerEmail || '';
          if (!customerEmail) {
            return res.status(400).json(error('Order has no customer email for delivery'));
          }

          try {
            const { getCaptchaMasterService } = await import('@utils/captchamaster');
            const CaptchaMasterSettings = (await import('@models/CaptchaMasterSettings')).default;
            const service = await getCaptchaMasterService();

            // Greeting name for the CaptchaMaster completion email.
            // Priority: the configured greeting (default "Dear Customer") so the
            // email never falls back to the reseller store name.
            const settings = await CaptchaMasterSettings.findById('global').lean();
            const greetingName = String(settings?.emailGreetingName || 'Dear Customer').trim();

            const result = await service.purchasePackage(
              captchamasterPlanId,
              customerEmail,
              greetingName
            );

            (order as any).captchaApiKey = result.apiKey || '';
            (order as any).delivery = {
              provider: 'captchamaster',
              status: 'completed',
              externalReference: result.orderId || result.packageId || '',
              deliveredAt: new Date(),
            };

            // Persist a local CaptchaPackage mirror so the customer dashboard
            // and admin panel show this purchase even before the reseller API
            // is queried. Idempotent on captchaMasterPackageId.
            const externalId = result.orderId || result.packageId;
            if (externalId) {
              try {
                const credits = Number(result.credits || 0);

                // Plan kind ("daily" plans refill every day at 10 PM) drives
                // the refill countdown on the customer dashboard.
                let packageType = (result as any).packageType || '';
                if (!packageType) {
                  try {
                    const plans = await service.getRawPricingPlans();
                    const match = plans.find(
                      (p: any) => String(p.id) === String(captchamasterPlanId)
                    );
                    packageType = match?.type || '';
                  } catch {
                    packageType = '';
                  }
                }

                await CaptchaPackage.findOneAndUpdate(
                  { captchaMasterPackageId: externalId },
                  {
                    $set: {
                      orderId: order._id,
                      customerEmail: customerEmail.toLowerCase().trim(),
                      planId: captchamasterPlanId,
                      planName: captchaItemName || captchamasterPlanId,
                      credits,
                      creditsRemaining: credits,
                      price: order.amount || 0,
                      currency: 'USD',
                      captchaMasterPackageId: externalId,
                      captchaMasterOrderId: result.orderId || '',
                      captchaApiKey: result.apiKey || '',
                      packageType,
                      status: 'active',
                      activatedAt: new Date(),
                      expiresAt: result.endDate ? new Date(result.endDate) : null,
                    },
                    $setOnInsert: { creditsUsed: 0 },
                  },
                  { upsert: true, new: true, setDefaultsOnInsert: true }
                );
              } catch {
                // Local mirror is best-effort; the reseller purchase already
                // succeeded and the API key is saved on the order.
              }
            }
          } catch (err: any) {
            // Do NOT mark as delivered on failure — admin can retry
            (order as any).delivery = {
              provider: 'captchamaster',
              status: 'failed',
              errorMessage: err?.message || 'Unknown delivery error',
            };
            await order.save();
            return res.status(500).json(error(`Delivery failed: ${err?.message || 'API error'}`));
          }
        }

        order.status = 'delivered';
        break;
      }
      default:
        // Unknown action — fall through to regular update
        break;
    }
    await order.save();
    return res.json(success(order, `Order ${action.replace('_', ' ')}d`));
  }

  // Regular field update
  Object.assign(order, req.body);
  await order.save();

  return res.json(success(order, 'Order updated'));
});

// ---------------------------------------------------------------------------
// CaptchaMaster plan resolution helpers
// ---------------------------------------------------------------------------

// Extract the reseller plan code from an order item. Historically the code was
// embedded in the product id (`cm-D1`) and in the product name
// ("Captcha Solver Api — D1"), so legacy orders remain deliverable.
function extractCaptchaPlanCode(productId: string, productName: string): string {
  const idMatch = /^cm-(.+)$/i.exec(productId.trim());
  if (idMatch?.[1]) return idMatch[1].trim().toUpperCase();

  const nameMatch = /(?:—|–|-|:|\s)\s*([A-Za-z]{1,4}\d{1,6})\s*$/i.exec(productName.trim());
  if (nameMatch?.[1]) return nameMatch[1].trim().toUpperCase();

  return '';
}

// Resolve a plan code (e.g. "D1") to the current reseller plan id by querying
// the live reseller pricing plans. Plans are rotated over time, so the code is
// matched exactly against `code` (case-insensitive) — a partial/loose match
// could buy the WRONG package and spend real credits.
async function resolveCaptchaPlanIdByCode(code: string): Promise<string> {
  const target = String(code || '').trim().toUpperCase();
  if (!target) return '';
  try {
    const { getCaptchaMasterService } = await import('@utils/captchamaster');
    const service = await getCaptchaMasterService();
    const plans = await service.getRawPricingPlans();
    const match = plans.find((p: any) => String(p.code || '').trim().toUpperCase() === target);
    return match?.id ? String(match.id) : '';
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Coupon usage finalization (called once from verify_payment)
//
// Records coupon usage on the Coupon document only when the order's payment is
// verified. Idempotent: the couponFinalized flag is claimed atomically before
// recording, so double-clicking "Verify" (or concurrent verifies) never
// double-counts; the idempotencyKey prefix guard additionally prevents a
// completed usage from being recorded again on a retry order.
// ---------------------------------------------------------------------------
async function finalizeCouponUsage(order: any): Promise<void> {
  const code = String(order.couponCode || '').trim().toUpperCase();
  if (!code) return;

  const coupon = await Coupon.findOne({ code });
  if (!coupon) return;

  const email = String(order.email || order.customerEmail || '').trim().toLowerCase();
  // The create-time key is unique per order (email::CODE::timestamp). Use the
  // stable "email::CODE" prefix as the cross-order idempotency guard: retry
  // orders (same user + coupon, fresh key) are never blocked by the unique
  // index, while a completed usage is still never double-counted.
  const idempotencyKey = String(order.idempotencyKey || '')
    || `${email}::${code}::${order._id}`;
  const prefix = `${email}::${code}`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Cross-order guard: if another order for the same customer + coupon has
  // already finalized usage, do nothing — usage is not double-counted.
  const existingFinalized = await Order.findOne({
    idempotencyKey: { $regex: `^${escapedPrefix}::` },
    couponFinalized: true,
    _id: { $ne: order._id },
  }).lean();
  if (existingFinalized) return;

  // Atomic claim: only the first verifier to flip couponFinalized may record
  // usage. A concurrent double-click on "Verify" loses the claim and returns.
  // The in-memory flags are mirrored after the increment so the trailing
  // order.save() in updateAdminOrder does not clobber the claim.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, couponFinalized: { $ne: true } },
    { $set: { couponFinalized: true, couponFinalizedAt: new Date(), idempotencyKey } },
    { new: false },
  ).lean();
  if (!claimed) return;

  try {
    const productIds = (order.items || [])
      .filter((item: any) => item.product)
      .map((item: any) => item.product.toString())
      .filter((pid: string) => pid && pid.length === 24 && /^[a-f0-9]+$/i.test(pid));

    // Skip (email, product) pairs already recorded on the coupon.
    const existingPairs = new Set(
      (coupon.usedBy || [])
        .filter((e: any) => e.email === email)
        .map((e: any) => e.productId?.toString()),
    );
    const newEntries = productIds
      .filter((pid: string) => !existingPairs.has(pid))
      .map((pid: string) => ({ email, productId: pid }));

    if (newEntries.length > 0) {
      await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { usedCount: 1 },
        $push: { usedBy: { $each: newEntries } },
      });
    }
  } catch (err) {
    // Recording failed — release the claim so a retry can re-record.
    await Order.updateOne({ _id: order._id }, { $set: { couponFinalized: false } })
      .catch(() => undefined);
    throw err;
  }

  // Mirror the claim onto the in-memory doc so the trailing save() persists it.
  order.couponFinalized = true;
  order.couponFinalizedAt = new Date();
  order.idempotencyKey = idempotencyKey;
}

// DELETE /api/admin/orders/:id
export const deleteAdminOrder = asyncHandler(async (req, res) => {
  await connectDB();

  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return res.status(404).json(error('Order not found'));
  }

  return res.json(success(null, 'Order deleted'));
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

// GET /api/admin/categories
export const getAdminCategories = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Category.find(query).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// POST /api/admin/categories
export const createAdminCategory = asyncHandler(async (req, res) => {
  await connectDB();

  const { name, slug, icon, gradient, isActive, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json(error('Category name is required'));
  }

  const category = await Category.create({
    name,
    slug: slug || name,
    icon,
    gradient,
    isActive,
    sortOrder,
  });

  return res.status(201).json(success(category, 'Category created'));
});

// PUT /api/admin/categories/:id
export const updateAdminCategory = asyncHandler(async (req, res) => {
  await connectDB();

  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return res.status(404).json(error('Category not found'));
  }

  return res.json(success(category, 'Category updated'));
});

// DELETE /api/admin/categories/:id
export const deleteAdminCategory = asyncHandler(async (req, res) => {
  await connectDB();

  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return res.status(404).json(error('Category not found'));
  }

  return res.json(success(null, 'Category deleted'));
});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

// GET /api/admin/coupons
export const getAdminCoupons = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.search) {
    query.code = { $regex: req.query.search, $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// POST /api/admin/coupons
export const createAdminCoupon = asyncHandler(async (req, res) => {
  await connectDB();

  const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, expiresAt } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    return res.status(400).json(error('Code, discountType, and discountValue are required'));
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscountAmount: maxDiscountAmount || 0,
    usageLimit: usageLimit || 0,
    expiresAt: expiresAt || null,
    ...req.body,
  });

  return res.status(201).json(success(coupon, 'Coupon created'));
});

// PUT /api/admin/coupons/:id
export const updateAdminCoupon = asyncHandler(async (req, res) => {
  await connectDB();

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    return res.status(404).json(error('Coupon not found'));
  }

  return res.json(success(coupon, 'Coupon updated'));
});

// DELETE /api/admin/coupons/:id
export const deleteAdminCoupon = asyncHandler(async (req, res) => {
  await connectDB();

  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) {
    return res.status(404).json(error('Coupon not found'));
  }

  return res.json(success(null, 'Coupon deleted'));
});

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

// GET /api/admin/campaigns
export const getAdminCampaigns = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (req.query.status) query.status = req.query.status;

  const [data, total] = await Promise.all([
    Campaign.find(query).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Campaign.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// POST /api/admin/campaigns
export const createAdminCampaign = asyncHandler(async (req, res) => {
  await connectDB();

  const { name, discountType, discountValue, startDate, endDate, status } = req.body;

  if (!name || !discountType) {
    return res.status(400).json(error('Name and discountType are required'));
  }

  const campaign = await Campaign.create({
    name,
    discountType,
    discountValue: discountValue || 0,
    slug: req.body.slug || name.toLowerCase().replace(/\s+/g, '-'),
    startDate: startDate || null,
    endDate: endDate || null,
    status: status || 'draft',
    ...req.body,
  });

  return res.status(201).json(success(campaign, 'Campaign created'));
});

// PUT /api/admin/campaigns/:id
export const updateAdminCampaign = asyncHandler(async (req, res) => {
  await connectDB();

  const { id } = req.params;
  const campaign = await Campaign.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true },
  );

  if (!campaign) {
    return res.status(404).json(error('Campaign not found'));
  }

  return res.json(success(campaign, 'Campaign updated'));
});

// DELETE /api/admin/campaigns/:id  (soft-delete)
export const deleteAdminCampaign = asyncHandler(async (req, res) => {
  await connectDB();

  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { $set: { isDeleted: true } },
    { new: true },
  );

  if (!campaign) {
    return res.status(404).json(error('Campaign not found'));
  }

  return res.json(success(null, 'Campaign deleted'));
});

// POST /api/admin/campaigns/duplicate
export const duplicateAdminCampaign = asyncHandler(async (req, res) => {
  await connectDB();

  const original = await Campaign.findById(req.body.id);

  if (!original) {
    return res.status(404).json(error('Campaign not found'));
  }

  const obj = original.toObject();

  // Remove fields that must be unique or auto-generated
  delete obj._id;
  delete obj.createdAt;
  delete obj.updatedAt;

  // Append "(copy)" to name and adjust slug
  const copyName = `${obj.name} (copy)`;
  const copySlug = `${obj.slug}-copy-${Date.now()}`;

  const duplicate = await Campaign.create({
    ...obj,
    name: copyName,
    slug: copySlug,
    status: 'draft',           // duplicates always start as draft
  });

  return res.status(201).json(success(duplicate, 'Campaign duplicated'));
});

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------

// GET /api/admin/kyc
export const getAdminKyc = asyncHandler(async (req, res) => {
  await connectDB();

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.search) {
    query.$or = [
      { email: { $regex: req.query.search, $options: 'i' } },
      { fullName: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    KYC.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    KYC.countDocuments(query),
  ]);

  return res.json(paginated(data, total, page, limit));
});

// PUT /api/admin/kyc/:id
export const updateAdminKyc = asyncHandler(async (req, res) => {
  await connectDB();

  const { action, rejectionReason } = req.body;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json(error('Action must be "approve" or "reject"'));
  }

  const update: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewedAt: new Date(),
  };

  if (action === 'reject') {
    update.rejectionReason = rejectionReason || 'No reason provided';
  }

  const kyc = await KYC.findByIdAndUpdate(req.params.id, update, { new: true });

  if (!kyc) {
    return res.status(404).json(error('KYC submission not found'));
  }

  return res.json(
    success(kyc, `KYC ${action === 'approve' ? 'approved' : 'rejected'}`)
  );
});

// ---------------------------------------------------------------------------
// Settings — Footer
// ---------------------------------------------------------------------------

// GET /api/admin/settings/footer
export const getFooterSettings = asyncHandler(async (req, res) => {
  await connectDB();

  let footer = await Footer.findOne().lean();
  if (!footer) {
    footer = await Footer.create({ sections: [] });
    footer = footer.toObject();
  }

  return res.json(success(footer));
});

// PUT /api/admin/settings/footer
export const updateFooterSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const footer = await Footer.findOneAndUpdate({}, { $set: req.body }, { new: true, upsert: true });

  return res.json(success(footer, 'Footer settings updated'));
});

// ---------------------------------------------------------------------------
// Settings — Payment
// ---------------------------------------------------------------------------

// GET /api/admin/settings/payment
export const getPaymentSettings = asyncHandler(async (req, res) => {
  await connectDB();

  let settings = await PaymentSettings.findOne().lean();
  if (!settings) {
    settings = await PaymentSettings.create({});
    settings = settings.toObject();
  }

  return res.json(success(settings));
});

// PUT /api/admin/settings/payment
export const updatePaymentSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await PaymentSettings.findOneAndUpdate(
    {},
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );

  return res.json(success(settings, 'Payment settings updated'));
});

// ---------------------------------------------------------------------------
// Settings — Maintenance
// ---------------------------------------------------------------------------

// GET /api/admin/settings/maintenance
export const getMaintenanceSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await MaintenanceSettings.getSettings();
  return res.json(success(settings));
});

// PUT /api/admin/settings/maintenance
export const updateMaintenanceSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await MaintenanceSettings.findOneAndUpdate(
    {},
    { $set: { ...req.body, updatedAt: new Date() } },
    { new: true, upsert: true }
  );

  // Bust middleware cache so change takes effect immediately
  bustMaintenanceCache();

  // Broadcast to all connected clients via WebSocket
  try {
    emitMaintenanceUpdate({
      enabled: settings.enabled,
      type: settings.type as 'marquee' | 'fullscreen',
      message: settings.message || '',
    });
  } catch {
    // Socket not initialized yet, non-blocking
  }

  return res.json(success(settings, 'Maintenance settings updated'));
});

// ---------------------------------------------------------------------------
// Settings — Side Slider
// ---------------------------------------------------------------------------

// GET /api/admin/settings/side-slider
export const getSideSliderSettings = asyncHandler(async (req, res) => {
  await connectDB();

  let settings = await SideSliderSettings.findOne().lean();
  if (!settings) {
    settings = await SideSliderSettings.create({});
    settings = settings.toObject();
  }

  return res.json(success(settings));
});

// PUT /api/admin/settings/side-slider
export const updateSideSliderSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await SideSliderSettings.findOneAndUpdate(
    {},
    { $set: req.body },
    { new: true, upsert: true }
  );

  return res.json(success(settings, 'Side slider settings updated'));
});

// ---------------------------------------------------------------------------
// Settings — Popup Management
// ---------------------------------------------------------------------------

// GET /api/admin/settings/popup
export const getPopupSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const popups = await PopupManagement.find().sort({ order: 1 }).lean();
  return res.json(success(popups));
});

// POST /api/admin/settings/popup
export const addPopupImage = asyncHandler(async (req, res) => {
  await connectDB();

  const { imageUrl, altText, offerUrl, showDuration, order, type } = req.body;

  if (!imageUrl) {
    return res.status(400).json(error('imageUrl is required'));
  }

  const popup = await PopupManagement.create({
    imageUrl,
    altText: altText || 'Popup Image',
    offerUrl: offerUrl || '',
    showDuration: showDuration || 3,
    order: order || 0,
    type: type || 'image',
  });

  return res.status(201).json(success(popup, 'Popup image added'));
});

// DELETE /api/admin/settings/popup/:id
export const deletePopupImage = asyncHandler(async (req, res) => {
  await connectDB();

  const popup = await PopupManagement.findByIdAndDelete(req.params.id);

  if (!popup) {
    return res.status(404).json(error('Popup image not found'));
  }

  return res.json(success(null, 'Popup image deleted'));
});

// ---------------------------------------------------------------------------
// Settings — Popup Settings (toggle enabled/disabled)
// ---------------------------------------------------------------------------

// GET /api/admin/settings/popup-settings
export const getPopupSettingsToggle = asyncHandler(async (req, res) => {
  await connectDB();

  let settings = await PopupSettings.findOne().lean();
  if (!settings) {
    settings = { enabled: true };
  }

  return res.json(success(settings));
});

// PUT /api/admin/settings/popup-settings
export const updatePopupSettingsToggle = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await PopupSettings.findOneAndUpdate(
    {},
    { $set: { enabled: req.body.enabled } },
    { new: true, upsert: true }
  );

  return res.json(success(settings, 'Popup settings updated'));
});

// ---------------------------------------------------------------------------
// Settings — Popup Images (update)
// ---------------------------------------------------------------------------

// PUT /api/admin/settings/popup-images/:id
export const updatePopupImage = asyncHandler(async (req, res) => {
  await connectDB();

  const popup = await PopupManagement.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!popup) {
    return res.status(404).json(error('Popup image not found'));
  }

  return res.json(success(popup, 'Popup image updated'));
});

// ---------------------------------------------------------------------------
// Settings — Promo Marquee
// ---------------------------------------------------------------------------

// GET /api/admin/settings/promo-marquee
export const getPromoMarqueeSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await PromoMarqueeSettings.getSettings();
  return res.json(success(settings));
});

// PUT /api/admin/settings/promo-marquee
export const updatePromoMarqueeSettings = asyncHandler(async (req, res) => {
  await connectDB();

  const settings = await PromoMarqueeSettings.findOneAndUpdate(
    {},
    { $set: { ...req.body, updatedAt: new Date() } },
    { new: true, upsert: true }
  );

  return res.json(success(settings, 'Promo marquee settings updated'));
});

// ---------------------------------------------------------------------------
// Settings — Promo Offers (CRUD)
// ---------------------------------------------------------------------------

// GET /api/admin/settings/promo-offers
export const getAllPromoOffers = asyncHandler(async (req, res) => {
  await connectDB();

  const offers = await PromoOffer.find().sort({ order: 1 }).lean();
  return res.json(success(offers));
});

// POST /api/admin/settings/promo-offers
export const createPromoOffer = asyncHandler(async (req, res) => {
  await connectDB();

  const { title, description, imageUrl, link, order, type } = req.body;

  if (!title || !description || !imageUrl) {
    return res.status(400).json(error('title, description, and imageUrl are required'));
  }

  const offer = await PromoOffer.create({
    title,
    description,
    imageUrl,
    link: link || '',
    order: order || 0,
    type: type || 'image',
  });

  return res.status(201).json(success(offer, 'Promo offer created'));
});

// PUT /api/admin/settings/promo-offers/:id
export const updatePromoOffer = asyncHandler(async (req, res) => {
  await connectDB();

  const offer = await PromoOffer.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!offer) {
    return res.status(404).json(error('Promo offer not found'));
  }

  return res.json(success(offer, 'Promo offer updated'));
});

// DELETE /api/admin/settings/promo-offers/:id
export const deletePromoOffer = asyncHandler(async (req, res) => {
  await connectDB();

  const offer = await PromoOffer.findByIdAndDelete(req.params.id);

  if (!offer) {
    return res.status(404).json(error('Promo offer not found'));
  }

  return res.json(success(null, 'Promo offer deleted'));
});

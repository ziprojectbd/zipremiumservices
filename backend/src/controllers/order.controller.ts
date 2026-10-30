import Order from '@models/Order';
import Product from '@models/Product';
import Campaign from '@models/Campaign';
import Coupon from '@models/Coupon';
import CaptchaPackage from '@models/CaptchaPackage';
import CaptchaMasterSettings from '@models/CaptchaMasterSettings';
import PaymentSettings from '@models/PaymentSettings';
import { Readable } from 'stream';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import env from '@config/env';
import axios from 'axios';
import { getClientIP, getGeoFromIP, countryCodeToFlag } from '@utils/geo';
import { mapOrderToProvider, getProviderEndpoint } from '@utils/providerMapper';
import { roundCurrency } from '@utils/currency';
import { selectApplicableCampaignDiscount } from '@utils/campaignDiscount';
import { isWeeklyCampaignActive } from '@services/cartExpiration.weekly';
import { captchamasterAddons, orderKblSelected, type OrderLineShape } from '@utils/addons';
import { extractGoogleDriveFileId, fetchDriveFile, attachmentHeader } from '@utils/driveDownload';
import logger from '@config/logger';

// ---------------------------------------------------------------------------
// GET /orders  — Order history (public, by email or wallet)
// ---------------------------------------------------------------------------
export const getOrders = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, wallet } = req.query;

  let query: Record<string, unknown> = {};
  if (email) {
    query = { customerEmail: email as string };
  } else if (wallet) {
    query = { customerWallet: wallet as string };
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // If an order has a captchaApiKey, try to attach the related CaptchaPackage
  for (const order of orders) {
    const key = (order as Record<string, unknown>).captchaApiKey as string || (order as Record<string, unknown>).captchaApiKey as string;
    if (key) {
      try {
        const pkg = await CaptchaPackage.findOne({ captchaApiKey: key }).lean();
        if (pkg) {
          (order as Record<string, unknown>).captchaPackage = pkg;
        }
      } catch {
        // Non-blocking
      }
    }
  }

  return res.json(success(orders));
});

// ---------------------------------------------------------------------------
// GET /orders/:id  — Single order by MongoDB _id or orderNumber string
// ---------------------------------------------------------------------------
export const getOrderById = asyncHandler(async (req, res) => {
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

  // Fallback to orderNumber string (e.g. "ORD-101")
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

// ---------------------------------------------------------------------------
// GET /orders/:id/delivery-download — Stream this order's delivery file
//
// Deliberately proxied through our own origin instead of linking straight to
// Google Drive:
//   - a Drive "view" link opens a preview page, it does not download anything
//   - Drive's `uc?export=download` shows a virus-scan interstitial for large
//     files, and a cross-origin download cannot be named by the browser
//   - streaming from our origin means the response carries
//     `Content-Disposition: attachment`, so the file saves without the customer
//     leaving the site
//
// Access is limited to the buyer (email on the order) or an admin, and only
// after the order has actually been delivered. Nothing about the upstream URL
// is logged.
// ---------------------------------------------------------------------------
export const downloadDeliveryFile = asyncHandler(async (req, res) => {
  await connectDB();

  const id = String(req.params.id || '').trim();
  if (!id) {
    return res.status(400).json(error('Order ID is required'));
  }

  let order: Record<string, any> | null = null;
  if (id.length === 24 && /^[a-f0-9]+$/i.test(id)) {
    order = await Order.findById(id).lean() as Record<string, any> | null;
  }
  if (!order) {
    order = await Order.findOne({ orderNumber: id }).lean() as Record<string, any> | null;
  }
  if (!order) {
    return res.status(404).json(error('Order not found'));
  }

  // Only delivered orders are downloadable.
  const status = String(order.status || '').toLowerCase();
  if (!['delivered', 'completed', 'approved'].includes(status)) {
    return res.status(403).json(error('This order has not been delivered yet.'));
  }

  // The buyer, or an admin for support.
  const ownerEmail = String(order.email || order.customerEmail || '').toLowerCase().trim();
  const viewerEmail = String(req.user?.email || '').toLowerCase().trim();
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin && (!ownerEmail || ownerEmail !== viewerEmail)) {
    return res.status(403).json(error('You do not have access to this file.'));
  }

  const link = String(order.deliveryLink || '').trim();
  if (!link) {
    return res.status(404).json(error('This order has no downloadable file.'));
  }

  const driveId = extractGoogleDriveFileId(link);
  if (!driveId) {
    return res.status(400).json(error('This order is not delivered as a file download.'));
  }

  const fallbackName = String(
    order.items?.[0]?.productName || order.productName || 'download',
  )
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 80) || 'download';

  try {
    const file = await fetchDriveFile(driveId, fallbackName);

    // Drive answers with HTML when the file is private, missing, or when it
    // still wants a confirmation. Distinguish the private case so the customer
    // gets an actionable message rather than an HTML page saved as a file.
    if (file.isHtml) {
      if (file.needsAccess) {
        logger.warn('Delivery file is not publicly shared', { orderId: id });
        return res
          .status(502)
          .json(error('The download file is not publicly available. Please contact support.'));
      }
      return res
        .status(502)
        .json(error('Could not fetch the download file. Please try again or contact support.'));
    }

    if (!file.ok || !file.stream) {
      logger.warn('Delivery file fetch failed', { orderId: id, upstreamStatus: file.status });
      return res.status(502).json(error('Could not download the file. Please try again.'));
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', attachmentHeader(file.filename));
    if (file.contentLength) res.setHeader('Content-Length', file.contentLength);
    // Purchased files are private to the buyer — never cached by proxies.
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Stream straight through so a large file never has to be buffered.
    Readable.fromWeb(file.stream as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
    return undefined;
  } catch (err) {
    logger.error('Delivery file download failed', {
      orderId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return res.status(502).json(error('Could not download the file. Please try again.'));
  }
});

// ---------------------------------------------------------------------------
// POST /orders — Create a new order
// ---------------------------------------------------------------------------
export const createOrder = asyncHandler(async (req, res) => {
  await connectDB();

  const {
    items,
    email,
    username,
    totalAmount,
    couponCode,
    paymentMethod,
    paymentType,
    trxId,
    txHash,
    walletAddress,
    senderUid,
    payerNumber,
    selectedPlatform,
    selectedNetwork,
    cryptoCurrency,
    p2pToken,
    p2pNetwork,
    p2pWalletAddress,
    deliveryNote,
    captchaApiKey,
    orderId,
    idempotencyKey,
  } = req.body;

  // -----------------------------------------------------------------------
  // Normalise payment fields
  // -----------------------------------------------------------------------
  const method = (paymentMethod || '').toLowerCase().trim();
  const payType = (paymentType || '').toLowerCase().trim();
  const isCrypto = method === 'paycrypto';
  const finalPaymentMethod = isCrypto ? 'paycrypto' : method;

  // Normalise TrxID consistently: trim + uppercase so the same TrxID with
  // different casing or whitespace is treated as one unique reference.
  const normalizedTrxId = (trxId || '').trim().toUpperCase();
  const normalizedTxHash = (txHash || '').trim().toLowerCase();

  const normalizedBody: Record<string, unknown> = {
    paymentMethod: finalPaymentMethod,
    paidVia: isCrypto ? payType : '',
    paymentNumber: payerNumber || walletAddress || '',
    transactionId: normalizedTrxId,
    txHash: normalizedTxHash,
    walletAddress: walletAddress || '',
    senderUid: senderUid || '',
    selectedPlatform: selectedPlatform || '',
    selectedNetwork: selectedNetwork || '',
    cryptoCurrency: cryptoCurrency || '',
    p2pToken: p2pToken || '',
    p2pNetwork: p2pNetwork || '',
    p2pWalletAddress: p2pWalletAddress || '',
    captchaApiKey: captchaApiKey || '',
  };

  // -----------------------------------------------------------------------
  // Basic field validation
  // -----------------------------------------------------------------------
  if (!email) {
    return res.status(400).json(error('Customer email is required'));
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json(error('At least one item is required'));
  }
  if (isCrypto && payType === 'uid' && (!senderUid || !/^\d{9,20}$/.test(String(senderUid).trim()))) {
    return res.status(400).json(error('UID must be 9 to 20 digits'));
  }

  // -----------------------------------------------------------------------
  // Idempotency — reject duplicate submission with the same idempotency key
  // -----------------------------------------------------------------------
  const normalizedIdempotencyKey = (idempotencyKey || '').trim();
  if (normalizedIdempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey: normalizedIdempotencyKey }).lean();
    if (existing) {
      return res
        .status(409)
        .json(error('This order has already been submitted. Please check your order status.'));
    }
  }

  // -----------------------------------------------------------------------
  // Server-side price validation with active campaigns
  //
  // Campaigns are checked against explicit dates, not just the `status` field,
  // so a campaign whose end date passed but was never re-saved cannot keep
  // discounting products.
  // -----------------------------------------------------------------------
  const now = new Date();
  const activeCampaigns = await Campaign.find({
    status: 'active',
    isActive: true,
    isDeleted: { $ne: true },
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gt: now } }],
  }).lean();

  // Exchange rate used to derive a USD price for products that only carry a BDT
  // price. Many catalogue items have `priceUSDT: 0`, and the client converts
  // them with `price / exchangeRate`; without the same conversion here the
  // server valued a ৳50 item at $50 and the anti-manipulation check rejected
  // the order with "Price mismatch detected".
  let exchangeRate = 0;
  try {
    const settings = await PaymentSettings.findOne().select('exchangeRate').lean();
    exchangeRate = Number(settings?.exchangeRate) || 0;
  } catch {
    exchangeRate = 0;
  }

  // Crypto orders require a configured exchange rate to convert BDT product
  // prices to USD. Without it, the server cannot authoritatively price crypto
  // orders and must reject rather than undercharge.
  if (isCrypto && exchangeRate <= 0) {
    return res.status(400).json(error('Exchange rate not configured. Please try again later.'));
  }

  const validatedItems: Array<Record<string, unknown>> = [];

  // Unrounded line sum. The client adds unrounded line totals and rounds once
  // at the end, so the server must do the same or a multi-line order can
  // disagree by a cent and be rejected by the exact-match price guard.
  let rawLineTotalSum = 0;

  // -----------------------------------------------------------------------
  // CaptchaMaster pricing (authoritative)
  //
  // Captcha packages have no Product document — the price comes from the
  // reseller plan. Trusting the client's numbers made the total depend on which
  // exchange rate the browser happened to use: the product card converts with
  // `captchamastersettings.exchangeRate` (e.g. 130) while a crypto order was
  // checked against `paymentsettings.exchangeRate` (e.g. 125), so a ৳123.5
  // package was valued at $0.988 instead of $0.95 and every crypto order was
  // rejected with "Price mismatch detected".
  //
  // The server now derives the unit price from the plan itself (with the
  // configured discount applied), which is the same figure the card shows, and
  // is immune to both the rate mismatch and any tampering with the body.
  // -----------------------------------------------------------------------
  let captchaPricing: { rate: number; discountPercent: number; discountEnabled: boolean; byPlanId: Map<string, number> } | null = null;

  async function loadCaptchaPricing() {
    if (captchaPricing) return captchaPricing;

    const settings = await CaptchaMasterSettings.findById('global').lean();
    const rate = Number(settings?.exchangeRate) || 0;
    const discountPercent = Number(settings?.discountPercent) || 0;
    const discountEnabled = Boolean(settings?.discountEnabled);

    const byPlanId = new Map<string, number>();
    try {
      const { getCaptchaMasterService } = await import('@utils/captchamaster');
      const service = await getCaptchaMasterService();
      const plans = await service.getRawPricingPlans();
      for (const plan of plans as Array<Record<string, unknown>>) {
        const id = String(plan.id ?? '');
        const price = Number(plan.priceValue);
        if (id && Number.isFinite(price)) byPlanId.set(id, price);
      }
    } catch {
      // Reseller unreachable — fall back to the client-supplied figures below
      // so an order is never blocked by a vendor outage.
    }

    captchaPricing = { rate, discountPercent, discountEnabled, byPlanId };
    return captchaPricing;
  }

  for (const item of items) {
    // Accept both 'product' and 'productId' field names for compatibility
    const productId = item.product || item.productId;
    const quantity = item.quantity;
    const price = item.price;
    const link = item.link;
    const details = item.details;
    const name = item.name;

    // P2P / captcha / non-ObjectId items: accept at face value.
    //
    // `price` from these items is a BDT amount, while a crypto order is billed
    // in USD. Using the BDT number directly made the server total
    // `exchangeRate`x larger than the client's and tripped the price-mismatch
    // guard, so convert for crypto (preferring the client's own USD figure).
    if (!productId || typeof productId !== 'string' || productId.length < 12 || productId.startsWith('p2p') || productId === 'captcha') {
      const isSmmItem = item.smmProvider === 'oneservicebd';
      const qty = quantity || 1;
      const clientUsdt = Number(item.usdtAmount) || 0;
      const bdtUnit = Number(price) || 0;
      const effectiveQty = isSmmItem ? qty / 1000 : qty;

      // Captcha packages are priced from the reseller plan, not from the body.
      let unitPx: number;
      const planId = String(item.captchamasterPlanId || item.customData?.captchamasterPlanId || '');
      const isCaptchaItem = item.productType === 'captchamaster' || String(productId).startsWith('cm-') || Boolean(planId);

      // Add-ons applied to this line by the server (CaptchaMaster plans only —
      // they have no Product document to look up). Recorded on the order item
      // so the exact charged percentage is auditable.
      let captchaAppliedAddons: Array<{ key: string; label: string; pricePercent: number }> = [];
      let captchaAddonPercent = 0;

      if (isCaptchaItem) {
        // Optional paid add-on ("Kolotibablo Auto Login", +30%).
        //
        // The percentage comes from the server-side CaptchaMaster catalog,
        // never from the request body — the client can only select the add-on,
        // it cannot change its price. Unknown keys are ignored.
        const requestedAddonKeys = new Set(
          Array.isArray(item.customData?.addons)
            ? item.customData.addons.map((k: unknown) => String(k))
            : (typeof item.customData?.addons === 'string' && item.customData.addons
                ? [String(item.customData.addons)]
                : []),
        );
        captchaAppliedAddons = captchamasterAddons()
          .filter((a) => a?.key && requestedAddonKeys.has(String(a.key)))
          .map((a) => ({
            key: String(a.key),
            label: String(a.label || '').slice(0, 80),
            pricePercent: Math.min(1000, Math.max(0, Number(a.pricePercent) || 0)),
          }));
        captchaAddonPercent = captchaAppliedAddons.reduce((sum, a) => sum + a.pricePercent, 0);
        const captchaMultiplier = 1 + captchaAddonPercent / 100;

        const pricing = await loadCaptchaPricing();
        const listPriceUsd = pricing.byPlanId.get(planId);

        if (typeof listPriceUsd === 'number') {
          // Mirror the card exactly: discount on the USD price, rounded to cents.
          const netUsd = pricing.discountEnabled && pricing.discountPercent > 0
            ? Math.round(listPriceUsd * (1 - pricing.discountPercent / 100) * 100) / 100
            : listPriceUsd;

          // The card converts with the captcha rate; fall back to the client
          // when that rate is not configured.
          const rate = pricing.rate > 0 ? pricing.rate : exchangeRate;
          const netBdt = rate > 0 ? Math.round(netUsd * rate * 100) / 100 : bdtUnit;

          // Authoritative server base price — apply the add-on on top of it.
          unitPx = (isCrypto ? netUsd : netBdt) * captchaMultiplier;
        } else {
          // Plan unknown (rotated away, or the reseller is unreachable): fall
          // back to the client value rather than blocking the order.
          //
          // `clientUsdt` already carries the client's add-on math (the body's
          // usdtAmount is sent add-on-inclusive), so it is used as-is; the BDT
          // `price` field is the bare base, so the add-on is applied there.
          unitPx = isCrypto
            ? (clientUsdt > 0
                ? clientUsdt
                : (exchangeRate > 0 ? roundCurrency(bdtUnit / exchangeRate, 3) : bdtUnit) * captchaMultiplier)
            : bdtUnit * captchaMultiplier;
        }
      } else {
        unitPx = isCrypto
          ? (clientUsdt > 0
              ? clientUsdt
              : (exchangeRate > 0 ? roundCurrency(bdtUnit / exchangeRate, 3) : bdtUnit))
          : bdtUnit;
      }

      // Server-side required field validation for orderFields
      const customData = item.customData || {};
      if (item.orderFields && Array.isArray(item.orderFields)) {
        for (const field of item.orderFields) {
          if (field.required && field.type !== 'hidden') {
            const val = customData[field.key] ?? field.defaultValue ?? '';
            if (val === '' || val === null || val === undefined) {
              return res.status(400).json(error(`"${field.label}" is required for ${item.productName || name || 'this item'}`));
            }
          }
        }
      }

      rawLineTotalSum += unitPx * effectiveQty;

      validatedItems.push({
        quantity: qty,
        price: roundCurrency(unitPx * effectiveQty),
        // The BDT-side amount is kept for display on BDT orders; on crypto
        // orders both fields carry the USD figure the customer pays.
        //
        // For CaptchaMaster lines `unitPx` already carries the server-derived
        // add-on, so the BDT display amount includes it too.
        usdtAmount: isCrypto
          ? roundCurrency(unitPx * effectiveQty)
          : roundCurrency((isCaptchaItem ? unitPx : bdtUnit) * effectiveQty),
        productName: item.productName || name || (productId ? productId : '') || '',
        category: item.category || '',
        link: link || '',
        smmServiceId: item.smmServiceId || '',
        smmProvider: item.smmProvider || '',
        details: details || '',
        productType: item.productType || '',
        captchamasterPlanId: item.captchamasterPlanId || item.customData?.captchamasterPlanId || '',
        discountType: 'none',
        // `customData.addons` carries the selection; `appliedAddons` records the
        // add-ons the server actually charged, so the order shows exactly what
        // was bought (mirrors the regular-product branch above).
        customData: {
          ...customData,
          ...(isCaptchaItem && captchaAppliedAddons.length
            ? { appliedAddons: captchaAppliedAddons, addonPercent: captchaAddonPercent }
            : {}),
        },
      });
      continue;
    }

    // Regular product — lookup from DB
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(400).json(error(`Product not found: ${productId}`));
    }

    // Use currency-appropriate price.
    //
    // For crypto the USD price must be derived when the product only stores a
    // BDT price (`priceUSDT` is 0/absent), exactly like the client does, so the
    // totals disagree by the exchange-rate factor.
    const rawUsdt = Number(product.priceUSDT) || 0;
    const rawBdt = Number(product.priceBDT) || Number(product.price) || 0;
    const usdtPrice = rawUsdt > 0
      ? rawUsdt
      : (exchangeRate > 0 ? roundCurrency(rawBdt / exchangeRate, 3) : rawBdt);

    // Base price is always derived from trusted server data — never from the
    // request body. This prevents a client from injecting a fake campaignPrice
    // or unit price to underpay. Campaign discounts are then re-applied
    // server-side below from the active campaign definitions.
    const basePrice = isCrypto ? usdtPrice : (product.priceBDT || product.price);

    // Find applicable campaign discount — computed server-side only, so the
    // client cannot influence the discounted price.
    const campaignDiscount = selectApplicableCampaignDiscount({
      productId,
      basePrice,
      campaigns: activeCampaigns,
      now,
    });
    // Base unit price after the server-derived campaign discount (before
    // optional add-ons). This is the authoritative floor for the line.
    const serverBaseUnitPrice = campaignDiscount ? campaignDiscount.discountPrice : basePrice;
    const itemDiscountType = campaignDiscount ? campaignDiscount.discountType : 'none';
    let unitPrice = serverBaseUnitPrice;

    // Optional paid add-ons (e.g. "Need Kolotibablo Auto Login", +30%).
    //
    // The percentages come from the PRODUCT, and only the selection comes from
    // the request, so a client can choose what to buy but cannot change a price.
    // An unknown key is ignored, and the percentage is clamped to a sane range.
    const requestedAddonKeys = new Set(
      Array.isArray(item.customData?.addons)
        ? item.customData.addons.map((k: unknown) => String(k))
        : (typeof item.customData?.addons === 'string' && item.customData.addons
            ? [String(item.customData.addons)]
            : []),
    );
    const productAddons = Array.isArray((product as { addons?: unknown }).addons)
      ? ((product as { addons: Array<{ key?: string; label?: string; pricePercent?: number }> }).addons)
      : [];
    const appliedAddons = productAddons
      .filter((a) => a?.key && requestedAddonKeys.has(String(a.key)))
      .map((a) => ({
        key: String(a.key),
        // Label is recorded so the order can show what was bought without
        // re-reading the product (which may have changed since).
        label: String(a.label || '').slice(0, 80),
        pricePercent: Math.min(1000, Math.max(0, Number(a.pricePercent) || 0)),
      }));
    const addonPercent = appliedAddons.reduce((sum, a) => sum + a.pricePercent, 0);
    if (addonPercent > 0) {
      unitPrice = unitPrice * (1 + addonPercent / 100);
    }

    // Reject any line whose client-supplied price undercuts the
    // server-derived base price. This blocks stale expired campaign discounts
    // and fake discounted prices from reaching checkout. Add-ons only raise the
    // price, so they are compared against the pre-add-on base price.
    const clientUnitPrice = Number(price) || 0;
    if (clientUnitPrice < serverBaseUnitPrice - 0.01) {
      return res.status(400).json(
        error("Price mismatch detected — this item's discount is no longer valid. Please refresh your cart and try again."),
      );
    }

    const isSmmProduct = product.smmProvider === 'oneservicebd';
    const effectiveQuantity = isSmmProduct ? (quantity || 1) / 1000 : (quantity || 1);
    // Line totals are NOT rounded for the running sum. The client adds the
    // unrounded lines and rounds once at the end; rounding per line here would
    // let a multi-line order disagree by a cent and trip the exact-match guard.
    const lineTotal = unitPrice * effectiveQuantity;
    const usdtLineTotal = isCrypto ? lineTotal : usdtPrice * effectiveQuantity;
    rawLineTotalSum += lineTotal;

    validatedItems.push({
      product: product._id,
      quantity: quantity || 1,
      price: lineTotal,
      usdtAmount: usdtLineTotal,
      productName: product.name || name || item.productName || '',
      category: product.category || '',
      link: link || '',
      smmServiceId: product.smmServiceId || '',
      smmProvider: product.smmProvider || '',
      details: details || '',
      discountType: itemDiscountType,
      // `customData.addons` carries the selection; `appliedAddons` records the
      // percentages the server actually charged, so the order shows exactly what
      // was bought even if the product's add-ons change later.
      customData: {
        ...(item.customData || {}),
        ...(appliedAddons.length
          ? { appliedAddons, addonPercent }
          : {}),
      },
    });
  }

  // -----------------------------------------------------------------------
  // New campaign type validation (payment_method, bulk_quantity, weekly_special)
  //
  // These are evaluated server-side from trusted campaign data. The client
  // cannot influence the discount — only the payment method code and line
  // quantities are accepted from the request.
  // -----------------------------------------------------------------------
  const paymentMethodCode = (paymentMethod || '').trim();
  let paymentMethodDiscountAmount = 0;

  // Payment method campaign: cart-level discount for using a specific gateway
  // method. Validated against the campaign's eligiblePaymentMethods list.
  const paymentMethodCampaigns = await Campaign.find({
    campaignType: 'payment_method',
    status: 'active',
    isActive: true,
    isDeleted: { $ne: true },
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gt: now } }],
    eligiblePaymentMethods: paymentMethodCode,
  }).lean();

  for (const campaign of paymentMethodCampaigns) {
    const applicableLines = validatedItems.filter((vi) => {
      // Check if the line's product is eligible for this campaign
      const targetType = String(campaign.targetType || 'specific_products');
      const applicableProducts = (campaign.applicableProducts as unknown[]) || [];
      const applicableCategories = (campaign.applicableCategories as unknown[]) || [];
      if (targetType === 'entire_store') return true;
      const productMatch = applicableProducts.some(
        (p: unknown) => String(p) === String(vi.product) || String(p) === String(vi.dbId),
      );
      if (productMatch) return true;
      if (vi.category && applicableCategories.includes(vi.category)) return true;
      return false;
    });

    if (!applicableLines.length) continue;

    const applicableSubtotal = applicableLines.reduce(
      (sum, li) => sum + Number(li.price), 0,
    );

    let discountAmount = 0;
    if (campaign.paymentMethodDiscountType === 'percentage') {
      discountAmount = applicableSubtotal * (Number(campaign.paymentMethodDiscountValue) / 100);
    } else if (campaign.paymentMethodDiscountType === 'fixed_amount') {
      discountAmount = Number(campaign.paymentMethodDiscountValue);
    }
    if (campaign.paymentMethodMaxDiscount) {
      discountAmount = Math.min(discountAmount, Number(campaign.paymentMethodMaxDiscount));
    }

    if (discountAmount > paymentMethodDiscountAmount) {
      paymentMethodDiscountAmount = discountAmount;
    }
  }

  // Bulk quantity campaign: per-line quantity-tier discounts.
  // Recalculated server-side from trusted tier definitions.
  const bulkCampaigns = await Campaign.find({
    campaignType: 'bulk_quantity',
    status: 'active',
    isActive: true,
    isDeleted: { $ne: true },
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gt: now } }],
  }).lean();

  for (const item of validatedItems) {
    const itemCampaigns = bulkCampaigns.filter((c) =>
      isCampaignEligibleForProductInOrder(c, {
        productId: String(item.product || item.productId),
        dbId: String(item.dbId || item.product || item.productId),
        basePrice: Number(item.price),
        quantity: Number(item.quantity),
        category: String(item.category || ''),
      }),
    );

    if (!itemCampaigns.length) continue;

    let bestBulkDiscount: { discountedPrice: number; discountAmount: number } | null = null;
    const qty = Math.max(1, Number(item.quantity || 1));
    const basePrice = Number(item.price);

    for (const campaign of itemCampaigns) {
      const tier = findBulkTierInOrder(campaign, qty);
      if (!tier) continue;
      const discounted = applyBulkTierDiscountInOrder(basePrice, qty, tier);
      if (!discounted) continue;
      if (!bestBulkDiscount || discounted.discountAmount > bestBulkDiscount.discountAmount) {
        bestBulkDiscount = discounted;
      }
    }

    if (bestBulkDiscount) {
      // Override the line price with the bulk-discounted price
      item.price = bestBulkDiscount.discountedPrice;
      // Track the discount for the order record
      (item as Record<string, unknown>).bulkDiscountAmount = bestBulkDiscount.discountAmount;
      (item as Record<string, unknown>).bulkCampaignId = String(
        itemCampaigns.find((c) => {
          const tier = findBulkTierInOrder(c, qty);
          return tier && applyBulkTierDiscountInOrder(basePrice, qty, tier)?.discountedPrice === bestBulkDiscount?.discountedPrice;
        })?._id ?? ''
      );
    }
  }

  // Filter active campaigns for weekly_special: only those in their active
  // weekly window apply. Already-fetched activeCampaigns above may include
  // weekly_special campaigns whose schedule is not currently active.
  const weeklyActiveCampaigns = activeCampaigns.filter((c) => {
    if (c.campaignType !== 'weekly_special') return true;
    // Weekly specials are handled by their own schedule below
    return false;
  });

  // Weekly special campaigns: evaluate based on schedule
  const weeklyCampaigns = activeCampaigns.filter((c) => c.campaignType === 'weekly_special');
  const weeklyTz = 'Asia/Dhaka';
  const activeWeeklyCampaigns = weeklyCampaigns.filter((c) =>
    isWeeklyCampaignActive(c, now, weeklyTz),
  );

  // Replace weekly_special entries in activeCampaigns with only the active ones
  const effectiveCampaigns = [
    ...activeCampaigns.filter((c) => c.campaignType !== 'weekly_special'),
    ...activeWeeklyCampaigns,
  ];

  // Re-apply special_offer campaign discounts using only currently-active
  // campaigns (weekly specials filtered by schedule).
  // The per-line campaign discount was already applied above using all
  // activeCampaigns; for weekly specials we need to re-check. Since
  // selectApplicableCampaignDiscount already checks startDate/endDate and
  // weekly specials also need schedule checking, we re-evaluate lines that
  // had a weekly_special discount.
  for (const item of validatedItems) {
    if ((item as Record<string, unknown>).appliedCampaignType === 'weekly_special') {
      const campaignId = (item as Record<string, unknown>).appliedCampaignId;
      const campaign = activeCampaigns.find(
        (c) => String(c._id) === campaignId,
      );
      if (campaign && campaign.campaignType === 'weekly_special') {
        if (!isWeeklyCampaignActive(campaign, now, weeklyTz)) {
          // Remove the weekly discount from this line
          item.price = item.originalPrice || item.price;
          delete (item as Record<string, unknown>).appliedCampaignId;
          delete (item as Record<string, unknown>).appliedCampaignType;
        }
      }
    }
  }

  // Recompute server total from validated (and possibly re-priced) line items
  rawLineTotalSum = 0;
  for (const item of validatedItems) {
    const isSmmProduct = item.smmProvider === 'oneservicebd';
    const qty = Math.max(1, Number((item as Record<string, unknown>).quantity || 1));
    const effectiveQty = isSmmProduct ? qty / 1000 : qty;
    rawLineTotalSum += Number((item as Record<string, unknown>).price) * effectiveQty;
  }

  const serverTotal = isCrypto
    ? roundCurrency(rawLineTotalSum, 2)
    : Math.round(rawLineTotalSum);

  // -----------------------------------------------------------------------
  // Coupon Required campaign enforcement
  //
  // If any cart line is covered by a campaign with discountType
  // 'coupon_required', the customer MUST provide a valid coupon code.
  // This is enforced server-side — the client cannot bypass it.
  // -----------------------------------------------------------------------
  const hasCouponRequired = validatedItems.some(
    (item) => (item as Record<string, unknown>).discountType === 'coupon_required',
  );

  let coupon = null;
  let appliedCouponCode = (couponCode || '').trim();

  if (hasCouponRequired) {
    const requiredCouponCode = (couponCode || '').trim();
    if (!requiredCouponCode) {
      return res.status(400).json(error('A valid coupon code is required for this order.'));
    }

    const requiredCoupon = await Coupon.findOne({ code: requiredCouponCode.toUpperCase() });
    if (!requiredCoupon) {
      return res.status(400).json(error('Invalid coupon code'));
    }
    if (!requiredCoupon.isActive) {
      return res.status(400).json(error('Coupon is no longer active'));
    }
    if (requiredCoupon.expiresAt && new Date(requiredCoupon.expiresAt) < new Date()) {
      return res.status(400).json(error('Coupon has expired'));
    }
    if (requiredCoupon.usageLimit > 0 && requiredCoupon.usedCount >= requiredCoupon.usageLimit) {
      return res.status(400).json(error('Coupon usage limit has been reached'));
    }
    if (serverTotal < requiredCoupon.minOrderAmount) {
      return res
        .status(400)
        .json(error(`Minimum order amount of ${requiredCoupon.minOrderAmount} required for this coupon`));
    }

    // Use this coupon for the order discount (overrides any other coupon code)
    coupon = requiredCoupon;
    appliedCouponCode = requiredCouponCode;
  }

  // Apply payment method discount to server total
  const serverTotalAfterPaymentDiscount = Math.max(0, serverTotal - paymentMethodDiscountAmount);

  // -----------------------------------------------------------------------
  // Coupon validation
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // Coupon validation
  // -----------------------------------------------------------------------
  let discountAmount = 0;
  let discountType = '';

  // If coupon_required was already enforced above, skip re-validation here.
  const alreadyRequiredCoupon = Boolean(coupon);

  if (appliedCouponCode && !alreadyRequiredCoupon) {
    coupon = await Coupon.findOne({ code: appliedCouponCode.toUpperCase() });

    if (!coupon) {
      return res.status(400).json(error('Invalid coupon code'));
    }
    if (!coupon.isActive) {
      return res.status(400).json(error('Coupon is no longer active'));
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json(error('Coupon has expired'));
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json(error('Coupon usage limit reached'));
    }
    if (serverTotal < coupon.minOrderAmount) {
      return res
        .status(400)
        .json(error(`Minimum order amount of ${coupon.minOrderAmount} required for this coupon`));
    }

    if (coupon.discountType === 'percentage') {
      discountAmount = isCrypto
        ? roundCurrency((serverTotal * coupon.discountValue) / 100, 2)
        : Math.round((serverTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = isCrypto ? roundCurrency(coupon.maxDiscountAmount, 2) : Math.round(coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === 'flat') {
      discountAmount = isCrypto
        ? Math.min(roundCurrency(coupon.discountValue, 2), serverTotal)
        : Math.min(Math.round(coupon.discountValue), serverTotal);
    }
    discountType = coupon.discountType;
  }

  // Authoritative order total. This exact number must be what the customer is
  // asked to pay and what payment verification checks against. BDT stays a
  // whole-taka integer; crypto/USD keeps 2 decimal places (e.g. 4.60).
  const finalTotal = isCrypto
    ? roundCurrency(serverTotalAfterPaymentDiscount - discountAmount, 2)
    : Math.round(serverTotalAfterPaymentDiscount - discountAmount);

  // -----------------------------------------------------------------------
  // Anti-manipulation check
  // For crypto orders the client total must EXACTLY equal the authoritative
  // server total — no tolerance. BDT is whole-taka only; crypto/USD to 2
  // decimal places. Fractional BDT input is rejected outright.
  //
  // For manual verification payments (mobile wallet / COD), the payable
  // amount is determined server-side and recorded as `finalTotal`. The
  // client/gateway amount is informational only — the admin verifies the
  // actual payment proof manually, so we never reject these orders for a
  // client-vs-server amount drift.
  // -----------------------------------------------------------------------
  const clientTotal = Number(totalAmount);
  if (!Number.isFinite(clientTotal)) {
    return res.status(400).json(error('Invalid order amount.'));
  }
  // BDT must be a whole-taka integer — reject fractional input explicitly.
  if (!isCrypto && clientTotal !== Math.round(clientTotal)) {
    return res.status(400).json(error('BDT amount must be a whole number (no decimals).'));
  }
  const clientTotalNormalized = isCrypto
    ? roundCurrency(clientTotal, 2)
    : clientTotal;

  if (isCrypto && clientTotalNormalized !== finalTotal) {
    return res
      .status(400)
      .json(error('Price mismatch detected. Please refresh and try again.'));
  }

  // -----------------------------------------------------------------------
  // Duplicate transaction check (mobile payments)
  // -----------------------------------------------------------------------
  const isMobilePayment = !['paycrypto', 'cod'].includes(finalPaymentMethod);
  if (isMobilePayment && normalizedBody.transactionId) {
    const existing = await Order.findOne({ transactionId: normalizedBody.transactionId }).lean();
    if (existing) {
      return res
        .status(400)
        .json(error('This transaction ID has already been used for a previous order.'));
    }
  }

  // Duplicate txHash check (on-chain network payments — each TXID must be unique)
  if (isCrypto && normalizedBody.txHash) {
    const existingTx = await Order.findOne({ txHash: normalizedBody.txHash }).lean();
    if (existingTx) {
      return res
        .status(400)
        .json(error('This Transaction Hash (TXID) has already been used. Each on-chain network payment must have a unique TXID.'));
    }
  }

  // -----------------------------------------------------------------------
  // Order number reuse
  // If the client supplied an order number (generated at checkout and shown
  // on the ZI-Pay invoice), reuse it so the created order keeps the exact
  // number the customer saw. The Order pre-save hook handles collisions
  // (regenerating a fresh number) instead of failing the order.
  // -----------------------------------------------------------------------
  let orderNumber = '';
  const clientOrderNumber = (orderId || '').toString().trim();
  if (clientOrderNumber) {
    orderNumber = clientOrderNumber.slice(0, 50);
  }

  // -----------------------------------------------------------------------
  // Build order data & create
  // -----------------------------------------------------------------------
  // Determine currency based on payment method
  const orderCurrency = isCrypto ? 'USDT' as const : 'BDT' as const;

  // IP geolocation
  const ipAddress = (getClientIP(req) || req.headers['x-client-ip'] || req.ip || '') as string;
  let geo: { country: string; countryCode: string } = { country: '', countryCode: '' };
  let countryFlag = '';
  if (ipAddress) {
    try {
      geo = await getGeoFromIP(ipAddress);
      countryFlag = countryCodeToFlag(geo.countryCode);
    } catch {
      // Non-blocking
    }
  }

  // Freeze the Kolotibablo Auto Login flag on the order record at purchase
  // time. Derived from the validated items only (a CaptchaMaster line's
  // stored add-on selection) — it is what the admin delivery preview and the
  // vendor payload later read, and no request field can override it.
  const kbl = orderKblSelected(
    validatedItems as unknown as Array<OrderLineShape>,
  );

  const orderData: Record<string, unknown> = {
    email,
    customerEmail: email,
    username: username || email?.split('@')[0] || '',
    items: validatedItems,
    kbl,
    productName: (validatedItems[0]?.productName as string) || '',
    productCategory: (validatedItems[0]?.category as string) || '',
    amount: finalTotal,
    totalAmount: finalTotal,
    currency: orderCurrency,
    orderNumber: orderNumber || undefined,
    paymentMethod: finalPaymentMethod,
    couponCode: appliedCouponCode || '',
    reservedCouponCode: appliedCouponCode || '',
    discountAmount,
    discountType,
    idempotencyKey: normalizedIdempotencyKey
      ? normalizedIdempotencyKey
      : appliedCouponCode
        ? `${email.trim().toLowerCase()}::${appliedCouponCode.toUpperCase()}::${new Date().getTime()}`
        : '',
    deliveryNote: deliveryNote || '',
    captchaApiKey: (normalizedBody.captchaApiKey as string) || undefined,

    // Payment details
    paymentStatus: 'pending',
    paymentNumber: isCrypto ? undefined : (normalizedBody.paymentNumber as string),
    transactionId: isCrypto ? undefined : (normalizedBody.transactionId as string),
    txHash: normalizedBody.txHash as string,
    walletAddress: normalizedBody.walletAddress as string,
    senderUid: normalizedBody.senderUid as string,
    selectedPlatform: normalizedBody.selectedPlatform as string,
    selectedNetwork: normalizedBody.selectedNetwork as string,
    cryptoCurrency: normalizedBody.cryptoCurrency as string,
    paidVia: (normalizedBody.paidVia as string) || '',

    // P2P trade fields
    p2pToken: normalizedBody.p2pToken as string,
    p2pNetwork: normalizedBody.p2pNetwork as string,
    p2pWalletAddress: normalizedBody.p2pWalletAddress as string,
    customerWallet: normalizedBody.walletAddress || payerNumber || '',

    // IP geolocation
    ipAddress,
    country: geo.country,
    countryCode: geo.countryCode,
    countryFlag,
  };

  let order;
  try {
    order = await Order.create(orderData);
  } catch (err: any) {
    // Duplicate transactionId / txHash / idempotencyKey — concurrent submissions
    // with the same reference must never both succeed. The unique partial index
    // on the model catches races that the pre-check above misses.
    if (err?.code === 11000) {
      const key = Object.keys(err.keyValue || {}).join(', ') || 'reference';
      return res.status(409).json(
        error(`This ${key} has already been used. Please check your order status.`),
      );
    }
    throw err;
  }

  // -----------------------------------------------------------------------
  // SMM order submission using provider mapper
  // -----------------------------------------------------------------------
  for (const item of validatedItems) {
    if (item.smmProvider === 'oneservicebd' && item.smmServiceId) {
      try {
        const payload = mapOrderToProvider(item.smmProvider as string, {
          smmServiceId: item.smmServiceId as string,
          link: (item.link as string) || '',
          quantity: item.quantity as number,
          customData: (item.customData as Record<string, unknown>) || {},
        });
        (payload as Record<string, unknown>).key = env.ONESERVICEBD_API_KEY || '';
        (payload as Record<string, unknown>).action = 'add';

        const smmRes = await axios.post(getProviderEndpoint(item.smmProvider as string), payload);
        const { order: smmOrderId } = smmRes.data;
        if (smmOrderId) {
          await Order.findByIdAndUpdate(order._id, {
            $set: { 'items.$[elem].smmOrderId': String(smmOrderId) },
          }, {
            arrayFilters: [{ 'elem.smmServiceId': item.smmServiceId }],
          });
        }
      } catch {
        // Non-blocking — order is still created
      }
    }
  }

  // -----------------------------------------------------------------------
  // Telegram notification (non-blocking)
  // -----------------------------------------------------------------------
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const message = [
      `\uD83C\uDD95 <b>New Order</b>`,
      `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
      `\uD83D\uDCE7 <b>Email:</b> ${email}`,
      `\uD83D\uDCB3 <b>Payment:</b> ${finalPaymentMethod}`,
      `\uD83D\uDCB0 <b>Total:</b> ${finalTotal} ${orderCurrency === 'USDT' ? 'USDT' : 'BDT'}`,
      `\uD83D\uDCE6 <b>Items:</b> ${validatedItems.length}`,
      `\uD83C\uDD94 <b>Order:</b> ${order.orderNumber || order._id}`,
    ].join('\n');

    try {
      await axios.post(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        },
        { timeout: 5000 }
      );
    } catch {
      // Non-blocking
    }
  }

  return res.status(201).json(success(order, 'Order created successfully'));
});

// -----------------------------------------------------------------------
// Helper functions for new campaign type validation
// -----------------------------------------------------------------------

function isCampaignEligibleForProductInOrder(
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

function findBulkTierInOrder(
  campaign: Record<string, unknown>,
  quantity: number,
): Record<string, unknown> | null {
  const tiers = ((campaign as Record<string, unknown>).bulkQuantityTiers as unknown[]) || [];
  const matching = tiers.filter((t) => {
    const tier = t as Record<string, unknown>;
    const min = Number(tier.minQty);
    const max = tier.maxQty ? Number(tier.maxQty) : Infinity;
    return quantity >= min && quantity <= max;
  });
  if (!matching.length) return null;
  return matching.reduce((best, t) => {
    const bestTier = best as Record<string, unknown>;
    const tier = t as Record<string, unknown>;
    const bestVal = Number(bestTier.discountValue);
    const curVal = Number(tier.discountValue);
    return curVal > bestVal ? tier : bestTier;
  }, matching[0] as unknown as Record<string, unknown>) as Record<string, unknown> | null;
}

function applyBulkTierDiscountInOrder(
  basePrice: number,
  quantity: number,
  tier: Record<string, unknown>,
): { discountedPrice: number; discountAmount: number } | null {
  const lineTotal = basePrice * quantity;
  let discountAmount = 0;

  if (tier.discountType === 'percentage') {
    discountAmount = lineTotal * (Number(tier.discountValue) / 100);
  } else if (tier.discountType === 'fixed_amount') {
    discountAmount = Number(tier.discountValue) * quantity;
  }

  if (tier.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(tier.maxDiscountAmount));
  }

  discountAmount = Math.max(0, discountAmount);
  const discountedPrice = Math.max(0, lineTotal - discountAmount) / quantity;

  return {
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
  };
}

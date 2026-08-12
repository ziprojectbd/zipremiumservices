import Order from '@models/Order';
import Product from '@models/Product';
import Campaign from '@models/Campaign';
import Coupon from '@models/Coupon';
import CaptchaPackage from '@models/CaptchaPackage';
import connectDB from '@db/connect';
import { success, error } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import env from '@config/env';
import axios from 'axios';
import { getClientIP, getGeoFromIP, countryCodeToFlag } from '@utils/geo';
import { mapOrderToProvider, getProviderEndpoint } from '@utils/providerMapper';
import { roundCurrency } from '@utils/currency';

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
  } = req.body;

  // -----------------------------------------------------------------------
  // Normalise payment fields
  // -----------------------------------------------------------------------
  const method = (paymentMethod || '').toLowerCase().trim();
  const payType = (paymentType || '').toLowerCase().trim();
  const isCrypto = method === 'paycrypto';
  const finalPaymentMethod = isCrypto ? 'paycrypto' : method;

  const normalizedBody: Record<string, unknown> = {
    paymentMethod: finalPaymentMethod,
    paidVia: isCrypto ? payType : '',
    paymentNumber: payerNumber || walletAddress || '',
    transactionId: trxId || '',
    txHash: txHash || '',
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
  if (isCrypto && payType === 'uid' && (!senderUid || !/^\d{9,}$/.test(String(senderUid).trim()))) {
    return res.status(400).json(error('UID must be at least 9 digits'));
  }

  // -----------------------------------------------------------------------
  // Server-side price validation with active campaigns
  // -----------------------------------------------------------------------
  const activeCampaigns = await Campaign.find({
    status: 'active',
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  const validatedItems: Array<Record<string, unknown>> = [];

  for (const item of items) {
    // Accept both 'product' and 'productId' field names for compatibility
    const productId = item.product || item.productId;
    const quantity = item.quantity;
    const price = item.price;
    const link = item.link;
    const details = item.details;
    const name = item.name;

    // P2P / captcha / non-ObjectId items: accept at face value
    if (!productId || typeof productId !== 'string' || productId.length < 12 || productId.startsWith('p2p') || productId === 'captcha') {
      const isSmmItem = item.smmProvider === 'oneservicebd';
      const qty = quantity || 1;
      const unitPx = price || 0;
      const effectiveQty = isSmmItem ? qty / 1000 : qty;

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

      validatedItems.push({
        quantity: qty,
        price: roundCurrency(unitPx * effectiveQty),
        usdtAmount: roundCurrency(unitPx * effectiveQty),
        productName: item.productName || name || (productId ? productId : '') || '',
        category: item.category || '',
        link: link || '',
        smmServiceId: item.smmServiceId || '',
        smmProvider: item.smmProvider || '',
        details: details || '',
        customData,
      });
      continue;
    }

    // Regular product — lookup from DB
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(400).json(error(`Product not found: ${productId}`));
    }

    // Use currency-appropriate price
    const basePrice = isCrypto
      ? (product.priceUSDT || product.price)
      : (product.priceBDT || product.price);
    const usdtPrice = product.priceUSDT || product.price || 0;

    // Find applicable campaign discount
    let unitPrice = basePrice;
    for (const campaign of activeCampaigns) {
      if (
        campaign.applicableProducts &&
        campaign.applicableProducts.some(
          (p: unknown) => p?.toString() === productId
        )
      ) {
        const effective = campaign.getEffectivePrice
          ? campaign.getEffectivePrice(basePrice)
          : null;
        if (effective && effective.discountPrice < unitPrice) {
          unitPrice = effective.discountPrice;
        }
      }
    }

    const isSmmProduct = product.smmProvider === 'oneservicebd';
    const effectiveQuantity = isSmmProduct ? (quantity || 1) / 1000 : (quantity || 1);
    const lineTotal = roundCurrency(unitPrice * effectiveQuantity);
    const usdtLineTotal = isCrypto ? lineTotal : roundCurrency(usdtPrice * effectiveQuantity);

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
      customData: item.customData || {},
    });
  }

  // -----------------------------------------------------------------------
  // Compute server-side total
  //
  // BDT amounts are normalized to whole taka (integers) end-to-end. The
  // authoritative amount is `finalTotal` below — an integer that is carried
  // unchanged into the order, the ZI-Pay invoice and payment verification.
  // -----------------------------------------------------------------------
  const serverTotal = Math.round(validatedItems.reduce((sum, item) => sum + (item.price as number), 0));

  // -----------------------------------------------------------------------
  // Coupon validation
  // -----------------------------------------------------------------------
  let discountAmount = 0;
  let discountType = '';
  let coupon = null;
  let appliedCouponCode = (couponCode || '').trim();

  if (appliedCouponCode) {
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
      discountAmount = Math.round((serverTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = Math.round(coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === 'flat') {
      discountAmount = Math.min(Math.round(coupon.discountValue), serverTotal);
    }
    discountType = coupon.discountType;
  }

  // Authoritative whole-taka order total. This exact integer must be what the
  // customer is asked to pay and what ZI-Pay verifies against.
  const finalTotal = Math.round(serverTotal - discountAmount);

  // -----------------------------------------------------------------------
  // Anti-manipulation check
  // The client total is normalized to whole taka and must EXACTLY equal the
  // authoritative server total — no tolerance. Guard against NaN (e.g. an
  // empty or non-numeric totalAmount) which would silently pass a comparison.
  // -----------------------------------------------------------------------
  const clientTotalInt = Math.round(Number(totalAmount));
  if (!Number.isFinite(clientTotalInt) || clientTotalInt !== finalTotal) {
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

  const orderData: Record<string, unknown> = {
    email,
    customerEmail: email,
    username: username || email?.split('@')[0] || '',
    items: validatedItems,
    productName: (validatedItems[0]?.productName as string) || '',
    productCategory: (validatedItems[0]?.category as string) || '',
    amount: finalTotal,
    totalAmount: finalTotal,
    currency: orderCurrency,
    paymentMethod: finalPaymentMethod,
    couponCode: appliedCouponCode || '',
    discountAmount,
    discountType,
    deliveryNote: deliveryNote || '',
    captchaApiKey: (normalizedBody.captchaApiKey as string) || undefined,

    // Payment details
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

  const order = await Order.create(orderData);

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
  // Track coupon usage
  // -----------------------------------------------------------------------
  if (coupon && appliedCouponCode) {
    const productIds = validatedItems
      .filter((i) => i.product)
      .map((i) => i.product!.toString());

    const usedByEntries = productIds.map((pid) => ({
      email: email.toLowerCase().trim(),
      productId: pid,
    }));

    await Coupon.findByIdAndUpdate(coupon._id, {
      $inc: { usedCount: 1 },
      $push: { usedBy: { $each: usedByEntries } },
    });
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

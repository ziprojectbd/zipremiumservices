import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Campaign from '../models/Campaign.js';
import Coupon from '../models/Coupon.js';
import CaptchaPackage from '../models/CaptchaPackage.js';
import connectDB from '../db/connect.js';
import { success, error } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import env from '../config/env.js';
import axios from 'axios';
import { getClientIP, getGeoFromIP, countryCodeToFlag } from '../utils/geo.js';
import { mapOrderToProvider, getProviderEndpoint } from '../utils/providerMapper.js';
import { roundCurrency } from '../utils/currency.js';

// ---------------------------------------------------------------------------
// GET /orders  — Order history (public, by email or wallet)
// ---------------------------------------------------------------------------
export const getOrders = asyncHandler(async (req, res) => {
  await connectDB();

  const { email, wallet } = req.query;

  let query = {};
  if (email) {
    query = { customerEmail: email };
  } else if (wallet) {
    query = { customerWallet: wallet };
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // If an order has a captchaApiKey, try to attach the related CaptchaPackage
  for (const order of orders) {
    const key = order.captchaApiKey || order.captchaApiKey;
    if (key) {
      try {
        const pkg = await CaptchaPackage.findOne({ captchaApiKey: key }).lean();
        if (pkg) {
          order.captchaPackage = pkg;
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

  const { id } = req.params;
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
  const key = order.captchaApiKey;
  if (key) {
    try {
      const pkg = await CaptchaPackage.findOne({ captchaApiKey: key }).lean();
      if (pkg) order.captchaPackage = pkg;
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

  const normalizedBody = {
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

  // -----------------------------------------------------------------------
  // Server-side price validation with active campaigns
  // -----------------------------------------------------------------------
  const activeCampaigns = await Campaign.find({
    status: 'active',
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  const validatedItems = [];

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
          (p) => p.toString() === productId
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
  // -----------------------------------------------------------------------
  const serverTotal = roundCurrency(validatedItems.reduce((sum, item) => sum + item.price, 0));

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
      discountAmount = roundCurrency((serverTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === 'flat') {
      discountAmount = Math.min(coupon.discountValue, serverTotal);
    }
    discountType = coupon.discountType;
  }

  const finalTotal = roundCurrency(serverTotal - discountAmount);

  // -----------------------------------------------------------------------
  // Anti-manipulation check
  // -----------------------------------------------------------------------
  const clientTotal = parseFloat(totalAmount || 0);
  if (Math.abs(clientTotal - finalTotal) > 0.01) {
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

  // -----------------------------------------------------------------------
  // Build order data & create
  // -----------------------------------------------------------------------
  // Determine currency based on payment method
  const orderCurrency = isCrypto ? 'USDT' : 'BDT';

  // IP geolocation
  const ipAddress = getClientIP(req) || req.headers['x-client-ip'] || req.ip || '';
  let geo = { country: '', countryCode: '' };
  let countryFlag = '';
  if (ipAddress) {
    try {
      geo = await getGeoFromIP(ipAddress);
      countryFlag = countryCodeToFlag(geo.countryCode);
    } catch {
      // Non-blocking
    }
  }

  const orderData = {
    email,
    customerEmail: email,
    username: username || email?.split('@')[0] || '',
    items: validatedItems,
    productName: validatedItems[0]?.productName || '',
    productCategory: validatedItems[0]?.category || '',
    amount: finalTotal,
    totalAmount: finalTotal,
    currency: orderCurrency,
    paymentMethod: finalPaymentMethod,
    couponCode: appliedCouponCode || '',
    discountAmount,
    discountType,
    deliveryNote: deliveryNote || '',
    captchaApiKey: normalizedBody.captchaApiKey || undefined,

    // Payment details
    paymentNumber: normalizedBody.paymentNumber,
    transactionId: normalizedBody.transactionId,
    txHash: normalizedBody.txHash,
    walletAddress: normalizedBody.walletAddress,
    senderUid: normalizedBody.senderUid,
    selectedPlatform: normalizedBody.selectedPlatform,
    selectedNetwork: normalizedBody.selectedNetwork,
    cryptoCurrency: normalizedBody.cryptoCurrency,
    paidVia: normalizedBody.paidVia,

    // P2P trade fields
    p2pToken: normalizedBody.p2pToken,
    p2pNetwork: normalizedBody.p2pNetwork,
    p2pWalletAddress: normalizedBody.p2pWalletAddress,
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
        const payload = mapOrderToProvider(item.smmProvider, {
          smmServiceId: item.smmServiceId,
          link: item.link || '',
          quantity: item.quantity,
          customData: item.customData || {},
        });
        payload.key = env.ONESERVICEBD_API_KEY || '';
        payload.action = 'add';

        const smmRes = await axios.post(getProviderEndpoint(item.smmProvider), payload);
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
      .map((i) => i.product.toString());

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
      `🆕 <b>New Order</b>`,
      `━━━━━━━━━━━━━`,
      `📧 <b>Email:</b> ${email}`,
      `💳 <b>Payment:</b> ${finalPaymentMethod}`,
      `💰 <b>Total:</b> $${finalTotal.toFixed(2)}`,
      `📦 <b>Items:</b> ${validatedItems.length}`,
      `🆔 <b>Order:</b> ${order.orderNumber || order._id}`,
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

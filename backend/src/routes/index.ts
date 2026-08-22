import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import orderRoutes from './order.routes.js';
import cartRoutes from './cart.routes.js';
import campaignRoutes from './campaign.routes.js';
import couponRoutes from './coupon.routes.js';
import customerRoutes from './customer.routes.js';
import userRoutes from './user.routes.js';
import captchamasterRoutes from './captchamaster.routes.js';
import smmRoutes from './smm.routes.js';
import kycRoutes from './kyc.routes.js';
import marketplaceRoutes from './marketplace.routes.js';
import publicRoutes from './public.routes.js';
import uploadRoutes from './upload.routes.js';
import webhookRoutes from './webhook.routes.js';
import chatRoutes from './chat.routes.js';
import tradeRoutes from './trade.routes.js';
import statsRoutes from './stats.routes.js';
import reviewRoutes from './review.routes.js';
import convertPriceRoutes from './convert-price.routes.js';
import proxyRoutes from './proxy.routes.js';
import adminRoutes from './admin.routes.js';
import adminCaptchamasterRoutes from './admin-captchamaster.routes.js';
import generateSeoRoutes from './generate-seo.routes.js';
import userProductRoutes from './user-product.routes.js';
import paymentResolveRoutes from './paymentResolve.routes.js';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import { getPaymentSettings, updatePaymentSettings } from '@controllers/admin.controller';
import CaptchaMasterSettings from '@models/CaptchaMasterSettings';
import connectDB from '@db/connect';

const router = Router();

// Auth routes
router.use('/', authRoutes);

// Public routes
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/coupons', couponRoutes);
router.use('/public', publicRoutes);
router.use('/reviews', reviewRoutes);
router.use('/convert-price', convertPriceRoutes);

// Authenticated user routes
router.use('/captchamaster', captchamasterRoutes);
router.use('/kyc', kycRoutes);
router.use('/chat', chatRoutes);
router.use('/marketplace', marketplaceRoutes);

// Admin-only routes
router.use('/customers', customerRoutes);
router.use('/users', userRoutes);
router.use('/smm', smmRoutes);
router.use('/admin/smm', smmRoutes); // Alias for frontend compatibility
router.use('/trade', tradeRoutes);
router.use('/stats', statsRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/captchamaster', adminCaptchamasterRoutes);

// Gemini AI generate SEO route
router.use('/admin/generate-seo', generateSeoRoutes);

// Compatibility alias: /api/payment-settings (with auth) → admin payment settings
router.get('/payment-settings', authenticate, adminOnly, getPaymentSettings);
router.post('/payment-settings', authenticate, adminOnly, updatePaymentSettings);

// Public captcha discount settings — no auth needed, frontend fetches to display prices
router.get('/captcha-settings', async (_req, res) => {
  try {
    await connectDB();
    let settings = await CaptchaMasterSettings.findById('global').lean();
    if (!settings) {
      const created = await CaptchaMasterSettings.create({ _id: 'global' });
      settings = created.toObject();
    }
    res.json({ success: true, data: { discountPercent: settings.discountPercent, discountEnabled: settings.discountEnabled, exchangeRate: settings.exchangeRate || 110 } });
  } catch {
    res.json({ success: true, data: { discountPercent: 20, discountEnabled: true, exchangeRate: 110 } });
  }
});

// User product submissions (public listing & creation, admin update)
router.use('/user-products', userProductRoutes);

// Webhooks (no auth)
router.use('/webhook', webhookRoutes);

// Image proxy (no auth needed)
router.use('/proxy', proxyRoutes);

// ZI-Pay payment result resolution (server-to-server, no auth needed)
router.use('/payment-resolve', paymentResolveRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

export default router;

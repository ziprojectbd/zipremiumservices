import { Router } from 'express';
import {
  getPromoOffers,
  getPromoMarquee,
  getRecentOrders,
  getFooter,
  getSideSlider,
  getMaintenance,
  getPopupImages,
  getPopupSettings,
  getPaymentSettings,
  getAllPublicSettings,
} from '@controllers/public.controller';

const router = Router();

router.get('/promo-offers', getPromoOffers);
router.get('/promo-marquee', getPromoMarquee);
router.get('/recent-orders', getRecentOrders);
router.get('/footer', getFooter);
router.get('/side-slider', getSideSlider);
router.get('/maintenance', getMaintenance);
router.get('/popup-images', getPopupImages);
router.get('/popup-settings', getPopupSettings);
router.get('/payment-settings', getPaymentSettings);

// Combined settings endpoint (reduces parallel requests)
router.get('/settings', getAllPublicSettings);

// Public CaptchaMaster pricing — served from the RESELLER pricing-plans
// endpoint (server-side, no API key exposed to the browser).
router.get('/captchamaster/pricing', async (_req, res) => {
  try {
    const { getCaptchaMasterService } = await import('@utils/captchamaster');
    const service = await getCaptchaMasterService();
    const plans = await service.getRawPricingPlans();
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Failed to load captcha pricing',
      error: {},
    });
  }
});

export default router;

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

export default router;

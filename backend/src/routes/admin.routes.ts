import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import {
  getAdminProducts,
  getAdminProductStats,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminOrders,
  getAdminOrderStats,
  getAdminOrderById,
  createAdminOrder,
  updateAdminOrder,
  deleteAdminOrder,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  getAdminCampaigns,
  createAdminCampaign,
  getAdminKyc,
  updateAdminKyc,
  getFooterSettings,
  updateFooterSettings,
  getPaymentSettings,
  updatePaymentSettings,
  getMaintenanceSettings,
  updateMaintenanceSettings,
  getSideSliderSettings,
  updateSideSliderSettings,
  getPopupSettings,
  addPopupImage,
  deletePopupImage,
} from '@controllers/admin.controller';

const router = Router();

router.use(authenticate, adminOnly);

// Products
router.get('/products/stats', getAdminProductStats);
router.get('/products/:id', getAdminProductById);
router.get('/products', getAdminProducts);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

// Orders
router.get('/orders/stats', getAdminOrderStats);
router.get('/orders/:id', getAdminOrderById);
router.get('/orders', getAdminOrders);
router.post('/orders', createAdminOrder);
router.put('/orders/:id', updateAdminOrder);
router.delete('/orders/:id', deleteAdminOrder);

// Categories
router.get('/categories', getAdminCategories);
router.post('/categories', createAdminCategory);
router.put('/categories/:id', updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createAdminCoupon);
router.put('/coupons/:id', updateAdminCoupon);
router.delete('/coupons/:id', deleteAdminCoupon);

// Campaigns
router.get('/campaigns', getAdminCampaigns);
router.post('/campaigns', createAdminCampaign);

// KYC
router.get('/kyc', getAdminKyc);
router.put('/kyc/:id', updateAdminKyc);

// Settings - Footer
router.get('/settings/footer', getFooterSettings);
router.put('/settings/footer', updateFooterSettings);

// Settings - Payment
router.get('/settings/payment', getPaymentSettings);
router.put('/settings/payment', updatePaymentSettings);

// Settings - Maintenance
router.get('/settings/maintenance', getMaintenanceSettings);
router.put('/settings/maintenance', updateMaintenanceSettings);

// Settings - Side Slider
router.get('/settings/side-slider', getSideSliderSettings);
router.put('/settings/side-slider', updateSideSliderSettings);

// Settings - Popup
router.get('/settings/popup', getPopupSettings);
router.post('/settings/popup', addPopupImage);
router.delete('/settings/popup/:id', deletePopupImage);

export default router;

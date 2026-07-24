import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import {
  getAdminCaptchaStats,
  getAdminCaptchaPackages,
  deleteAdminCaptchaPackage,
  getAdminCaptchaApiKeys,
  createAdminCaptchaApiKey,
  regenerateAdminCaptchaApiKey,
  deleteAdminCaptchaApiKey,
} from '../controllers/admin-captchamaster.controller.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/stats', getAdminCaptchaStats);
router.get('/packages', getAdminCaptchaPackages);
router.delete('/packages/:id', deleteAdminCaptchaPackage);
router.get('/api-keys', getAdminCaptchaApiKeys);
router.post('/api-keys', createAdminCaptchaApiKey);
router.put('/api-keys/:id/regenerate', regenerateAdminCaptchaApiKey);
router.delete('/api-keys/:id', deleteAdminCaptchaApiKey);

export default router;

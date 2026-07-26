import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import {
  getAdminCaptchaStats,
  getAdminCaptchaPackages,
  deleteAdminCaptchaPackage,
  getAdminCaptchaApiKeys,
  createAdminCaptchaApiKey,
  regenerateAdminCaptchaApiKey,
  deleteAdminCaptchaApiKey,
} from '@controllers/admin-captchamaster.controller';

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

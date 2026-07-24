import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getCustomerPackages, getCustomerOrders } from '../controllers/captchamaster.controller.js';

const router = Router();

router.use(authenticate);

router.get('/packages', getCustomerPackages);
router.get('/orders', getCustomerOrders);

export default router;

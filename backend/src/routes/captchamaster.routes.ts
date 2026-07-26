import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { getCustomerPackages, getCustomerOrders } from '@controllers/captchamaster.controller';

const router = Router();

router.use(authenticate);

router.get('/packages', getCustomerPackages);
router.get('/orders', getCustomerOrders);

export default router;

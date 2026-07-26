import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import { getTradeSettings, updateTradeSettings } from '@controllers/trade.controller';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/settings', getTradeSettings);
router.put('/settings', updateTradeSettings);

export default router;

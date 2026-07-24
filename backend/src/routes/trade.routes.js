import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { getTradeSettings, updateTradeSettings } from '../controllers/trade.controller.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/settings', getTradeSettings);
router.put('/settings', updateTradeSettings);

export default router;

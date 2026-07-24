import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { getDashboardStats } from '../controllers/stats.controller.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/dashboard', getDashboardStats);

export default router;

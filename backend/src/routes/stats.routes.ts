import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import { getDashboardStats } from '@controllers/stats.controller';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/dashboard', getDashboardStats);

export default router;

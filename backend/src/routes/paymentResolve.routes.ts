import { Router } from 'express';
import { resolvePayment } from '@controllers/paymentResolve.controller';

const router = Router();

// Resolve a ZI-Pay one-time payment result server-to-server.
// POST /api/v1/payment-resolve  body: { resultId, token }
router.post('/', resolvePayment);

export default router;

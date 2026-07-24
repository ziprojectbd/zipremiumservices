import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { submitKYC, getKYCStatus } from '../controllers/kyc.controller.js';

const router = Router();

router.use(authenticate);

router.post('/submit', submitKYC);
router.get('/status', getKYCStatus);

export default router;

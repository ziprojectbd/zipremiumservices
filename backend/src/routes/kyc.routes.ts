import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { submitKYC, getKYCStatus } from '@controllers/kyc.controller';

const router = Router();

router.use(authenticate);

router.post('/submit', submitKYC);
router.get('/status', getKYCStatus);

export default router;

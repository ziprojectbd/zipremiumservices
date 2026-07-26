import { Router } from 'express';
import { captchaMasterWebhook } from '@controllers/webhook.controller';

const router = Router();

router.post('/captchamaster', captchaMasterWebhook);

export default router;

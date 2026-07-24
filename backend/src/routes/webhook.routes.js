import { Router } from 'express';
import { captchaMasterWebhook } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/captchamaster', captchaMasterWebhook);

export default router;

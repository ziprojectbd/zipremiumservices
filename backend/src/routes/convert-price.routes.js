import { Router } from 'express';
import { convertPrice } from '../controllers/convert-price.controller.js';

const router = Router();

router.get('/', convertPrice);

export default router;

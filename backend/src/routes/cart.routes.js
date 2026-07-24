import { Router } from 'express';
import { getCart, createCart, updateCart, deleteCart } from '../controllers/cart.controller.js';

const router = Router();

router.get('/', getCart);
router.post('/', createCart);
router.put('/', updateCart);
router.delete('/', deleteCart);

export default router;

import { Router } from 'express';
import { getCart, createCart, updateCart, deleteCart, validateCart } from '@controllers/cart.controller';

const router = Router();

router.get('/', getCart);
router.post('/', createCart);
router.put('/', updateCart);
router.delete('/', deleteCart);

// Run expiration/eligibility checks and return the cart as it should be
// (expired discounted items stripped, totals recalculated). No upsert unless
// the caller explicitly persists via POST /cart.
router.post('/validate', validateCart);

export default router;

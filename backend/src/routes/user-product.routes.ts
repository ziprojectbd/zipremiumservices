import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import {
  getUserProducts,
  createUserProduct,
  updateUserProduct,
  deleteUserProduct,
} from '@controllers/user-product.controller';

const router = Router();

// Public: list user's own submissions (by email query) and create new submission
router.get('/', getUserProducts);
router.post('/', createUserProduct);

// Admin-only: update status and delete
router.put('/:id', authenticate, adminOnly, updateUserProduct);
router.delete('/:id', authenticate, adminOnly, deleteUserProduct);

export default router;

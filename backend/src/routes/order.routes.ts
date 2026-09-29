import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  downloadDeliveryFile,
} from '@controllers/order.controller';
import { authenticate } from '@middlewares/auth';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);

// Streams the order's delivery file (e.g. a Google Drive download) from our own
// origin so the browser saves it instead of opening a preview page. Requires an
// authenticated viewer and a delivered order.
router.get('/:id/delivery-download', authenticate, downloadDeliveryFile);

router.get('/:id', getOrderById);

export default router;

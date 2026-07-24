import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { getCustomers, getCustomerStats, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customer.controller.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/stats', getCustomerStats);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;

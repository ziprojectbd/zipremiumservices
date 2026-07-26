import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import { getCustomers, getCustomerStats, createCustomer, updateCustomer, deleteCustomer } from '@controllers/customer.controller';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/stats', getCustomerStats);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;

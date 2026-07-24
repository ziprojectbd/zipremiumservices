import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { getUsers, getUserStats, getUserById, updateUser, deleteUser, assignAdmin } from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/stats', getUserStats);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/assign-admin', assignAdmin);

export default router;

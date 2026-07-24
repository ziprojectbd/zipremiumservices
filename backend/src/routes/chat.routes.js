import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getChats, handleChatAction } from '../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getChats);
router.post('/', handleChatAction);

export default router;

import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { getChats, handleChatAction } from '@controllers/chat.controller';

const router = Router();

router.use(authenticate);

router.get('/', getChats);
router.post('/', handleChatAction);

export default router;

import { Router } from 'express';
import { authenticate } from '@middlewares/auth';
import { adminOnly } from '@middlewares/adminOnly';
import upload from '@middlewares/upload';
import { uploadFile } from '@controllers/upload.controller';

const router = Router();

router.post('/', authenticate, adminOnly, upload.single('file'), uploadFile);

export default router;

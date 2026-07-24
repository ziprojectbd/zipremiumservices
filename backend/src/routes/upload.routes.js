import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import upload from '../middleware/upload.js';
import { uploadFile } from '../controllers/upload.controller.js';

const router = Router();

router.post('/', authenticate, adminOnly, upload.single('file'), uploadFile);

export default router;

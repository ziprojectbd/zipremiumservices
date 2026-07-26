import { Router } from 'express';
import { login, signup, getUser, googleAuth, googleCallback, googleAuthWithCredential, updateAdminRole } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import * as rateLimiter from '../middleware/rateLimiter.js';

const router = Router();

// Public auth routes
router.post('/auth/login', rateLimiter.auth, login);
router.post('/auth/google', googleAuthWithCredential);
router.get('/auth/google', googleAuth);
router.get('/auth/google/callback', googleCallback);
router.get('/auth/user', authenticate, getUser);
router.post('/auth/update-admin-role', authenticate, updateAdminRole);

// Signup (separate path from /api/auth/*)
router.post('/signup', rateLimiter.auth, signup);

export default router;

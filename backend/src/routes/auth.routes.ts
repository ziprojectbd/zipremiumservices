import { Router } from 'express';
import { login, signup, getUser, googleAuth, googleCallback, googleAuthWithCredential, updateAdminRole, refresh, logout, logoutAll, checkLock } from '@controllers/auth.controller';
import { authenticate } from '@middlewares/auth';
import * as rateLimiter from '@middlewares/rateLimiter';

const router = Router();

// Public auth routes
router.post('/auth/login', rateLimiter.auth, login);
router.post('/auth/google', googleAuthWithCredential);
router.get('/auth/google', googleAuth);
router.get('/auth/google/callback', googleCallback);
router.post('/auth/refresh', rateLimiter.auth, refresh);
router.post('/auth/check-lock', rateLimiter.auth, checkLock);

// Protected auth routes
router.get('/auth/user', authenticate, getUser);
router.post('/auth/logout', authenticate, logout);
router.post('/auth/logout-all', authenticate, logoutAll);
router.post('/auth/update-admin-role', authenticate, updateAdminRole);

// Signup (separate path from /api/auth/*)
router.post('/signup', rateLimiter.auth, signup);

export default router;

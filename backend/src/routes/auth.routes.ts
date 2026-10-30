import { Router } from 'express';
import {
  login,
  signup,
  getUser,
  googleAuth,
  googleCallback,
  googleAuthWithCredential,
  updateAdminRole,
  refresh,
  logout,
  logoutAll,
  checkLock,
} from '@controllers/auth.controller';
import { authenticate } from '@middlewares/auth';
import { cookieOriginGuard } from '@middlewares/cookieAuthGuard';
import * as rateLimiter from '@middlewares/rateLimiter';

const router = Router();

// Public auth routes
router.post('/auth/login', rateLimiter.auth, login);
router.post('/auth/google', googleAuthWithCredential);
router.get('/auth/google', googleAuth);
router.get('/auth/google/callback', googleCallback);

// Refresh / logout authenticate with the HttpOnly refresh cookie, so they run
// the CSRF origin guard instead of (or in addition to) a Bearer token.
router.post('/auth/refresh', cookieOriginGuard, rateLimiter.auth, refresh);
// Logout must never require a still-valid access token: an expired access token
// is exactly when the user needs to be able to sign out. The session is
// identified and revoked from the refresh cookie.
router.post('/auth/logout', cookieOriginGuard, logout);
router.post('/auth/check-lock', rateLimiter.auth, checkLock);

// Protected auth routes
router.get('/auth/user', authenticate, getUser);
router.post('/auth/logout-all', authenticate, cookieOriginGuard, logoutAll);
router.post('/auth/update-admin-role', authenticate, updateAdminRole);

// Signup (separate path from /api/auth/*)
router.post('/signup', rateLimiter.auth, signup);

export default router;

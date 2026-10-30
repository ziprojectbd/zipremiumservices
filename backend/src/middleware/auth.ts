import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@utils/jwt';
import User from '@models/User';
import { isSessionActive } from '@services/auth.service';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false as const,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false as const,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
      return;
    }

    const decoded = verifyAccessToken(token);

    // Revocation check. Access tokens minted by the session-aware issuer carry a
    // `sid`; if that session was revoked (logout, logout-all, token-reuse) the
    // access token must stop working immediately instead of living out its 15
    // minutes. Tokens without `sid` predate sessions and are still accepted, so
    // nobody signed in before this change is cut off.
    //
    // Fails open: a transient database error must not sign everybody out.
    if (decoded.sid) {
      let sessionActive = true;
      try {
        sessionActive = await isSessionActive(decoded.sid);
      } catch {
        sessionActive = true;
      }
      if (!sessionActive) {
        res.status(401).json({
          success: false as const,
          error: 'Session expired. Please sign in again.',
        });
        return;
      }
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({
        success: false as const,
        error: 'User not found',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false as const,
        error: 'Account is suspended. Please contact support.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    const message = err instanceof Error && err.name === 'TokenExpiredError'
      ? 'Token expired'
      : 'Invalid or expired token';
    res.status(401).json({ success: false as const, error: message });
  }
}

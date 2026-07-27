import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@utils/jwt';
import User from '@models/User';

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

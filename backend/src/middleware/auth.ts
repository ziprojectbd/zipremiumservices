import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwt';
import User from '@models/User';
import { error } from '@utils/apiResponse';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json(error('Authentication required'));
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json(error('User not found'));
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json(error('Invalid or expired token'));
  }
}

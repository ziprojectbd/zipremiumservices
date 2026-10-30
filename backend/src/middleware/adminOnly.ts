import type { Request, Response, NextFunction } from 'express';
import { error } from '@utils/apiResponse';

export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json(error('Admin access required'));
    return;
  }
  next();
};

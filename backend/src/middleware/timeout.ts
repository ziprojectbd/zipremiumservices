import type { Request, Response, NextFunction } from 'express';
import env from '@config/env';

export function requestTimeout(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const timeoutMs = env.REQUEST_TIMEOUT_MS;
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout',
        error: {},
      });
    }
  }, timeoutMs);

  // Clear the timeout when the request completes
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));

  next();
}

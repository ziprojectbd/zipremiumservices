import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@utils/AppError';

export function errorHandler(
  err: Error | AppError | mongoose.Error.ValidationError | mongoose.Error.CastError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('Unhandled error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      error: messages.join(', '),
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
    return;
  }

  const mongoError = err as { code?: number };
  if (mongoError.code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate field value',
    });
    return;
  }

  const status = (err as { status?: number }).status || 500;

  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

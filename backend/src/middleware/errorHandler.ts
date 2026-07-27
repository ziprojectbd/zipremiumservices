import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';

export function errorHandler(
  err: Error | AppError | mongoose.Error.ValidationError | mongoose.Error.CastError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as any).requestId || 'unknown';

  // Log the error
  logger.error('Error occurred', {
    requestId,
    url: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // AppError — known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? { code: err.code, stack: err.stack } : {},
    });
    return;
  }

  // Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      message: messages.join(', '),
      error: {},
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId etc.)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: {},
    });
    return;
  }

  // MongoDB duplicate key error
  const mongoError = err as { code?: number };
  if (mongoError.code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Duplicate field value. This record already exists.',
      error: {},
    });
    return;
  }

  // Multer file size error
  if (err.message === 'File too large' || (err as any).code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      message: 'File too large',
      error: {},
    });
    return;
  }

  // Unknown errors — don't leak stack traces in production
  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error',
    error: process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {},
  });
}

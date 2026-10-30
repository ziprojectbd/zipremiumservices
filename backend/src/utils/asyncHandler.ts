import type { Request, Response, NextFunction } from 'express';

type AsyncHandlerFn<T = unknown> = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<T>;

export function asyncHandler<T = unknown>(
  fn: AsyncHandlerFn<T>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function asyncMiddleware<T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

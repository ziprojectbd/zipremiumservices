import type { Request, Response, NextFunction } from 'express';

export type AsyncHandlerFn<T = unknown> = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<T>;

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface SearchQuery {
  search?: string;
}

import type { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export function getPaginationParams(req: Request, defaultLimit = 10, maxLimit = 100): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
  const skip = (page - 1) * limit;
  const sortField = (req.query.sort as string) || 'createdAt';
  const sortOrder = req.query.order === 'asc' ? (1 as const) : (-1 as const);
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  return { page, limit, skip, sort };
}

export function buildSearchQuery(search?: string, fields: string[] = ['name']): Record<string, unknown> {
  if (!search || !search.trim()) return {};
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: escaped, $options: 'i' },
    })),
  };
}

export function buildDateRangeFilter(
  startDate?: string,
  endDate?: string,
  field = 'createdAt',
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    filter[field] = dateFilter;
  }
  return filter;
}

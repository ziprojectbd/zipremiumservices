// Standardized API responses

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: Record<string, unknown>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function success<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { success: true, message, data };
}

export function error(message: string, code?: string | number): ApiResponse<never> {
  const err: Record<string, unknown> = {};
  if (code !== undefined) err.code = code;
  return { success: false, message, error: err };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<T[]> {
  return {
    success: true,
    message: 'Success',
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

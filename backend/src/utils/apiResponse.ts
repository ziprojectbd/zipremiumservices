export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string | number;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function success<T>(data: T, message?: unknown): ApiSuccessResponse<T> {
  return { success: true as const, data, message };
}

export function error(message: string, code?: string | number): ApiErrorResponse {
  return { success: false as const, error: message, code };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    success: true as const,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export type ApiResponse<T = unknown> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse
  | PaginatedResponse<T>;

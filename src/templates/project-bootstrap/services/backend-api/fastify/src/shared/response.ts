export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return meta ? { data, meta } : { data }
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  }
}

export type ID = string

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams extends PaginationParams, SortParams {
  search?: string
}

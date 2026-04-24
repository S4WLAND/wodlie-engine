import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { Item } from './types'

export const itemKeys = {
  all: ['items'] as const,
  list: () => [...itemKeys.all, 'list'] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
}

export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Item[] }>('/items')
      return data.data
    },
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Item }>(`/items/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

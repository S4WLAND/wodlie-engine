import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { itemKeys } from './queries'
import type { CreateItemInput, Item } from './types'

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const { data } = await apiClient.post<{ data: Item }>('/items', input)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list() })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/items/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list() })
    },
  })
}

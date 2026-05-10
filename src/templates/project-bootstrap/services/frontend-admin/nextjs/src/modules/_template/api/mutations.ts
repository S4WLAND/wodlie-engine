// React Query mutations del módulo.
// Ejemplo:
// import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { apiClient } from '@/shared/api/client'
// import { itemKeys } from './queries'
// import type { CreateItemInput, Item } from './types'
//
// export function useCreateItem() {
//   const queryClient = useQueryClient()
//   return useMutation({
//     mutationFn: async (input: CreateItemInput) => {
//       const { data } = await apiClient.post<{ data: Item }>('/items', input)
//       return data.data
//     },
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: itemKeys.all }),
//   })
// }

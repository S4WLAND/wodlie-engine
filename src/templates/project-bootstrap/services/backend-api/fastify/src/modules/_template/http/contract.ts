import { z } from 'zod'

export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const itemParamsSchema = z.object({
  id: z.string().min(1),
})

export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

export const updateItemSchema = createItemSchema.partial()

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>
export type ItemParams = z.infer<typeof itemParamsSchema>
export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>

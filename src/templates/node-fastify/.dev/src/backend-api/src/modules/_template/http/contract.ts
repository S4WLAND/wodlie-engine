import { z } from 'zod'

export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

export const updateItemSchema = createItemSchema.partial()

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>

import type { FastifyInstance } from 'fastify'
import { getItemsHandler, getItemByIdHandler, createItemHandler, updateItemHandler, deleteItemHandler } from './controller'
import {
  createItemSchema,
  itemParamsSchema,
  listItemsQuerySchema,
  type CreateItemInput,
  type ItemParams,
  type ListItemsQuery,
  type UpdateItemInput,
  updateItemSchema,
} from './contract'

type ListItemsRoute = {
  Querystring: ListItemsQuery
}

type ItemParamsRoute = {
  Params: ItemParams
}

type CreateItemRoute = {
  Body: CreateItemInput
}

type UpdateItemRoute = {
  Params: ItemParams
  Body: UpdateItemInput
}

export async function registerRoutes(app: FastifyInstance) {
  app.get<ListItemsRoute>('/', { schema: { querystring: listItemsQuerySchema } }, getItemsHandler)
  app.get<ItemParamsRoute>('/:id', { schema: { params: itemParamsSchema } }, getItemByIdHandler)
  app.post<CreateItemRoute>('/', { schema: { body: createItemSchema }, preHandler: [app.authenticate] }, createItemHandler)
  app.patch<UpdateItemRoute>(
    '/:id',
    { schema: { params: itemParamsSchema, body: updateItemSchema }, preHandler: [app.authenticate] },
    updateItemHandler,
  )
  app.delete<ItemParamsRoute>('/:id', { schema: { params: itemParamsSchema }, preHandler: [app.authenticate] }, deleteItemHandler)
}

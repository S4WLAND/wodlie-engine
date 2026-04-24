import type { FastifyInstance } from 'fastify'
import { getItemsHandler, getItemByIdHandler, createItemHandler, updateItemHandler, deleteItemHandler } from './controller'
import { createItemSchema, updateItemSchema } from './contract'

export async function registerRoutes(app: FastifyInstance) {
  app.get('/', getItemsHandler)
  app.get('/:id', getItemByIdHandler)
  app.post('/', { schema: { body: createItemSchema }, preHandler: [app.authenticate] }, createItemHandler)
  app.patch('/:id', { schema: { body: updateItemSchema }, preHandler: [app.authenticate] }, updateItemHandler)
  app.delete('/:id', { preHandler: [app.authenticate] }, deleteItemHandler)
}

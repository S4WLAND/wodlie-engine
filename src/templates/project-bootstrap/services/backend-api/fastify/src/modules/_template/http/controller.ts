import type { FastifyRequest, FastifyReply } from 'fastify'
import { ok, paginated } from '../../../shared/response'
import { createTemplateModule } from '../composition'
import type { CreateItemInput, ItemParams, ListItemsQuery, UpdateItemInput } from './contract'

const templateModule = createTemplateModule()

export async function getItemsHandler(
  request: FastifyRequest<{ Querystring: ListItemsQuery }>,
  reply: FastifyReply,
) {
  const page = request.query.page ?? 1
  const limit = request.query.limit ?? 20
  const { items, total } = await templateModule.listItems.execute({ page, limit })
  return reply.send(paginated(items, total, page, limit))
}

export async function getItemByIdHandler(
  request: FastifyRequest<{ Params: ItemParams }>,
  reply: FastifyReply,
) {
  const item = await templateModule.getItemById.execute(request.params.id)
  return reply.send(ok(item))
}

export async function createItemHandler(
  request: FastifyRequest<{ Body: CreateItemInput }>,
  reply: FastifyReply,
) {
  const item = await templateModule.createItem.execute(request.body)
  return reply.code(201).send(ok(item))
}

export async function updateItemHandler(
  request: FastifyRequest<{ Params: ItemParams; Body: UpdateItemInput }>,
  reply: FastifyReply,
) {
  const item = await templateModule.updateItem.execute(request.params.id, request.body)
  return reply.send(ok(item))
}

export async function deleteItemHandler(
  request: FastifyRequest<{ Params: ItemParams }>,
  reply: FastifyReply,
) {
  await templateModule.deleteItem.execute(request.params.id)
  return reply.code(204).send()
}

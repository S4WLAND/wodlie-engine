import type { FastifyRequest, FastifyReply } from 'fastify'
import { ok, paginated } from '../../../shared/response'

export async function getItemsHandler(request: FastifyRequest, reply: FastifyReply) {
  // const useCase = new GetItemsUseCase(new ItemRepositoryImpl())
  // const { items, total } = await useCase.execute(request.query)
  return reply.send(paginated([], 0, 1, 20))
}

export async function getItemByIdHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  // const useCase = new GetItemByIdUseCase(new ItemRepositoryImpl())
  // const item = await useCase.execute(request.params.id)
  return reply.send(ok(null))
}

export async function createItemHandler(request: FastifyRequest, reply: FastifyReply) {
  // const useCase = new CreateItemUseCase(new ItemRepositoryImpl())
  // const item = await useCase.execute(request.body)
  return reply.code(201).send(ok(null))
}

export async function updateItemHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  // const useCase = new UpdateItemUseCase(new ItemRepositoryImpl())
  // const item = await useCase.execute(request.params.id, request.body)
  return reply.send(ok(null))
}

export async function deleteItemHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  // const useCase = new DeleteItemUseCase(new ItemRepositoryImpl())
  // await useCase.execute(request.params.id)
  return reply.code(204).send()
}

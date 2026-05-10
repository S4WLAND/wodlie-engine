import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { createTemplateModule } from './composition'
import { registerRoutes } from './http/routes'

export { createTemplateModule }
export type { TemplateModuleApi } from './composition'
export { CreateItemUseCase } from './use-cases/create-item.use-case'
export { DeleteItemUseCase } from './use-cases/delete-item.use-case'
export { GetItemByIdUseCase } from './use-cases/get-item-by-id.use-case'
export { ListItemsUseCase } from './use-cases/list-items.use-case'
export { UpdateItemUseCase } from './use-cases/update-item.use-case'

export default fp(async (app: FastifyInstance) => {
  await registerRoutes(app)
})

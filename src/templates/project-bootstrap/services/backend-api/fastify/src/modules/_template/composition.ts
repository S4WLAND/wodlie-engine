import type { ItemRepository } from './domain/repository'
import { ItemRepositoryImpl } from './infra/repository'
import { CreateItemUseCase } from './use-cases/create-item.use-case'
import { DeleteItemUseCase } from './use-cases/delete-item.use-case'
import { GetItemByIdUseCase } from './use-cases/get-item-by-id.use-case'
import { ListItemsUseCase } from './use-cases/list-items.use-case'
import { UpdateItemUseCase } from './use-cases/update-item.use-case'

export interface TemplateModuleApi {
  listItems: ListItemsUseCase
  getItemById: GetItemByIdUseCase
  createItem: CreateItemUseCase
  updateItem: UpdateItemUseCase
  deleteItem: DeleteItemUseCase
}

export function createTemplateModule(repository: ItemRepository = new ItemRepositoryImpl()): TemplateModuleApi {
  return {
    listItems: new ListItemsUseCase(repository),
    getItemById: new GetItemByIdUseCase(repository),
    createItem: new CreateItemUseCase(repository),
    updateItem: new UpdateItemUseCase(repository),
    deleteItem: new DeleteItemUseCase(repository),
  }
}

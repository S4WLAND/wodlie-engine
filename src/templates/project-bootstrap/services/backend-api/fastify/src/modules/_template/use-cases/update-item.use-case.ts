import { NotFoundError } from '../../../shared/errors'
import { createScopedLogger } from '../../../shared/logger'
import type { ItemRepository, UpdateItemData } from '../domain/repository'

const logger = createScopedLogger({
  module: '_template',
  layer: 'use-case',
  useCase: 'UpdateItemUseCase',
})

export class UpdateItemUseCase {
  constructor(private readonly repository: ItemRepository) {}

  async execute(id: string, input: UpdateItemData) {
    logger.debug({ id, input }, 'Updating item')
    const existing = await this.repository.findById(id)

    if (!existing) {
      throw new NotFoundError('Item')
    }

    return this.repository.update(id, input)
  }
}

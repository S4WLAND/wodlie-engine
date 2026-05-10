import { NotFoundError } from '../../../shared/errors'
import { createScopedLogger } from '../../../shared/logger'
import type { ItemRepository } from '../domain/repository'

const logger = createScopedLogger({
  module: '_template',
  layer: 'use-case',
  useCase: 'DeleteItemUseCase',
})

export class DeleteItemUseCase {
  constructor(private readonly repository: ItemRepository) {}

  async execute(id: string) {
    logger.debug({ id }, 'Deleting item')
    const existing = await this.repository.findById(id)

    if (!existing) {
      throw new NotFoundError('Item')
    }

    await this.repository.delete(id)
  }
}

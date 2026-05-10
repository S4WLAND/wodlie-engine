import { NotFoundError } from '../../../shared/errors'
import { createScopedLogger } from '../../../shared/logger'
import type { ItemRepository } from '../domain/repository'

const logger = createScopedLogger({
  module: '_template',
  layer: 'use-case',
  useCase: 'GetItemByIdUseCase',
})

export class GetItemByIdUseCase {
  constructor(private readonly repository: ItemRepository) {}

  async execute(id: string) {
    logger.debug({ id }, 'Loading item')
    const item = await this.repository.findById(id)

    if (!item) {
      throw new NotFoundError('Item')
    }

    return item
  }
}

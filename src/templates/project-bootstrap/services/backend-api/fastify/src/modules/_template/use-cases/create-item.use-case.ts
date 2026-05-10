import { createScopedLogger } from '../../../shared/logger'
import type { CreateItemData, ItemRepository } from '../domain/repository'

const logger = createScopedLogger({
  module: '_template',
  layer: 'use-case',
  useCase: 'CreateItemUseCase',
})

export class CreateItemUseCase {
  constructor(private readonly repository: ItemRepository) {}

  async execute(input: CreateItemData) {
    logger.debug({ input }, 'Creating item')
    return this.repository.create(input)
  }
}

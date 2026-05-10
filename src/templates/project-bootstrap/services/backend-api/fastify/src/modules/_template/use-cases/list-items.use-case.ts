import { createScopedLogger } from '../../../shared/logger'
import type { ItemRepository } from '../domain/repository'

export interface ListItemsInput {
  page?: number
  limit?: number
}

const logger = createScopedLogger({
  module: '_template',
  layer: 'use-case',
  useCase: 'ListItemsUseCase',
})

export class ListItemsUseCase {
  constructor(private readonly repository: ItemRepository) {}

  async execute(input: ListItemsInput = {}) {
    logger.debug({ input }, 'Listing items')
    return this.repository.findAll(input)
  }
}

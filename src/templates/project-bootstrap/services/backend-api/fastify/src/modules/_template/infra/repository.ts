import { count, eq } from 'drizzle-orm'
import { getDb } from '../../../db'
import { createScopedLogger } from '../../../shared/logger'
import type { ItemRepository, Item, CreateItemData, UpdateItemData } from '../domain/repository'
import { itemsTable } from './queries'

const logger = createScopedLogger({
  module: '_template',
  layer: 'repository',
  repository: 'ItemRepositoryImpl',
})

export class ItemRepositoryImpl implements ItemRepository {
  async findAll(params?: { page?: number; limit?: number }) {
    const db = getDb()
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const offset = (page - 1) * limit

    logger.debug({ page, limit }, 'Querying items list')

    const [items, [{ total }]] = await Promise.all([
      db.select().from(itemsTable).limit(limit).offset(offset),
      db.select({ total: count() }).from(itemsTable),
    ])

    return { items: items as Item[], total: Number(total) }
  }

  async findById(id: string): Promise<Item | null> {
    const db = getDb()
    logger.debug({ id }, 'Querying item by id')
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id))
    return (item as Item) ?? null
  }

  async create(data: CreateItemData): Promise<Item> {
    const db = getDb()
    logger.debug({ data }, 'Creating item row')
    const [item] = await db.insert(itemsTable).values(data).returning()
    return item as Item
  }

  async update(id: string, data: UpdateItemData): Promise<Item> {
    const db = getDb()
    logger.debug({ id, data }, 'Updating item row')
    const [item] = await db.update(itemsTable).set(data).where(eq(itemsTable.id, id)).returning()
    return item as Item
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    logger.debug({ id }, 'Deleting item row')
    await db.delete(itemsTable).where(eq(itemsTable.id, id))
  }
}

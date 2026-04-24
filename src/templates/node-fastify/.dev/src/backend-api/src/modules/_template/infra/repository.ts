import { db } from '../../../db'
import type { ItemRepository, Item, CreateItemData, UpdateItemData } from '../domain/repository'
import { itemsTable } from './queries'
import { eq } from 'drizzle-orm'

export class ItemRepositoryImpl implements ItemRepository {
  async findAll(params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const offset = (page - 1) * limit

    const [items, [{ count }]] = await Promise.all([
      db.select().from(itemsTable).limit(limit).offset(offset),
      db.select({ count: itemsTable.id }).from(itemsTable),
    ])

    return { items: items as Item[], total: Number(count) }
  }

  async findById(id: string): Promise<Item | null> {
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id))
    return (item as Item) ?? null
  }

  async create(data: CreateItemData): Promise<Item> {
    const [item] = await db.insert(itemsTable).values(data).returning()
    return item as Item
  }

  async update(id: string, data: UpdateItemData): Promise<Item> {
    const [item] = await db.update(itemsTable).set(data).where(eq(itemsTable.id, id)).returning()
    return item as Item
  }

  async delete(id: string): Promise<void> {
    await db.delete(itemsTable).where(eq(itemsTable.id, id))
  }
}

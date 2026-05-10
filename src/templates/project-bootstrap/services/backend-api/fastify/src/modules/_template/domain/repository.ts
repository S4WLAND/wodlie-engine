export interface Item {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateItemData {
  name: string
  description?: string
}

export interface UpdateItemData {
  name?: string
  description?: string
}

export interface ItemRepository {
  findAll(params?: { page?: number; limit?: number }): Promise<{ items: Item[]; total: number }>
  findById(id: string): Promise<Item | null>
  create(data: CreateItemData): Promise<Item>
  update(id: string, data: UpdateItemData): Promise<Item>
  delete(id: string): Promise<void>
}

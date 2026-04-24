/**
 * Adapter: Cache en memoria del proceso
 *
 * Default — sin dependencias externas.
 * No compartido entre múltiples instancias de la API.
 * Migración a Redis: cambiar CACHE_ADAPTER=redis en .env
 */

import type { CacheAdapter } from './adapter'

interface CacheEntry<T> {
  value: T
  expiresAt: number | null
}

export class MemoryCacheAdapter implements CacheAdapter {
  private store = new Map<string, CacheEntry<unknown>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async flush(): Promise<void> {
    this.store.clear()
  }
}

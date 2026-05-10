/**
 * Adapter: Cache en memoria
 *
 * CACHE_ADAPTER=memory → node-cache en proceso (default)
 * CACHE_ADAPTER=redis  → ioredis
 *
 * Migración: cambiar CACHE_ADAPTER en .env → sin cambios en código
 */

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  flush(): Promise<void>
}

export async function createCacheAdapter(): Promise<CacheAdapter> {
  const adapterType = process.env.CACHE_ADAPTER || 'memory'

  switch (adapterType) {
    case 'redis': {
      const { RedisCacheAdapter } = await import('./redis.adapter')
      return new RedisCacheAdapter()
    }
    case 'memory':
    default: {
      const { MemoryCacheAdapter } = await import('./memory.adapter')
      return new MemoryCacheAdapter()
    }
  }
}

/**
 * Adapter: Cache en Redis (ioredis)
 *
 * Para múltiples instancias de API o proyectos con Redis activo.
 * Activar con CACHE_ADAPTER=redis en .env
 */

import type { CacheAdapter } from './adapter'

export class RedisCacheAdapter implements CacheAdapter {
  // TODO: implementar con ioredis
  async get<T>(_key: string): Promise<T | null> {
    throw new Error('RedisCacheAdapter: implementar con ioredis')
  }
  async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {
    throw new Error('RedisCacheAdapter: implementar con ioredis')
  }
  async del(_key: string): Promise<void> {
    throw new Error('RedisCacheAdapter: implementar con ioredis')
  }
  async flush(): Promise<void> {
    throw new Error('RedisCacheAdapter: implementar con ioredis')
  }
}

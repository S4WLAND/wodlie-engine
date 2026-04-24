/**
 * Adapter: Estado en Postgres
 *
 * Para uso futuro con la plataforma Wodlie.
 * Se activa con STATE_ADAPTER=postgres en .env
 *
 * Requiere: WODLIE_ENGINE_DB_URL en el entorno del engine (no del proyecto)
 */

import type { StateAdapter, StateData } from './adapter'

export class PostgresStateAdapter implements StateAdapter {
  // TODO: implementar cuando exista la plataforma Wodlie
  async read(): Promise<StateData | null> {
    throw new Error('PostgresStateAdapter: no implementado aún')
  }
  async write(_data: StateData): Promise<void> {
    throw new Error('PostgresStateAdapter: no implementado aún')
  }
}

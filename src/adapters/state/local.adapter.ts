/**
 * Adapter: Estado local
 *
 * Guarda el estado en .core/state.json (en .gitignore)
 * Default para desarrollo sin plataforma Wodlie activa.
 */

import fs from 'fs-extra'
import path from 'path'
import type { StateAdapter, StateData } from './adapter'

export class LocalStateAdapter implements StateAdapter {
  private statePath = path.join(process.cwd(), '.core', 'state.json')

  async read(): Promise<StateData | null> {
    if (!await fs.pathExists(this.statePath)) return null
    return fs.readJson(this.statePath)
  }

  async write(data: StateData): Promise<void> {
    await fs.ensureDir(path.dirname(this.statePath))
    await fs.writeJson(this.statePath, data, { spaces: 2 })
  }
}

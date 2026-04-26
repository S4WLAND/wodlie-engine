/**
 * Adapter: Estado del proyecto
 *
 * Abstracción sobre el almacenamiento del estado.
 * Permite cambiar de implementación sin tocar el resto del engine.
 *
 * STATE_ADAPTER=git      → rama wodlie-state (default)
 * STATE_ADAPTER=postgres → Postgres managed externo (plataforma futura)
 */

export interface StateData {
  project: string
  active: boolean
  contract: {
    type: 'fixed' | 'subscription'
    history: Array<{ type: string; started: string; ended: string | null }>
  }
  health: {
    summary: {
      progress_pct: number
      blocked_pct: number
      pivoted_pct: number
      wip: number
      total_epics: number
      total_stories: number
      active_stories: number
      completed_stories: number
    }
    backlog: {
      draft: number
      ready: number
      in_progress: number
      in_review: number
      blocked: number
      completed: number
      pivoted: number
      archived: number
    }
    risk: {
      pivots: number
      blocked: number
      archived: number
      active_edits: number
      wip: number
    }
  }
  last_deploy: string | null
  last_incident: string | null
}

export interface StateAdapter {
  read(): Promise<StateData | null>
  write(data: StateData): Promise<void>
}

export async function createStateAdapter(): Promise<StateAdapter> {
  const adapterType = process.env.STATE_ADAPTER || 'local'

  switch (adapterType) {
    case 'postgres': {
      const { PostgresStateAdapter } = await import('./postgres.adapter')
      return new PostgresStateAdapter()
    }
    case 'local':
    default: {
      const { LocalStateAdapter } = await import('./local.adapter')
      return new LocalStateAdapter()
    }
  }
}

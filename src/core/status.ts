import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'
import { createStateAdapter } from '../adapters/state/adapter'
import { ensureCanonicalFiles, getBusinessProgress, loadBusinessModel, readEngineEvents } from './shared/canonical'
import { syncBusinessArtifacts } from './shared/business-artifacts'

interface ProgressData {
  layer: string
  summary?: {
    progress_pct: number
    blocked_pct: number
    pivoted_pct: number
    wip: number
    total_epics: number
    total_stories: number
    active_stories: number
    completed_stories: number
  }
  stories: {
    total?: number
    active?: number
    completed: number
    blocked?: number
    wip?: number
    pivoted?: number
    archived?: number
    by_status?: Record<string, number>
  }
  epics?: {
    total: number
    active: number
    completed: number
    blocked?: number
    pivoted?: number
    archived?: number
  }
  deploys: number
  incidents: number
  pivots: number
  last_updated: string | null
}

async function readProgressJson(layer: string): Promise<ProgressData | null> {
  const progressPath = path.join(process.cwd(), `.${layer}`, 'progress.json')
  if (!await fs.pathExists(progressPath)) return null
  return fs.readJson(progressPath)
}

async function updateProgressJson(layer: string, data: ProgressData): Promise<void> {
  const progressPath = path.join(process.cwd(), `.${layer}`, 'progress.json')
  data.last_updated = new Date().toISOString().split('T')[0]
  await fs.writeJson(progressPath, data, { spaces: 2 })
}

async function updateProgressMd(layer: string, date: string): Promise<void> {
  const progressPath = path.join(process.cwd(), `.${layer}`, 'progress.md')
  if (!await fs.pathExists(progressPath)) return

  let content = await fs.readFile(progressPath, 'utf-8')
  content = content.replace(/ultima_actualizacion: .*/m, `ultima_actualizacion: ${date}`)
  await fs.writeFile(progressPath, content, 'utf-8')
}

function countEditsForToday(events: Awaited<ReturnType<typeof readEngineEvents>>): number {
  const today = new Date().toISOString().split('T')[0]
  return events.filter((event) => {
    if (event.layer !== 'business') return false
    if (!event.type.endsWith('.updated')) return false
    return event.created_at.startsWith(today)
  }).length
}

export async function statusCommand(): Promise<void> {
  console.log(chalk.bold('\nWodlie Status — Actualizando estado del proyecto\n'))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    console.error(chalk.dim('  Ejecutá este comando desde la raíz de un proyecto Wodlie'))
    process.exit(1)
  }

  const date = new Date().toISOString().split('T')[0]
  const layers = ['business', 'infra', 'dev']
  await ensureCanonicalFiles(config, new Date().toISOString())

  const businessModel = await loadBusinessModel()
  await syncBusinessArtifacts(config, businessModel)
  const businessProgress = getBusinessProgress(businessModel)
  const events = await readEngineEvents()

  const progressData: Record<string, ProgressData | null> = {}
  for (const layer of layers) {
    progressData[layer] = await readProgressJson(layer)
  }

  progressData.business = {
    layer: 'business',
    summary: businessProgress.summary,
    stories: businessProgress.stories,
    epics: businessProgress.epics,
    deploys: 0,
    incidents: 0,
    pivots: businessProgress.pivots,
    last_updated: businessModel.updated_at.split('T')[0],
  }

  const totalStories = businessProgress.summary.total_stories
  const completedStories = businessProgress.summary.completed_stories
  const activeStories = businessProgress.summary.active_stories
  const totalPivots = layers.reduce((acc, layer) => acc + (progressData[layer]?.pivots ?? 0), 0)
  const totalDeploys = layers.reduce((acc, layer) => acc + (progressData[layer]?.deploys ?? 0), 0)
  const totalIncidents = layers.reduce((acc, layer) => acc + (progressData[layer]?.incidents ?? 0), 0)

  const stateAdapter = await createStateAdapter()
  const existingState = await stateAdapter.read()

  const newState = {
    project: config.project,
    active: true,
    contract: existingState?.contract ?? {
      type: 'fixed' as const,
      history: [{ type: 'fixed', started: date, ended: null }],
    },
    health: {
      summary: businessProgress.summary,
      backlog: {
        draft: businessProgress.stories.by_status.draft,
        ready: businessProgress.stories.by_status.ready,
        in_progress: businessProgress.stories.by_status['in-progress'],
        in_review: businessProgress.stories.by_status['in-review'],
        blocked: businessProgress.stories.by_status.blocked,
        completed: businessProgress.stories.by_status.completed,
        pivoted: businessProgress.stories.by_status.pivoted,
        archived: businessProgress.stories.by_status.archived,
      },
      risk: {
        pivots: businessProgress.pivots,
        blocked: businessProgress.stories.blocked,
        archived: businessProgress.stories.archived,
        active_edits: countEditsForToday(events),
        wip: businessProgress.summary.wip,
      },
    },
    last_deploy: existingState?.last_deploy ?? null,
    last_incident: existingState?.last_incident ?? null,
  }

  await stateAdapter.write(newState)
  console.log(chalk.green('  ✓ .core/state.json actualizado'))

  for (const layer of layers) {
    if (progressData[layer]) {
      await updateProgressJson(layer, progressData[layer]!)
      await updateProgressMd(layer, date)
      console.log(chalk.green(`  ✓ .${layer}/progress.* actualizado`))
    }
  }

  console.log(chalk.bold(`\nResumen — ${config.project}\n`))
  console.log(`  Historias:   ${completedStories}/${totalStories} completadas (${businessProgress.summary.progress_pct}%)`)
  console.log(`  Activas:     ${activeStories}`)
  console.log(`  Bloqueadas:  ${businessProgress.stories.blocked}`)
  console.log(`  WIP:         ${businessProgress.summary.wip}`)
  console.log(`  Deploys:     ${totalDeploys}`)
  console.log(`  Incidentes:  ${totalIncidents}`)
  console.log(`  Pivots:      ${totalPivots}`)
  console.log(`  Actualizado: ${date}`)
  console.log('')
}

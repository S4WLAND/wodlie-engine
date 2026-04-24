import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'
import { createStateAdapter } from '../adapters/state/adapter'
import { ensureCanonicalFiles, getBusinessProgress, loadBusinessModel } from './shared/canonical'
import { syncBusinessArtifacts } from './shared/business-artifacts'

interface ProgressData {
  layer: string
  stories: { total: number; completed: number; in_progress: number; draft: number }
  epics: { total: number; active: number; completed: number }
  deploys: number
  incidents: number
  pivots: number
  last_updated: string | null
}

async function readProgressJson(layer: string): Promise<ProgressData | null> {
  const p = path.join(process.cwd(), `.${layer}`, 'progress.json')
  if (!await fs.pathExists(p)) return null
  return fs.readJson(p)
}

async function updateProgressJson(layer: string, data: ProgressData): Promise<void> {
  const p = path.join(process.cwd(), `.${layer}`, 'progress.json')
  data.last_updated = new Date().toISOString().split('T')[0]
  await fs.writeJson(p, data, { spaces: 2 })
}

async function updateProgressMd(layer: string, date: string): Promise<void> {
  const p = path.join(process.cwd(), `.${layer}`, 'progress.md')
  if (!await fs.pathExists(p)) return

  let content = await fs.readFile(p, 'utf-8')
  content = content.replace(/ultima_actualizacion: .*/m, `ultima_actualizacion: ${date}`)
  await fs.writeFile(p, content, 'utf-8')
}

export async function statusCommand(): Promise<void> {
  console.log(chalk.bold('\n📊 Wodlie Status — Actualizando estado del proyecto\n'))

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

  // Leer progress de cada capa
  const progressData: Record<string, ProgressData | null> = {}
  for (const layer of layers) {
    progressData[layer] = await readProgressJson(layer)
  }
  progressData.business = {
    layer: 'business',
    stories: businessProgress.stories,
    epics: businessProgress.epics,
    deploys: 0,
    incidents: 0,
    pivots: businessProgress.pivots,
    last_updated: businessModel.updated_at.split('T')[0],
  }

  // Calcular métricas globales
  const totalStories = layers.reduce((acc, l) => acc + (progressData[l]?.stories.total ?? 0), 0)
  const completedStories = layers.reduce((acc, l) => acc + (progressData[l]?.stories.completed ?? 0), 0)
  const inProgressStories = layers.reduce((acc, l) => acc + (progressData[l]?.stories.in_progress ?? 0), 0)
  const totalPivots = layers.reduce((acc, l) => acc + (progressData[l]?.pivots ?? 0), 0)
  const totalDeploys = layers.reduce((acc, l) => acc + (progressData[l]?.deploys ?? 0), 0)
  const totalIncidents = layers.reduce((acc, l) => acc + (progressData[l]?.incidents ?? 0), 0)

  const progressPct = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0

  // Actualizar state.json
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
      new: {
        total: totalStories,
        completed: completedStories,
        in_progress: inProgressStories,
        progress: `${progressPct}%`,
      },
      updates: {
        total: 0,
        completed: 0,
        in_progress: 0,
        progress: '0%',
      },
      pivots: {
        total: totalPivots,
        completed: totalPivots,
        in_progress: 0,
        progress: totalPivots > 0 ? '100%' : '0%',
      },
      ui_ux: {
        new: '0%',
        updated: '0%',
        pivoted: totalPivots > 0 ? '100%' : '0%',
      },
    },
    last_deploy: existingState?.last_deploy ?? null,
    last_incident: existingState?.last_incident ?? null,
  }

  await stateAdapter.write(newState)
  console.log(chalk.green('  ✓ .core/state.json actualizado'))

  // Actualizar progress.md y progress.json de cada capa
  for (const layer of layers) {
    if (progressData[layer]) {
      await updateProgressJson(layer, progressData[layer]!)
      await updateProgressMd(layer, date)
      console.log(chalk.green(`  ✓ .${layer}/progress.* actualizado`))
    }
  }

  // Mostrar resumen
  console.log(chalk.bold(`\n📋 Resumen — ${config.project}\n`))
  console.log(`  Historias:   ${completedStories}/${totalStories} completadas (${progressPct}%)`)
  console.log(`  En progreso: ${inProgressStories}`)
  console.log(`  Deploys:     ${totalDeploys}`)
  console.log(`  Incidentes:  ${totalIncidents}`)
  console.log(`  Pivotes:     ${totalPivots}`)
  console.log(`  Actualizado: ${date}`)
  console.log('')
}

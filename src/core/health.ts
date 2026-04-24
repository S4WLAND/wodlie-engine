import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'
import { createStateAdapter } from '../adapters/state/adapter'

function bar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width)
  const empty = width - filled
  const color = pct >= 75 ? chalk.green : pct >= 40 ? chalk.yellow : chalk.red
  return color('█'.repeat(filled)) + chalk.dim('░'.repeat(empty)) + ` ${pct}%`
}

export async function healthCommand(): Promise<void> {
  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const stateAdapter = await createStateAdapter()
  const state = await stateAdapter.read()

  if (!state) {
    console.log(chalk.yellow('⚠ No hay datos de estado. Ejecutá: wodlie status'))
    return
  }

  const h = state.health
  const newPct = h.new.total > 0 ? Math.round((h.new.completed / h.new.total) * 100) : 0
  const updatesPct = h.updates.total > 0 ? Math.round((h.updates.completed / h.updates.total) * 100) : 0

  console.log(chalk.bold(`\n🏥 Health — ${config.project}\n`))
  console.log(`  Historias nuevas    ${bar(newPct)}  (${h.new.completed}/${h.new.total})`)
  console.log(`  Actualizaciones     ${bar(updatesPct)}  (${h.updates.completed}/${h.updates.total})`)
  console.log('')

  const layers = ['business', 'infra', 'dev']
  console.log(chalk.bold('  Capas:'))
  for (const layer of layers) {
    const p = path.join(process.cwd(), `.${layer}`, 'progress.json')
    if (await fs.pathExists(p)) {
      const data = await fs.readJson(p)
      const pct = data.stories.total > 0
        ? Math.round((data.stories.completed / data.stories.total) * 100)
        : 0
      const icon = pct === 100 ? '✅' : pct > 0 ? '🔄' : '⏳'
      console.log(`  ${icon} .${layer.padEnd(10)} ${bar(pct, 15)}`)
    }
  }

  console.log('')
  if (state.last_deploy) {
    console.log(`  Último deploy:     ${chalk.cyan(state.last_deploy)}`)
  }
  if (state.last_incident) {
    console.log(`  Último incidente:  ${chalk.red(state.last_incident)}`)
  }

  if (h.pivots.total > 0) {
    console.log(chalk.yellow(`\n  ⚠ ${h.pivots.total} pivot(s) registrados. Revisar .business/changelog.md`))
  }
  if (h.new.in_progress > 5) {
    console.log(chalk.yellow(`\n  ⚠ ${h.new.in_progress} historias en progreso simultáneamente. Considerar reducir WIP.`))
  }

  console.log('')
}

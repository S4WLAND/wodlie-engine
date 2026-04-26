import chalk from 'chalk'
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
    console.log(chalk.yellow('⚠ No hay datos de estado. Ejecutá: wodlie-engine status'))
    return
  }

  const summary = state.health.summary
  const backlog = state.health.backlog
  const risk = state.health.risk

  console.log(chalk.bold(`\nHealth — ${config.project}\n`))
  console.log(chalk.bold('  Resumen'))
  console.log(`  Avance global      ${bar(summary.progress_pct)}  (${summary.completed_stories}/${summary.total_stories})`)
  console.log(`  Bloqueadas activas ${bar(summary.blocked_pct)}  (${risk.blocked}/${summary.active_stories})`)
  console.log(`  Pivotadas total    ${bar(summary.pivoted_pct)}  (${risk.pivots}/${summary.total_stories || 0})`)
  console.log('')

  console.log(chalk.bold('  Negocio'))
  console.log(`  Épicos totales:    ${summary.total_epics}`)
  console.log(`  Historias activas: ${summary.active_stories}`)
  console.log(`  WIP actual:        ${summary.wip}`)
  console.log(`  draft / ready:     ${backlog.draft} / ${backlog.ready}`)
  console.log(`  progress / review: ${backlog.in_progress} / ${backlog.in_review}`)
  console.log(`  completed:         ${backlog.completed}`)
  console.log(`  archived:          ${backlog.archived}`)
  console.log('')

  console.log(chalk.bold('  Riesgo'))
  console.log(`  Bloqueadas:        ${risk.blocked}`)
  console.log(`  Pivots:            ${risk.pivots}`)
  console.log(`  Ediciones hoy:     ${risk.active_edits}`)
  if (state.last_deploy) console.log(`  Último deploy:     ${chalk.cyan(state.last_deploy)}`)
  if (state.last_incident) console.log(`  Último incidente:  ${chalk.red(state.last_incident)}`)

  if (risk.blocked > 0) {
    console.log(chalk.yellow('\n  ⚠ Hay historias bloqueadas. Revisar backlog y dependencias.'))
  }
  if (summary.wip > 5) {
    console.log(chalk.yellow('\n  ⚠ WIP alto. Considerar reducir trabajo simultáneo.'))
  }

  console.log('')
}

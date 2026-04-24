import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { simpleGit } from 'simple-git'
import { loadProjectConfig } from './shared/config'

export async function purgeCommand(): Promise<void> {
  console.log(chalk.bold('\n🗑 Purge — Eliminando engine del proyecto\n'))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const cwd = process.cwd()
  const git = simpleGit(cwd)

  console.log(chalk.cyan('→ Creando snapshot git antes de purge...'))
  await git.add('.')
  try {
    await git.commit(`chore(core): snapshot pre-purge — ${new Date().toISOString().split('T')[0]}`)
    console.log(chalk.green('  ✓ Snapshot creado'))
  } catch {
    console.log(chalk.dim('  (sin cambios para commitear)'))
  }

  const toRemove = ['.core', '.wodlie-config', path.join('.dev', 'AGENTS.md')]

  for (const item of toRemove) {
    const fullPath = path.join(cwd, item)
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath)
      console.log(chalk.green(`  ✓ Eliminado: ${item}`))
    }
  }

  console.log(chalk.dim('\n  Se conservaron: .business/ .infra/ .dev/src/ .dev/GUIDELINES.md .wodlie-export/'))

  await git.add('.')
  try {
    await git.commit(`chore(core): purge del wodlie-engine — proyecto ${config.project}`)
    console.log(chalk.green('\n  ✓ Commit de purge realizado'))
  } catch {
    console.log(chalk.dim('  (sin cambios adicionales)'))
  }

  console.log(chalk.bold(`\n✓ Purge completado — ${config.project}\n`))
}

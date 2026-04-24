import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { loadProjectConfig } from './shared/config'

interface UpgradeOptions {
  apply?: boolean
}

const CURRENT_VERSION = '1.0.0'

export async function upgradeCommand(options: UpgradeOptions): Promise<void> {
  console.log(chalk.bold('\n⬆ Upgrade — Verificando actualizaciones del engine\n'))

  try {
    await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const engineVersionPath = path.join(process.cwd(), '.wodlie-config', 'engine-version')
  let installedVersion = CURRENT_VERSION

  if (await fs.pathExists(engineVersionPath)) {
    installedVersion = (await fs.readFile(engineVersionPath, 'utf-8')).trim()
  }

  console.log(`  Versión instalada:   ${chalk.cyan(installedVersion)}`)
  console.log(`  Versión del engine:  ${chalk.cyan(CURRENT_VERSION)}`)
  console.log('')

  if (installedVersion === CURRENT_VERSION) {
    console.log(chalk.green('✓ El proyecto está actualizado'))
    return
  }

  console.log(chalk.yellow('⚠ Hay una actualización disponible'))
  console.log('')
  console.log(chalk.dim('  Archivos que cambiarían: (verificar CHANGELOG.md del engine)'))
  console.log(chalk.dim('  - .core/AGENTS.md'))
  console.log(chalk.dim('  - .core/triggers/*.yml'))
  console.log('')

  if (options.apply) {
    console.log(chalk.cyan('→ Aplicando actualización...'))
    console.log(chalk.dim('  Esta funcionalidad todavía no está implementada'))
    console.log(chalk.dim('  Por ahora, actualizar manualmente copiando archivos del template'))
  } else {
    console.log(chalk.dim('  Para aplicar: wodlie upgrade --apply'))
  }
  console.log('')
}

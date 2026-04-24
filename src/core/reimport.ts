import chalk from 'chalk'
import { loadProjectConfig } from './shared/config'

interface ReimportOptions {
  from?: string
  apply?: boolean
}

export async function reimportCommand(options: ReimportOptions): Promise<void> {
  console.log(chalk.bold('\n🔄 Reimport — Reactivando engine en proyecto del cliente\n'))

  if (!options.from && !options.apply) {
    console.error(chalk.red('✗ Especificar origen con --from <url-o-ruta>'))
    process.exit(1)
  }

  if (options.apply) {
    try {
      await loadProjectConfig()
      console.log(chalk.cyan('→ Aplicando reimport...'))
      console.log(chalk.dim('  Esta funcionalidad todavía no está implementada'))
      console.log(chalk.dim('  Por ahora, reimport manual:'))
      console.log(chalk.dim('  1. Clonar repo del cliente'))
      console.log(chalk.dim('  2. Restaurar .core/ y .wodlie-config/ desde backup'))
      console.log(chalk.dim('  3. Ejecutar wodlie-engine status'))
    } catch {
      console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    }
    return
  }

  console.log(chalk.cyan(`→ Detectando cambios desde: ${options.from}`))
  console.log('')
  console.log(chalk.yellow('⚠ Reimport genera un conflict-report.md'))
  console.log(chalk.dim('  1. Clonar repo del cliente desde ' + options.from))
  console.log(chalk.dim('  2. Comparar con último snapshot de .wodlie-export/'))
  console.log(chalk.dim('  3. Generar conflict-report.md con diferencias'))
  console.log(chalk.dim('  4. Ejecutar: wodlie-engine reimport --apply'))
  console.log('')
  console.log(chalk.dim('  Esta funcionalidad todavía no está implementada'))
  console.log('')
}

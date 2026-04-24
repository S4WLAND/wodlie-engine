import chalk from 'chalk'
import { loadProjectConfig } from './shared/config'
import { exportCommand } from './export'
import { purgeCommand } from './purge'

interface DeliverOptions {
  target?: string
}

export async function deliverCommand(options: DeliverOptions): Promise<void> {
  console.log(chalk.bold('\n📬 Deliver — Entrega completa al cliente\n'))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  if (!options.target) {
    console.error(chalk.red('✗ Especificar repositorio destino con --target <url>'))
    process.exit(1)
  }

  console.log(chalk.cyan(`Proyecto: ${config.project}`))
  console.log(chalk.cyan(`Destino:  ${options.target}`))
  console.log('')
  console.log(chalk.yellow('⚠ Esta acción es irreversible. Pasos a ejecutar:'))
  console.log(chalk.dim('  1. wodlie export'))
  console.log(chalk.dim('  2. wodlie purge'))
  console.log(chalk.dim('  3. Agregar remote destino y hacer push'))
  console.log('')
  console.log(chalk.bold('Ejecutar manualmente en orden:'))
  console.log(chalk.cyan('  1. wodlie export'))
  console.log(chalk.cyan('  2. Revisar .wodlie-export/delivery/delivery-report.md'))
  console.log(chalk.cyan('  3. wodlie purge'))
  console.log(chalk.cyan(`  4. git remote add cliente ${options.target}`))
  console.log(chalk.cyan('  5. git push cliente main'))
  console.log('')
  console.log(chalk.dim('  Esta secuencia todavía no está automatizada por el engine'))
  console.log('')
}

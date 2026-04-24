import chalk from 'chalk'
import { loadProjectConfig } from './shared/config'
import { triggerCommand } from './trigger'

interface DeployOptions {
  env: string
  target: string
  skip?: string
}

export async function deployCommand(options: DeployOptions): Promise<void> {
  console.log(chalk.bold(`\n🚀 Deploy — ${options.env} / ${options.target}\n`))

  let config
  try {
    config = await loadProjectConfig()
  } catch {
    console.error(chalk.red('✗ No se encontró .wodlie-config/project.json'))
    process.exit(1)
  }

  const skipped = options.skip ? options.skip.split(',').map(s => s.trim()) : []

  console.log(chalk.cyan('Configuración:'))
  console.log(`  Proyecto:  ${config.project}`)
  console.log(`  Entorno:   ${options.env}`)
  console.log(`  Target:    ${options.target}`)
  if (skipped.length > 0) console.log(`  Skip:      ${skipped.join(', ')}`)
  console.log('')

  if (options.env === 'production') {
    console.log(chalk.yellow('⚠ Deploy a PRODUCCIÓN'))
    console.log(chalk.dim('  El workflow deploy-prod.yml se activará al hacer push a main'))
    console.log(chalk.dim('  Asegurarse de que todos los tests pasen antes de mergear'))
  } else {
    console.log(chalk.cyan('→ Deploy a staging'))
    console.log(chalk.dim('  El workflow deploy-staging.yml se activará al hacer push a dev'))
  }

  console.log('')
  console.log(chalk.bold('Pasos manuales:'))
  console.log(chalk.dim(`  1. git push origin ${options.env === 'production' ? 'main' : 'dev'}`))
  console.log(chalk.dim('  2. Monitorear el workflow en CI/CD'))
  console.log(chalk.dim('  3. Verificar healthcheck: curl https://api.<dominio>/health'))
  console.log(chalk.dim('  4. Ejecutar: wodlie-engine trigger on-deploy'))
  console.log('')
}

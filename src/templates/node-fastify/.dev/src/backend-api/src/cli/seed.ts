import 'dotenv/config'
import { logger } from '../shared/logger'

// Uso: tsx src/cli/seed.ts [--env staging|development]
async function seed() {
  const env = process.argv.includes('--env')
    ? process.argv[process.argv.indexOf('--env') + 1]
    : 'development'

  logger.info({ env }, 'Iniciando seed de datos')

  // TODO: agregar datos de prueba según el entorno
  // En development: datos de demo completos
  // En staging: datos mínimos para smoke tests

  logger.info('Seed completado')
  process.exit(0)
}

seed().catch((err) => {
  logger.error(err)
  process.exit(1)
})

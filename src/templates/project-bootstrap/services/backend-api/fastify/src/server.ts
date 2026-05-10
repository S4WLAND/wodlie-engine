import 'dotenv/config'
import { buildApp } from './app'
import { env } from './config/env'
import { logger } from './shared/logger'

const start = async () => {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    logger.info(`Servidor iniciado en ${env.HOST}:${env.PORT}`)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

start()

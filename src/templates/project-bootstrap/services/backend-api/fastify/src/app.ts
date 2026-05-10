import Fastify from 'fastify'
import { corsPlugin } from './plugins/cors.plugin'
import { authPlugin } from './plugins/auth.plugin'
import { rateLimitPlugin } from './plugins/rate-limit.plugin'
import { errorHandlerPlugin } from './plugins/error-handler.plugin'

export async function buildApp() {
  const usePrettyLogs = process.env.NODE_ENV === 'development'

  const app = Fastify({
    logger:
      usePrettyLogs
        ? {
            level: process.env.LOG_LEVEL || 'debug',
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
          }
        : {
            level: process.env.LOG_LEVEL || 'info',
          },
    trustProxy: true,
  })

  await app.register(corsPlugin)
  await app.register(rateLimitPlugin)
  await app.register(authPlugin)
  await app.register(errorHandlerPlugin)

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Registrar módulos aquí
  // await app.register(import('./modules/users'), { prefix: '/api/users' })

  return app
}

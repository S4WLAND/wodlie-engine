import Fastify, { type FastifyInstance } from 'fastify'
import { corsPlugin } from './plugins/cors.plugin'
import { authPlugin } from './plugins/auth.plugin'
import { rateLimitPlugin } from './plugins/rate-limit.plugin'
import { errorHandlerPlugin } from './plugins/error-handler.plugin'
import { swaggerPlugin } from './plugins/swagger.plugin'
import { env } from './config/env'

export async function buildApp() {
  const usePrettyLogs = process.env.NODE_ENV === 'development'

  const fastifyOptions = {
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
  }

  const app = (env.HTTP2_ENABLED
    ? Fastify({ ...fastifyOptions, http2: true })
    : Fastify(fastifyOptions)) as FastifyInstance

  await app.register(swaggerPlugin)
  await app.register(corsPlugin)
  await app.register(rateLimitPlugin)
  await app.register(authPlugin)

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Superficies HTTP reservadas:
  // - /api/v1/auth para autenticación común
  // - /api/v1/admin/* para gestión interna protegida
  // - /api/v1/public/* para lecturas públicas granulares
  // - /api/v1/pages/* para BFF SSR de composición
  //
  // Registrar módulos reales aquí, por ejemplo:
  // await app.register(usersModule, { prefix: '/api/v1/admin/users' })
  // await app.register(publicCatalogModule, { prefix: '/api/v1/public/catalog' })

  await app.register(errorHandlerPlugin)

  return app
}

import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import { securityConfig } from '../config/security'

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyRateLimit, {
    max: securityConfig.rateLimit.max,
    timeWindow: securityConfig.rateLimit.timeWindow,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Demasiadas solicitudes. Intente más tarde.',
    }),
  })
})

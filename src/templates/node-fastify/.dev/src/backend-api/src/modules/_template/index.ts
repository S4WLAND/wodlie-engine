import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { registerRoutes } from './http/routes'

export default fp(async (app: FastifyInstance) => {
  await registerRoutes(app)
})

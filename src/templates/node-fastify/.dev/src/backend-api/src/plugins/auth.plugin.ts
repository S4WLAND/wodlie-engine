import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance } from 'fastify'
import { securityConfig } from '../config/security'
import { UnauthorizedError } from '../shared/errors'

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: securityConfig.jwt.secret,
  })

  app.decorate('authenticate', async (request: Parameters<typeof app.authenticate>[0], reply: Parameters<typeof app.authenticate>[1]) => {
    try {
      await request.jwtVerify()
    } catch {
      throw new UnauthorizedError()
    }
  })
})

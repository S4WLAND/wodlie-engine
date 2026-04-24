import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { securityConfig } from '../config/security'

export const corsPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyCors, {
    origin: securityConfig.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
})

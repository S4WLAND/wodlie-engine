import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { AppError } from '../shared/errors'
import { logger } from '../shared/logger'

export const errorHandlerPlugin = fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code || 'APP_ERROR',
        message: error.message,
      })
    }

    if (error.validation) {
      return reply.code(422).send({
        error: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: error.validation,
      })
    }

    logger.error(error)
    return reply.code(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
    })
  })
})

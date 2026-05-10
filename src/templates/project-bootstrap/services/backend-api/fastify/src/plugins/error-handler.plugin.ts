import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { env } from '../config/env'
import { AppError } from '../shared/errors'

export const errorHandlerPlugin = fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
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

    request.log.error(
      {
        err: error,
        requestId: request.id,
        route: request.routeOptions.url,
        method: request.method,
      },
      'Unhandled request error',
    )

    return reply.code(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message,
      ...(env.NODE_ENV === 'production'
        ? {}
        : {
            details: {
              name: error.name,
              stack: error.stack,
            },
          }),
    })
  })
})

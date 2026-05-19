import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance } from 'fastify'
import { securityConfig } from '../config/security'

export const swaggerPlugin = fp(async (app: FastifyInstance) => {
  if (!securityConfig.swagger.enabled) {
    return
  }

  await app.register(swagger, {
    openapi: {
      info: {
        title: '{{CLIENT_NAME}} Backend API',
        version: '1.0.0',
        description: [
          'Documentación de endpoints del backend de {{CLIENT_NAME}}.',
          '',
          'Tags por superficie:',
          '- auth-* para autenticación y sesión',
          '- admin-* para gestión y mutaciones protegidas',
          '- public-* para lecturas públicas granulares',
          '- pages-* para BFF SSR de composición',
          '- webhooks-* para entradas de proveedores externos',
          '- jobs-* para operaciones async/background',
          '- integrations-* para endpoints técnicos de integraciones cuando existan',
        ].join('\n'),
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: securityConfig.swagger.routePrefix,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  })
})

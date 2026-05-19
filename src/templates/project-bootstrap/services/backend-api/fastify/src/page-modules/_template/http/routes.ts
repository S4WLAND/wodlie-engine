/**
 * Rutas HTTP: Page module template
 *
 * Registrar sólo en page-modules concretos. Este template no se registra desde app.ts.
 */

import type { FastifyInstance } from 'fastify'
import type { TemplatePageModuleApi } from '../composition'
import { createTemplatePageController } from './controller'
import { templatePageResponseJsonSchema } from './contract'

export async function registerTemplatePageRoutes(app: FastifyInstance, templatePageModule: TemplatePageModuleApi) {
  const controller = createTemplatePageController(templatePageModule)

  app.get('/template', {
    schema: {
      tags: ['pages-template'],
      summary: 'Template de composición SSR',
      response: { 200: templatePageResponseJsonSchema },
    },
  }, controller.get)
}

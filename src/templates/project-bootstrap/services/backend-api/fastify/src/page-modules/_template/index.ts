/**
 * Módulo Fastify: Page module template
 *
 * Plugin de ejemplo para page-modules concretos. No se registra como ruta real.
 */

import type { FastifyInstance } from 'fastify'
import { createTemplatePageModule } from './composition'
import { registerTemplatePageRoutes } from './http/routes'

export { createTemplatePageModule }
export type { TemplatePageModuleApi } from './composition'
export { GetTemplatePageUseCase } from './use-cases/get-page.use-case'

export default async function templatePageModule(app: FastifyInstance) {
  const templatePageApi = createTemplatePageModule()
  await registerTemplatePageRoutes(app, templatePageApi)
}

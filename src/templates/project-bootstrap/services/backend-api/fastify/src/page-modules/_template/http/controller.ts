/**
 * Controller HTTP: Page module template
 *
 * Handler delgado: no contiene reglas de negocio ni queries.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import { ok } from '../../../shared/response'
import type { TemplatePageModuleApi } from '../composition'

export function createTemplatePageController(templatePageModule: TemplatePageModuleApi) {
  return {
    get: async (_request: FastifyRequest, reply: FastifyReply) => {
      const page = await templatePageModule.getPage.execute()
      return reply.send(ok(page))
    },
  }
}

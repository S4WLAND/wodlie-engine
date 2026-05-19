/**
 * Composición de módulo: Page module template
 *
 * Wiring local de la composición SSR. Reemplazar dependencias de ejemplo por use-cases reales.
 */

import {
  GetTemplatePageUseCase,
  type TemplateCategory,
  type TemplateMenuLink,
  type TemplatePageDependencies,
} from './use-cases/get-page.use-case'

export interface TemplatePageModuleApi {
  getPage: GetTemplatePageUseCase
}

const emptyTemplateDependencies: TemplatePageDependencies = {
  async listPublishedMenuLinks(): Promise<TemplateMenuLink[]> {
    return []
  },
  async listPublishedTreatmentCategories(): Promise<TemplateCategory[]> {
    return []
  },
}

export function createTemplatePageModule(
  dependencies: TemplatePageDependencies = emptyTemplateDependencies,
): TemplatePageModuleApi {
  return {
    getPage: new GetTemplatePageUseCase(dependencies),
  }
}

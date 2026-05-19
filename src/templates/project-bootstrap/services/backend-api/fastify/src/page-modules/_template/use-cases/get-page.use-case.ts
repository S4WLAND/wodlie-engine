/**
 * Caso de uso: Obtener página SSR
 *
 * Template de composición. Reemplazar las dependencias por use-cases reales de `modules/*`.
 */

export interface TemplateMenuLink {
  label: string
  href: string
  order: number
}

export interface TemplateCategory {
  slug: string
  title: string
  summary: string
}

export interface TemplatePageResponse {
  navigation: {
    menuLinks: TemplateMenuLink[]
  }
  treatments: {
    categories: TemplateCategory[]
  }
}

export interface TemplatePageDependencies {
  listPublishedMenuLinks(): Promise<TemplateMenuLink[]>
  listPublishedTreatmentCategories(): Promise<TemplateCategory[]>
}

export class GetTemplatePageUseCase {
  constructor(private readonly dependencies: TemplatePageDependencies) {}

  async execute(): Promise<TemplatePageResponse> {
    const [menuLinks, categories] = await Promise.all([
      this.dependencies.listPublishedMenuLinks(),
      this.dependencies.listPublishedTreatmentCategories(),
    ])

    return {
      navigation: { menuLinks },
      treatments: { categories },
    }
  }
}

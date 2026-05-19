/**
 * Contratos HTTP: Page module template
 *
 * Schema de response de ejemplo para una composición SSR.
 */

function responseEnvelope(schema: Record<string, unknown>) {
  return {
    type: 'object',
    properties: {
      data: schema,
      meta: { type: 'object', additionalProperties: true },
    },
    required: ['data'],
  } as const
}

const menuLinkSchema = {
  type: 'object',
  properties: {
    label: { type: 'string' },
    href: { type: 'string' },
    order: { type: 'number' },
  },
  required: ['label', 'href', 'order'],
} as const

const categorySchema = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['slug', 'title', 'summary'],
} as const

export const templatePageResponseJsonSchema = responseEnvelope({
  type: 'object',
  properties: {
    navigation: {
      type: 'object',
      properties: {
        menuLinks: { type: 'array', items: menuLinkSchema },
      },
      required: ['menuLinks'],
    },
    treatments: {
      type: 'object',
      properties: {
        categories: { type: 'array', items: categorySchema },
      },
      required: ['categories'],
    },
  },
  required: ['navigation', 'treatments'],
})

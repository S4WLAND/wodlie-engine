# Template: Page module

Plantilla para endpoints BFF de composición usados por SSR de Next.js.

## Qué es

Un `page-module` arma el contrato de datos de una pantalla concreta para que otro servidor, normalmente `frontend-public`, pueda renderizar HTML inicial con una sola llamada interna.

Ejemplos futuros:

- `home-page` → `GET /api/v1/pages/home`
- `treatment-detail-page` → `GET /api/v1/pages/treatments/:slug`
- `product-detail-page` → `GET /api/v1/pages/products/:slug`

## Qué no es

- no es un módulo de dominio
- no es CRUD
- no procesa mutaciones
- no tiene tablas propias
- no consulta Drizzle directamente
- no importa `infra/` de otros módulos
- no construye HTML ni componentes React

La UI, layout, estilos, assets estáticos y componentes viven en Next.js. El `page-module` sólo devuelve JSON tipado.

## Estructura

```text
page-modules/<page-name>/
  use-cases/
    get-<page-name>.use-case.ts   ← orquesta lecturas existentes
  http/
    routes.ts                     ← registra la ruta Fastify del page-module
    controller.ts                 ← llama al use-case y responde `{ data }`
    contract.ts                   ← schema del response de página
  composition.ts                  ← recibe/injecta use-cases de módulos reales
  index.ts                        ← plugin Fastify, registrado desde app.ts cuando se active
  README.md                       ← contrato, fuentes de datos y consumidor SSR
```

Carpetas que no deberían existir en un page-module:

```text
domain/
infra/
repository.ts
queries.ts
```

## Flujo

```text
frontend-public Server Component
  -> GET /api/v1/pages/<page>
    -> page-modules/<page>
      -> Promise.all([
           modules/menu-links use-case,
           modules/treatments use-case,
           modules/reviews use-case,
         ])
      -> mapTo<Page>Response()
  -> React renderiza HTML con esos datos
```

## Composition

El page-module recibe dependencias ya compuestas desde `app-composition.ts` cuando exista cross-module real. No instancia repositorios ni clientes externos.

```text
app-composition.ts
  createMenuLinksModule()
  createTreatmentsModule()
  createHomePageModule({ menuLinks, treatments })
```

La ejecución por request sólo llama use-cases ya instanciados.

## Regla de duplicación

El `page-module` no duplica reglas de negocio. Si una página necesita tratamientos publicados, debe consumir un use-case del módulo `treatments`, por ejemplo `ListPublishedTreatmentCategoriesUseCase`. La regla de qué significa "publicado" vive en `treatments`, no en el page-module.

El mapeo permitido es el DTO de página:

```text
navigation.menuLinks
treatments.categories
seo
relatedItems
availabilitySummary
```

## Cuándo crear uno

Crear un `page-module` cuando una pantalla SSR necesite varias fuentes dinámicas administradas desde admin y convenga responder en una sola petición.

No crear uno si la pantalla necesita una sola lectura granular. En ese caso Next puede consumir `/api/v1/public/<resource>`.

## Registro

El template no registra rutas reales. Cuando se cree un page-module concreto, se registra desde `app.ts`:

```typescript
await app.register(homePageModule, { prefix: '/api/v1/pages' })
```

Los módulos registrados con prefijo no deben envolverse con `fastify-plugin`, porque el prefijo forma parte del contrato HTTP.

## Swagger

Usar tags `pages-<page>`.

La descripción de la ruta debe indicar:

- que es BFF SSR de lectura
- qué Server Component o página lo consume
- qué módulos reales alimentan el response
- que no ejecuta mutaciones ni side effects
- qué partes del response son dinámicas y cuáles quedan en build time de Next

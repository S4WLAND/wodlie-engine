# Context AI — Frontend Public

Decisiones técnicas, gotchas y deuda conocida del sitio público.

> Última actualización: {{DATE}}

## Resumen ejecutivo

Frontend en Next.js App Router con:

- `modules/` como unidad principal de negocio
- `shared/` para infraestructura y estado reusable
- estilos globales guiados por `tokens.css`

## Decisiones técnicas

### App Router

- routing y layouts por carpeta
- metadata cerca de la ruta
- buena base para SEO y errores por segmento

### Módulos en `src/modules`

- cada módulo encapsula API, estado y tipos
- las páginas orquestan; no concentran lógica

### Estado compartido

- Zustand para estado local/global simple
- cliente API compartido en `shared/api`

## Estado inicial

- layout base
- página pública placeholder
- auth/login placeholder
- archivos base de `error`, `not-found`, `robots` y `sitemap`

## Recordatorios

- si una ruta pública requiere SEO específico, documentarlo en el módulo
- si se agregan nuevas `NEXT_PUBLIC_*`, reflejarlas en `.env.example`

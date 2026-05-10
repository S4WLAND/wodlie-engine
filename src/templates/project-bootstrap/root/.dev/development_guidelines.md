# Development Guidelines — Stack node-fastify

Documento técnico de referencia para todo el código de `.dev/`. Estándares, patrones y convenciones obligatorios.

> Aplicar en cualquier tarea de código (frontend o backend).
> Para el router de capa y la sección "código entendible para humanos", ver `.dev/AGENTS.md`.

---

## 1. Stack canónico

| Capa | Tecnología |
|---|---|
| Backend | Node.js 20 + Fastify 4 + TypeScript 5 |
| ORM | Drizzle ORM + drizzle-kit |
| Base de datos | PostgreSQL 16 |
| Frontend | Next.js 14 (App Router) + TypeScript 5 |
| Estado cliente | Zustand 4 |
| Datos remotos | TanStack React Query 5 |
| Estilos | CSS Modules + tokens.css |
| Tests unit | Vitest 1 |
| Tests E2E | Playwright |
| Queue | Graphile Worker (default) / BullMQ (Redis) |
| Cache | In-memory (default) / ioredis |
| HTTP cliente | Axios 1 |
| Logger | Pino 8 |
| Validación schemas | Zod 3 |

---

## 2. Naming conventions

### TypeScript

```
variables:    camelCase    → userName, isLoading
funciones:    camelCase    → getUserById, createOrder
clases:       PascalCase   → UserRepository, CreateUserUseCase
interfaces:   PascalCase   → UserRepository, FastifyRequest
tipos:        PascalCase   → User, CreateUserData
enums/unions: PascalCase   → AppointmentStatus
constantes:   UPPER_SNAKE_CASE → API_BASE_URL, MAX_RETRIES
archivos:     kebab-case   → user.repository.ts, create-user.use-case.ts, app-aware-link.tsx
directorios:  kebab-case   → user-profile, appointment-history, treatment-card
```

**Norma obligatoria:** nombres de archivos y carpetas siempre en inglés. Aplica también a segmentos de ruta en `src/app/`.

### CSS

```
Variables (tokens):  --color-primary, --space-4, --text-base
Clases (CSS plano):  kebab-case → .user-card, .nav-item
Clases (CSS Module): camelCase para acceso desde JS → styles.pageShell, styles.heroSection
```

### Tests

```
unit:  tests/unit/modules/<modulo>/<archivo>.spec.ts
e2e:   tests/e2e/modules/<modulo>/<flujo>.spec.ts
```

---

## 3. TypeScript estricto

```typescript
// ❌ Nunca any
function processData(data: any) { }

// ✅ Tipos específicos o unknown con type guards
function processData(data: Appointment[]) { }
function processData(data: unknown): data is Appointment {
  return typeof data === 'object' && data !== null && 'id' in data
}

// ✅ Null checks explícitos
function findUser(id: string): User | null { ... }

// ✅ Tipos derivados de la fuente de verdad (API contract, DB schema)
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
```

**Reglas:**
- Nunca `any`. Usar `unknown` con type guards o tipos específicos
- Null checks explícitos (`User | null` no `User | undefined` indistintamente)
- Tipos derivados de zod schemas o Drizzle schemas, no duplicados a mano

---

## 4. Arquitectura backend (Clean Architecture)

```
modules/<nombre>/
├── domain/
│   └── repository.ts        ← interfaz del repositorio (sin implementación)
├── use-cases/
│   ├── create-X.use-case.ts ← un archivo por caso de uso
│   ├── get-X.use-case.ts
│   └── update-X.use-case.ts
├── infra/
│   ├── repository.ts        ← implementación con Drizzle
│   └── queries.ts           ← queries SQL reutilizables
├── http/
│   ├── routes.ts            ← registro de rutas Fastify
│   ├── controller.ts        ← thin controller (llama use-cases)
│   └── contract.ts          ← schemas Zod de request/response
├── composition.ts           ← wiring local del módulo
├── index.ts                 ← exporta el plugin Fastify
└── README.md                ← contexto del módulo
```

### Patrón de módulo

```typescript
// domain/repository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>
  create(data: CreateUserData): Promise<User>
}

// use-cases/create-user.use-case.ts
export class CreateUserUseCase {
  constructor(private repo: UserRepository) {}
  async execute(data: CreateUserData): Promise<User> {
    return this.repo.create(data)
  }
}

// http/controller.ts (thin — sin lógica de negocio)
export async function createUser(req: FastifyRequest, reply: FastifyReply) {
  const usersModule = createUsersModule()
  const user = await usersModule.createUser.execute(req.body)
  return reply.code(201).send({ data: user })
}
```

**Reglas:**
- Un caso de uso por archivo
- Controllers delgados — sin lógica de negocio
- Repositorios con interfaz en `domain/`, implementación en `infra/`
- Validación de input con zod en `http/contract.ts`
- Sin contenedor DI global: usar composición local por módulo
- Otro módulo no puede importar `infra/` ajena; sólo use-cases públicos
- `shared/` contiene solo utilidades técnicas, nunca lógica de negocio
- `plugins/` contiene solo infraestructura HTTP/global

---

## 5. Arquitectura frontend (Module-based / Screaming)

Cada dominio de negocio vive en su propio módulo bajo `modules/`. No todos los módulos necesitan todas las carpetas — crear solo las que el módulo usa.

```
modules/<nombre>/
├── index.ts                 ← exporta el módulo
├── README.md                ← contexto del módulo
├── components/              ← componentes específicos del módulo
├── hooks/                   ← hooks específicos del módulo
├── api/
│   ├── queries.ts           ← React Query queries
│   ├── mutations.ts         ← React Query mutations
│   └── types.ts             ← tipos de la API
├── store/                   ← Zustand store del módulo
├── content/                 ← contenido tipado (textos, config estática)
├── styles/                  ← CSS Modules del módulo
└── types/                   ← tipos internos

shared/                      ← código genuinamente transversal entre módulos
├── api/                     ← Axios client + interceptores
├── components/              ← UI reutilizable entre múltiples módulos
├── config/                  ← site.ts y constantes de la app
├── hooks/                   ← hooks compartidos entre módulos
├── store/                   ← estado global Zustand (theme, ui)
├── styles/                  ← CSS Modules de utilidad transversal
├── types/                   ← tipos globales del sistema
└── utils/                   ← helpers puros sin efectos secundarios

styles/                      ← base del documento (tokens.css, globals.css)
```

Regla de pertenencia: si una pieza de código la usan dos o más módulos, va a `shared/`. Si la usa solo uno, va dentro del módulo. `shared/hooks/` y `shared/utils/` se crean cuando aparece el primer caso real, no antes.

### Comunicación cross-module via Zustand

```typescript
// modules/auth/store/index.ts
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

// modules/dashboard/hooks/useCurrentUser.ts
import { useAuthStore } from '@/modules/auth/store'
export function useCurrentUser() {
  return useAuthStore((state) => state.user)
}
```

---

## 6. CSS Modules y design tokens

`tokens.css` es la única fuente de verdad visual. Nunca hardcodear colores, espaciados, radios ni tipografías.

```css
/* ❌ Incorrecto */
.button {
  padding: 16px 24px;
  background: #91f2d4;
  border-radius: 8px;
  font-size: 16px;
}

/* ✅ Correcto */
.button {
  padding: var(--space-4) var(--space-6);
  background: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}
```

### Mobile-first obligatorio

```css
/* Base: mobile (desde 320px) */
.container {
  padding: var(--space-4);
}

/* Tablet y arriba */
@media (min-width: 768px) {
  .container {
    padding: var(--space-8);
  }
}

/* Desktop y arriba */
@media (min-width: 1024px) {
  .container {
    padding: var(--space-12);
  }
}
```

### Reglas responsive

- Responsive oficial del proyecto:
  - `< 375px` → móviles compactos
  - `375px - 411px` → móviles estándar
  - `412px - 767px` → móviles grandes
  - `768px - 1023px` → tablet
  - `1024px+` → desktop
- Validar visualmente en: `<375px`, `375px`, `412px`, `768px`, `1024px`, `1440px`
- Nunca usar `vw` para tamaños de texto críticos (títulos, CTAs, navegación)
- Tipografía responsive con tokens fijos por breakpoint en `tokens.css`
- Ningún layout puede generar overflow horizontal — `overflow-x: hidden` no reemplaza corregir la causa
- Full-screen mobile: usar `100svh` o `100dvh`, no solo `100vh`
- Elementos interactivos: mínimo 44×44px de área táctil (token `--size-touch-target`)
- Animaciones decorativas: alternativa con `prefers-reduced-motion`
- En mobile el diseño puede cambiar la composición respecto a desktop si mejora claridad, uso táctil o conversión
- Regla de criterio: diseñar para mobile primero, no “comprimir desktop” en pantallas pequeñas

### Reglas de diseño

- Pantallas temporales (`coming-soon`, `maintenance`, `404`, `503`) siguen la arquitectura modular
- Editar `tokens.css` cuando cambien valores de marca — nunca en componentes individuales
- Componentes específicos en `modules/`, globales en `shared/components/`

---

## 7. Next.js App Router

- Páginas y layouts: Server Components por defecto
- `'use client'` solo cuando hay APIs del browser, estado interactivo o hooks de React
- Layouts y pages deben ser delgados — componen y delegan, no concentran lógica
- Mantener rutas semánticas y consistentes con la arquitectura de módulos
- Todo contenido público reutilizable en `src/shared/config`
- Assets en `public/`, organizados por categoría (`public/brand/`, `public/icons/`, `public/og/`)
- No ejecutar `next build`, `clean:next` ni borrar `.next/` mientras `next dev` está activo

```tsx
// ✅ Server Component (por defecto)
import { AppointmentList } from '@/modules/appointments'

export default function AppointmentsPage() {
  return <AppointmentList />
}

// ✅ Client Component (solo cuando es necesario)
'use client'
import { useState } from 'react'

export function AppointmentForm() {
  const [step, setStep] = useState(1)
}
```

---

## 8. Estado con Zustand

```typescript
interface AppointmentState {
  selectedDate: string | null
  setSelectedDate: (date: string | null) => void
  clearSelection: () => void
}

export const useAppointmentStore = create<AppointmentState>()((set) => ({
  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  clearSelection: () => set({ selectedDate: null }),
}))
```

**Reglas:**
- Tipo explícito en el store con interfaz separada
- Acciones claras y atómicas
- `persist` solo cuando es necesario (preferencias de UI, no datos del servidor)
- Si el estado es del servidor → usar React Query, no Zustand

---

## 9. Data fetching con React Query

```typescript
// Query keys centralizados en api/queries.ts del módulo
export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (filters?: AppointmentFilters) => [...appointmentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...appointmentKeys.all, 'detail', id] as const,
}

export function useAppointments(filters?: AppointmentFilters) {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Appointment[] }>('/appointments', { params: filters })
      return data.data
    },
  })
}
```

**Reglas:**
- Query keys jerárquicos para invalidación granular
- Hooks tipados completamente (no `any`)
- Mutations invalidan los keys afectados con `queryClient.invalidateQueries`
- Nunca llamar `apiClient` directamente desde componentes — siempre vía hook

---

## 10. Manejo de errores

### Backend

```typescript
import { NotFoundError, ValidationError } from '@/shared/errors'

async execute(input: CreateUserData) {
  const existing = await this.repo.findByEmail(input.email)
  if (existing) {
    throw new ValidationError('El email ya está registrado')
  }
  return await this.repo.create(input)
}

// El plugin error-handler global traduce errores tipados a HTTP
// { error: { message: '...', code: 'VALIDATION_ERROR', statusCode: 400 } }
```

### Frontend

```typescript
try {
  await createAppointment(payload)
  // mostrar éxito al usuario
} catch (error) {
  console.error('Error al crear turno:', error)
  // mostrar mensaje claro al usuario, sin stack trace
}
```

**Nunca:**
- Silenciar errores sin loguear (`catch (e) {}`)
- Mostrar mensajes técnicos al usuario final
- Asumir que una operación async no puede fallar

---

## 11. Documentación de código

### Filosofía

1. El código es la documentación primaria — escribir código autoexplicativo
2. Documentar el *por qué*, no el *qué* — el código ya dice qué hace
3. Conciso pero útil — suficiente para entender rápido
4. Doc desactualizada es peor que ninguna — mantenerla viva

### A) Header de archivo (siempre)

```typescript
/**
 * [Tipo]: [Nombre]
 *
 * [Descripción del propósito — 1 a 2 líneas]
 * [Contexto adicional si aplica: relaciones, dependencias]
 */
```

Ejemplos:

```typescript
/**
 * Repositorio Drizzle: Users
 *
 * Implementación de UserRepository con Drizzle ORM.
 * Conecta con la tabla `users` de PostgreSQL.
 */

/**
 * Module status: pantalla coming-soon
 *
 * Pantalla de lanzamiento. Muestra identidad de marca, dominio y canales de contacto
 * mientras el sistema completo no está disponible.
 */

/**
 * Tokens de diseño
 *
 * Variables CSS globales del sistema de diseño de My Project.
 * Fuente de verdad para colores, espaciados, tipografías, radios, sombras y efectos.
 */
```

### B) JSDoc en funciones públicas

**Documentar:**
- Funciones/hooks exportados
- Lógica de negocio compleja
- Funciones con side-effects importantes
- Helpers reutilizables

**No documentar:**
- Getters/setters obvios
- Funciones privadas autoexplicativas
- Lo que el nombre ya comunica

```typescript
/**
 * Resuelve el href de la app nativa según el User Agent del dispositivo.
 * Retorna null en desktop o si el link no tiene deepLink configurado.
 *
 * @param link - Configuración del link con soporte opcional de deep link
 * @returns URL del scheme nativo o null si no aplica
 */
function resolveAppHref(link: SiteLink): string | null { ... }

/**
 * Crea un usuario nuevo y envía email de bienvenida.
 * @throws {EmailAlreadyExistsError} si el email ya está registrado
 */
async execute(data: CreateUserData): Promise<User>
```

### C) Interfaces, tipos y constantes

```typescript
/**
 * Configuración de un link con soporte opcional de deep linking a apps nativas.
 */
export interface SiteLink {
  readonly href: string             // URL web (fallback universal)
  readonly label: string            // Texto legible para el usuario
  readonly appDeepLink?: AppDeepLink
}
```

### D) Comentarios en lógica de negocio

Documentar decisiones no obvias, validaciones con reglas de negocio, workarounds:

```typescript
// Esperar que el browser registre si la página quedó oculta
// (indica que la app nativa se abrió exitosamente)
document.addEventListener('visibilitychange', markPageAsHidden)

// TODO: implementar formulario de login (US-010)
// FIXME: el interceptor redirige al login incluso en rutas públicas
// HACK: workaround temporal hasta que el backend soporte refresh tokens
```

### E) CSS — secciones

En archivos CSS grandes (globals, tokens, modules), comentarios de sección:

```css
/* ─── Colores de marca ───────────────────────────────────────────── */
/* ─── Espaciado (base 4px) ──────────────────────────────────────── */
/* ─── Tipografía ────────────────────────────────────────────────── */
/* ─── Animaciones ───────────────────────────────────────────────── */
/* ─── Responsive: mobile (max 640px) ────────────────────────────── */
/* ─── Accesibilidad: prefers-reduced-motion ─────────────────────── */
```

---

## 12. Variables de entorno

Ver `.env.example` en cada app para la lista completa.

```
.env.example        → versionado (valores vacíos)
.env.development    → local (no versionado)
.env.test           → tests (no versionado)
.env.production     → producción (no versionado)
```

Usar `npm run env:sync` para:

- crear `.env.development` y `.env.test` si faltan en cada app
- agregar claves nuevas sin pisar valores existentes
- crear `.infra/env/stack.dev.env`, `.infra/env/stack.test.env` y `.infra/env/test-expose.env` si faltan
- regenerar `.infra/env/catalog.json`

Rutas creadas por `env:sync`:

- `.dev/src/backend-api/.env.development`
- `.dev/src/backend-api/.env.test`
- `.dev/src/frontend-public/.env.development`
- `.dev/src/frontend-public/.env.test`
- `.dev/src/frontend-admin/.env.development`
- `.dev/src/frontend-admin/.env.test`

Usar `npm run env:check` para detectar:

- claves faltantes en `.env.development` o `.env.test`
- variables usadas en código pero ausentes del `.env.example`

**Nunca:**
- Commitear archivos `.env` con valores reales
- Hardcodear URLs, claves o secrets en código
- Documentar valores de secrets en `.infra/secrets.md` — solo claves y propósito

---

## 13. Migraciones de base de datos

```bash
npm run db:generate    # generar migración desde cambios en schema
npm run db:migrate     # aplicar migraciones
npm run db:push        # push directo (solo development)
npm run db:studio      # UI para explorar la DB
```

**Regla:** nunca modificar la base de datos directamente. Siempre vía `drizzle-kit`.

---

## 14. Testing

### Unit tests (Vitest)

```typescript
// tests/unit/modules/users/create-user.spec.ts
// US-001 — Crear usuario

describe('CreateUserUseCase', () => {
  it('dado un email válido, cuando se crea el usuario, entonces persiste en la DB', async () => {
    // arrange / act / assert
  })

  it('dado un email duplicado, cuando se crea, entonces lanza EmailAlreadyExistsError', async () => {
    // ...
  })
})
```

### E2E tests (Playwright)

```typescript
// tests/e2e/modules/auth/login.spec.ts
// US-002 — Login de usuario

test('dado credenciales válidas, cuando el usuario hace login, entonces es redirigido al dashboard', async ({ page }) => {
  // ...
})
```

**Reglas:**
- Formato `Given / When / Then` en el nombre del test (en español)
- Referenciar `US-XXX` en el header del spec cuando aplique
- Unit en `tests/unit/`, E2E en `tests/e2e/`, no funcionales en `tests/non-functional/`
- Tests independientes — cada uno crea y limpia su estado

---

## 15. Política de SEO

Aplica a toda página pública. Obligatorio desde el primer deploy de la landing.

### Metadatos mínimos por página

```typescript
export const metadata: Metadata = {
  title: 'My Project — Example Business',
  description: 'Descripción única (150–160 caracteres).',
  openGraph: {
    title: 'My Project — Example Business',
    description: 'Descripción para redes sociales.',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com',
    siteName: 'My Project',
    images: [{ url: '/og/home.png', width: 1200, height: 630 }],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Project — Example Business',
    description: 'Descripción para Twitter/X.',
    images: ['/og/home.png'],
  },
}

// Metadata dinámica
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService(params.slug)
  return { title: `${service.name} — My Project`, description: service.description }
}
```

### Reglas obligatorias

- Cada página pública con `title` y `description` únicos
- No hardcodear dominios públicos: derivarlos de `NEXT_PUBLIC_APP_URL` o variable equivalente del entorno
- `title` máx 60 caracteres; `description` 150–160 caracteres
- Imágenes OG en `public/og/` con dimensiones 1200×630px
- Una sola etiqueta `<h1>` por página
- HTML semántico: `<main>`, `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`
- Imágenes con `alt` descriptivo (vacío `alt=""` solo en decorativas con `aria-hidden="true"`)
- URLs públicas en inglés, con guiones, sin mayúsculas ni caracteres especiales
- Cuando el negocio opere local o regionalmente, orientar el SEO a la geografía real del servicio
- Para My Project, priorizar combinaciones de marca + intención + ubicación:
  - `My Project`
  - `main service`
  - `service category`
  - `city`
  - `region`
- Evitar keyword stuffing: distribuir términos entre `title`, `description`, headings, copy, alt, JSON-LD y rutas cuando aplique

### Archivos raíz requeridos

```
public/
  robots.txt
  sitemap.xml
  og/
    home.png
```

`robots.txt` mínimo:
```
User-agent: *
Allow: /
Disallow: /app/
Disallow: /login

Sitemap: <NEXT_PUBLIC_APP_URL>/sitemap.xml
```

### Core Web Vitals

- Imágenes críticas (hero, logo): `priority` en `<Image>`
- Imágenes fuera del viewport inicial: `loading="lazy"` (default en Next.js `<Image>`)
- Declarar `width` y `height` en `<Image>` para evitar CLS
- Fuentes web: usar `next/font` con `display: swap`

---

## 16. Política de Error Boundaries

Toda ruta pública debe tener manejo de errores explícito en App Router.

### Archivos requeridos

```
src/app/
  error.tsx            ← global (rutas no cubiertas)
  not-found.tsx        ← 404 global
  (site)/error.tsx
  (private)/error.tsx
  (private)/not-found.tsx
```

### Implementación mínima

```tsx
// src/app/error.tsx
'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // TODO: enviar a servicio de monitoreo (Sentry)
    console.error('Error no controlado:', error)
  }, [error])

  return (
    <main>
      <h1>Algo salió mal</h1>
      <p>Ocurrió un error inesperado. Por favor intentá de nuevo.</p>
      <button onClick={reset}>Reintentar</button>
    </main>
  )
}
```

### Reglas

- `error.tsx` siempre Client Component (`'use client'`)
- `not-found.tsx` puede ser Server Component
- Nunca mostrar mensajes técnicos o stack traces al usuario
- Loguear el error con `console.error` mínimo; Sentry en producción
- Ofrecer una acción: reintentar o volver al inicio
- Estilo visual coherente con tokens del sitio

---

## 17. Política de dependencias nuevas

### Checklist antes de instalar

```
1. ¿Hay alternativa nativa del browser o React/Next.js?
   → Si sí: preferir la nativa, salvo que una librería mejore de forma clara accesibilidad, mantenibilidad o velocidad de implementación.

2. ¿Cuánto pesa? (bundlephobia.com)
   → Si > 50 KB gzip: justificar explícitamente por qué vale el costo.

3. ¿Está mantenida activamente? (último commit, issues, descargas)
   → Si > 1 año sin actividad: buscar alternativa.

4. ¿Tiene tipos TypeScript?
   → Si no: evaluar costo de tiparlo manualmente.

5. ¿La complejidad justifica una dependencia?
   → Si < 20 líneas de código propio: implementar directamente, salvo que la librería resuelva accesibilidad, compatibilidad cross-browser o edge cases que no convenga reescribir.
```

### Proceso

1. Evaluar checklist
2. Documentar la decisión en el commit o en la documentación del módulo cuando el impacto lo amerite
3. Agregar a `package.json` en el campo correcto (`dependencies` vs `devDependencies`)
4. Actualizar `package-lock.json` con `npm install`
5. Nunca usar `--force` o `--legacy-peer-deps` sin entender por qué falla

### Regla de decisión

- Sí se pueden agregar librerías nuevas
- No agregar librerías por moda o conveniencia superficial
- Sí agregarlas cuando reduzcan complejidad accidental o eleven calidad real en:
  - accesibilidad
  - SEO
  - formularios complejos
  - visualización especializada
  - parsing / serialización no trivial
  - interoperabilidad con APIs o formatos externos
- Si una librería entra, debe dejar el código más entendible y mantenible, no más opaco

### Cuándo actualizar

- Seguridad (`npm audit`): aplicar inmediatamente
- Patch (`x.y.Z`): aplicar
- Minor (`x.Y.z`): revisar changelog
- Major (`X.y.z`): evaluar breaking changes, planificar migración

---

## 18. Política de accesibilidad (WCAG 2.1 AA)

### Semántica HTML

```tsx
// ✅ Una sola <h1> por página, jerarquía lógica
// ✅ main, nav, article, section, header, footer
// ✅ Botones para acciones, anchors para navegación
// ❌ <div onClick> en lugar de <button>
```

### Imágenes

```tsx
// ✅ Alt descriptivo en imágenes de contenido
<Image src="/services/facial.jpg" alt="Tratamiento facial con hidratación profunda" />

// ✅ Alt vacío en decorativas
<Image src="/decoration/wave.svg" alt="" aria-hidden="true" />

// ❌ Alt con nombre del archivo
<Image src="/img1.jpg" alt="img1" />
```

### Teclado y foco

```css
/* ✅ Focus visible siempre */
.link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}

/* ❌ Eliminar outline sin alternativa */
* { outline: none; }
```

### Contraste

- Texto normal: ratio mínimo 4.5:1
- Texto grande (≥ 18px regular o ≥ 14px bold): ratio mínimo 3:1

### ARIA

```tsx
<nav aria-label="Redes sociales de My Project">

<section aria-labelledby="services-title">
  <h2 id="services-title">Nuestros servicios</h2>

<div aria-hidden="true" className={styles.backgroundLayer}>
```

### Verificación pre-deploy

- [ ] Navegar toda la página solo con teclado (Tab, Enter, Escape)
- [ ] Contraste verificado en todos los textos
- [ ] Todas las imágenes con alt correcto
- [ ] Sin `outline: none` sin reemplazo
- [ ] Probado con lector de pantalla (VoiceOver, NVDA)
- [ ] Tests de accesibilidad en `tests/non-functional/accessibility/`

---

## 19. No sobreingeniería

**No hacer:**
- Funcionalidades no solicitadas
- Abstracciones para un único caso de uso
- Refactorizar código no relacionado
- Diseñar para requerimientos hipotéticos
- Manejo de errores para escenarios imposibles

**Hacer:**
- Resolver el problema específico
- Soluciones mínimas y enfocadas
- Cambios directos, sin shims de compatibilidad innecesarios
- Validar solo en bordes del sistema (input de usuario, APIs externas)

---

## 20. Convenciones de commits

```
feat(<scope>):     nueva funcionalidad
fix(<scope>):      bug fix
refactor(<scope>): refactor sin cambio funcional
docs(<scope>):     cambios de documentación
test(<scope>):     agregar/modificar tests
style(<scope>):    formato (espacios, comas)
chore(<scope>):    mantenimiento (deps, configs)
perf(<scope>):     mejora de performance
```

Scope: `dev/<modulo>`, `dev/shared`, `business/...`, `infra/...`.

Ejemplos reales:
```
feat(dev/status): add social link deep linking support
fix(dev/middleware): redirect authenticated users away from login
refactor(dev/shared): extract site config to centralized module
docs(dev/frontend-public): add JSDoc to all shared components
test(dev/app-aware-link): add unit tests for deep link resolution
```

Commits pequeños y frecuentes — no esperar a tener todo terminado.

---

## 21. Checklist post-desarrollo

Antes de considerar una tarea "terminada":

- [ ] El código compila sin errores (`npm run build`)
- [ ] TypeScript sin errores (`tsc --noEmit`)
- [ ] Funcionalidad probada manualmente
- [ ] Sin valores hardcodeados (colores, URLs, textos de negocio en JSX)
- [ ] Header de archivo y JSDoc actualizados
- [ ] README del módulo actualizado si hubo cambio funcional
- [ ] Sin `any` en TypeScript
- [ ] Accesibilidad básica verificada (teclado, contraste, ARIA)
- [ ] Responsive verificado en mobile (360px) y desktop (1440px)
- [ ] Sin logs de debug en producción
- [ ] Tests agregados o actualizados si aplica
- [ ] Commit semántico

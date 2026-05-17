# Development Guidelines — {{PROJECT_STACK}}

Documento técnico de referencia para todo el código de `.dev/`. Estándares, patrones y convenciones obligatorios.

> Aplicar en cualquier tarea de código (frontend o backend).
> Para el router de capa y la sección "código entendible para humanos", ver `.dev/AGENTS.md`.
> Los ejemplos de código usan TypeScript como lenguaje de referencia. Adaptar convenciones de tipado, naming y tooling al stack real del proyecto.

---

## 1. Stack canónico

> Completar esta tabla al inicializar el proyecto. El preset elegido en `wodlie-engine init` define el stack base; ajustar versiones y capas según el contrato y las decisiones técnicas del proyecto.

| Capa | Tecnología |
|---|---|
| Backend | {{BACKEND_STACK}} |
| ORM / acceso a datos | {{ORM_STACK}} |
| Base de datos | {{DB_STACK}} |
| Frontend | {{FRONTEND_STACK}} |
| Estado cliente | {{STATE_MANAGEMENT}} |
| Datos remotos | {{DATA_FETCHING}} |
| Estilos | {{STYLES_APPROACH}} |
| Tests unit | {{UNIT_TEST_FRAMEWORK}} |
| Tests E2E | {{E2E_TEST_FRAMEWORK}} |
| Queue | {{QUEUE_STACK}} |
| Cache | {{CACHE_STACK}} |
| HTTP cliente | {{HTTP_CLIENT}} |
| Logger | {{LOGGER}} |
| Validación schemas | {{VALIDATION_LIBRARY}} |

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

// index.ts — módulo registrado como plugin de Fastify
// La composición ocurre UNA SOLA VEZ al registrar el plugin, no por request
export default fp(async (app: FastifyInstance) => {
  const mod = createUsersModule()           // ← instanciado aquí, una vez
  await registerRoutes(app, mod)            // ← mod pasado por closure
})

// http/controller.ts (thin — sin lógica de negocio)
// El módulo llega por parámetro desde el plugin, no se instancia aquí
export function createUserController(mod: UsersModuleApi) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await mod.createUser.execute(req.body)
    return reply.code(201).send({ data: user })
  }
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

### Comunicación cross-module via estado compartido

Un módulo **nunca** importa el store de otro módulo. El estado transversal vive en `shared/store/` y cualquier módulo lo lee desde ahí.

```typescript
// ❌ Incorrecto — import cross-module
import { useAuthStore } from '@/modules/auth/store'

// ✅ Correcto — import desde shared/
import { useAuthStore } from '@/shared/store/auth'

export function useCurrentUser() {
  return useAuthStore((state) => state.user)
}
```

**Criterio para shared/store vs módulo:**
- `shared/store/` → estado que más de un módulo necesita leer o escribir (auth, theme, ui global)
- `modules/<X>/store/` → estado privado del módulo (formularios, filtros de tabla, selección UI interna)
- Si solo un módulo lo usa → dentro del módulo. Si dos o más → shared/store/

---

## 6. CSS Modules y design tokens

### Enfoque por tipo de frontend

Cuando el proyecto tiene múltiples frontends, el enfoque de estilos puede diferir entre ellos. Documentar la decisión aquí al inicializar. Ejemplo común:

- **Frontend público:** CSS Modules + tokens.css. Sin librerías de componentes.
- **Frontend admin:** Puede usar una librería de componentes (ej. shadcn/ui + Tailwind) cuando los requisitos de UI complejos (Command Palette, DataTable, Charts, Date Picker) justifican el costo. Los tokens del proyecto se mapean como variables de la librería para mantener coherencia visual. Documentar la excepción y sus límites.

Si se usa una librería de componentes en el admin, los componentes se deben copiar al proyecto (no son dependencia runtime) y deben seguir usando los tokens del proyecto.

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

### Orden de propiedades dentro de una regla CSS

Seguir siempre este orden:

```css
.elemento {
  /* 1. Posicionamiento */
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;

  /* 2. Box model / display */
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  margin: 0;
  padding: var(--space-4) var(--space-6);
  overflow: hidden;

  /* 3. Visual */
  background: var(--color-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);

  /* 4. Tipografía */
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);

  /* 5. Misc */
  cursor: pointer;
  transition: background var(--transition-fast);
}
```

### Patrón DRY: clase base + variante

Para componentes con múltiples variantes (botones, cards, badges), usar clase base + variantes en el módulo. No duplicar propiedades compartidas.

**Dónde vive cada cosa:**

| Qué | Dónde |
|---|---|
| Valores visuales (colores, radios, sombras) | `src/styles/tokens.css` |
| Reset + document base | `src/styles/globals.css` |
| Primitivas UI reutilizables (`.btn`, `.surface`) | `src/styles/utilities.css` |
| Componentes específicos de un módulo | `modules/<nombre>/styles/` |
| Sobreescrituras contextuales | Dentro del selector del módulo |

### Dark mode (cuando aplique)

Si el proyecto requiere dark mode, usar `data-theme` attribute en `<html>`. Los tokens se redefinen en el scope del atributo — mismo nombre de variable, valor distinto. Ningún componente necesita saber en qué tema está.

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f5f5f5;
}

[data-theme="dark"] {
  --color-bg: #0f0f0f;
  --color-surface: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #0f0f0f;
    --color-surface: #1a1a1a;
  }
}
```

**Convención:** nunca crear `--color-bg-dark`. El mismo token se redefine en el scope.

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

**Regla:** nunca modificar la base de datos directamente. Siempre vía el CLI del ORM o la herramienta de migraciones del proyecto.

**Regla command-first:** primero usar scripts del proyecto o CLI oficial de la librería para scaffold, introspección, migraciones, sync o validación; después ajustar manualmente solo los archivos que la herramienta deja como base. Si la librería no genera la estructura necesaria, crear la mínima estructura manual respetando la arquitectura del proyecto.

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
- Para cada proyecto, definir combinaciones de marca + intención + ubicación según el nicho y la geografía del cliente. Documentar las keywords prioritarias aquí al inicializar.
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

## 19. Sin duplicación de animaciones y efectos visuales

Cuando se cambia el enfoque de una animación o efecto (CSS → JS, JS → CSS, librería → nativo), **eliminar la implementación anterior antes de agregar la nueva**. Dos implementaciones del mismo efecto compiten, se sobrecargan mutuamente y producen comportamiento impredecible.

**Regla:** una animación, un lugar, un enfoque. Si cambiás el enfoque:
1. Eliminar el bloque anterior (CSS, JS o librería)
2. Agregar el nuevo
3. Verificar en el browser que no quede ninguna versión residual activa

Aplica especialmente a: `transition`, `animation`, `@keyframes`, scroll listeners, `will-change`, librerías de animación, y cualquier efecto que opere sobre `transform`, `opacity` o `filter`.

---

## 19b. No sobreingeniería

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

> Prohibiciones base definidas en `AGENTS.md` raíz: sin co-autor IA, sin commit sin pedido explícito del operador, sin push sin instrucción. Estas reglas aplican en toda la capa dev sin excepción.

Tipos base (del root): `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
Tipos extendidos para dev: `style` (formato, espacios, orden de propiedades), `perf` (mejora de rendimiento medible con datos)

```
feat(<scope>):     nueva funcionalidad
fix(<scope>):      bug fix
refactor(<scope>): refactor sin cambio funcional
docs(<scope>):     cambios de documentación
test(<scope>):     agregar o modificar tests
style(<scope>):    formato (espacios, comas, orden)
chore(<scope>):    mantenimiento (deps, configs)
perf(<scope>):     mejora de rendimiento medible
```

Scope: refleja la capa y el módulo afectado.

```
dev/<modulo>       dev/backend-api, dev/frontend-public, dev/frontend-admin
dev/shared         cambios transversales a toda la capa dev
```

Ejemplos:
```
feat(dev/appointments): add slot availability endpoint
fix(dev/frontend-public): correct navbar scroll threshold
docs(dev/backend-api): document auth module use-cases
refactor(dev/shared): extract date formatting to utility
perf(dev/appointments): add index on scheduled_at column
style(dev/frontend-public): normalize CSS property order in hero
```

Commits pequeños y frecuentes — no esperar a tener todo terminado.

---

## 21. Estructuras de datos y rendimiento

> Elegir la estructura correcta no es maximizar notaciones Big-O — es entender cómo se va a acceder al dato y elegir la herramienta que mejor sirve ese patrón.

La notación Big-O describe crecimiento asintótico, no rendimiento absoluto. Para conjuntos pequeños, `Array.find()` puede ser más rápido que un `Map` en la práctica por cache locality. La pregunta correcta no es "¿cuál tiene mejor notación?" sino **"¿cuál es la operación que se realiza con más frecuencia sobre estos datos?"**

| Patrón de acceso dominante | Estructura adecuada | Por qué |
|---|---|---|
| Lookup por clave arbitraria | `Map` / `Record` / `dict` | Hash directo, sin recorrer el conjunto |
| Verificar si un elemento existe | `Set` | Hash, sin guardar valor asociado |
| Iterar todos en orden | `Array` / `List` | Contiguo en RAM, CPU prefetch óptimo |
| Acceder al siguiente o anterior | `Array` | Vecindad garantizada en memoria |
| Lookup sobre N grande con acceso aleatorio | `Map` | Escala sin degradación cuando el costo de heap disperso se amortiza |

```typescript
// Dropdown de 20 categorías — siempre se itera completo para renderizar
// Array: iteración contigua, find() sobre N=20 es negligible
const categories: Category[] = [...]
const found = categories.find(c => c.slug === slug)

// 80K usuarios buscados por ID en cada request autenticado
// Map: N justifica el overhead; el lookup aleatorio por clave es el patrón
const userIndex = new Map(users.map(u => [u.id, u]))
const user = userIndex.get(requestedId)
```

Si se construye un índice en memoria para un dataset estable, construirlo una sola vez al inicializar el módulo — no en cada llamada.

Cuando no hay solución óptima clara:
- **Hot path** (cada request de usuario): sacrificar memoria antes que CPU o disco
- **Cold path** (workers, jobs en background): disco y tiempo de CPU no son críticos
- **Caché**: acotar siempre con TTL y tamaño máximo — sin límite es un memory leak por diseño

---

## 22. Indexado de base de datos

Al diseñar un schema, pensar en qué queries va a recibir la tabla y qué columnas aparecerán en `WHERE`, `JOIN` u `ORDER BY`. Un índice ausente es un problema de rendimiento silencioso; un índice innecesario es espacio y escrituras extra sin beneficio.

| Tipo de acceso | Índice a considerar |
|---|---|
| Equality lookup frecuente (`WHERE col = ?`) | B-Tree (default) o HASH (solo equality) |
| Rango o sort (`BETWEEN`, `>`, `ORDER BY`) | B-Tree |
| Unicidad (`email`, `slug`, `token`) | UNIQUE — también actúa como constraint de integridad |
| FK referenciada en JOINs frecuentes | B-Tree explícito — la mayoría de ORMs no los crean automáticamente |

**Regla:** definir índices desde la migration-0 para columnas que soportarán los patrones de acceso del MVP. No dejar indexado para "después de que se noten problemas".

---

## 23. Caché in-memory

La caché tiene sentido cuando un dato se lee con frecuencia y cambia poco. No tiene sentido para datos transaccionales o que deben reflejar el estado más reciente en cada operación.

```typescript
// Patrón cache-aside: leer caché primero, poblar desde DB si falta
export class GetServiceCatalogUseCase {
  constructor(private repo: ServiceRepository, private cache: CacheAdapter) {}

  async execute(): Promise<ServiceCategory[]> {
    const cached = await this.cache.get<ServiceCategory[]>('service:catalog')
    if (cached) return cached
    const services = await this.repo.findAllActive()
    await this.cache.set('service:catalog', services, 300) // TTL 5 min
    return services
  }
}

// Invalidar cuando el dato cambia
async execute(input: UpdateServiceInput) {
  const updated = await this.repo.update(input)
  await this.cache.delete('service:catalog')
  return updated
}
```

Siempre usar adaptadores intercambiables: in-memory (default) y Redis (múltiples instancias o persistencia). El cambio de adapter se hace vía env — sin modificar código de negocio.

---

## 24. DTOs y Value Objects

Aplicar cuando agregan claridad o seguridad real, no por convención en todos lados.

Un **DTO** tiene sentido cuando la entidad de DB contiene campos que no deben exponerse, o cuando el contrato de la API tiene forma distinta al modelo interno.

```typescript
// ❌ Expone todo el row incluyendo campos sensibles
return reply.send(await this.repo.findById(id))

// ✅ Contrato explícito — solo lo que el cliente debe ver
export class UserResponseDTO {
  constructor(private user: UserEntity) {}
  toJSON() {
    return { id: this.user.id, fullName: `${this.user.firstName} ${this.user.lastName}`, email: this.user.email, role: this.user.role }
  }
}
```

Un **Value Object** tiene sentido cuando un tipo primitivo tiene invariantes propias que se repetirían en múltiples lugares.

```typescript
// ❌ Validación dispersa en cada use-case que recibe un teléfono
// ✅ Validación una sola vez, comportamiento centralizado
export class PhoneNumber {
  private readonly value: string
  constructor(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 8 || digits.length > 15) throw new ValidationError('Teléfono inválido')
    this.value = digits
  }
  toE164(country = '54') { return `+${country}${this.value}` }
}
```

| Patrón | Cuándo | Dónde |
|---|---|---|
| DTO de response | Entidad de DB ≠ contrato público de API | `http/controller.ts` |
| DTO de input | Input necesita normalización antes del use-case | `http/contract.ts` |
| Value Object | Concepto con invariantes propias (email, phone, money) | `domain/` |

---

## 25. Asincronía y operaciones no bloqueantes

En entornos de ejecución single-threaded (Node.js, browser), cualquier operación que bloquea el hilo principal pausa el procesamiento de todos los requests simultáneos.

```typescript
// ❌ Bloquea el hilo
const config = fs.readFileSync('config.json')

// ✅ Cede el hilo
const config = await fs.promises.readFile('config.json', 'utf-8')

// Operaciones independientes en paralelo
// ❌ Serial: total = suma de todas las latencias
for (const id of ids) { await notify(id) }

// ✅ Paralelo: total ≈ latencia máxima
await Promise.all(ids.map(id => notify(id)))

// Con límite si el destino tiene rate limiting
const limit = pLimit(10)
await Promise.all(ids.map(id => limit(() => notify(id))))
```

Para CPU-intensivo (resize de imágenes, generación de PDFs, cálculos sobre datasets grandes), usar workers. Para procesos diferibles, usar la queue — responder inmediatamente con 202 y procesar en background.

---

## 26. Race conditions e idempotencia

### Race conditions

Ocurren cuando dos operaciones concurrentes leen el mismo estado, toman una decisión basada en él, y ambas escriben sin conocer la acción de la otra.

```typescript
// ❌ Race condition: dos requests pueden pasar el if simultáneamente
const existing = await repo.findBySlot(date, professionalId)
if (existing) throw new ConflictError('Horario ocupado')
await repo.create({ date, professionalId, patientId })

// ✅ Unique constraint en DB como red de seguridad final
// uniqueIndex('idx_appointments_slot').on(table.professionalId, table.scheduledAt)
// El repo captura la violación y la traduce a ConflictError

// ✅ Transacción con lock pesimista para secciones críticas
await db.transaction(async (tx) => {
  const slot = await tx.select().from(slots).where(eq(slots.id, slotId)).for('update')
  if (slot[0].isBooked) throw new ConflictError('Horario ocupado')
  await tx.update(slots).set({ isBooked: true }).where(eq(slots.id, slotId))
})
```

### Idempotencia

Una operación es idempotente cuando ejecutarla N veces produce el mismo resultado que ejecutarla una sola vez. Fundamental para: pagos, notificaciones, jobs de queue, webhooks de servicios externos.

```typescript
// ❌ Sin idempotencia — un retry de red puede cobrar dos veces
await paymentGateway.charge({ amount, userId })

// ✅ Idempotency key — el gateway deduplica requests con el mismo identificador
await paymentGateway.charge({ amount, userId, idempotencyKey: `payment:${orderId}` })
```

Pensar en idempotencia al diseñar endpoints de creación, jobs de queue, webhooks y formularios que pueden hacer submit múltiple.

---

## 27. Formato de respuesta API

Todas las respuestas siguen la misma estructura. Consistencia facilita el consumo desde cualquier cliente y el manejo de errores en el frontend.

```typescript
// Recurso único — 200 OK
{ data: T }

// Lista — 200 OK
{ data: T[] }

// Lista con metadatos de paginación — 200 OK
{ data: T[], meta: { total: number } }

// Creación — 201 Created
{ data: T }

// Sin contenido — 204 No Content (sin body)

// Error — 4xx / 5xx
{ error: { message: string, code: string, statusCode: number } }
```

No construir `{ error: ... }` manualmente en controllers — lanzar desde use-case y dejar que el error handler global normalice la estructura.

---

## 28. Fechas y zonas horarias

**Estándar del proyecto:** UTC en almacenamiento y transporte, zona local solo en presentación al usuario.

```typescript
// En DB: usar tipos con timezone (timestamptz en PostgreSQL)
// El ORM almacena UTC, convierte automáticamente

// En API: ISO 8601 — parseable en cualquier lenguaje, timezone explícita
return reply.send({ data: { scheduledAt: appointment.scheduledAt.toISOString() } })
// resultado: "2024-01-15T13:30:00.000Z"

// ❌ Evitar en API
appointment.scheduledAt.toLocaleDateString()  // timezone implícita del servidor

// En frontend: Intl.DateTimeFormat con locale y timezone explícitos
new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(new Date(scheduledAt))
```

Nunca construir strings de fecha manualmente (`${day}/${month}/${year}`). Para operaciones con fechas (diferencias, suma de días, comparaciones), evaluar una librería de fechas antes de implementar con `Date` nativo — las edge cases de meses y años bisiestos son silenciosas.

---

## 29. Logging

El mismo código corre en todos los entornos. La variable `LOG_LEVEL` controla qué se emite — no hace falta eliminar logs de debug para producción, solo configurar el nivel correcto.

| Nivel | Cuándo usar |
|---|---|
| `debug` | Valores intermedios, trazas de flujo — solo útil en desarrollo |
| `info` | Eventos operacionales: recurso creado, pago procesado, job completado |
| `warn` | Situación inesperada pero manejada: retry automático, fallback activado |
| `error` | Error capturado que afecta la operación |
| `fatal` | Error irrecuperable — el proceso debería terminar |

```
LOG_LEVEL=debug  → desarrollo (todos los niveles, pretty-print para legibilidad)
LOG_LEVEL=warn   → test (silencia info/debug, solo problemas)
LOG_LEVEL=info   → producción (operacional, JSON estructurado)
```

```typescript
// ❌ String concatenado — no se puede filtrar ni indexar
logger.info(`Usuario ${userId} creó turno ${appointmentId}`)

// ✅ Objeto estructurado — filtrable, indexable, parseable por agregadores
logger.info({ userId, appointmentId }, 'Turno creado')
logger.error({ err, orderId }, 'Error al procesar pago')
```

Nunca loguear datos sensibles: passwords, tokens, números de tarjeta, datos personales en claro.

---

## 30. Decisiones que requieren análisis o confirmación del operador

Estas decisiones dependen del contexto de negocio. Al encontrar uno de estos casos: analizar el contexto del módulo, proponer una recomendación con su trade-off, y confirmar con el operador antes de implementar.

**Paginación — offset vs cursor**
Offset es simple y suficiente para volúmenes moderados y datos estables. Cursor es consistente ante inserciones concurrentes y escala mejor, pero es más complejo. Analizar volumen esperado y patrón de la interfaz (listado paginado vs scroll infinito) y recomendar.

**Soft deletes vs borrado físico**
`deletedAt` timestamp permite recuperación y auditoría pero complica todas las queries. Borrado físico es más simple pero irreversible. Depende de si el negocio requiere historial o recuperación — confirmar con el operador.

**Campos de auditoría** (`createdAt`, `updatedAt`, `createdBy`)
Útiles para trazabilidad. No todas las tablas los necesitan con la misma granularidad. Evaluar tabla por tabla según requerimientos de auditoría del módulo.

**Retry logic y circuit breaker para servicios externos**
Necesario cuando el servicio externo es crítico y puede fallar transitoriamente. Analizar criticidad y SLA del proveedor — implementar solo donde el costo de fallo justifique la complejidad.

**Versionado de API**
No versionar prematuramente — añade overhead. Versionar cuando hay clientes externos que no se pueden actualizar simultáneamente. Siempre confirmar con el operador; la decisión depende de si hay contratos públicos que el equipo no controla.

**Seeding de base de datos**
La estrategia de datos iniciales (fixtures, factories, scripts) depende de qué tan estables son los datos de referencia y cuántos entornos los necesitan. Definir en el primer módulo productivo — confirmar estrategia con el operador.

**Rate limiting por endpoint**
Los thresholds dependen del perfil de uso: un endpoint público de login tiene límites distintos a uno interno de consulta. Configurar con criterio por ruta — confirmar umbrales con el operador cuando el endpoint tenga requisitos específicos.

---

## 31. Checklist post-desarrollo

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

---

## 32. Cuándo preguntar antes de ejecutar

Cuando una tarea tiene más de un enfoque válido, el agente **no asume** — pregunta primero y espera respuesta antes de ejecutar.

### Situaciones que requieren confirmación obligatoria

**Importación de plantillas o código externo**

Presentar siempre las opciones:

> Hay dos formas de encarar esta importación:
> 1. **Importar tal cual** → preserva el comportamiento original (animaciones, interacciones, estados); la migración al stack se hace después en una tarea separada.
> 2. **Importar y adaptar en una sola operación** → más compacto, pero puede perder comportamientos que solo se entienden ejecutando la plantilla.
>
> ¿Cuál preferís?

**Refactor de alcance incierto**

- ¿El cambio aplica solo al componente actual o a todos los que usan el mismo patrón?
- ¿Se refactoriza el código viejo ahora o en una tarea separada?

**Cambio que afecta diseño y comportamiento al mismo tiempo**

- ¿Se cambia solo el diseño (tokens, variables) o también estructura HTML/componente?
- ¿Es una migración gradual módulo por módulo, o se aplica todo de una vez?

**Conflicto entre convención del proyecto y código existente**

- Si el código a importar/adaptar viola guidelines, preguntar si se corrige en el mismo paso o se deja como deuda técnica documentada.

### Cómo presentar las opciones

- Máximo 2–3 opciones concretas con su trade-off
- Una opción recomendada marcada como `(Recomendado)`
- Nunca ejecutar hasta tener respuesta
- Si el usuario ya dio contexto suficiente para inferir el enfoque, no preguntar — actuar

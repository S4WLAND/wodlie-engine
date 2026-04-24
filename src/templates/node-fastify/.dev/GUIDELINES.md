# Guía Técnica — Stack node-fastify

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js 20 + Fastify 4 + TypeScript 5 |
| ORM | Drizzle ORM + drizzle-kit |
| Base de datos | PostgreSQL 16 |
| Frontend | Next.js 14 (App Router) + TypeScript 5 |
| Estado cliente | Zustand 4 |
| Datos remotos | TanStack React Query 5 |
| Tests unit | Vitest 1 |
| Tests E2E | Playwright |
| Estilos | CSS puro con tokens.css |
| Queue | Graphile Worker (default) / BullMQ (Redis) |
| Cache | In-memory (default) / ioredis |

---

## Arquitectura backend (Clean Architecture)

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
    // lógica de negocio aquí
    return this.repo.create(data)
  }
}

// http/controller.ts (thin — sin lógica de negocio)
export async function createUser(req: FastifyRequest, reply: FastifyReply) {
  const useCase = new CreateUserUseCase(new UserRepositoryImpl())
  const user = await useCase.execute(req.body)
  return reply.code(201).send({ data: user })
}
```

---

## Arquitectura frontend (Feature-based)

```
features/<nombre>/
├── index.ts                 ← exporta la feature
├── README.md                ← contexto de la feature
├── components/              ← componentes específicos de la feature
├── hooks/                   ← hooks específicos de la feature
├── api/
│   ├── queries.ts           ← React Query queries
│   ├── mutations.ts         ← React Query mutations
│   └── types.ts             ← tipos de la API
├── store/                   ← Zustand store de la feature
├── events/                  ← eventos cross-feature
├── styles/                  ← estilos de la feature
└── types/                   ← tipos internos

components/                  ← componentes globales reutilizables
  ├── ui/                    ← botones, inputs, modales
  └── layout/                ← header, sidebar, footer

shared/                      ← utilidades compartidas entre features
  ├── api/
  │   ├── client.ts          ← axios instance configurada
  │   └── interceptors.ts    ← interceptors de auth
  ├── utils/
  └── store/
```

### Comunicación cross-feature via Zustand

```typescript
// features/auth/store/index.ts
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

// features/dashboard/hooks/useCurrentUser.ts
import { useAuthStore } from '@/features/auth/store'
export function useCurrentUser() {
  return useAuthStore((state) => state.user)
}
```

---

## Naming conventions

### TypeScript
```
variables:    camelCase    → userName, isLoading
funciones:    camelCase    → getUserById, createOrder
clases:       PascalCase   → UserRepository, CreateUserUseCase
interfaces:   PascalCase   → UserRepository, FastifyRequest
tipos:        PascalCase   → User, CreateUserData
archivos:     kebab-case   → user.repository.ts, create-user.use-case.ts
```

### CSS
```
Variables:    --color-primary, --space-4, --text-base
Clases:       kebab-case → .user-card, .nav-item
```

---

## Documentación obligatoria

### Header de archivo (backend)
```typescript
/**
 * Módulo: users
 * Capa: infra/repository
 *
 * Implementación de UserRepository con Drizzle ORM.
 * Conecta con la tabla `users` de PostgreSQL.
 */
```

### JSDoc en funciones públicas
```typescript
/**
 * Crea un usuario nuevo y envía email de bienvenida.
 * @throws {EmailAlreadyExistsError} si el email ya está registrado
 */
async execute(data: CreateUserData): Promise<User>
```

---

## Variables de entorno

Ver `.env.example` en cada app para la lista completa.

### Env promotion

```
.env.example        → versionado (valores vacíos)
.env.development    → local (no versionado)
.env.test           → tests (no versionado)
.env.production     → producción en servidor (no versionado)
```

Usar `wodlie env:sync` para sincronizar entre entornos.

---

## Migraciones de base de datos

```bash
# Generar migración desde cambios en schema
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Push directo (solo en development — sin historial de migraciones)
npm run db:push

# UI para explorar la base de datos
npm run db:studio
```

**Regla:** NUNCA modificar la base de datos directamente. Siempre via `drizzle-kit`.

---

## Testing

### Unit tests (Vitest)
```typescript
// tests/unit/modules/users/create-user.spec.ts
// US-001 — Crear usuario

describe('CreateUserUseCase', () => {
  it('dado un email válido, cuando se crea el usuario, entonces persiste en la DB', async () => {
    // ...
  })
})
```

### E2E tests (Playwright)
```typescript
// tests/e2e/features/auth/login.spec.ts
// US-002 — Login de usuario

test('dado credenciales válidas, cuando el usuario hace login, entonces es redirigido al dashboard', async ({ page }) => {
  // ...
})
```

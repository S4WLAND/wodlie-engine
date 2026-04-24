# AGENTS.md — Capa de Desarrollo

## Contexto
Capa de desarrollo. Código fuente + tests + estándares técnicos.
Stack: Node.js + Fastify + Next.js + PostgreSQL + Drizzle ORM

## Navegación — leer en este orden
1. `GUIDELINES.md` (estándares del stack)
2. `src/<app>/README.md` (contexto de la app)
3. `src/<app>/src/modules/<modulo>/README.md` (contexto del módulo)
4. Código específico (solo si la doc no alcanza)

## Reglas de código
- Clean Architecture: domain → application → infrastructure → presentation
- Un módulo = una carpeta, un caso de uso = un archivo
- Nunca lógica de negocio en controllers (thin controllers)
- Siempre documentar: header de archivo + JSDoc en funciones públicas
- Código en inglés, comentarios y docs en español
- Nunca usar `any` en TypeScript
- Nunca hardcodear valores — siempre `tokens.css` o constantes
- Actualizar README del módulo después de cada cambio

## Reglas de diseño
- `tokens.css` es la única fuente de verdad visual
- Nunca hardcodear colores, espaciados o tipografías
- Editar `tokens.css` cuando cambien valores de marca
- Componentes en `features/` — globales en `components/`

## Reglas de testing
- Unit tests en `tests/unit/modules/<modulo>/`
- E2E en `tests/e2e/features/<feature>/`
- Formato Given/When/Then en el nombre del test
- Referenciar US-XXX en el header del spec

## Convenciones de commits
```
feat(dev/<modulo>): descripción
fix(dev/<modulo>): descripción
refactor(dev/<modulo>): descripción
test(dev/<modulo>): descripción
```

## Cuándo escalar a `.core/AGENTS.md`
- Cambios que afectan infra (docker-compose, env)
- Cambios que afectan múltiples capas
- Decisiones de arquitectura irreversibles

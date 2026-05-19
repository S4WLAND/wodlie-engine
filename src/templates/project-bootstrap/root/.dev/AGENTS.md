# AGENTS.md — Capa de Desarrollo

Capa de código: frontend, backend, tests, estándares técnicos.

> Reglas universales (cross-layer): ver `.core/AGENTS.md`.
> Estándares técnicos detallados: ver `.dev/development_guidelines.md`.
> Setup local y puertos: ver `.dev/README.md`.

## Stack

La composición técnica depende del modo elegido por servicio.

Presets soportados hoy:

- `backend-api`: `neutral` o `fastify`
- `frontend-public`: `neutral` o `nextjs`
- `frontend-admin`: `neutral` o `nextjs`

El stack Docker preconfigurado queda listo cuando la combinación es `fastify + nextjs + nextjs`.
En esa combinación, `backend-api`, `frontend-public` y `frontend-admin` se operan por separado; `media-nginx` sirve uploads locales y los frontends no montan storage.

Detalle completo en `.dev/development_guidelines.md`.

---

## Orden de lectura por tipo de tarea

### Backend
1. `.dev/development_guidelines.md` (§4 Clean Architecture, §13 migrations, §14 testing, §27 superficies HTTP)
2. `.dev/src/backend-api/README.md` — comandos, estructura física, env vars
3. `.dev/src/backend-api/CONTEXT_AI.md` — decisiones, gotchas, deuda
4. `.dev/src/backend-api/PROGRESS_CHECKLIST.md` — fases técnicas y próximos pasos
5. `.dev/src/backend-api/src/modules/<modulo>/README.md` — al trabajar un módulo

### Frontend Public
1. `.dev/development_guidelines.md` (§5 module-based, §6 CSS, §7 Next.js, §8 Zustand, §9 React Query, §15 SEO, §16 errors, §18 a11y)
2. `.dev/src/frontend-public/README.md`
3. `.dev/src/frontend-public/CONTEXT_AI.md`
4. `.dev/src/frontend-public/PROGRESS_CHECKLIST.md`
5. `.dev/src/frontend-public/src/modules/<module>/README.md`

### Frontend Admin
1. `.dev/development_guidelines.md` (mismas secciones que public)
2. `.dev/src/frontend-admin/README.md`
3. `.dev/src/frontend-admin/PROGRESS_CHECKLIST.md`

---

## Reglas top de la capa dev

5 reglas no-negociables. El detalle vive en `development_guidelines.md`.

1. **Código, archivos y carpetas en inglés; comentarios y documentación en español.**
2. **Nunca tipos dinámicos no controlados.** En TypeScript: nunca `any`; usar tipos específicos o `unknown` con type guards. En otros lenguajes: equivalent typing discipline applies.
3. **La fuente de verdad visual es única.** Nunca hardcodear colores, espaciados ni tipografías fuera del sistema de tokens del proyecto.
4. **Layouts, pages y controllers siempre delgados.** Lógica de negocio en use-cases (backend) o modules/hooks (frontend).
5. **Commits convencionales obligatorios.** Formato `tipo(scope): descripción`. Las prohibiciones del root aplican sin excepción en dev: sin co-autor IA, sin commit sin pedido explícito del operador, sin push sin instrucción. Ver `AGENTS.md` raíz (sección Commits) y `development_guidelines.md` §20 para tipos y scopes de la capa dev.

Además:
- La política oficial de breakpoints, responsive mobile-first y SEO público vive en `.dev/development_guidelines.md`
- La política de nuevas dependencias también vive ahí; no asumir que están prohibidas por defecto
- **No iniciar servidores long-running** (`npm run dev`, `npm run dev:up`, `npm run test:up` o similares) salvo pedido explícito del operador; si el operador ya tiene el entorno levantado, limitarse a validar con comandos finitos como lint, typecheck o build.
- En backend, separar contratos `/api/v1/admin/*`, `/api/v1/public/*` y `/api/v1/pages/*`; `page-modules` sólo compone datos para SSR y no duplica reglas de dominio.
- En frontends, usar `INTERNAL_API_URL` para SSR/Server Components dentro de Docker y `NEXT_PUBLIC_EXTERNAL_API_URL` para navegador.

---

## Código entendible para humanos

**Tesis.** Tres principios que no se negocian: **velocidad de respuesta** (estructura de datos adecuada al patrón de acceso real, I/O no-bloqueante, índices donde las queries lo justifican), **legibilidad vía abstracción apropiada** (DTOs, Value Objects, encapsulación — fácil de leer y escribir para el operador), y **modularidad con desacoplamiento** (cada módulo autónomo e intercambiable; se acepta una capa extra de abstracción a cambio de independencia real).

Cuando entran en conflicto, el orden de prioridad es:

| # | Principio | Descripción |
|---|---|---|
| 1 | **Correcto** | El código hace lo que debe — prerrequisito no negociable |
| 2 | **Modular y desacoplado** | Independencia entre módulos; una capa extra de abstracción es aceptable si compra autonomía real |
| 3 | **Performante por diseño** | Elegir la estructura más eficiente para el **patrón de acceso real** — no maximizar Big-O en abstracto. I/O siempre async. Índices desde el primer schema. |
| 4 | **Legible vía abstracción** | DTOs, Value Objects, encapsulación; el código expresa el dominio, no los detalles de implementación |
| 5 | **Limpio** | Conciso, sin duplicación, sin magia innecesaria |
| 6 | **Micro-optimizado** | Solo con datos de profiling que lo justifiquen |

### Principios

1. **Nombres > comentarios.** Si necesitás un comentario para explicar el nombre, el nombre está mal.

   ```typescript
   // ❌ const d = new Date()  // fecha de creación
   // ✅ const createdAt = new Date()
   ```

2. **Funciones cortas, un único nivel de abstracción.** Si una función mezcla validación + transformación + persistencia → partir.

   ```typescript
   // ❌ una función hace 4 cosas distintas
   async function processOrder(input: OrderInput) {
     // valida
     if (!input.email.includes('@')) throw new Error('email')
     // calcula total
     const total = input.items.reduce((s, i) => s + i.price * i.qty, 0)
     // persiste
     const order = await db.insert(orders).values({ ...input, total })
     // notifica
     await sendEmail(input.email, `Orden ${order.id}`)
     return order
   }

   // ✅ orquestación pura, cada paso en su lugar
   async function processOrder(input: OrderInput) {
     validateOrderInput(input)
     const total = calculateOrderTotal(input.items)
     const order = await persistOrder({ ...input, total })
     await notifyOrderCreated(order)
     return order
   }
   ```

3. **Early return > anidamiento.** Guard clauses primero; happy path al final.

   ```typescript
   // ❌ tres niveles de indentación
   function getDiscount(user: User) {
     if (user) {
       if (user.isActive) {
         if (user.purchases > 10) {
           return 0.2
         }
       }
     }
     return 0
   }

   // ✅ early returns
   function getDiscount(user: User) {
     if (!user) return 0
     if (!user.isActive) return 0
     if (user.purchases <= 10) return 0
     return 0.2
   }
   ```

4. **Una idea por línea.** No encadenar 4 operaciones de array en una línea ilegible. Variables intermedias con nombres.

   ```typescript
   // ❌ ilegible
   const r = data.filter(x => x.active).map(x => x.value).reduce((a, b) => a + b, 0) / data.length

   // ✅ explícito
   const activeItems = data.filter(item => item.active)
   const totalValue = activeItems.reduce((sum, item) => sum + item.value, 0)
   const averageValue = totalValue / data.length
   ```

5. **Datos antes que lógica.** Definir tipos y estructuras primero; la función que los manipula viene después.

6. **Magic numbers/strings → constantes con nombre.**

   ```typescript
   // ❌ if (count > 3) { ... }
   // ✅ const MAX_RETRIES = 3
   //    if (count > MAX_RETRIES) { ... }
   ```

7. **Distinguir diseño performante de micro-optimización.** Elegir `Map` sobre `Array` para lookup por clave es diseño correcto, no optimización prematura. Micro-optimizar (bit manipulation, memory pooling, trucos de runtime) sí requiere datos de profiling que lo justifiquen.

8. **Comentar el "por qué", no el "qué".** Si necesitás un comentario explicando QUÉ hace el código → refactorizá. Si necesitás un comentario explicando POR QUÉ, escribilo.

### Anti-patrones (evitar siempre)

- One-liners crípticos con ternarios anidados
- Abreviaciones (`usr`, `ctx`, `tmp`) salvo convenciones del lenguaje
- Funciones > 40 líneas
- Más de 3 niveles de indentación
- Side effects ocultos en getters
- Mutación implícita de parámetros
- Reutilizar variables para distintos propósitos

### Checklist de revisión

- ¿Un dev nuevo entiende esta función en < 30 segundos?
- ¿El nombre del archivo/función predice su contenido?
- ¿Los nombres de variables hacen los comentarios redundantes?
- ¿Hay alguna función > 40 líneas o con > 3 niveles de indentación?
- ¿Hay valores mágicos sin nombre?

---

## Cuándo escalar a `.core/AGENTS.md`

- Cambios que afectan infra (Docker, compose, env, CI/CD)
- Cambios que afectan múltiples capas
- Decisiones de arquitectura irreversibles o de alto impacto

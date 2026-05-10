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

Detalle completo en `.dev/development_guidelines.md`.

---

## Orden de lectura por tipo de tarea

### Backend
1. `.dev/development_guidelines.md` (§4 Clean Architecture, §13 migrations, §14 testing)
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
2. **Nunca `any` en TypeScript.** Usar tipos específicos o `unknown` con type guards.
3. **`tokens.css` es la única fuente de verdad visual.** Nunca hardcodear colores, espaciados ni tipografías.
4. **Layouts, pages y controllers siempre delgados.** Lógica de negocio en use-cases (backend) o modules/hooks (frontend).
5. **Commits convencionales obligatorios.** Formato `tipo(scope): descripción` — ver `development_guidelines.md` §20.

Además:
- La política oficial de breakpoints, responsive mobile-first y SEO público vive en `.dev/development_guidelines.md`
- La política de nuevas dependencias también vive ahí; no asumir que están prohibidas por defecto

---

## Código entendible para humanos

**Tesis.** Balance entre limpio + escalable + óptimo + entendible. Cuando entran en conflicto, el orden de prioridad es: **correcto > entendible > limpio > óptimo**. La optimización prematura que sacrifica legibilidad NO es bienvenida.

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

7. **Optimización solo con medición.** No micro-optimizar sin profile. Si la solución óptima es menos obvia, comentar el porqué.

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

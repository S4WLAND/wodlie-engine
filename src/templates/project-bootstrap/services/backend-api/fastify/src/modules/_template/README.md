# Módulo: _template

> Template base para nuevos módulos de negocio.
> Copiar esta carpeta, renombrar `_template` y reemplazar `Item*` por el lenguaje del dominio real.

## Filosofía

- Screaming architecture en la estructura del backend: los módulos expresan negocio
- Clean Architecture liviana dentro del módulo: `domain/`, `use-cases/`, `infra/`, `http/`
- Sin contenedor DI global
- La frontera pública del módulo son sus **use-cases**

## Estructura

```text
modules/<module>/
  domain/         # contratos y tipos del dominio
  use-cases/      # orquestación de negocio, un archivo por acción
  infra/          # repositorios y adapters concretos
  http/           # routes, controller, contract
  composition.ts  # wiring local del módulo
  index.ts        # exporta HTTP + API pública del módulo
  README.md
```

## Regla de frontera

Otro módulo puede depender de este módulo de dos formas:

- vía HTTP, registrando `index.ts` en Fastify
- vía código, importando `create<Module>Module()` o un use-case público

No debe:

- importar `infra/` de otro módulo
- tocar tablas o queries de otro módulo
- reutilizar lógica de negocio desde `shared/`

## Patrón de uso

### Dentro del mismo módulo

- `controller.ts` llama use-cases
- `use-cases/` dependen de interfaces de `domain/`
- `infra/` implementa esas interfaces

### Entre módulos

```ts
import { createInvoicesModule } from '@/modules/invoices'

const invoicesModule = createInvoicesModule()
await invoicesModule.createInvoice.execute(input)
```

## Logging esperado

Cada capa agrega contexto técnico:

- `module`
- `layer`
- `useCase` o `repository`

Ejemplo:

```ts
createScopedLogger({
  module: 'payments',
  layer: 'use-case',
  useCase: 'CreatePaymentUseCase',
})
```

## Endpoints de referencia

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/{module}` | No | Listar ítems |
| GET | `/api/{module}/:id` | No | Obtener un ítem |
| POST | `/api/{module}` | Sí | Crear un ítem |
| PATCH | `/api/{module}/:id` | Sí | Actualizar un ítem |
| DELETE | `/api/{module}/:id` | Sí | Eliminar un ítem |

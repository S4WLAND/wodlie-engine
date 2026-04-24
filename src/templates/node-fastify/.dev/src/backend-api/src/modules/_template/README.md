# Módulo: _template

> Este es el template base para nuevos módulos.
> Copiar esta carpeta y renombrar `_template` con el nombre del módulo.

## Historia de usuario

Referencia: US-XXX — [nombre de la historia]

## Responsabilidad

[Qué hace este módulo. Qué problema de negocio resuelve.]

## Entidades

```
Item
  - id: string (UUID)
  - name: string
  - description?: string
  - createdAt: Date
  - updatedAt: Date
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/{modulo}` | No | Listar ítems |
| GET | `/api/{modulo}/:id` | No | Obtener ítem por ID |
| POST | `/api/{modulo}` | Sí | Crear ítem |
| PATCH | `/api/{modulo}/:id` | Sí | Actualizar ítem |
| DELETE | `/api/{modulo}/:id` | Sí | Eliminar ítem |

## Casos de uso

- `GetItemsUseCase` — Lista con paginación
- `GetItemByIdUseCase` — Obtiene uno por ID
- `CreateItemUseCase` — Crea nuevo
- `UpdateItemUseCase` — Actualiza existente
- `DeleteItemUseCase` — Elimina

## Dependencias

- Ninguna

## Changelog

| Versión | Fecha | Autor | Cambio |
|---|---|---|---|
| 1.0.0 | {{DATE}} | {{OPERATOR}} | Módulo creado desde template |

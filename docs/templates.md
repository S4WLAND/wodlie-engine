# Templates

## Estado actual

- Solo existe un template implementado: `node-fastify`.
- El build copia `src/templates/` a `dist/templates/`.
- `init` usa ese asset empaquetado y reemplaza variables simples.
- No existe todavía un sistema de composición avanzada por perfil/capability.

## Template disponible

| Template | Stack | Estado |
|---|---|---|
| node-fastify | Node.js + Fastify + Next.js + PostgreSQL + Drizzle | implementado |

## Cómo funciona `wodlie-engine init`

```
wodlie-engine init my-project --type webapp --size medium --stack node
    ↓
1. Copia dist/templates/node-fastify/ → my-project/
2. Reemplaza variables en archivos:
   {{PROJECT_NAME}} → my-project
   {{PROJECT_TYPE}} → webapp
   {{PROJECT_SIZE}} → medium
   {{DATE}}         → fecha actual
   {{OPERATOR}}     → respuesta del prompt
3. Ajusta .wodlie-config/project.json con datos reales
4. Inicializa business.json, architecture.json y events.jsonl
5. Inicializa git con primer commit
```

## Variables disponibles en templates

| Variable | Descripción |
|---|---|
| `{{PROJECT_NAME}}` | Nombre del proyecto |
| `{{PROJECT_TYPE}}` | webapp, platform, enterprise, iot |
| `{{PROJECT_SIZE}}` | small, medium, large |
| `{{DATE}}` | Fecha de creación (YYYY-MM-DD) |
| `{{OPERATOR}}` | Nombre del operador |
| `{{CONTRACT_TYPE}}` | fixed, subscription |
| `{{INFRA_TYPE}}` | vps, hosting, cloud |
| `{{CLIENT_NAME}}` | Nombre del cliente |
| `{{ENGINE_VERSION}}` | Versión del engine |
| `{{DOMAIN}}` | Dominio principal |
| `{{EMAIL}}` | Email de SSL |

## Qué sí entrega hoy el template

- Estructura de 4 capas
- documentación base
- template de backend, frontend público y admin
- workflows de ejemplo
- `.wodlie-config/` con modelo mínimo del engine

## Qué no entrega hoy

- activación/desactivación real de módulos por capability
- composición de template por `type`, `size` o `infra`
- stacks alternativos reales
- reconciliación estructural si cambia el perfil después de crear el proyecto

## Crear un template nuevo

```bash
# 1. Copiar node-fastify como base
cp -r src/templates/node-fastify src/templates/python-fastapi

# 2. Adaptar estructura, docs y .wodlie-config
# 3. Actualizar init para resolver el nuevo stack
# 4. Agregar smoke tests
# 5. Documentar limitaciones reales
```

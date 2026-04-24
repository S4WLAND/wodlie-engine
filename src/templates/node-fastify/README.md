# {{PROJECT_NAME}}

> Proyecto gestionado con [@s4wland/wodlie-engine](https://github.com/S4WLAND/wodlie-engine)

## Capas del proyecto

| Capa | Descripción |
|---|---|
| [.business/](.business/) | Requerimientos, historias de usuario, reportes cliente |
| [.infra/](.infra/) | Infraestructura, Docker, guías de deploy y secrets |
| [.dev/](.dev/) | Código fuente, tests, estándares técnicos |
| [.core/](.core/) | Orquestación del engine (se purga al entregar) |

## Comandos rápidos

```bash
wodlie status          # ver estado del proyecto
wodlie health          # ver salud del proyecto
wodlie report:draft    # generar borrador de reporte semanal
wodlie deploy --env staging --target all   # flujo guiado, no deploy automático
```

## Stack

- **Backend:** Node.js + Fastify + PostgreSQL + Drizzle ORM
- **Frontend público:** Next.js (SSR + CSR)
- **Frontend admin:** Next.js (CSR)
- **Infra:** {{INFRA_TYPE}} + stack base documentado en `.infra/`

## Operador

{{OPERATOR}} — iniciado el {{DATE}}

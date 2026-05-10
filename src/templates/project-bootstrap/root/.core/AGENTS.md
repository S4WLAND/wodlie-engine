# AGENTS.md — Maestro del Proyecto

Router de orquestación cross-layer. Define el árbol de lectura y las reglas universales que aplican en todas las capas.

## Capas del sistema

- `.business/` → requerimientos, historias, reportes cliente
- `.infra/`    → infraestructura, Docker, CI/CD
- `.dev/`      → código fuente, tests, estándares
- `.core/`     → orquestación (no tocar directamente)

## Árbol de lectura por tipo de tarea

| Tarea | Lectura |
|---|---|
| Código (frontend/backend) | `.dev/AGENTS.md` → `.dev/development_guidelines.md` → `.dev/src/<app>/README.md` → módulo/feature |
| Negocio (épicos, historias, reportes) | `.business/AGENTS.md` → `.business/requirements/epics/EP-XXX/epic.md` → `US-XXX.md` |
| Infraestructura (Docker, deploy, secrets) | `.infra/AGENTS.md` → `.infra/vps/<tipo>.md` |
| Engine (comandos, configuración global) | `AGENTS.md` (raíz) |

## Reglas universales

Aplican en todas las capas. No se repiten en los AGENTS.md de capa.

1. NUNCA ejecutar cambios destructivos sin confirmar con el operador
2. NUNCA asumir — verificar con documentación o leer código
3. NUNCA editar archivos `.json` ni artefactos generados automáticamente por el engine
4. SIEMPRE usar comandos del engine para historias, épicos, pivots, reportes y cambios estructurados
5. SIEMPRE actualizar el README del módulo/feature después de cada cambio funcional
6. SIEMPRE hacer preguntas cuando hay ambigüedad
7. Doc desactualizada = leer el código, no asumir

## Cuándo activar modo plan

- Cambio que afecta más de un módulo
- Eliminación de código existente
- Cambios en schema de DB
- Ambigüedad en el prompt
- Cambio irreversible sin rollback claro

## Cuándo escalar al maestro raíz (`/AGENTS.md`)

- Cambios que afectan al engine (comandos, configuración, integración con CLI)
- Decisiones que requieren coordinación de múltiples capas

## Referencias inmediatas

- `.business/AGENTS.md` — reglas business
- `.infra/AGENTS.md` — reglas infra
- `.dev/AGENTS.md` — reglas dev

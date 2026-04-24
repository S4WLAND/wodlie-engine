# AGENTS.md — Maestro del Proyecto

## Proyecto
Lee `.wodlie-config/project.json` para contexto completo.

## Capas del sistema
- `.business/` → requerimientos, historias, reportes cliente
- `.infra/`    → infraestructura, Docker, CI/CD
- `.dev/`      → código fuente, tests, estándares
- `.core/`     → orquestación (no tocar directamente)

## Navegación por árbol
Según desde dónde abrís la IA:
- `proyecto/`   → este archivo (maestro)
- `.dev/`       → `.dev/AGENTS.md`
- `.business/`  → `.business/AGENTS.md`
- `.infra/`     → `.infra/AGENTS.md`

## Árbol de lectura por tipo de tarea
- Código:    `.dev/AGENTS.md` → `.dev/GUIDELINES.md` → `módulo/README.md` → código
- Negocio:   `.business/AGENTS.md` → `overview.md` → `epic.md` → `US-XXX.md`
- Infra:     `.infra/AGENTS.md` → `tipo/README.md` → `checklist.md`

## Reglas universales
- NUNCA ejecutar cambios destructivos sin confirmar con el operador
- NUNCA asumir — siempre verificar con documentación
- NUNCA editar archivos `.json` generados automáticamente
- SIEMPRE usar comandos del engine para historias, épicos, pivots, reportes y cambios estructurados
- SIEMPRE actualizar README del módulo después de cambios
- SIEMPRE hacer preguntas cuando hay ambigüedad
- Doc desactualizada = leer código sí o sí

## Modo plan — se activa cuando:
- Cambio afecta más de un módulo
- Hay eliminación de código existente
- Hay cambios en schema de DB
- Hay ambigüedad en el prompt
- Cambio irreversible sin rollback claro

## Referencias a capas
- `.core/AGENTS.md` → este archivo
- `.business/AGENTS.md`
- `.infra/AGENTS.md`
- `.dev/AGENTS.md`

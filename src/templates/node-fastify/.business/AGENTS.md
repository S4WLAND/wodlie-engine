# AGENTS.md — Capa de Negocio

## Contexto
Capa de negocio. Requerimientos, historias, reportes del cliente.

## Navegación — leer en este orden
1. `overview.md` (estado global del proyecto)
2. `epics/EP-XXX/epic.md` (módulo específico)
3. `epics/EP-XXX/stories/US-XXX.md` (historia específica)

## Reglas
- NUNCA modificar historias completadas sin modo plan
- SIEMPRE actualizar `overview.md` cuando cambia una historia
- Si el operador menciona un cambio del cliente → preguntar si es pivot
- Los pivotes van en `changelog.md` con tipo `PIVOT`
- Para crear o cambiar épicos, historias, pivots y estados usar comandos del engine; no escribir los artefactos estructurados a mano
- Los reportes internos se escriben en `reports/internal/YYYY-WNN.md`
- El agente NO genera el PDF — solo procesa el `.md` y genera el `.tex`

## Cuándo escalar a `.core/AGENTS.md`
- Cuando el cambio afecta múltiples capas
- Cuando hay un pivot que impacta infra o dev

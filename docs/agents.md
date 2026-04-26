# Agentes — Estado actual del engine

## Principio operativo

- La IA asiste.
- La CLI gobierna los cambios estructurados.
- El operador aprueba operaciones de riesgo.

## Resolución actual

- No existe MCP server en este repositorio.
- La superficie autoritativa para agentes es la misma CLI.
- `AGENTS.md` define navegación, restricciones y cuándo usar comandos.

---

## Regla más importante

- Si un cambio afecta:
  - `.wodlie-config/*.json`
  - `progress.json`
  - `state.json`
  - eventos
  - historias, épicos, pivots, reportes estructurados
- entonces la IA no debe escribir esos artefactos a mano.
- Debe usar comandos del engine.

## Flujo recomendado para la IA

1. Leer el `AGENTS.md` de la capa actual.
2. Leer la documentación de contexto.
3. Verificar el código si la tarea toca implementación.
4. Si el cambio es estructural, usar un comando del engine.
5. Si el cambio es narrativo o libre, escribir Markdown manualmente.

## Comandos que la IA debería priorizar

- `business:epic:create`
- `business:epic:edit`
- `business:epic:status`
- `business:story:create`
- `business:story:edit`
- `business:story:status`
- `business:pivot`
- `business:sync`
- `dev:story:complete`
- `status`
- `report:draft`
- `reconcile`

## Lo que todavía no existe

- resolución MCP
- portabilidad agentica de módulos cerrada
- disparo automático de triggers desde commits
- reconciliación automática de drift más allá del negocio canónico

## Reglas universales

- **Nunca ejecutar cambios destructivos sin confirmar** con el operador
- **Nunca asumir** — siempre verificar con la documentación
- **Nunca editar** archivos .json generados automáticamente
- **Siempre usar comandos del engine** para crear o cambiar artefactos estructurados con impacto en estado o métricas
- **Siempre hacer preguntas** cuando hay ambigüedad
- **Documentación desactualizada** = leer código sí o sí

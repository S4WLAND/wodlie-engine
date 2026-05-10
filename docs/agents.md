# Agentes — Estado actual del engine

## Principio operativo

- La IA asiste.
- La CLI gobierna los cambios estructurados.
- El operador aprueba operaciones de riesgo.

## Superficie autoritativa

- no existe MCP en este repositorio
- la superficie autoritativa es la CLI
- `AGENTS.md` define navegación, restricciones y cuándo usar comandos

## Jerarquía actual de `AGENTS.md`

Los proyectos nuevos generan:

- `AGENTS.md` en raíz
- `.core/AGENTS.md`
- `.dev/AGENTS.md`
- `.infra/AGENTS.md`
- `AGENTS.md` por servicio en `.dev/src/<service>/`

## Regla más importante

Si un cambio afecta:

- `.wodlie-config/*.json`
- `progress.*`
- `state.json`
- eventos
- historias, épicos, pivots o reportes estructurados

la IA no debe escribir esos artefactos a mano; debe usar comandos del engine.

## Flujo recomendado para la IA

1. Leer el `AGENTS.md` de la capa actual.
2. Leer la documentación de contexto.
3. Verificar el código si la tarea toca implementación.
4. Si el cambio es estructural, usar la CLI.
5. Si el cambio es narrativo o libre, escribir Markdown manualmente.

## Reglas universales

- nunca ejecutar cambios destructivos sin confirmar
- nunca asumir; verificar con código o documentación
- nunca editar a mano JSON generados automáticamente
- siempre actualizar docs afectadas si cambia el comportamiento real

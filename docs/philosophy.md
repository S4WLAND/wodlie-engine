# Filosofía y objetivo del engine

Este documento describe la dirección buscada del proyecto y la separa del estado realmente implementado hoy.

## Filosofía objetivo

- La IA asiste todo el ciclo de vida del software.
- El engine gobierna el estado estructural del proyecto.
- La documentación narrativa ayuda a operar.
- El modelo canónico y los eventos gobiernan sincronización, métricas y trazabilidad.
- La arquitectura DEV debe favorecer modularidad, desacoplamiento y portabilidad controlada.

## Regla central

No todo debe escribirse libremente.

- Lo narrativo puede redactarlo la IA o el operador.
- Lo estructural debe pasar por comandos del engine.
- Lo que dispare eventos, métricas, alertas o reconciliación no debe depender de texto manual sin validar.

## Flujo objetivo

1. Propuesta y levantamiento de contexto.
2. Normalización de brief, épicos, historias y pivots.
3. Decisiones de arquitectura, stack e infraestructura.
4. Generación o ajuste del proyecto base.
5. Desarrollo modular con trazabilidad por historia.
6. Reportes, alertas y eventos derivados del trabajo real.
7. Entrega, exportación, purge y reimport cuando aplique.

## Estado actual frente a esa filosofía

### Resuelto

- existe un modelo canónico mínimo en `.wodlie-config/`
- negocio ya puede crear épicos, historias, estados y pivots
- existen eventos persistidos en `events.jsonl`
- existen artefactos derivados básicos: `overview`, `progress`, `state`, reportes
- el flujo `dev -> story complete -> sync` ya produce efectos reales

### Parcial

- `init` genera un baseline usable, pero no compone por perfil
- `deploy`, `module:add`, `module:remove` y `deliver` todavía son flujos guiados
- `env:sync`, `export` y `purge` funcionan, pero con alcance acotado
- la IA puede seguir reglas por `AGENTS.md`, pero no tiene MCP todavía

### No resuelto

- no hay reconciliación profunda de drift
- no hay composición variable del framework según tipo, tamaño o capabilities
- no hay portabilidad real de módulos con análisis cerrado de dependencias
- no hay automatización completa de infra, CI/CD, secretos y deploy
- no hay surface agentica formal sobre MCP
- no hay eventos nacidos automáticamente desde commits, pipelines o resultados de prueba

## Criterios para una implementación completa

La visión se puede considerar coherente y funcional cuando existan al menos estas capacidades:

- CLI y MCP llamando al mismo núcleo de casos de uso
- modelo canónico para negocio, arquitectura, infra y estado
- reconciliación segura entre cambios manuales y artefactos derivados
- módulos con contrato portable e inferencia de dependencias
- automatización real de decisiones de infra y configuración de entornos
- reportes semanales derivados del trabajo real con revisión humana opcional
- eventos, alertas y notificaciones originados por cambios estructurales verificables

## Regla de diseño para seguir creciendo

Cuando una idea nueva aparezca, primero decidir en cuál de estas categorías cae:

- `narrativa libre`
- `artefacto derivado`
- `estado canónico`
- `evento`
- `operación guiada`
- `automatización completa`

Si no se clasifica así, el engine vuelve a mezclar promesas con implementación real.

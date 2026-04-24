# Referencia de Comandos — Estado Real

Este documento describe lo que cada comando hace hoy.

Estados usados:
- `implemented`: funcional y conectado al modelo actual
- `guided`: útil, pero deja pasos manuales
- `planned`: existe como placeholder, no resuelve el flujo completo

## Inicialización

### `wodlie init <proyecto>`

Estado: `implemented`

Genera un proyecto nuevo desde el template `node-fastify`, aplica reemplazo de variables e inicializa git.

```bash
wodlie init my-project \
  --type webapp \        # webapp | platform | enterprise | iot
  --size medium \        # small | medium | large
  --stack node           # node (default) | python | go
```

Flags:
- `--capabilities` — ai, automation, native, realtime, media (separados por coma)
- `--infra` — vps | hosting | cloud (default: vps)

Limitaciones actuales:
- `--stack` acepta valores `node|python|go`, pero solo `node-fastify` está implementado.
- no compone templates por perfil; copia el template base y reemplaza variables.

---

## Entornos

### `wodlie env:sync`

Estado: `implemented`

Sincroniza claves de `.env.example` a `.env.development` locales en las apps del template.

```bash
wodlie env:sync
```

No hace hoy:
- sincronización con VPS
- manejo de secrets remotos
- promoción de variables por entorno

---

## Negocio canónico

### `wodlie business:epic:create <id> <titulo>`

Estado: `implemented`

Crea un épico canónico en `.wodlie-config/business.json` y genera su archivo estándar.

```bash
wodlie business:epic:create EP-001 "Onboarding cliente"
```

### `wodlie business:story:create <epicId> <id> <titulo>`

Estado: `implemented`

Crea una historia canónica, genera su archivo estándar y sincroniza overview/progress.

```bash
wodlie business:story:create EP-001 US-001 "Registrar brief" \
  --as operador \
  --want "capturar el brief" \
  --so-that "el proyecto arranque con contexto"
```

### `wodlie business:story:status <storyId> <estado>`

Estado: `implemented`

Actualiza el estado canónico de una historia.

```bash
wodlie business:story:status US-001 en-desarrollo
wodlie business:story:status US-001 completado
```

### `wodlie business:pivot <targetId>`

Estado: `implemented`

Registra un pivot sobre un épico, una historia o `global`.

```bash
wodlie business:pivot EP-001 --reason "cliente cambió la dirección del producto"
wodlie business:pivot global --reason "se redefine el alcance comercial"
```

### `wodlie dev:story:complete <storyId>`

Estado: `implemented`

Marca una historia como completada desde DEV y sincroniza negocio, métricas y eventos.

```bash
wodlie dev:story:complete US-001
```

### `wodlie business:sync`

Estado: `implemented`

Reconstruye `overview.md`, `progress.*` y demás artefactos derivados desde `business.json`.

```bash
wodlie business:sync
```

---

## Estado y métricas

### `wodlie status`

Estado: `implemented`

Actualiza el estado completo del proyecto.

```bash
wodlie status
```

**Genera/actualiza:**
- `state.json` — estado global del proyecto
- `progress.json` por capa — métricas de avance
- `.wodlie-config/events.jsonl` — eventos del engine para sincronización y reportes

No hace hoy:
- parseo automático de commits
- consolidación real de changelog desde git
- derivación fuerte desde infra/dev, salvo triggers manuales y comandos estructurados

### `wodlie health`

Estado: `implemented`

Muestra la salud del proyecto en consola de forma visual.

```bash
wodlie health
```

**Muestra:**
- % completado por capa
- Historias: new / updates / pivots
- Último deploy y último incidente
- Alertas si hay dependencias bloqueadas

---

## Reportes

### `wodlie report:draft`

Estado: `implemented`

Genera borrador del reporte semanal interno.

```bash
wodlie report:draft
```

- Lee historias y eventos canónicos
- Genera un borrador Markdown con secciones narrativas vacías
- El operador o la IA completan la parte libre

### `wodlie report`

Estado: `implemented`

Genera el reporte `.tex` para el cliente.

```bash
wodlie report
```

- Genera el `.tex` base
- No compila a PDF
- No reescribe narrativas por sí mismo

---

## Triggers

### `wodlie trigger <nombre>`

Estado: `implemented`

Disparo manual de un trigger.

```bash
wodlie trigger on-deploy --project my-project
wodlie trigger on-incident "caída de API 14:30hs"
wodlie trigger on-milestone --story US-003
wodlie trigger on-pivot --epic EP-001
```

**Triggers disponibles:**
- `on-deploy` — post-deploy
- `on-incident` — incidente registrado
- `on-milestone` — historia completada
- `on-pivot` — cambio de dirección del cliente

Observación:
- hoy los triggers son manuales; no hay workflow que lea commits y dispare esto automáticamente.

---

## Deploy

### `wodlie deploy`

Estado: `guided`

Muestra el flujo manual recomendado para deploy.

```bash
wodlie deploy --env staging --target all
wodlie deploy --env production --target api
wodlie deploy --env staging --target front --skip e2e
```

**Flags:**
- `--env` — staging | production
- `--target` — front | admin | api | worker | all
- `--skip` — tests | e2e | perf | security | a11y | ci

No hace hoy:
- push automático
- ejecución remota
- integración CI/CD real

### `wodlie ssh:verify`

Estado: `implemented`

Verifica conexión SSH con el VPS.

```bash
wodlie ssh:verify
```

---

## Ciclo de vida del proyecto

### `wodlie export`

Estado: `implemented`

Genera `.wodlie-export/` con el historial completo del proyecto.

```bash
wodlie export
```

**Genera:**
```
.wodlie-export/
├── README.md
├── state/final-state.json
├── changelog/full-changelog.json
├── metrics/history.json
├── snapshots/YYYY-MM-DD.json
└── delivery/delivery-report.md
```

### `wodlie purge`

Estado: `implemented`

Elimina el engine del proyecto. **Hace snapshot git automático antes.**

```bash
wodlie purge
```

Implementación real hoy:
- elimina `.core/`
- elimina `.wodlie-config/`
- elimina `.dev/AGENTS.md`

No hace hoy:
- limpieza selectiva de workflows del engine
- rollback sofisticado

### `wodlie deliver`

Estado: `guided`

Entrega completa al cliente.

```bash
wodlie deliver --target https://github.com/cliente/my-project
```

Hoy imprime la secuencia manual recomendada.

### `wodlie reimport`

Estado: `planned`

Reactiva el engine en un proyecto del cliente.

```bash
wodlie reimport --from https://github.com/cliente/my-project
```

Hoy solo imprime instrucciones manuales.

---

## Engine

### `wodlie upgrade`

Estado: `planned`

Informa actualizaciones disponibles del engine.

```bash
wodlie upgrade
# → versión actual: 1.0.0
# → versión disponible: 1.2.0
# → archivos que cambiarían: ...
# → reglas de AGENTS.md que se actualizarían: ...
```

Hoy no aplica cambios reales.

---

## Módulos

### `wodlie module:add <nombre>`

Estado: `guided`

Copia el módulo desde otro proyecto al path esperado del backend.

```bash
wodlie module:add turnos --from ../my-project
```

No hace hoy:
- adaptación automática con IA
- reporte de compatibilidad
- registro automático en `app.ts`
- commit automático

### `wodlie module:remove <nombre>`

Estado: `guided`

Muestra los pasos manuales para eliminar un módulo.

```bash
wodlie module:remove turnos
```

No hace hoy:
- grafo de dependencias
- migraciones automáticas
- borrado seguro real

---

## Reconciliación

### `wodlie reconcile`

Estado: `implemented`

Reconstruye artefactos derivados desde el modelo canónico actual.

```bash
wodlie reconcile
```

Hoy equivale a una sincronización conservadora de negocio y métricas.

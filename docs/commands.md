# Referencia de Comandos — Estado Real

Este documento describe lo que cada comando hace hoy.

Estados usados:
- `implemented`: funcional y conectado al modelo actual
- `guided`: útil, pero deja pasos manuales
- `planned`: existe como placeholder, no resuelve el flujo completo

## Shell interactiva

### `wodlie-engine`

Estado: `implemented`

Abre una shell interactiva:
- menú principal en árbol: `Business`, `Reports`, `Project`
- browse con búsqueda por ID, título o slug para épicos e historias
- creación, edición, cambios de estado, pivots y archive sin escribir IDs manuales

## Inicialización

### `wodlie-engine init <proyecto>`

Estado: `implemented`

Genera un proyecto nuevo desde el template `node-fastify`, aplica reemplazo de variables e inicializa git.

```bash
wodlie-engine init my-project \
  --type webapp \        # webapp | platform | enterprise | iot
  --size medium \        # small | medium | large
  --stack node           # node (default) | python | go
```

Flags:
- `--capabilities` — ai, automation, native, realtime, media (separados por coma)
- `--infra` — vps | hosting | cloud (default: vps)

Además del modo con flags, `init` pregunta de forma interactiva por:
- tipo
- tamaño
- stack
- infraestructura
- datos operativos del proyecto
- capabilities

Qué recorta hoy según la selección:
- `.infra/` conserva solo la carpeta elegida
- `.infra/vps/docker-compose/sizes/` conserva solo el tamaño elegido
- `.infra/vps/docker-compose/profiles/` conserva el perfil elegido si existe
- `.infra/vps/docker-compose/capabilities/` conserva solo las capabilities elegidas

Limitaciones actuales:
- `--stack` acepta valores `node|python|go`, pero solo `node-fastify` está implementado.
- todavía no compone el código fuente completo por `type`, `size`, `infra` o `capabilities`; hoy el recorte fuerte está concentrado en infra.

---

## Entornos

### `wodlie-engine env:sync`

Estado: `implemented`

Sincroniza claves de `.env.example` a `.env.development` locales en las apps del template.

```bash
wodlie-engine env:sync
```

No hace hoy:
- sincronización con VPS
- manejo de secrets remotos
- promoción de variables por entorno

---

## Negocio canónico

### `wodlie-engine business:epic:create <titulo>`

Estado: `implemented`

Crea un épico canónico en `.wodlie-config/business.json`, genera su archivo estándar y asigna un ID único `EP-XXX`.

```bash
wodlie-engine business:epic:create "Onboarding cliente"
```

### `wodlie-engine business:epic:list`

Estado: `implemented`

Lista los épicos canónicos.

### `wodlie-engine business:epic:edit <epicId>`

Estado: `implemented`

Edita título y descripción de un épico existente.

### `wodlie-engine business:epic:status <epicId> <estado>`

Estado: `implemented`

Cambia el estado de un épico.

Estados soportados:
- `draft`
- `active`
- `blocked`
- `completed`
- `pivoted`
- `archived`

### `wodlie-engine business:story:create <epicId> <titulo>`

Estado: `implemented`

Crea una historia canónica, genera su archivo estándar, sincroniza overview/progress y asigna un ID único `US-XXX`.

```bash
wodlie-engine business:story:create EP-001 "Registrar brief" \
  --as operador \
  --want "capturar el brief" \
  --so-that "el proyecto arranque con contexto"
```

### `wodlie-engine business:story:list`

Estado: `implemented`

Lista historias canónicas.

### `wodlie-engine business:story:edit <storyId>`

Estado: `implemented`

Edita título, historia de usuario, prioridad y asignación.

### `wodlie-engine business:story:status <storyId> <estado>`

Estado: `implemented`

Actualiza el estado canónico de una historia.

```bash
wodlie-engine business:story:status US-001 in-progress
wodlie-engine business:story:status US-001 completed
```

Estados soportados:
- `draft`
- `ready`
- `in-progress`
- `blocked`
- `in-review`
- `completed`
- `pivoted`
- `archived`

### `wodlie-engine business:pivot <targetId>`

Estado: `implemented`

Registra un pivot sobre un épico, una historia o `global`.

```bash
wodlie-engine business:pivot EP-001 --reason "cliente cambió la dirección del producto"
wodlie-engine business:pivot global --reason "se redefine el alcance comercial"
```

### `wodlie-engine dev:story:complete <storyId>`

Estado: `implemented`

Marca una historia como completada desde DEV y sincroniza negocio, métricas y eventos.

```bash
wodlie-engine dev:story:complete US-001
```

### `wodlie-engine business:sync`

Estado: `implemented`

Reconstruye `overview.md`, `progress.*` y demás artefactos derivados desde `business.json`.

```bash
wodlie-engine business:sync
```

---

## Estado y métricas

### `wodlie-engine status`

Estado: `implemented`

Actualiza el estado completo del proyecto.

```bash
wodlie-engine status
```

**Genera/actualiza:**
- `state.json` — estado global del proyecto
- `progress.json` por capa — métricas de avance
- `.wodlie-config/events.jsonl` — eventos del engine para sincronización y reportes

No hace hoy:
- parseo automático de commits
- consolidación real de changelog desde git
- derivación fuerte desde infra/dev, salvo triggers manuales y comandos estructurados

### `wodlie-engine health`

Estado: `implemented`

Muestra la salud del proyecto en consola de forma visual.

```bash
wodlie-engine health
```

**Muestra:**
- avance global
- backlog por estado
- bloqueadas, pivots y WIP
- último deploy y último incidente
- alertas por riesgo operativo

---

## Reportes

### `wodlie-engine report:draft`

Estado: `implemented`

Genera borrador del reporte semanal interno.

```bash
wodlie-engine report:draft
```

- Lee historias y eventos canónicos
- Genera un borrador Markdown con secciones narrativas vacías
- El operador o la IA completan la parte libre

### `wodlie-engine report`

Estado: `implemented`

Genera el reporte `.tex` para el cliente.

```bash
wodlie-engine report
```

- Genera el `.tex` base
- No compila a PDF
- No reescribe narrativas por sí mismo

---

## Triggers

### `wodlie-engine trigger <nombre>`

Estado: `implemented`

Disparo manual de un trigger.

```bash
wodlie-engine trigger on-deploy --project my-project
wodlie-engine trigger on-incident "caída de API 14:30hs"
wodlie-engine trigger on-milestone --story US-003
wodlie-engine trigger on-pivot --epic EP-001
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

### `wodlie-engine deploy`

Estado: `guided`

Muestra el flujo manual recomendado para deploy.

```bash
wodlie-engine deploy --env staging --target all
wodlie-engine deploy --env production --target api
wodlie-engine deploy --env staging --target front --skip e2e
```

**Flags:**
- `--env` — staging | production
- `--target` — front | admin | api | worker | all
- `--skip` — tests | e2e | perf | security | a11y | ci

No hace hoy:
- push automático
- ejecución remota
- integración CI/CD real

### `wodlie-engine ssh:verify`

Estado: `implemented`

Verifica conexión SSH con el VPS.

```bash
wodlie-engine ssh:verify
```

---

## Ciclo de vida del proyecto

### `wodlie-engine export`

Estado: `implemented`

Genera `.wodlie-export/` con el historial completo del proyecto.

```bash
wodlie-engine export
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

### `wodlie-engine purge`

Estado: `implemented`

Elimina el engine del proyecto. **Hace snapshot git automático antes.**

```bash
wodlie-engine purge
```

Implementación real hoy:
- elimina `.core/`
- elimina `.wodlie-config/`
- elimina `.dev/AGENTS.md`

No hace hoy:
- limpieza selectiva de workflows del engine
- rollback sofisticado

### `wodlie-engine deliver`

Estado: `guided`

Entrega completa al cliente.

```bash
wodlie-engine deliver --target https://github.com/cliente/my-project
```

Hoy imprime la secuencia manual recomendada.

### `wodlie-engine reimport`

Estado: `planned`

Reactiva el engine en un proyecto del cliente.

```bash
wodlie-engine reimport --from https://github.com/cliente/my-project
```

Hoy solo imprime instrucciones manuales.

---

## Engine

### `wodlie-engine upgrade`

Estado: `planned`

Informa actualizaciones disponibles del engine.

```bash
wodlie-engine upgrade
# → versión actual: 1.0.0
# → versión disponible: 1.2.0
# → archivos que cambiarían: ...
# → reglas de AGENTS.md que se actualizarían: ...
```

Hoy no aplica cambios reales.

---

## Módulos

### `wodlie-engine module:add <nombre>`

Estado: `guided`

Copia el módulo desde otro proyecto al path esperado del backend.

```bash
wodlie-engine module:add turnos --from ../my-project
```

No hace hoy:
- adaptación automática con IA
- reporte de compatibilidad
- registro automático en `app.ts`
- commit automático

### `wodlie-engine module:remove <nombre>`

Estado: `guided`

Muestra los pasos manuales para eliminar un módulo.

```bash
wodlie-engine module:remove turnos
```

No hace hoy:
- grafo de dependencias
- migraciones automáticas
- borrado seguro real

---

## Reconciliación

### `wodlie-engine reconcile`

Estado: `implemented`

Reconstruye artefactos derivados desde el modelo canónico actual.

```bash
wodlie-engine reconcile
```

Hoy equivale a una sincronización conservadora de negocio y métricas.

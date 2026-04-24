# @s4wland/wodlie-engine

> Engine CLI para proyectos greenfield con modelo canónico de negocio, eventos y artefactos derivados.
> El estado estructural se gobierna desde comandos del engine; la IA asiste, pero no escribe a mano los artefactos sensibles.

## Estado actual

- Base implementada:
  - `init` para generar un proyecto `node-fastify`
  - modelo canónico en `.wodlie-config/`
  - comandos de negocio para épicos, historias, estados y pivots
  - eventos en `.wodlie-config/events.jsonl`
  - sincronización de `overview.md`, `progress.*`, `state.json` y reportes semanales
- No implementado todavía:
  - servidor MCP
  - reconciliación avanzada de drift
  - portabilidad agentica real de módulos entre proyectos
  - despliegue automático end-to-end
  - upgrade/reimport/deliver automáticos

## Instalación local

El repositorio está pensado para desarrollo local del engine.

### Prerrequisitos

- Node.js >= 20.0.0
- Git
- npm

### Instalar dependencias

```bash
npm install
```

### Verificar build y smoke tests

```bash
npm run build
npm run test:run
```

### Usar la shell interactiva

```bash
wodlie-engine
```

La shell abre una paleta de acciones en terminal:
- escribir `/` muestra el listado de comandos
- escribir `/init` arranca la creación guiada del proyecto
- escribir `/story`, `/epic`, `/status` o `/report-draft` ejecuta acciones sin memorizar flags

---

## Uso rápido del engine

```bash
# Abrir shell interactiva
wodlie-engine

# O crear nuevo proyecto en modo directo
npm run dev -- init mi-proyecto

# Ver estado del proyecto
cd mi-proyecto
wodlie-engine status

# Crear épico e historia canónicos
wodlie-engine business:epic:create EP-001 "Onboarding"
wodlie-engine business:story:create EP-001 US-001 "Registrar brief" --as operador --want "capturar el brief" --so-that "arrancar con contexto"

# Marcar avance desde DEV
wodlie-engine dev:story:complete US-001

# Generar borrador de reporte semanal
wodlie-engine report:draft
```

---

## Documentación

| Documento | Descripción |
|---|---|
| [Getting Started](docs/getting-started.md) | Flujo real de instalación y primer proyecto |
| [Comandos](docs/commands.md) | Estado exacto de cada comando |
| [Templates](docs/templates.md) | Qué genera hoy el template y qué no |
| [Agentes](docs/agents.md) | Cómo debe trabajar la IA con el engine actual |
| [Deploy](docs/deployment.md) | Estado real del flujo de deploy |
| [Current State](docs/current-state.md) | Qué está implementado y qué falta para la visión completa |
| [Philosophy](docs/philosophy.md) | Filosofía objetivo y gap contra el estado real |

## Regla de uso

Los artefactos estructurados que impactan estado, métricas o eventos no se escriben a mano.
La IA o el operador deben usar comandos del engine.
MCP todavía no está implementado en este repositorio.

## Generación selectiva

Durante `init`, el engine pregunta por:
- tipo de proyecto
- tamaño
- stack
- infraestructura
- capabilities

Y luego conserva solo la selección aplicada para:
- carpeta de infraestructura (`vps`, `hosting` o `cloud`)
- perfil de `docker-compose` si existe
- tamaño seleccionado
- compose de capabilities elegidas

---

## Stack soportado

| Stack | Estado |
|---|---|
| node-fastify | implementado |
| python-fastapi | no implementado |
| go-gin | no implementado |

---

## Licencia

Privado — uso exclusivo de Wodlie y operadores autorizados.

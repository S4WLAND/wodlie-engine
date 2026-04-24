# @s4wland/wodlie-engine — Especificación Técnica

> **Estado:** Diseño completado — implementación parcial  
> **Versión:** 0.1.0-design  
> **Autor:** Stifh BL — Wodlie  
> **Fecha:** 2026-04-24

---

## Índice

1. [Declaración de intención](#1-declaración-de-intención)
2. [Problema que resuelve](#2-problema-que-resuelve)
3. [Alcance y límites](#3-alcance-y-límites)
4. [Filosofía y principios](#4-filosofía-y-principios)
5. [Arquitectura del sistema](#5-arquitectura-del-sistema)
6. [Estructura de capas](#6-estructura-de-capas)
7. [Estructura de carpetas](#7-estructura-de-carpetas)
8. [Sistema de commits y changelogs](#8-sistema-de-commits-y-changelogs)
9. [Sistema agentico](#9-sistema-agentico)
10. [Ciclo de vida de un proyecto](#10-ciclo-de-vida-de-un-proyecto)
11. [CLI — comandos](#11-cli--comandos)
12. [Estado actual e implementación pendiente](#12-estado-actual-e-implementación-pendiente)
13. [Decisiones de arquitectura registradas](#13-decisiones-de-arquitectura-registradas)
14. [Evolución futura](#14-evolución-futura)

---

## 1. Declaración de intención

`@s4wland/wodlie-engine` es un framework de SDLC (Software Development Life Cycle) diseñado para operadores de software que gestionan proyectos para clientes. Su propósito es estandarizar, automatizar y documentar el proceso completo de desarrollo — desde el onboarding del cliente hasta la entrega final del producto — sin imponer restricciones sobre el lenguaje, framework o proveedor de infraestructura.

El sistema se instala globalmente como una herramienta CLI y actúa sobre repositorios de proyectos de clientes sin mezclarse con el código de estos. Al finalizar un contrato, el engine se purga del repositorio y el cliente recibe únicamente su código, su documentación y su historial de decisiones.

El objetivo de largo plazo es que este engine sea el núcleo de una plataforma de gestión de proyectos para Wodlie, donde múltiples operadores trabajen proyectos activos con visibilidad centralizada del estado de cada uno.

---

## 2. Problema que resuelve

El desarrollo de software para clientes PYME enfrenta problemas recurrentes que no son de código sino de proceso:

**Falta de estructura documental consistente.** Cada proyecto arranca desde cero con una estructura diferente, lo que hace costoso incorporar nuevos operadores, retomar proyectos pausados o entregar un repositorio comprensible a un tercero.

**Pérdida de contexto entre iteraciones.** Las decisiones de negocio, los pivotes del cliente, los incidentes y los cambios de arquitectura no se registran de forma estructurada. Con el tiempo, nadie recuerda por qué se tomó una decisión.

**Costo alto de incorporar IA al flujo de trabajo.** Los agentes de IA necesitan contexto estructurado para ser útiles. Sin documentación estandarizada y navegable, el agente gasta tokens reconstruyendo contexto que debería estar explícito.

**Fricciones en la entrega.** Al finalizar un contrato no existe un proceso limpio para transferir el proyecto: código, documentación, historial y configuración de infraestructura quedan dispersos.

**Ausencia de trazabilidad.** No hay registro estructurado de qué se completó, qué cambió por solicitud del cliente, qué incidentes ocurrieron ni cuál es el estado real del proyecto en un momento dado.

El engine ataca todos estos problemas con una sola herramienta.

---

## 3. Alcance y límites

### Qué hace el engine

- Genera la estructura completa de un proyecto de cliente con documentación base.
- Establece un sistema de capas separadas para negocio, infraestructura, desarrollo y orquestación.
- Automatiza la actualización de métricas y changelogs a partir de commits tipados.
- Provee una interfaz agentica estructurada para que herramientas de IA lean el proyecto sin gastar contexto innecesario.
- Gestiona el ciclo de vida completo del proyecto: inicio, operación, entrega y posible reimportación.
- Es agnóstico al lenguaje, framework, proveedor de nube y proveedor de dominio.

### Qué no hace el engine

- No es un gestor de código: no reemplaza a Git ni a GitHub.
- No es un panel de control de infraestructura: no reemplaza a Dokploy ni a ningún gestor de contenedores.
- No es un sistema de gestión de tareas: no reemplaza a Trello, Linear ni Jira.
- No genera código de aplicación: no es un generador de boilerplate de negocio.
- No escribe historias de usuario por cuenta propia: necesita input del operador.
- No toma decisiones de negocio: las sugiere, las documenta, pero no las ejecuta sin aprobación.

### Invariantes del sistema

Estas propiedades deben mantenerse en cualquier evolución futura del engine:

1. El código del cliente nunca contiene código del engine en la entrega final.
2. El estado del proyecto persiste en el repositorio del proyecto, no en el engine.
3. Ningún archivo `.json` generado automáticamente se edita manualmente.
4. El operador es siempre el punto de decisión final.
5. La documentación desactualizada activa lectura de código, nunca la suprime.

---

## 4. Filosofía y principios

### 4.1 Separación estricta de responsabilidades

El sistema se organiza en cuatro capas con responsabilidades no superpuestas. Ninguna capa ejecuta la responsabilidad de otra. Ningún archivo cruza de capa sin una razón explícita.

### 4.2 Documentación como primera clase

La documentación no es un subproducto del desarrollo. Es una entrada del sistema. Un módulo sin `README.md` no está completo. Una historia sin criterios de aceptación no puede ser testeada. Un changelog sin entradas tipadas no puede generar métricas.

### 4.3 Automatización de lo repetible, control humano de lo estratégico

Todo proceso que puede inferirse de información ya existente en el repositorio debe ser automático. Los scripts generan métricas, consolidan changelogs y actualizan el estado del proyecto. El operador toma decisiones, aprueba planes y registra contexto que ningún script puede inferir.

### 4.4 Desacoplamiento por diseño

Los módulos se comunican a través de interfaces, nunca de implementaciones directas. Los servicios externos (queue, cache, realtime, estado) se abstraen con adapters intercambiables via variable de entorno. Esto garantiza que una migración tecnológica (de Graphile Worker a Redis, de polling a WebSockets) no requiere reescritura de lógica de negocio.

### 4.5 Variabilidad estructurada

El engine genera configuraciones distintas según el perfil del proyecto (`type`, `size`, `capabilities`). Un proyecto `webapp/small` sin capacidades adicionales genera un `docker-compose.yml` con cinco servicios. Un proyecto `platform/large` con `+ai +realtime +media` genera uno con nueve. La variabilidad está definida y es predecible.

### 4.6 Mínimas carpetas, muchos archivos, poco código por archivo

Se prefieren muchos archivos con pocas líneas de código sobre pocos archivos con bloques infinitos. Se crean carpetas únicamente cuando existe una relación taxonómica o una necesidad funcional real. Esto mejora la navegabilidad para humanos y reduce el costo de contexto para agentes de IA.

### 4.7 Propiedad clara en cada entregable

El repositorio del cliente contiene únicamente lo que pertenece al cliente: código, documentación de negocio e infraestructura, y tests. El engine se purga. El cliente puede contratar a cualquier otro equipo de ingeniería sin dependencia de Wodlie.

---

## 5. Arquitectura del sistema

### 5.1 Componentes

```
@s4wland/wodlie-engine (CLI global)
│
├── Comandos CLI (commander.js)
│   └── Cada comando invoca lógica en src/core/
│
├── Lógica de core (src/core/*.ts)
│   └── Lógica pura desacoplada del transporte CLI
│
├── Adapters (src/adapters/)
│   └── StateAdapter: local (default) → postgres (plataforma futura)
│
├── Templates (src/templates/node-fastify/)
│   ├── structure.ts      ← define árbol de carpetas
│   └── files/            ← archivos con contenido real (templates)
│
└── MCP Server (src/mcp/) ← fase 2, no implementado
```

### 5.2 Flujo de instalación y uso

```
npm install -g @s4wland/wodlie-engine
              ↓
wodlie init <proyecto> --type webapp --size medium --stack node
              ↓
Engine genera estructura en el directorio actual
              ↓
Operador completa variables de entorno y configura Git
              ↓
Operador trabaja el proyecto haciendo commits tipados
              ↓
GitHub Actions detecta tipos de commit → wodlie-state.yml
              ↓
Triggers actualizan state.json + progress.json + changelog.md
              ↓
Al finalizar el contrato: wodlie deliver --target <repo-cliente>
```

### 5.3 Adapters — patrón de escalabilidad

Todos los servicios intercambiables siguen el mismo patrón:

```
src/adapters/<servicio>/
├── adapter.ts          ← interfaz TypeScript (contrato)
├── <impl-A>.adapter.ts ← implementación default (sin dependencias externas)
└── <impl-B>.adapter.ts ← implementación escalada

Variable de entorno controla cuál se usa:
QUEUE_ADAPTER=graphile|redis
CACHE_ADAPTER=memory|redis
REALTIME_ADAPTER=polling|websocket
STATE_ADAPTER=local|postgres
```

Cambiar de implementación no requiere modificar ningún caso de uso ni ningún módulo de negocio.

### 5.4 Rollback en operaciones destructivas

Cualquier comando que modifique o elimine archivos del repositorio del proyecto ejecuta el siguiente patrón antes de operar:

```
1. git stash (snapshot automático)
2. Ejecuta la operación
3. Si falla → git stash pop (restauración automática)
4. Si éxito → git stash drop (limpieza)
```

Esto aplica a: `wodlie purge`, `wodlie deliver`, `wodlie module:remove`, `wodlie upgrade --apply`, `wodlie reimport --apply`.

---

## 6. Estructura de capas

El sistema organiza cada proyecto en cuatro capas con responsabilidades no superpuestas.

### `.business/` — Capa de negocio

Contiene todo lo relacionado con el cliente: requerimientos, historias de usuario, reportes y documentación de onboarding.

**Responsabilidades:**
- Documentar el proceso de levantamiento de requerimientos.
- Registrar épicos, historias, criterios de aceptación y tareas.
- Generar reportes semanales para el cliente.
- Registrar cambios, pivotes y el estado de avance del proyecto desde la perspectiva del negocio.

**No contiene:** código, configuración de infraestructura, ni lógica del engine.

### `.infra/` — Capa de infraestructura

Contiene documentación, guías y templates de configuración para el despliegue del proyecto.

**Responsabilidades:**
- Documentar el tipo de infraestructura elegida (VPS, hosting, cloud).
- Proveer templates de `docker-compose.yml` por perfil de proyecto.
- Documentar el proceso de configuración de secrets, CI/CD y monitoreo.
- Registrar checklists ejecutables de configuración inicial.

**No contiene:** código de aplicación ni documentación de negocio. No ejecuta lógica — es documentación de referencia.

### `.dev/` — Capa de desarrollo

Contiene todo el código fuente, los tests, los estándares técnicos y los workflows de CI/CD del cliente.

**Responsabilidades:**
- Alojar el código fuente completo de todas las aplicaciones del proyecto.
- Definir los estándares de código en `GUIDELINES.md`.
- Contener los workflows de GitHub Actions del cliente (test, deploy).
- Alojar los tests unitarios, de integración, E2E y no funcionales.

**No contiene:** documentación de negocio ni configuración de infraestructura.

### `.wodlie/` — Capa de orquestación

Contiene el estado y la configuración del engine para este proyecto específico. Se purga completamente al entregar el proyecto al cliente.

**Responsabilidades:**
- Almacenar el estado del proyecto (`state.json`).
- Alojar el `AGENTS.md` maestro que gobierna el comportamiento de los agentes de IA.
- Definir los triggers automáticos por tipo de evento.
- Guardar la configuración del engine para este proyecto.

**No contiene:** código de aplicación, documentación de negocio ni configuración de infraestructura.

---

## 7. Estructura de carpetas

### Proyecto generado por `wodlie init`

```
proyecto-cliente/
├── .business/
│   ├── README.md
│   ├── AGENTS.md
│   ├── progress.md
│   ├── progress.json          ← generado por engine
│   ├── changelog.md           ← editable por operador
│   ├── changelog.json         ← generado por engine
│   ├── onboarding/
│   │   ├── brief.md           ← 11 secciones de onboarding del cliente
│   │   ├── contract.json
│   │   ├── checklist.md
│   │   └── assets/{brand,docs,media,data}/
│   ├── requirements/
│   │   ├── overview.md
│   │   └── epics/
│   │       └── EP-001-slug/
│   │           ├── epic.md
│   │           └── stories/
│   │               └── US-001-slug.md
│   └── reports/
│       ├── _template-internal.md
│       ├── internal/
│       └── client/
│
├── .infra/
│   ├── README.md
│   ├── AGENTS.md
│   ├── progress.md
│   ├── progress.json
│   ├── changelog.md
│   ├── changelog.json
│   ├── vps/
│   │   ├── README.md
│   │   ├── checklist.md
│   │   ├── checklist.json
│   │   ├── secrets.md
│   │   ├── ci-cd.md
│   │   └── docker-compose/
│   │       ├── base.yml
│   │       ├── profiles/{webapp,platform,enterprise}.yml
│   │       ├── sizes/{small,medium,large}.yml
│   │       └── capabilities/{ai,automation,native,realtime,media}.yml
│   ├── hosting/
│   │   ├── README.md
│   │   ├── checklist.md
│   │   ├── checklist.json
│   │   └── ci-cd.md
│   └── cloud/
│       ├── README.md
│       ├── checklist.md
│       ├── checklist.json
│       ├── secrets.md
│       └── ci-cd.md
│
├── .wodlie/
│   ├── AGENTS.md              ← maestro: gobierna todas las capas
│   ├── changelog.md
│   ├── changelog.json
│   ├── state.json             ← en .gitignore
│   ├── config/
│   │   ├── project.json
│   │   └── engine-version
│   └── triggers/
│       ├── on-deploy.yml
│       ├── on-incident.yml
│       ├── on-milestone.yml
│       └── on-pivot.yml
│
├── .dev/
│   ├── README.md
│   ├── AGENTS.md
│   ├── GUIDELINES.md          ← estándares técnicos del stack
│   ├── progress.md
│   ├── progress.json
│   ├── changelog.md
│   ├── changelog.json
│   ├── .github/
│   │   └── workflows/
│   │       ├── test.yml
│   │       ├── deploy-staging.yml
│   │       └── deploy-prod.yml
│   └── src/
│       ├── backend-api/
│       ├── frontend-public/
│       └── frontend-admin/
│
├── .gitignore
├── .env.example
└── README.md
```

### Estructura interna de `backend-api/` (template node-fastify)

```
backend-api/
├── Dockerfile
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
├── tests/
│   ├── README.md
│   ├── GUIDELINES.md
│   ├── reports/
│   ├── unit/modules/<modulo>/*.spec.ts
│   ├── integration/modules/<modulo>/*.spec.ts
│   └── non-functional/{performance/*.k6.js,security/zap.config.yml}
└── src/
    ├── server.ts
    ├── app.ts
    ├── config/{env,app,security,media}.ts
    ├── db/
    │   ├── index.ts
    │   ├── schema/*.ts
    │   └── migrations/*.sql
    ├── shared/{logger,errors,response,types,utils}.ts
    ├── plugins/{auth,cors,rate-limit,error-handler}.plugin.ts
    ├── adapters/
    │   ├── queue/{adapter,graphile,redis}.adapter.ts
    │   └── cache/{adapter,memory,redis}.adapter.ts
    ├── cli/{create-admin,seed}.ts
    ├── modules/<nombre>/
    │   ├── index.ts
    │   ├── README.md
    │   ├── http/{routes,controller,contract}.ts
    │   ├── use-cases/*.ts
    │   ├── domain/repository.ts
    │   └── infra/{repository,queries}.ts
    └── workers/{media,notifications}.worker.ts
```

### Estructura interna de `frontend-public/` y `frontend-admin/`

```
frontend-*/
├── Dockerfile
├── package.json
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── .env.example
├── tests/
│   ├── README.md
│   ├── GUIDELINES.md
│   ├── reports/
│   ├── unit/features/<feature>/*.spec.ts
│   ├── e2e/features/<feature>/*.spec.ts
│   └── non-functional/accessibility/*.spec.ts
└── src/
    ├── app/               ← Next.js App Router
    ├── features/<nombre>/ ← lógica por dominio
    │   ├── index.ts
    │   ├── README.md
    │   ├── components/
    │   ├── hooks/
    │   ├── api/{queries,mutations,types}.ts
    │   ├── store/
    │   ├── events/
    │   ├── styles/
    │   └── types/
    ├── components/{ui,layout}/    ← globales (+ tables,forms,charts en admin)
    ├── shared/
    │   ├── api/{client,interceptors,cache/}
    │   ├── utils/{device,formatters,storage,events}/
    │   ├── realtime/              ← solo en admin
    │   │   ├── adapter.ts
    │   │   ├── polling.adapter.ts
    │   │   └── websocket.adapter.ts
    │   └── store/
    ├── hooks/
    ├── types/
    ├── styles/{tokens.css,globals.css,utilities.css}
    └── middleware.ts
```

---

## 8. Sistema de commits y changelogs

### 8.1 Tipos de commit por capa

El engine extiende Conventional Commits con scopes específicos por capa:

```
DEV
  feat(dev/<modulo>)     ← nueva funcionalidad
  fix(dev/<modulo>)      ← corrección de bug
  refactor(dev/<modulo>) ← refactor sin cambio de comportamiento
  test(dev/<modulo>)     ← tests
  perf(dev/<modulo>)     ← optimización

BUSINESS
  docs(business/<ep>)   ← actualización de requerimientos
  pivot(business/<ep>)  ← cambio de dirección solicitado por el cliente
  story(business/<ep>)  ← nueva historia de usuario
  epic(business/<ep>)   ← nuevo épico

INFRA
  config(infra/<tipo>)  ← cambio de configuración
  deploy(infra)         ← deploy completado
  incident(infra)       ← incidente registrado
  migrate(infra)        ← cambio de proveedor o tecnología

CORE/ENGINE
  chore(core)           ← regeneración de archivos del engine
  trigger(core)         ← ejecución de trigger
  release               ← nueva versión del proyecto
```

### 8.2 Qué genera cada commit

Los commits tipados disparan GitHub Actions (`wodlie-state.yml`) que ejecutan el trigger correspondiente. El trigger llama a `wodlie status`, que:

1. Lee los archivos de las capas para extraer métricas.
2. Actualiza `state.json` con el estado de salud del proyecto.
3. Actualiza `progress.json` por capa.
4. Lee `changelog.md` (editado por operador) y el historial de git.
5. Consolida ambas fuentes en `changelog.json` (para IA y sistemas).
6. Regenera la sección `<!-- AUTO-GENERATED -->` en `progress.md`.

### 8.3 Separación de fuentes del changelog

```
changelog.md   → escrito por el operador con formato estricto:
                 ### [YYYY-MM-DD] — vX.X.X — [NUEVO|CAMBIO|PIVOT|CORRECCIÓN|PAUSA]
                 
changelog.json → generado por el engine combinando:
                 1. commits tipados del historial de git
                 2. entradas de changelog.md del operador
                 → fuente de verdad para IA y plataforma Wodlie
```

El operador nunca edita `changelog.json` directamente.

### 8.4 Flags de omisión en commits

Para casos donde el operador necesita hacer un commit sin disparar ciertos workflows:

```
[skip tests]    → omite todos los tests
[skip unit]     → omite tests unitarios
[skip e2e]      → omite tests E2E
[skip perf]     → omite tests de performance
[skip security] → omite análisis de seguridad
[skip a11y]     → omite tests de accesibilidad
[skip ci]       → omite todo el CI
```

Los tests no funcionales se controlan también por variables en GitHub:
`ENABLE_PERF_TESTS`, `ENABLE_SECURITY_TESTS`, `ENABLE_A11Y_TESTS`.

---

## 9. Sistema agentico

### 9.1 Arquitectura de AGENTS.md

Cada capa tiene su propio `AGENTS.md` con instrucciones específicas para agentes de IA. El `AGENTS.md` maestro vive en `.wodlie/` y los referencia a todos.

```
Agente abierto desde proyecto/   → lee .wodlie/AGENTS.md (maestro)
Agente abierto desde .dev/       → lee .dev/AGENTS.md
Agente abierto desde .business/  → lee .business/AGENTS.md
Agente abierto desde .infra/     → lee .infra/AGENTS.md
```

### 9.2 Árbol de navegación por tipo de tarea

El agente navega la documentación en orden antes de tocar código:

```
Tarea de código:
  .dev/AGENTS.md → .dev/GUIDELINES.md → módulo/README.md → código

Tarea de negocio:
  .business/AGENTS.md → overview.md → epic.md → US-XXX.md

Tarea de infraestructura:
  .infra/AGENTS.md → tipo/README.md → checklist.md
```

### 9.3 Reglas universales del agente

Estas reglas se definen en `.wodlie/AGENTS.md` y aplican en todas las capas:

- Nunca ejecutar cambios destructivos sin confirmar con el operador.
- Nunca asumir comportamiento no documentado: preguntar.
- Nunca editar archivos `.json` generados automáticamente.
- Siempre actualizar el `README.md` del módulo después de cambios.
- Si la documentación y el código difieren: el código es la verdad, la documentación está desactualizada y debe corregirse.
- Documentación desactualizada activa lectura de código obligatoria.

### 9.4 Modo plan

El agente decide activar modo plan cuando detecta:

- El cambio afecta más de un módulo.
- Hay eliminación de código o archivos existentes.
- Hay cambios en el schema de base de datos.
- El prompt tiene ambigüedad sobre el alcance.
- El cambio es irreversible sin intervención manual.

En modo plan el agente presenta su análisis, los conflictos detectados y el plan de acción paso a paso. El operador revisa y aprueba antes de que el agente ejecute.

### 9.5 Importación de módulos entre proyectos

```
wodlie module:add turnos --from ../proyecto-origen

1. Engine copia la carpeta del módulo
2. Agente analiza diferencias de contexto:
   - entidades que cambian de nombre
   - imports que deben actualizarse
   - reglas de negocio que difieren
3. Agente presenta lo que puede hacer solo y lo que necesita confirmar
4. Operador responde las preguntas mínimas
5. Agente entra en modo plan con el plan de adaptación
6. Operador aprueba
7. Agente ejecuta y genera module-add-report.md
8. Commit automático: feat(dev/<nombre>): acoplar módulo desde <origen>
```

---

## 10. Ciclo de vida de un proyecto

### 10.1 Inicio

```
wodlie init <proyecto> --type <tipo> --size <tamaño> --stack <stack>
```

El engine pregunta de forma interactiva el nombre de las apps, las capabilities a activar, el sistema de estilos y el nivel de testing. Genera la estructura completa del proyecto con toda la documentación base.

### 10.2 Operación

Durante la vida del proyecto, el operador trabaja con Git normalmente. Los commits tipados disparan automáticamente la actualización del estado del proyecto. `wodlie status` puede ejecutarse manualmente en cualquier momento.

El reporte semanal se genera con `wodlie report:draft` (que pre-completa el borrador) y `wodlie report` (que genera el `.tex` para el cliente).

### 10.3 Entrega

```
wodlie deliver --target https://github.com/<cliente>/<repo>
```

Ejecuta en orden:
1. `wodlie export` → genera `.wodlie-export/` con el historial completo.
2. `wodlie purge` → elimina todo rastro del engine del repositorio.
3. Mirror del repositorio al destino del cliente.
4. Genera documento de entrega formal.

El cliente recibe: código fuente, documentación, workflows de CI/CD propios y `.wodlie-export/` como historial de su proyecto.

### 10.4 Reimportación

Si el cliente decide reactivar el servicio:

```
wodlie reimport --from https://github.com/<cliente>/<repo>
```

El engine detecta diferencias entre el repositorio actual del cliente y el último snapshot de Wodlie. Genera `conflict-report.md`. El operador lo revisa y ejecuta `wodlie reimport --apply` para reactivar el engine con el historial restaurado.

---

## 11. CLI — comandos

### Inicialización
| Comando | Descripción |
|---|---|
| `wodlie init <proyecto>` | Genera proyecto con las 4 capas |

### Estado y métricas
| Comando | Descripción |
|---|---|
| `wodlie status` | Actualiza state.json + progress.json + changelog.md |
| `wodlie health` | Muestra estado de salud en consola |

### Entornos
| Comando | Descripción |
|---|---|
| `wodlie env:sync` | Sincroniza claves entre .env.example y el VPS |

### Módulos
| Comando | Descripción |
|---|---|
| `wodlie module:add <nombre>` | Importa módulo con asistencia agentica |
| `wodlie module:remove <nombre>` | Elimina módulo limpiamente (siempre modo plan) |

### Reportes
| Comando | Descripción |
|---|---|
| `wodlie report:draft` | Genera borrador del reporte semanal |
| `wodlie report` | Genera .tex para el cliente |

### Triggers
| Comando | Descripción |
|---|---|
| `wodlie trigger <nombre>` | Disparo manual de un trigger |

### Deploy
| Comando | Descripción |
|---|---|
| `wodlie deploy` | Deploy al entorno indicado |
| `wodlie ssh:verify` | Verifica conexión SSH con el VPS |

### Ciclo de vida
| Comando | Descripción |
|---|---|
| `wodlie export` | Genera .wodlie-export/ con historial completo |
| `wodlie purge` | Elimina el engine del proyecto |
| `wodlie deliver` | Entrega completa al cliente |
| `wodlie reimport` | Reactiva el engine en proyecto del cliente |
| `wodlie reimport --apply` | Aplica reimport tras revisar conflict-report |

### Engine
| Comando | Descripción |
|---|---|
| `wodlie upgrade` | Informa actualizaciones disponibles |
| `wodlie upgrade --apply` | Aplica actualización con snapshot de seguridad |

---

## 12. Estado actual e implementación pendiente

### Completado en diseño, pendiente de implementación

```
COMPLETADO (especificación)
✅ Arquitectura de 4 capas con responsabilidades definidas
✅ Sistema de commits tipados con scopes por capa
✅ Flujo de changelog: operador → git → changelog.json
✅ Patrón de adapters para queue, cache, realtime y state
✅ Sistema agentico con árbol de navegación y AGENTS.md por capa
✅ Ciclo de vida completo: init → operar → deliver → reimport
✅ Estructura de carpetas para template node-fastify
✅ CLI con todos los comandos definidos
✅ Rollback via git stash en operaciones destructivas
✅ Variabilidad por perfil: type × size × capabilities
✅ Separación wodlie-*.yml vs deploy-*.yml en CI/CD
✅ Auth cross-subdomain con cookie de dominio compartido
✅ Módulo de reimportación con conflict-report

IMPLEMENTADO (código base)
✅ Estructura del paquete npm (@s4wland/wodlie-engine)
✅ CLI entry point con commander.js
✅ StateAdapter: interfaz + LocalAdapter + PostgresAdapter (stub)
✅ Documentación en docs/ (getting-started, commands, agents, templates, deployment)
✅ GitHub Actions para el propio engine (test.yml, publish.yml)
✅ Templates base de raíz del proyecto (.gitignore, README.md, .env.example)
✅ Stubs de todos los comandos en src/core/

PENDIENTE DE IMPLEMENTAR
⬜ src/core/init.ts — lógica real de generación de proyecto
⬜ src/core/status.ts — lectura de capas + generación de métricas
⬜ src/core/health.ts — display de salud en consola
⬜ src/core/report.ts — generación de .tex desde .md
⬜ src/core/deliver.ts — flujo completo de entrega
⬜ src/core/purge.ts — remoción limpia del engine
⬜ src/core/module.ts — importación agentica de módulos
⬜ Queue adapters: GraphileAdapter, RedisAdapter (BullMQ)
⬜ Cache adapters: MemoryAdapter, RedisAdapter (ioredis)
⬜ Templates completos de las 4 capas en src/templates/node-fastify/
⬜ AGENTS.md maestro y por capa con contenido real
⬜ GUIDELINES.md completo para stack node-fastify
⬜ scripts/status.sh, report.sh, trigger.sh en template .wodlie/
⬜ GitHub Actions wodlie-state.yml (detección de tipo de commit)
⬜ MCP Server (src/mcp/) — fase 2
```

---

## 13. Decisiones de arquitectura registradas

### DA-001 — CLI global en lugar de dependencia del proyecto

**Decisión:** El engine se instala globalmente (`npm install -g`) y no se agrega como dependencia en `package.json` del proyecto del cliente.

**Razón:** El engine debe ser removible sin dejar rastros en el código del cliente. Si viviera como dependencia, aparecería en `node_modules/` y `package.json` después de la entrega.

**Consecuencia:** El operador debe tener el engine instalado en su máquina. El versionado es por proyecto vía `.wodlie/config/engine-version`.

---

### DA-002 — Estado del proyecto en el repositorio, no en el engine

**Decisión:** Los archivos de estado (`state.json`, `progress.json`, `changelog.json`) viven en el repositorio del proyecto, no en el engine ni en un servicio externo.

**Razón:** El estado es información del proyecto, no del engine. Necesita ser versionado por Git, accesible para todos los operadores del proyecto y visible para los agentes de IA que navegan el repositorio.

**Consecuencia:** `state.json` y `progress.json` están en `.gitignore` (se regeneran). `changelog.json` sí va a Git porque es fuente de verdad de decisiones. Cuando exista la plataforma Wodlie, `STATE_ADAPTER=postgres` sincronizará el estado con una DB externa sin cambiar la lógica del engine.

---

### DA-003 — .core/ renombrado a .wodlie/

**Decisión:** La capa de orquestación del engine se llama `.wodlie/` en el proyecto generado, no `.core/`.

**Razón:** El paquete npm tiene una carpeta `src/core/` con la lógica de los comandos. Tener también `.core/` en el proyecto generado crea ambigüedad para operadores nuevos y para agentes de IA que navegan el repositorio.

**Consecuencia:** La purga al entregar el proyecto elimina `.wodlie/` completo. El nombre hace explícito que es infraestructura del engine, no del cliente.

---

### DA-004 — changelog.json no se edita manualmente

**Decisión:** El operador edita `changelog.md` con formato tipado. El engine genera `changelog.json` combinando ese archivo con el historial de git.

**Razón:** `changelog.json` es consumido por agentes de IA y por la plataforma Wodlie. Si contiene entradas mal formadas o inconsistentes por edición manual, los sistemas que lo consumen producen resultados incorrectos. `changelog.md` es el punto de entrada humano; `changelog.json` es el punto de salida para máquinas.

---

### DA-005 — Adapters para toda tecnología intercambiable

**Decisión:** Queue, cache, realtime y state se abstraen con el patrón adapter. La implementación se selecciona por variable de entorno.

**Razón:** Los proyectos comienzan con configuraciones livianas (Graphile Worker, cache en memoria, polling) y escalan a configuraciones más robustas (Redis, WebSockets) sin reescribir lógica de negocio. El punto de variabilidad debe estar en la infraestructura, no en el dominio.

**Consecuencia:** Agregar una nueva implementación es crear un archivo `*.adapter.ts` y actualizar el factory. Ningún caso de uso cambia.

---

### DA-006 — Tests en carpeta separada, nunca colocados junto al código

**Decisión:** Los tests viven en `tests/unit/`, `tests/integration/`, `tests/e2e/` dentro de cada app. No se colocan junto a los archivos de código fuente.

**Razón:** El objetivo del sistema es que el agente de IA y el operador puedan rastrear errores por feature sin cruzar concerns. Si los tests están junto al código, un agente que navega `features/turnos/` mezcla contexto de implementación con contexto de testing. La separación permite navegar uno u otro según la tarea.

**Consecuencia:** La vinculación entre test y código se hace vía comentario en el header del spec (`@see .business/requirements/.../US-XXX.md`) y vía naming consistente de carpetas.

---

### DA-007 — Documentación de QA dentro de tests/, sin carpeta .dev/qa/

**Decisión:** `README.md`, `GUIDELINES.md` y `reports/` de QA viven dentro de `tests/` en cada app, no en una carpeta `.dev/qa/` separada.

**Razón:** La documentación de testing es más útil al lado de los tests que en una subcarpeta del engine. El operador que revisa un test falla busca el `README.md` de tests en el mismo lugar donde están los specs, no en otra parte del árbol.

---

## 14. Evolución futura

### Plataforma Wodlie (fase 2)

La plataforma Wodlie consumirá el engine a través de su API y su MCP Server. Los proyectos activos expondrán su estado vía `STATE_ADAPTER=postgres` a una base de datos central. La plataforma ofrecerá:

- Panel de control multi-proyecto para operadores.
- Gestión centralizada de clientes y contratos.
- Generación automática de proyectos desde licitaciones aprobadas (webhook desde sistema licitador externo).
- Historial centralizado de todos los proyectos entregados.

La arquitectura del engine está diseñada para esta evolución: cambiar `STATE_ADAPTER` es suficiente para conectar un proyecto activo a la plataforma.

### MCP Server (fase 2)

El engine expondrá todas sus operaciones como herramientas MCP, permitiendo que agentes de IA (Claude Code, Cursor, Windsurf) las invoquen directamente. El MCP Server será la capa de transporte entre el agente y la lógica de `src/core/`, sin duplicar esa lógica.

### Templates adicionales (según demanda)

El sistema está diseñado para múltiples templates de stack. Los candidatos naturales son:

- `python-fastapi` — para proyectos con mayor necesidad de procesamiento de datos o ML.
- `go-gin` — para servicios con requisitos estrictos de performance.

La estructura de capas (`.business/`, `.infra/`, `.wodlie/`, `.dev/`) es idéntica para todos los templates. Solo varía el contenido de `src/` y las secciones tecnológicas de `GUIDELINES.md`.

### Sistema licitador (sistema externo)

El sistema que gestiona propuestas comerciales a clientes (modelo suscripción mensual y pago único documentado en el PDF de propuesta comercial de Wodlie) es un proyecto separado. Al confirmarse una licitación, emitirá un webhook a la plataforma Wodlie, que disparará `wodlie init` de forma automatizada para el nuevo proyecto. El trigger manual via CLI es el equivalente actual de ese proceso.

---

*Documento generado con base en la sesión de diseño completa.*  
*Próxima revisión cuando avance la implementación de `src/core/init.ts`.*

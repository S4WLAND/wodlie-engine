# AGENTS.md — Maestro del Engine

Proyecto gestionado con `wodlie-engine`. La fuente de verdad estructural vive en los artefactos del engine y debe operarse por CLI.

> Para reglas universales y árbol de lectura por tipo de tarea, ver `.core/AGENTS.md`.
> Para reglas específicas de infra (cuándo actualizar `.infra/`), ver `.infra/AGENTS.md`.

## Regla principal

No editar manualmente los artefactos estructurados del engine si existe un comando para hacerlo. Primero usar `wodlie-engine`; después revisar la documentación o el código generado.

## Comandos

```bash
wodlie-engine                         # consola interactiva (menús: Business, Infra, Reports, Project)

# estado y diagnóstico
wodlie-engine status
wodlie-engine health

# negocio
wodlie-engine business:epic:list
wodlie-engine business:story:list
wodlie-engine business:sync
wodlie-engine dev:story:complete US-001

# infra
wodlie-engine infra:edit
wodlie-engine infra:sync
wodlie-engine env:sync
wodlie-engine ssh:verify

# reportes
wodlie-engine report:draft
wodlie-engine report

# entornos locales
npm run env:sync
npm run dev:up
npm run dev:down
npm run test:up
npm run test:expose
```

Si algún servicio sigue en modo `neutral`, `npm run dev:up` y `npm run test:up` sólo funcionarán después de completar o adaptar el stack real.

## Archivos auto-gestionados (no editar a mano)

- `.wodlie-config/project.json`
- `.wodlie-config/business.json`
- `.wodlie-config/events.jsonl`
- `.business/progress.md`, `.business/progress.json`
- `.business/changelog.json`

## Archivos editables manualmente

- `.business/changelog.md` (texto libre)
- `.business/reports/internal/YYYY-WNN.md` (input para reporte cliente)
- `.business/requirements/epics/...` (solo via comandos del engine)
- `.infra/vps/*.md` (regenerables con `infra:sync`)
- Todo el código en `.dev/`

## Secuencia recomendada

1. Abrir `wodlie-engine` (consola interactiva)
2. Revisar negocio en `Business`
3. Revisar infra en `Infra`
4. Trabajar código en `.dev/`
5. Cerrar historias con `wodlie-engine dev:story:complete <ID>`
6. Generar reporte con `wodlie-engine report:draft`

## Commits

- Seguir Conventional Commits: `type(scope): descripción`
- Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
- Scope: refleja el directorio o capa afectada (ej: `business/reports`, `business/onboarding`, `dev/backend-api`)
- **Prohibido agregar al agente IA como co-autor en ningún commit.** No incluir líneas `Co-Authored-By` de agentes.
- **Prohibido hacer commits sin que el operador lo pida explícitamente.** Aplicar cambios en archivos, confirmar con el operador, y esperar instrucción de commit.
- **Prohibido hacer push bajo ninguna circunstancia sin instrucción explícita del operador.**

## Cuándo pedir confirmación humana

- Antes de borrar carpetas del proyecto
- Antes de regenerar `.infra/` si hubo edición manual importante
- Antes de cambiar estados o historias sin contexto claro
- Antes de operaciones destructivas o de entrega

## Referencias

- `.core/AGENTS.md` → router cross-layer + reglas universales
- `.business/AGENTS.md`, `.infra/AGENTS.md`, `.dev/AGENTS.md` → capas específicas

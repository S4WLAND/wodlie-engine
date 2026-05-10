# AGENTS.md — Capa de Infraestructura

## Contexto
Infraestructura operativa del proyecto:

- orquestación local `dev/test` con Docker
- exposición controlada de `test`
- CI/CD en GitHub Actions por servicio
- producción remota en VPS + Dokploy sólo para `production`

La ficha técnica base sigue viviendo en `.wodlie-config/project.json`, pero los scripts, plantillas y runbooks activos viven en `.infra/`.

## Navegación — leer en este orden
1. `.infra/README.md` — mapa general de entornos, directorios y comandos
2. `.infra/vps/README.md` — arquitectura remota y topología de expose
3. `.infra/vps/ci-cd.md` — workflows, tags de release, runner local, Dokploy
4. `.infra/vps/secrets.md` — claves, variables, examples y catálogos
5. `.infra/vps/checklist.md` — pasos operativos y validaciones

## Regla obligatoria de documentación

Cada cambio que afecte deploy, Docker, env vars, expose de `test`, runner local o Dokploy debe actualizar `.infra/` dentro del mismo cambio.

### Cuándo actualizar
Cualquier cambio en:
- `.github/workflows/**`
- `.infra/scripts/**`
- `.infra/docker/**`
- `.infra/env/**`
- `Dockerfile`, `.dockerignore`, compose o build args
- `.env.example` por app
- GitHub Actions Secrets / Variables
- Dokploy apps, tags, dominios o estrategias de release
- puertos, dominios, rutas públicas o comandos `npm` de entornos

### Destino por tipo de cambio
| Cambio | Documento |
|---|---|
| Claves nuevas, eliminadas o renombradas | `vps/secrets.md` |
| Workflow, tags, release, Dokploy, Docker, expose/close | `vps/ci-cd.md` |
| Pasos operativos, runner local, validaciones o mantenimiento | `vps/checklist.md` |
| Arquitectura, dominios, topología, VPS, túneles | `vps/README.md` |

## Reglas operativas
- Usar `wodlie-engine infra:edit` solo para cambios de ficha técnica del VPS
- Usar `wodlie-engine infra:sync` si quieres regenerar la documentación base desde `project.json`
- Usar `npm run env:sync` para materializar `.env.development` y `.env.test` desde los `.env.example` de cada app
- Usar `npm run env:check` para validar que los examples sigan cubriendo el código real
- Usar `npm run dev:*` y `npm run test:*` como superficie principal de operación local
- Usar `wodlie-engine ssh:verify` para validar acceso SSH cuando cambie el VPS
- Si vas a regenerar `.infra/` tras edición manual, avisar primero

## Archivos editables manualmente
- `.infra/README.md`
- `.infra/vps/README.md`
- `.infra/vps/checklist.md`
- `.infra/vps/secrets.md`
- `.infra/vps/ci-cd.md`
- `.infra/env/*.example`
- `.infra/scripts/**`
- `.infra/docker/**`

## Cuándo escalar a `.core/AGENTS.md`
- Cambio de proveedor o panel de infraestructura
- Cambio de estrategia base de deploy o release
- Cambio que afecte a la vez `.infra/`, `.dev/` y flujo de negocio

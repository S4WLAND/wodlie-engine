# Deploy — Estado actual

## Qué sí es real hoy

- Docker local `dev` y `test` en `.infra/`
- `env:sync`, `env:check`, `infra:status` e `infra:ports`
- `dev:shell` y `test:shell` por servicio para diagnóstico operativo
- `test:open` / `test:expose` de `test` vía `.infra/env/test-expose.env`, usando env temporal para no contaminar el modo local
- `media-nginx` local para servir uploads en `dev/test`
- helper de actualización robusta para `test` en `.infra/scripts/ci/update-test-service.ps1`
- workflows base de test por servicio y promoción manual granular hacia producción

## Qué sigue siendo guiado

### `wodlie-engine deploy`

Estado: `guided`

Hoy:

- valida que estás en un proyecto Wodlie
- muestra entorno, target y skips
- imprime pasos manuales recomendados

No hace:

- push a git
- invocar CI/CD real
- ejecutar SSH
- desplegar contenedores
- verificar healthchecks por sí mismo

### `wodlie-engine ssh:verify`

Estado: `implemented`

Valida una conexión SSH básica con la ficha del proyecto.
No administra secretos ni paneles remotos.

## Relación con `.github/`

El proyecto generado ya reserva `.github/workflows/`, pero no todos los proyectos arrancan con workflows activos.
La convención es:

- workflows en la raíz
- scripts operativos en `.infra/scripts/ci/`
- documentación viva en `.infra/`
- cada workflow promueve o valida un servicio concreto: `backend-api`, `frontend-public` o `frontend-admin`
- la promoción a producción debe esperar el estado real del deployment remoto antes de marcar éxito

## Regla honesta del bootstrap

- si los tres servicios están en presets runnable, el stack local queda preconfigurado
- si algún servicio está en `neutral`, el proyecto trae el contrato y la documentación, pero no un deploy/stack operativo para ese servicio
- los workflows quedan como estándar reutilizable, pero requieren completar secrets, vars, apps remotas y permisos por proyecto

# Progress Checklist — Backend API

> Última actualización: {{DATE}}

## Estado actual

- Fase activa: bootstrap y estructura base
- Preset inicial: `fastify`
- Engine business progress: ver `.business/progress.md`

## Bootstrap

- [x] Estructura `adapters/`, `cli/`, `config/`, `db/`, `modules/`, `plugins/`, `shared/`, `workers/`
- [x] Template de módulo en `modules/_template/`
- [x] Configuración base (`app`, `env`, `security`, `media`)
- [x] Logger, errores tipados y response helpers
- [x] Adaptadores de cache y queue
- [x] Plugins base de Fastify
- [x] `/health` y arranque vacío

## Próximos pasos

- [ ] Elegir el primer módulo real
- [ ] Modelar schema y migraciones
- [ ] Definir auth si aplica
- [ ] Completar tests del primer flujo de negocio
- [ ] Alinear Docker/CI si el backend deja de ser solo bootstrap

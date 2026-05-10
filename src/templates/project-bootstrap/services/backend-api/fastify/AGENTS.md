# AGENTS.md — Backend API

Leer en este orden:

1. `.dev/development_guidelines.md`
2. `README.md`
3. `CONTEXT_AI.md`
4. `PROGRESS_CHECKLIST.md`
5. `src/modules/<module>/README.md` cuando exista un módulo real

Reglas:

- mantener `modules/` con `domain/use-cases/infra/http`
- no mover lógica de negocio a `plugins/` ni a `shared/`
- actualizar `.env.example` si cambia el contrato de configuración

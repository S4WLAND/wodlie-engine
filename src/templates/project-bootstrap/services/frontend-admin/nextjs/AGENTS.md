# AGENTS.md — Frontend Admin

Leer en este orden:

1. `.dev/development_guidelines.md`
2. `README.md`
3. `CONTEXT_AI.md`
4. `PROGRESS_CHECKLIST.md`
5. `src/modules/<module>/README.md` cuando exista un módulo real

Reglas:

- mantener la lógica administrativa dentro de `src/modules/`
- los hooks de auth/permisos/realtime viven en `shared/`
- actualizar `.env.example` si cambia el contrato de configuración

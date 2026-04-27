# AGENTS.md — Capa de Infraestructura

## Contexto
Capa de infraestructura. No tiene código ejecutable propio.
Tiene: documentación, metadatos y checklists ejecutables.

## Navegación
1. `README.md` (concepto general)
2. `<tipo>/README.md` (vps | hosting | cloud)
3. `<tipo>/checklist.md` (qué configurar)

## Reglas
- NUNCA modificar `.env.production` directamente
- SIEMPRE usar modo plan para cambios de infraestructura
- Cambios de proveedor (migrate) → documentar en `changelog.md`
- Cambios de despliegue o servicios → documentar en el README/checklist del tipo de infra
- Variables sensibles → gestionar según `vps/secrets.md`

## Cuándo escalar a `.core/AGENTS.md`
- Cambios que afectan múltiples capas
- Migraciones de proveedor completas
- Incidentes que requieren decisión de arquitectura

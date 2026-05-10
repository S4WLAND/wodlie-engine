# Context AI — Frontend Admin

Decisiones técnicas, gotchas y deuda conocida del panel administrativo.

> Última actualización: {{DATE}}

## Resumen ejecutivo

Frontend en Next.js App Router con:

- `modules/` para dominios administrativos
- `shared/hooks` para auth, permisos y realtime
- `shared/store` para estado transversal del panel

## Decisiones técnicas

### Panel separado del sitio público

- auth, navegación y permisos pueden evolucionar sin contaminar el frontend público
- el panel puede usar hooks y estados específicos de operación interna

### Realtime desacoplado

- `NEXT_PUBLIC_REALTIME_ADAPTER` define si el panel usa polling o websocket
- `shared/realtime` concentra el adapter en vez de repartirlo por módulos

## Estado inicial

- login placeholder
- layout privado base
- dashboard placeholder
- hooks de auth/permisos/realtime listos para adaptar

## Recordatorios

- si un módulo requiere permisos, documentarlo en su README
- si se agregan nuevas `NEXT_PUBLIC_*`, reflejarlas en `.env.example`

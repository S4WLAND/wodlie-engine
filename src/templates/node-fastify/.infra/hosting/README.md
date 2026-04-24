# Hosting Compartido — {{PROJECT_NAME}}

## Cuándo usar hosting compartido

- Proyectos simples (landing page + formulario de contacto)
- Sin Docker, sin base de datos propia
- Presupuesto ajustado en fase 1
- PHP/WordPress o HTML estático

## Limitaciones

- Sin Docker → no aplica el stack Node.js/Fastify estándar
- Sin acceso SSH root → no se puede configurar SSL propio
- Sin base de datos propia → usar servicio externo (PlanetScale, Supabase, etc.)

## Alternativas recomendadas

Para proyectos Node.js en hosting compartido, considerar:
- **Railway** — free tier generoso, deploy desde git
- **Render** — similar a Railway, buena DX
- **Fly.io** — containers cerca del usuario

## Configuración básica

Ver `checklist.md` para los pasos específicos del hosting contratado.

# Deploy — Estado actual

El engine no despliega automáticamente hoy.
Los comandos de deploy y ssh son utilidades guiadas.

## `wodlie deploy`

Qué hace hoy:
- valida que estás en un proyecto Wodlie
- muestra entorno, target y skips
- imprime los pasos manuales recomendados

Qué no hace:
- push a git
- invocar CI/CD
- ejecutar SSH
- desplegar contenedores
- verificar healthchecks por sí mismo

## `wodlie ssh:verify`

Qué hace hoy:
- lee `SSH_HOST` y `SSH_USER` desde `.env.development`
- intenta una conexión simple por SSH

Qué no hace:
- genera claves
- registra secrets
- administra Dokploy

## Qué queda documentado en el template

El template `node-fastify` incluye documentación e índices base en `.infra/` para:
- VPS
- hosting
- cloud

Eso es documentación de referencia inicial, no automatización funcional del engine.

## Para una implementación completa faltaría

- surface real para registrar secretos remotos
- integración CI/CD efectiva
- deploy declarativo por perfil/capability
- healthchecks post-deploy automáticos
- eventos de deploy disparados por workflows y no manualmente

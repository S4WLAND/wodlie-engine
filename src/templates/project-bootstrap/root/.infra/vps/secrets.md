# Gestión de Secrets y Variables — VPS

Se regenera con `wodlie-engine infra:sync`.

Reglas base:

- nunca commitear valores reales
- `.env.example` define claves; `.env.development` y `.env.test` viven fuera de git
- `npm run env:sync` crea y completa archivos locales sin pisar valores

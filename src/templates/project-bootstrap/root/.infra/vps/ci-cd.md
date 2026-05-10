# CI/CD — VPS

El detalle de CI/CD se regenera con `wodlie-engine infra:sync`.

Convenciones base:

- workflows en `.github/workflows/`
- scripts auxiliares en `.infra/scripts/ci/`
- promoción manual o automatizada por servicio
- `test` local separado de `production`

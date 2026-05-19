Los workflows del proyecto deben vivir en esta carpeta.

Reglas:

- GitHub Actions no reconoce workflows fuera de `.github/workflows/`
- si el proyecto sigue con servicios `neutral`, documentar el flujo antes de automatizarlo
- los workflows estándar validan y actualizan `backend-api`, `frontend-public` y `frontend-admin` por separado
- la promoción a producción es manual, por servicio, y requiere `commit_sha` revisado en `test`
- antes de activar producción completar GitHub Secrets, GitHub Variables y apps remotas reales
- cualquier cambio en workflows debe reflejarse también en `.infra/`

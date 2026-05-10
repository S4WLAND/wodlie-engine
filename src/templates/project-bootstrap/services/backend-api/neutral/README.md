# Backend API

Preset `neutral` para el backend.

Este servicio nace sin framework ni runtime preconfigurado. El objetivo es dejar:

- estructura estándar de carpetas
- contrato documental
- `.env.example`
- tests y módulos con convención clara

## Estructura esperada

```text
backend-api/
├── src/
│   ├── adapters/
│   ├── cli/
│   ├── config/
│   ├── db/
│   ├── modules/
│   ├── plugins/
│   ├── shared/
│   └── workers/
└── tests/
    ├── unit/modules/
    ├── integration/modules/
    └── non-functional/
```

Si luego elegís Fastify u otra tecnología, mantené esta topología o documentá la variante equivalente.

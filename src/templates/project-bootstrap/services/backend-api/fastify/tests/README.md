# Tests — backend-api

## Estructura

```
tests/
├── unit/
│   └── modules/
│       └── _template/      ← copiar para cada módulo
├── integration/
│   └── modules/
│       └── _template/      ← copiar para cada módulo
├── non-functional/
│   ├── performance/        ← k6 load tests
│   └── security/           ← OWASP ZAP
└── reports/
    ├── coverage/           ← generado por Vitest
    └── e2e/                ← generado por Playwright
```

## Ejecutar

```bash
npm run test          # watch mode
npm run test:run      # una sola vez (CI)
```

## Convenciones

- Formato: `Given/When/Then` en el nombre del test
- Referenciar US-XXX en el header del archivo
- Un archivo de test por caso de uso o comportamiento

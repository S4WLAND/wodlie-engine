# Contribuir a `@s4wland/wodlie-engine`

## Setup local

```bash
cd wodlie-engine
npm install
npm run build
npm run test:run
```

## Flujo de trabajo

- usar `npm run dev -- <comando>` para iterar la CLI
- mantener `src/` como fuente de verdad
- no editar `dist/`; se regenera con `npm run build`
- si el cambio toca artefactos estructurados, agregar o actualizar smoke tests en `scripts/run-tests.mjs`

## Documentación

- actualizar `README.md` y `docs/` cuando cambie el comportamiento real
- no documentar funcionalidades como implementadas si siguen siendo guiadas o placeholders

## Commits

- `feat:` funcionalidad nueva
- `fix:` corrección
- `docs:` documentación
- `chore:` mantenimiento interno
- `refactor:` cambios estructurales sin nueva funcionalidad

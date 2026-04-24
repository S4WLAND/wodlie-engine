# AGENTS.md — Reglas de trabajo para `wodlie-engine`

Este archivo define cómo deben trabajar agentes de IA y desarrolladores sobre este repositorio.
Aplica a toda la raíz del proyecto salvo que una carpeta hija defina reglas más específicas.

## Principio general

- `src/` es la fuente de verdad.
- `dist/` es artefacto generado; no se edita a mano.
- Los cambios deben reflejar el estado real del engine, no una visión aspiracional.
- Si una capacidad sigue siendo guiada, parcial o placeholder, la documentación debe decirlo explícitamente.

## Flujo mínimo para cualquier cambio

1. Entender el comportamiento actual leyendo código y documentación relevante.
2. Implementar el cambio en `src/` y archivos fuente relacionados.
3. Actualizar pruebas o smoke tests si el comportamiento cambió.
4. Actualizar la documentación afectada.
5. Registrar el cambio en `CHANGELOG.md` si modifica comportamiento, flujo, UX, comandos o alcance real del producto.
6. Ejecutar `npm run build` y, cuando aplique, `npm run test:run`.

## Cuándo actualizar documentación

Actualiza `CHANGELOG.md` cuando el cambio:
- agrega, elimina o modifica comandos
- cambia el flujo de uso
- cambia prompts, UX de terminal o generación del template
- cambia el estado real de una funcionalidad implementada/guided/planned
- corrige una limitación importante que afecte al usuario

Actualiza `README.md` cuando el cambio:
- afecta instalación, uso rápido o posicionamiento del proyecto
- cambia el modo principal de operar el engine

Actualiza `docs/commands.md` cuando el cambio:
- modifica flags, prompts, salidas, estados o limitaciones reales de un comando

Actualiza `docs/getting-started.md` cuando el cambio:
- altera el flujo recomendado para arrancar o usar el engine por primera vez

Actualiza `docs/current-state.md` cuando el cambio:
- mueve el estado real entre implementado, guiado o planificado
- cierra o abre una limitación relevante

Actualiza `docs/templates.md` o `docs/deployment.md` cuando el cambio:
- modifica lo que genera el template
- cambia qué parte del deploy es real y qué parte sigue siendo manual

Actualiza `docs/agents.md` cuando el cambio:
- modifica cómo debe operar una IA sobre proyectos Wodlie o sobre este engine

## Regla de consistencia documental

Si un cambio importante toca comportamiento del producto, no se considera completo hasta que:
- el código compile
- el changelog esté actualizado
- la documentación afectada refleje el nuevo estado real

No mezclar:
- código nuevo con documentación vieja
- documentación optimista con comportamiento todavía no implementado

## Convención de commits

Usar formato:

```text
tipo(scope): resumen corto
```

Tipos permitidos:
- `feat`: funcionalidad nueva visible
- `fix`: corrección de bug o regresión
- `docs`: cambios de documentación
- `refactor`: reestructuración sin cambio funcional buscado
- `test`: pruebas o smoke tests
- `chore`: mantenimiento interno

Scopes recomendados:
- `cli`
- `init`
- `business`
- `report`
- `deploy`
- `docs`
- `templates`
- `core`

Ejemplos:
- `feat(cli): agregar shell interactiva por defecto`
- `fix(init): recortar template segun infra seleccionada`
- `docs(commands): aclarar limites de generacion selectiva`
- `test(report): cubrir borrador semanal desde eventos canonicos`

## Reglas de implementación

- No editar `dist/` manualmente.
- No introducir una funcionalidad como “implementada” si sigue imprimiendo pasos manuales.
- Mantener compatibilidad con Node.js `>=20`.
- Preferir cambios pequeños y coherentes sobre refactors amplios sin cerrar flujo.
- Si se agrega una opción nueva a la CLI, revisar si también debe existir en la shell interactiva.
- Si se cambia `init`, revisar tanto prompts como recorte real del template y documentación derivada.
- Si se cambia el modelo canónico o artefactos derivados, revisar impacto en `status`, `report`, `health` y smoke tests.

## Verificación mínima esperada

Para cambios normales:

```bash
npm run build
```

Para cambios que tocan comandos, plantillas o artefactos estructurados:

```bash
npm run build
npm run test:run
```

## Qué no hacer

- No usar `dist/` como fuente para implementar cambios.
- No dejar comandos nuevos sin documentar.
- No cambiar el flujo principal de uso sin reflejarlo en `README.md`, `docs/getting-started.md` y `CHANGELOG.md`.
- No prometer composición real de templates, deploy automático o MCP si todavía no existe.
- No borrar limitaciones conocidas de la documentación sin haberlas resuelto en código.

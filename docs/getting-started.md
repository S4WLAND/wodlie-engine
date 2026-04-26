# Getting Started

## Prerrequisitos

- **Node.js >= 20.0.0** — [descargar](https://nodejs.org)
- **Git** — configurado con usuario y email
- **npm**

---

## 1. Preparar el engine localmente

```bash
git clone <repo>
cd wodlie-engine
npm install
npm run build
npm run test:run
npm link
```

---

## 2. Abrir la shell del engine

```bash
wodlie-engine
```

Dentro de la shell:
- `Project > Inicializar proyecto nuevo`
- `Business > Epics` y `Business > Stories`
- `Reports` para reportes semanales

También puedes seguir usando modo directo:

```bash
wodlie-engine init my-project
```

Hoy `init` pregunta de forma interactiva por:
- tipo de proyecto
- tamaño
- stack
- infraestructura
- nombre del cliente
- nombre del operador
- dominio
- email de SSL
- tipo de contrato
- capabilities

Y recorta el template para dejar solo:
- la carpeta de infra seleccionada
- el tamaño seleccionado
- el perfil correspondiente si existe
- las capabilities elegidas

### Estructura generada

```
my-project/
├── .business/        ← capa de negocio
├── .infra/           ← capa de infraestructura
├── .core/            ← orquestación del engine
├── .dev/             ← capa de desarrollo + código
├── .wodlie-config/   ← config del engine (se purga al entregar)
│   ├── project.json
│   ├── business.json
│   ├── architecture.json
│   └── events.jsonl
├── .gitignore
├── .env.example
└── README.md
```

---

## 3. Crear negocio canónico

```bash
cd my-project
wodlie-engine
# luego usar Business > Epics y Business > Stories
```

---

## 4. Sincronizar artefactos y métricas

```bash
wodlie-engine business:sync
wodlie-engine status
wodlie-engine health
```

---

## 5. Registrar avance desde desarrollo

```bash
wodlie-engine dev:story:complete US-001
wodlie-engine report:draft
```

---

## Límites actuales

- Solo `node-fastify` está implementado de verdad.
- `env:sync` trabaja sobre `.env.development` locales, no sincroniza un VPS real.
- `deploy`, `deliver`, `reimport` y `upgrade` siguen siendo flujos guiados/manuales.
- No existe servidor MCP todavía; la interfaz autoritativa es la CLI.

## Siguiente lectura

- [Comandos](commands.md)
- [Templates](templates.md)
- [Agentes](agents.md)
- [Current State](current-state.md)

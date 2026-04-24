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
```

---

## 2. Generar un proyecto

```bash
npm run dev -- init my-project \
  --type webapp \
  --size medium \
  --stack node
```

Hoy `init` pregunta de forma interactiva por:
- nombre del cliente
- nombre del operador
- dominio
- email de SSL
- tipo de contrato
- capabilities

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
wodlie business:epic:create EP-001 "Onboarding"
wodlie business:story:create EP-001 US-001 "Registrar brief" \
  --as operador \
  --want "capturar el brief" \
  --so-that "arrancar con contexto"
```

---

## 4. Sincronizar artefactos y métricas

```bash
wodlie business:sync
wodlie status
wodlie health
```

---

## 5. Registrar avance desde desarrollo

```bash
wodlie dev:story:complete US-001
wodlie report:draft
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

# Módulo Admin: _template

> Copiar esta carpeta completa y renombrar con el nombre del módulo de negocio.

## Historia de usuario

Referencia: US-XXX — [nombre de la historia]

## Responsabilidad

[Qué gestiona el admin en este módulo: qué entidad, qué operaciones CRUD, qué vistas.]

## Estructura disponible

```
<nombre>/
├── index.ts          ← exporta el módulo
├── README.md
├── components/       ← componentes específicos: tablas, formularios, modales
├── hooks/            ← hooks del módulo
├── api/
│   ├── queries.ts    ← React Query queries
│   ├── mutations.ts  ← React Query mutations
│   └── types.ts      ← tipos de la API
├── store/            ← estado local del módulo (selección, filtros, paginación)
└── types/            ← tipos internos del módulo
```

No crear carpetas vacías. Solo las que el módulo realmente usa.

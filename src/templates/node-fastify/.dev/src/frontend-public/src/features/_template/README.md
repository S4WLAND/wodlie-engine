# Feature: _template

> Copiar esta carpeta y renombrar con el nombre de la feature.

## Historia de usuario

Referencia: US-XXX — [nombre de la historia]

## Responsabilidad

[Qué hace esta feature. Qué problema del usuario resuelve.]

## Estructura

```
_template/
├── index.ts          ← exportaciones públicas de la feature
├── README.md         ← este archivo
├── components/       ← componentes específicos
├── hooks/            ← hooks específicos
├── api/
│   ├── queries.ts    ← React Query queries
│   ├── mutations.ts  ← React Query mutations
│   └── types.ts      ← tipos de la API
├── store/            ← Zustand store (si necesita estado global)
├── events/           ← eventos cross-feature
├── styles/           ← estilos de la feature
└── types/            ← tipos internos
```

## Dependencias

- Ninguna

## Changelog

| Versión | Fecha | Autor | Cambio |
|---|---|---|---|
| 1.0.0 | {{DATE}} | {{OPERATOR}} | Feature creada desde template |

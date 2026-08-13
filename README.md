# Playbook

Portal editorial de Playbook (negocio del deporte, México/LATAM). App
Next.js (App Router) con Postgres, Auth.js, TipTap y Vercel Blob —
migrada desde un sitio estático (HTML/JS vanilla, sin build).

## Estado del proyecto

**Antes de tocar nada, leer [`docs/ENCYCLOPEDIA.md`](./docs/ENCYCLOPEDIA.md).**
Es la referencia de arquitectura vigente: cómo está armada la app, qué
decisiones de stack se tomaron y por qué. Los pendientes viven en
[`docs/TODO.md`](./docs/TODO.md). El registro histórico de la migración
(2026, por sesión) está archivado en
[`docs/archive/HANDOFF.md`](./docs/archive/HANDOFF.md) — es archivo, no
documentación viva.

## Cómo correr en local

```bash
npm install
cp .env.local.example .env.local   # completar las variables, ver docs/ENCYCLOPEDIA.md
npm run db:migrate                  # aplica el schema de Postgres
npm run dev
```

## Estructura

- `app/`, `lib/`, `components/`, `styles/` — la app Next.js.
- `scripts/` — migraciones de schema, publicación de artículos, checks
  editoriales (`check-voice.mjs`, `find-duplicates.mjs`) y utilidades.
- `.claude/` — skills de Claude Code (publicación editorial) y el corpus
  compartido de reglas editoriales (`.claude/playbook-editorial/`).
- `graphify-out/` — grafo de conocimiento del código, committeado
  (consultar con `python3 scripts/graph-query.py query "..."`).

## Convención: documentación

La arquitectura se documenta en `docs/ENCYCLOPEDIA.md` y los pendientes en
`docs/TODO.md` — mantener esos dos al día con cada cambio estructural. No
crear changelogs separados; el historial fino vive en git.

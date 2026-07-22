# Playbook

Portal editorial de Playbook (negocio del deporte, México/LATAM). App
Next.js (App Router) con Postgres, Auth.js, TipTap y Vercel Blob —
migrada desde un sitio estático (HTML/JS vanilla, sin build).

## Estado del proyecto

**Antes de tocar nada, leer [`HANDOFF.md`](./HANDOFF.md).** Ese archivo
tiene el estado real: qué se hizo en cada fase de la migración, qué
decisiones de stack se tomaron, y un registro de progreso por sesión con
el detalle de qué se hizo y qué queda pendiente. Este README es solo
referencia operativa rápida (cómo correr el proyecto) — el estado y el
historial de trabajo viven en `HANDOFF.md`, no acá.

## Cómo correr en local

```bash
npm install
cp .env.local.example .env.local   # completar las variables, ver HANDOFF.md
npm run db:migrate                  # aplica el schema de Postgres
npm run migrate:json                # carga articles.json/content.json (una sola vez, idempotente)
npm run dev
```

## Estructura

- `app/`, `lib/`, `components/`, `styles/` — la app Next.js.
- `scripts/` — migraciones de schema y de datos, seed de editores.

## Convención: mantener el registro de progreso al día

Este proyecto avanza en sesiones grandes (múltiples archivos por push). Para
que cualquiera pueda retomarlo sin releer todo el historial de commits:

**Después de cada sesión de trabajo con cambios de código reales**, agregar
una entrada al "Registro de progreso" en `HANDOFF.md` con fecha, qué se
hizo, cómo se verificó, y qué queda pendiente para la siguiente sesión. Si
cambió el orden o alcance de las fases restantes, actualizar también
"Próximos pasos" en ese mismo archivo. Todo el historial de avance vive ahí
— no crear archivos de changelog separados ni duplicar el registro en el
README.

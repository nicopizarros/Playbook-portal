# Playbook

Portal editorial de Playbook (negocio del deporte, México/LATAM). **En
migración** de sitio estático (HTML/JS vanilla, sin build) a una app
Next.js (App Router) con Postgres, Auth.js, TipTap y Vercel Blob.

## Estado del proyecto

**Antes de tocar nada, leer [`HANDOFF.md`](./HANDOFF.md).** Ese archivo
tiene el estado real: qué fase de la migración está hecha, qué decisiones
de stack se tomaron, y un registro de progreso por sesión con el detalle de
qué se hizo y qué queda pendiente. Este README es solo referencia operativa
rápida (cómo correr el proyecto) — el estado y el historial de trabajo
viven en `HANDOFF.md`, no acá.

## Cómo correr en local

```bash
npm install
cp .env.local.example .env.local   # completar las variables, ver HANDOFF.md
npm run db:migrate                  # aplica el schema de Postgres
npm run migrate:json                # carga articles.json/content.json (una sola vez, idempotente)
npm run dev
```

## Estructura

- `app/`, `lib/`, `components/`, `styles/` — la app Next.js nueva.
- `legacy/` — el sitio estático original completo, conservado como
  referencia mientras se reconstruye cada pieza. No se despliega. Se borra
  en el corte final de la migración (ver `HANDOFF.md`).
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

# Handoff — Playbook: migración a Next.js

Documento de continuidad. Objetivo: que cualquiera (persona o sesión de
Claude Code nueva) pueda retomar el proyecto sin tener que releer todo el
historial de commits/PRs. **Este archivo se actualiza en cada sesión de
trabajo relevante** — ver la convención al final. Última actualización:
2026-07-20.

## Qué es esto

Playbook está migrando de un sitio estático sin build (HTML/JS vanilla +
Vercel Serverless Functions, con `articles.json`/`content.json` como base de
datos en el propio repo) a una app Next.js (App Router) con Postgres, Auth.js,
TipTap y Vercel Blob. El plan completo de la migración (arquitectura, schema
de base de datos, fases) vive en la conversación que lo aprobó; este
documento es el resumen operativo de **qué está hecho y qué falta**.

El sitio legado sigue intacto en `legacy/` (HTML/CSS/JS/admin/api/lib
originales) — se conserva como referencia mientras se reconstruye cada pieza
en la app nueva, y se borra recién en el corte final (ver "Pendientes"). La
producción actual (`playbook-portal-phi.vercel.app`) sigue sirviendo desde
`main`, sin tocar, durante toda la migración.

## Decisiones de stack tomadas

| Decisión | Elegido | Alternativa descartada |
|---|---|---|
| Base de datos | Vercel Postgres (Neon) | Supabase Postgres |
| ORM | Drizzle ORM | Prisma |
| Envío de magic links (lectores) | Resend | SMTP/nodemailer |
| Límite de artículos gratis/mes (lectores anónimos) | 3 | 4 |

Otras decisiones de arquitectura (por qué `legacy/lib/*.js` no se reutiliza
tal cual, por qué `bodyJson`/`bodyHtml` conviven en `articles`, por qué los
editores no pasan por el adapter de Auth.js, etc.) están documentadas como
comentarios en el propio código — buscar el archivo relevante antes de
asumir que hace falta volver a decidir algo.

## Mapa de archivos

- `legacy/` — sitio estático original completo, intacto, solo de referencia.
- `public/assets/` — assets reales (logo, banners) migrados desde
  `legacy/` (antes `assets/`), en uso por la app nueva.
- `lib/db/schema.ts` — schema completo de Drizzle (10 tablas: articles,
  site_content, content_revisions, editors, tablas de lectores de Auth.js,
  anon_readers, article_reads, media).
- `lib/db/client.ts` — cliente Drizzle (driver `pg`, funciona igual en local
  y contra Vercel Postgres).
- `drizzle/` — migraciones SQL generadas (`npm run db:generate` para
  regenerar tras un cambio de schema).
- `scripts/run-migrations.ts` — aplica las migraciones de schema.
- `scripts/migrate-json-to-db.ts` — migración única e idempotente de
  `articles.json`/`content.json` a Postgres. Ya corrida y verificada contra
  Postgres real (ver registro de progreso abajo).
- `scripts/seed-editors.ts` — migra `ADMIN_USERS` a la tabla `editors` con
  contraseñas hasheadas (bcrypt).

## Variables de entorno

Ver `.env.local.example` (crear una copia como `.env.local` para desarrollo
local). Claves necesarias: `POSTGRES_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`,
`RESEND_API_KEY`, `EMAIL_FROM`, `BLOB_READ_WRITE_TOKEN`, `PLAYBOOK_SECRET`
(webhook de Make.com), y para el seed único de editores, `ADMIN_USERS` con
el mismo formato que tenía el sitio legado (`usuario:pass,usuario:pass`).

## Cómo correr en local

```bash
npm install
# Levantar Postgres local (o apuntar POSTGRES_URL a uno remoto)
npm run db:generate   # solo si cambiaste lib/db/schema.ts
npm run db:migrate    # aplica el schema
npm run migrate:json  # carga articles.json/content.json (idempotente)
ADMIN_USERS="aldo:...,nico:...,guillermo:..." npm run db:seed-editors
npm run dev
```

## Registro de progreso

Cada entrada resume una sesión/push relevante: qué se hizo, cómo se
verificó, y qué queda pendiente para la siguiente. **No borrar entradas
viejas** — es el historial que reemplaza tener que leer todos los commits.

### 2026-07-20 — Fase 1: scaffold + schema + migración de datos

- Archivado el sitio estático completo a `legacy/`, assets reales movidos a
  `public/assets/`.
- Creado el scaffold de Next.js (`package.json`, `tsconfig.json`,
  `next.config.ts` — este último ya incluye los redirects permanentes desde
  cada URL legada `*.html` a su ruta nueva sin extensión).
- Creado el schema completo de Drizzle (10 tablas, ver `lib/db/schema.ts`).
- Escritos y **verificados contra Postgres real** (no solo compilados):
  `scripts/run-migrations.ts`, `scripts/migrate-json-to-db.ts` (30/30
  artículos y las 11 secciones de `content.json` migradas correctamente,
  re-corrida confirmada idempotente), `scripts/seed-editors.ts` (3 cuentas
  de prueba sembradas con hash bcrypt).
- `tsc --noEmit` limpio.
- **Pendiente para la siguiente sesión**: Fase 2 (páginas públicas de
  lectura, port del sistema de diseño CSS, SEO/sitemap/feed/robots) — ver
  "Próximos pasos" abajo, es la tarea #2 de la lista de tareas de la sesión.

## Próximos pasos (a la fecha de la última entrada del registro)

1. **Fase 2** — Páginas públicas (`/`, `/articulo`, `/archivo`, `/autor`,
   `/tema`, `/404`) contra la base de datos, port 1:1 del CSS (`css/*.css`
   de `legacy/` a `styles/`, sin reescribir selectores/tokens),
   `generateMetadata` por ruta, `app/sitemap.ts`, `app/robots.ts`,
   `app/feed.xml/route.ts`.
2. **Fase 3** — Auth.js (lectores por email, editores por credenciales),
   `middleware.ts` para la cookie de lector anónimo, lógica de medición
   (3 artículos/mes) y muro de captura de email.
3. **Fase 4** — Editor TipTap + subida de imágenes a Vercel Blob, panel de
   admin reconstruido (dashboard con preview en vivo y detección de
   conflictos, analítica), migración del webhook de Make.com.
4. **Fase 5** — Pulido: paridad de modo oscuro, transiciones/estados de
   hover y carga, accesibilidad, Lighthouse.
5. **Fase 6** — Verificación end-to-end (ver plan completo para el detalle
   de qué probar) y corte a producción.

## Convención: cómo mantener este archivo

Después de cada sesión de trabajo con cambios de código reales (no
correcciones triviales), agregar una entrada nueva al "Registro de
progreso" arriba, con: fecha, qué se hizo, cómo se verificó (no solo "se
escribió"), y qué queda pendiente. Actualizar también "Próximos pasos" si
cambió el orden o el alcance de lo que sigue. El README apunta acá para el
estado del proyecto — no dupliques el registro ahí.

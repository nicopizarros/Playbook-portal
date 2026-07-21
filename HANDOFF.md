# Handoff — Playbook: migración a Next.js

Documento de continuidad. Objetivo: que cualquiera (persona o sesión de
Claude Code nueva) pueda retomar el proyecto sin tener que releer todo el
historial de commits/PRs. **Este archivo se actualiza en cada sesión de
trabajo relevante** — ver la convención al final. Última actualización:
2026-07-21.

**PR abierto**: [#22](https://github.com/nicopizarros/Playbook-portal/pull/22)
(`claude/playbook-nextjs-migration-9zn6nh` → `main`) — sigue todas las fases
2-4 en un solo PR de trabajo en progreso (no mergear todavía, Fase 4 no está
terminada). Seguir trabajando en esa misma rama, no crear una nueva.

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

### 2026-07-20 — Fix: build roto en Vercel (sin `app/`)

- El PR de la Fase 1 dejó `npm run build` fallando en Vercel
  (`Couldn't find any 'pages' or 'app' directory`) porque esa fase solo
  agregó config/DB/scripts, sin ninguna página — reproducido en local con
  el mismo error exacto antes de tocar nada.
- Agregado `app/layout.tsx` + `app/page.tsx` como **placeholder temporal**
  (`robots: noindex`, texto simple "migración en progreso") solo para que
  el build tenga algo que compilar mientras la Fase 2 construye las páginas
  reales. Se reemplaza por completo en la Fase 2, no es la home definitiva.
- Verificado: `next build` y `tsc --noEmit` limpios en local.

### 2026-07-20 — Fase 2: páginas públicas + SEO + sistema de diseño

- CSS portado 1:1 a `styles/` (mismos selectores/tokens/cascada de modo
  oscuro), con un único cambio deliberado: `--serif-display`/`--sans` ahora
  referencian variables de `next/font/google` (Anton + Inter autohospedadas,
  mismo family/weight) en vez de los `<link>` de Google Fonts.
- Capa de datos server-only (`lib/data/articles.ts`, `lib/data/site-content.ts`,
  `lib/rank.ts`, `lib/taxonomy.ts`, `lib/related-articles.ts`) sobre Drizzle,
  reemplazando el patrón legado de "fetch del JSON completo" por queries
  directas — sigue filtrando en memoria (30 artículos hoy, tope de 500 del
  webhook legado) en vez de SQL por filtro, a propósito, para minimizar
  superficie de bugs a este tamaño de corpus.
- Todas las páginas públicas construidas y verificadas contra Postgres real:
  `/`, `/articulo` (con `generateMetadata`, JSON-LD, artículos relacionados,
  compartir), `/archivo` (filtros como enlaces reales, funciona sin JS),
  `/autor`, `/tema`, `/404` + `not-found.tsx`, más `app/sitemap.ts`,
  `app/robots.ts`, `app/feed.xml/route.ts`.
- **Bug real encontrado y corregido durante la verificación** (no solo
  compilación limpia): Next.js intentaba pre-renderizar `/` de forma
  **estática en build time**, lo que hubiera congelado el contenido hasta el
  próximo deploy pese a que artículos/contenido cambian en vivo (webhook,
  admin). Corregido con `export const dynamic = 'force-dynamic'` en
  `app/(public)/layout.tsx`; `app/sitemap.ts` recibió el mismo diagnóstico
  pero con el fix correcto para ese caso (`export const revalidate = 3600`,
  ISR en vez de dynamic, ya que un sitemap no necesita ir a la base de datos
  en cada request de un crawler).
- **Segundo bug real encontrado y corregido**: mismatch de hidratación en
  `data-theme` del `<html>` (el script anti-FOUC lo setea antes de que
  React hidrate, algo que React no puede saber de antemano) — corregido con
  `suppressHydrationWarning` en `<html>`, el patrón que la propia
  documentación de Next.js recomienda para este caso exacto.
- Verificación real ejecutada, no solo afirmada: `tsc --noEmit` y
  `next build` limpios; recorrido de rutas con `next dev` + `curl`
  (`/`, `/articulo?id=...` real y uno inexistente → 404 real en vez del
  "soft 404" del sitio legado, `/archivo` con combinaciones de filtros,
  `/autor`, `/tema` con tag válido e inválido, `/404`, una ruta no
  registrada); chequeo automatizado de que ningún `<a>` queda anidado
  dentro de otro (regresión real del sitio legado) en home/archivo/artículo;
  `sitemap.xml` y `feed.xml` parseados y validados (52 URLs, 30 items);
  smoke test con Playwright (`scripts/smoke-test.mjs`, queda en el repo)
  cubriendo toggle de tema + persistencia + sobrevive a reload, drawer móvil
  (abre, Escape cierra), buscador. Los únicos errores de consola detectados
  son recursos externos (Instagram embed.js, YouTube, Unsplash) bloqueados
  por la política de red de este sandbox, no bugs de la app.
- **Fuera de alcance a propósito, pendiente para más adelante**: GA4 +
  Vercel Web Analytics (`js/analytics.js` legado) todavía no se portó — no
  estaba en el plan detallado de Fase 2 y se evitó agregarlo sin planearlo
  primero (ver "scope creep" señalado por la auditoría de Fase 1). El
  módulo "Más leídas" de portada (dependiente de credenciales de GA4 Data
  API que el equipo nunca terminó de configurar en el sitio legado) tampoco
  se portó todavía.
- **Pendiente para la siguiente sesión**: Fase 3 (Auth.js, medición,
  muro de email) — ver "Próximos pasos" abajo.

### 2026-07-20 — Fix: `npm run build` roto en Vercel (falta `POSTGRES_URL`)

- **Corrige una afirmación equivocada de la entrada anterior**: ahí se
  dijo que `app/sitemap.ts` con `revalidate = 3600` (ISR) era "el fix
  correcto" para ese caso. Era un error — ISR se ejecuta en build time para
  generar su payload inicial, y Vercel todavía no tiene un Postgres de
  producción conectado (`POSTGRES_URL` no configurado ahí), así que
  `next build` fallaba en seco en `/sitemap.xml`. Reproducido en local
  moviendo `.env.local` fuera del paso antes de tocar nada (no fue un
  diagnóstico a ciegas).
- Cambiado `app/sitemap.ts` a `export const dynamic = 'force-dynamic'`
  (mismo patrón ya usado en `app/(public)/layout.tsx` y
  `app/feed.xml/route.ts`).
- **Ese fix solo no alcanzó**: al volver a compilar sin `POSTGRES_URL`, el
  build siguió fallando, ahora en `/feed.xml` — una ruta que YA era
  `force-dynamic`. Causa raíz real, más profunda de lo que parecía: en
  `lib/db/client.ts`, `export const db = drizzle(getPool(), ...)` llamaba a
  `getPool()` (que lanzaba si faltaba `POSTGRES_URL`) en el momento de
  *importar el módulo*, no de usarlo — y Next.js importa los Route Handlers
  durante "Collecting page data" en build time sin importar si son
  `force-dynamic` o no (a diferencia de algunos Server Components de
  página, donde esto no se disparó). Corregido sacando el `throw` eager:
  `pg.Pool` no hace I/O al construirse, así que ahora una `POSTGRES_URL`
  faltante recién falla cuando una request real intenta una query, nunca
  bloqueando el build.
- Verificado en ambos sentidos, no solo "compila": build completo sin
  `POSTGRES_URL` (los 10 routes, éxito); build completo con Postgres real
  (sin regresión); `sitemap.xml`/`feed.xml` servidos por `next dev` contra
  la base real siguen devolviendo el mismo contenido de antes (52 URLs, 30
  items) — el cambio de ISR a `force-dynamic` no rompió el contenido, solo
  cuándo se genera. `tsc --noEmit` limpio.
- **Lección para las próximas fases**: cualquier ruta nueva que lea de la
  base de datos (Fases 3-4 van a agregar varias) tiene que usar
  `force-dynamic`, no `revalidate`/ISR, hasta que haya una Postgres de
  producción conectada de forma estable en Vercel — y aun con eso conectado,
  preferir `force-dynamic` salvo que haya una razón real de cache.

### 2026-07-21 — Fase 3: Auth.js + medición + muro de correo

- Sin cambios de schema: las tablas que esta fase necesita (`users`,
  `accounts`, `verificationTokens`, `editors`, `anonReaders`,
  `articleReads`) ya existían desde la Fase 1. Confirmado con
  `@auth/drizzle-adapter`'s tipos que `sessionsTable` es opcional y no hace
  falta bajo estrategia JWT — no se agregó.
- `auth.ts`: una instancia de Auth.js, dos proveedores — `Resend` (lectores,
  magic link) y `Credentials` (editores, bcrypt contra `editors`) — con un
  `role: 'reader'|'editor'` derivado del proveedor que autenticó, nunca de
  input del cliente. `middleware.ts` mintea una cookie firmada
  (`pb_anon`, HMAC vía Web Crypto para funcionar en Edge o Node) sin tocar
  la base de datos; `lib/metering.ts` crea la fila de `anon_readers` recién
  cuando hace falta de verdad. `lib/data/articles.ts` ganó
  `getArticleMetaById` (columnas seguras, nunca `teaser`/`bodyJson`/
  `bodyHtml`) — `app/(public)/articulo/page.tsx` solo pide el cuerpo
  completo después de que `resolveEntitlement` ya confirmó acceso.
- **Tres bugs reales encontrados y corregidos durante la verificación** (no
  solo compilación limpia):
  1. **13 de los 30 artículos migrados tienen `teaser` con HTML real**
     (`<p>`, `<strong>` — rastreado hasta el commit legado "carga 13
     artículos nuevos"). La lógica de la Fase 2 (heredada tal cual del
     `js/article-page.js` legado) partía el texto por `\n{2,}` y lo
     escapaba, así que esos 13 artículos mostraban literalmente `&lt;p&gt;`
     en pantalla — un bug real, preexistente en el sitio legado también
     (mismo código), no algo introducido acá. Corregido: se detecta si el
     `teaser` ya es HTML y se renderiza como tal
     (`dangerouslySetInnerHTML`, seguro acá porque el contenido viene de
     datos migrados o del equipo editorial interno, nunca de un usuario
     final), en vez de reproducir el bug del sitio legado a propósito —
     esto es "estrictamente mejor", no una desviación de fidelidad.
  2. **`signIn('resend', {..., redirect:false})` no devuelve
     `{error, ok}`** para proveedores que no son Credentials — devuelve un
     string (la URL de destino), verificado leyendo el código fuente real
     de `next-auth/lib/actions.js`, no asumido. El chequeo original
     (`if (result?.error)`) nunca podía ser verdadero, así que un envío de
     magic link fallido (probado con una `RESEND_API_KEY` inválida, error
     401 real de Resend visible en los logs) igual mostraba "¡Listo!
     Revisa tu correo" — un falso positivo. Corregido inspeccionando la URL
     devuelta (`/api/auth/error` o un query param `error=`).
  3. Menor: el comentario sobre los índices únicos de `article_reads` en
     `lib/db/schema.ts` decía "partial unique indexes" — inexacto (ninguno
     tiene `WHERE`), ya señalado por la auditoría de la Fase 1 como "corregir
     cuando se toque el archivo". Corregido de paso.
- **Verificación real contra Postgres y un servidor real, no solo
  `tsc`/`build`**: secuencia completa de medición con `curl` + cookie jar
  persistente (lecturas 1-3 completas, lectura 4 con muro, re-leer el
  artículo #1 sigue completo sin gastar cupo — los 5 casos correctos);
  confirmado que la respuesta del muro **no contiene** el texto del
  `teaser` del artículo (grep directo); `User-Agent: Googlebot` de vuelta a
  acceso completo incluso con cupo agotado; login de editor probado de
  punta a punta contra los endpoints reales de Auth.js (`/api/auth/csrf` +
  `/api/auth/callback/credentials`), con contraseña correcta e incorrecta;
  flujo de magic link probado con Playwright real contra la UI real del
  muro de correo (`scripts/test-email-wall.mjs`, queda en el repo), incluida
  la corrección del bug #2 de arriba. `next build` limpio con y sin
  `POSTGRES_URL` (misma disciplina que la Fase 2).
- **Gap reconocido explícitamente, no escondido**: enviar y hacer clic en
  un magic link real no es verificable en este sandbox (sin salida de
  correo real) — necesita una `RESEND_API_KEY` real y una bandeja de
  entrada real, pendiente de verificación manual una vez desplegado.
- **Pendiente para la siguiente sesión**: Fase 4 (TipTap, Vercel Blob,
  panel de admin, webhook de Make.com) — ver "Próximos pasos" abajo.

### 2026-07-21 — Fase 4 (en progreso): schema `sourceUrl` + webhook de Make.com

- **Cambio de schema, revisado contra datos reales antes de aplicarlo**: el
  plan original proponía un índice único parcial sobre `articles.substackUrl`
  para que el webhook de Make.com pudiera deduplicar con un
  `onConflictDoNothing` atómico. Antes de aplicar la migración se corrió un
  chequeo de duplicados contra el Postgres local y aparecieron 4 grupos de
  artículos (hasta 9 filas) compartiendo un mismo `substackUrl` — todos posts
  tipo "Industry Shots", donde un solo post de Substack respalda
  legítimamente varios artículos distintos del sitio. Revisando
  `legacy/api/update-articles.js` se confirmó que el dedup original comparaba
  el `url` entrante del payload (único por ítem) contra los `substack_url`
  ya guardados, mientras que el guardado preferia `article.substack_url`
  sobre `article.url` — para los posts de digest esos dos campos
  legítimamente divergen. Un índice único sobre `substackUrl` habría
  fallado al aplicar la migración y además habría roto la ingesta futura de
  digests. Corregido con una columna nueva y separada,
  `articles.sourceUrl` (nullable, sin default — `articles.json` nunca
  persistió el `url` original por ítem, así que toda fila migrada queda en
  `NULL`; un índice único de Postgres ya trata cada `NULL` como distinto,
  así que no hace falta una cláusula `WHERE` parcial como la versión con
  `substackUrl`). `substackUrl` queda igual que antes, sin índice único.
- **Migración generada y aplicada** contra el Postgres local
  (`drizzle/0001_confused_leopardon.sql`: `ALTER TABLE` + `CREATE UNIQUE
  INDEX`, aditiva, sin tocar datos). Verificado
  `SELECT count(*) FROM articles WHERE source_url IS NOT NULL` → `0` tras
  aplicar, confirmando que ninguna fila existente cambió.
- **Webhook de Make.com** (`app/api/update-articles/route.ts`): puerto
  literal de la lógica `stripHtml`/`detectPublication`/`inferTags` y del
  formato de request/response de `legacy/api/update-articles.js`, mismo
  header `x-playbook-secret`. El dedup ahora es un único
  `onConflictDoNothing` dirigido a `articles.sourceUrl` (no `substackUrl`)
  en vez del loop de leer-chequear-escribir-reintentar de legacy (ese loop
  solo existía porque la API de Contents de GitHub necesitaba concurrencia
  optimista manual). Una colisión de `id` (primary key) se maneja aparte,
  con un reintento único agregando un sufijo, igual que el fallback de
  legacy para colisión de slug.
- **Verificación real contra Postgres y un servidor real**: `curl` directo
  al endpoint — campos faltantes (400), secreto incorrecto (401), inserción
  normal (200 `ok`), un `sourceUrl` duplicado (200 `duplicate`, no se
  inserta una segunda fila), dos ítems de un mismo digest "Industry Shots"
  compartiendo un `substackUrl` insertándose ambos con éxito (el caso exacto
  que motivó el cambio de schema), inferencia de tag de deporte (`NFL`,
  `Liga MX`) confirmada en la fila insertada, y una colisión de `id`
  resuelta con un id con sufijo sin devolver error. Filas de prueba
  borradas después. `tsc --noEmit` limpio; `next build` limpio con y sin
  `POSTGRES_URL`.
- **Pendiente**: el resto de la Fase 4 (editor TipTap, subida a Vercel
  Blob, panel de admin completo con las 12 pestañas, detección de
  conflictos, panel de analítica) — este fue un cambio "schema primero",
  antes del resto de la fase. Ver "Próximos pasos" abajo.

### 2026-07-21 — Fase 4 (checkpoint 1 de 5): login de editor + guard del layout protegido

- Primer checkpoint de una secuencia de 5 planeada para el resto de la Fase 4
  (ver el plan detallado más abajo) — cada uno se verifica y se pushea por
  separado en vez de un solo pase gigante.
- Rutas nuevas: `app/admin/layout.tsx` (carga `styles/admin.css`, port 1:1 de
  `legacy/admin/admin.css`, solo para `/admin/*`), `app/admin/page.tsx`
  (login, sin guard), `app/admin/(protected)/layout.tsx` (guard: `redirect
  ('/admin')` si `!session || session.user.role !== 'editor'`,
  `force-dynamic`, topbar con `AdminTopbarNav` + whoami + logout),
  `app/admin/(protected)/dashboard/page.tsx` y
  `.../analytics/page.tsx` como placeholders (contenido real en los
  checkpoints 4-5). `lib/actions/editor-auth.ts` (`loginAction`),
  `components/admin/LoginForm.tsx`, `components/admin/AdminTopbarNav.tsx`.
- **Verificación de una suposición antes de escribirla, no asumida** (la
  misma clase de bug ya atrapada dos veces en este repo, ver Fase 3 y los
  fixes de sitemap/feed): antes de escribir el manejo de errores del login,
  se leyó el código fuente real instalado de next-auth
  (`node_modules/next-auth/lib/actions.js` + el manejador de errores de
  `@auth/core/index.js`) en vez de asumir que el proveedor Credentials se
  comporta como el caso ya documentado de Resend en
  `lib/actions/reader-auth.ts` (que devuelve una URL a inspeccionar). Resultado:
  son casos distintos — un login de Credentials inválido lanza una excepción
  `AuthError`/`CredentialsSignin` (porque `signIn()` no envuelve su llamada
  interna a `Auth()` en try/catch, y esa llamada corre en modo "raw", donde
  `@auth/core` relanza cualquier `AuthError`), mientras que Resend construye
  una respuesta de redirect normal con `?error=` en la URL. Confirmado además
  contra el propio comentario de ejemplo en `node_modules/next-auth/index.d.ts`,
  que documenta exactamente el patrón try/catch con `instanceof AuthError`
  usado en `loginAction`.
- **Adaptación real de arquitectura, no un fix de bug**: legacy fija
  `data-theme="light"` en el `<html>` de cada página de admin (documentos
  HTML separados). Esta app tiene un solo `<html>` compartido por todo el
  sitio, cuyo `data-theme` refleja la preferencia guardada del *lector*
  público — no se puede pisar esa preferencia desde un layout anidado sin
  romper el toggle del sitio público. Resuelto fijando los tokens de color
  que sí cambian entre temas (`--ink`, `--paper`, `--paper-soft`, `--rule`,
  `--gray-txt`, `--gray-dark`, `--src-industry`, `--src-lana`,
  `--src-infinitas`) a sus valores claros, con scope `.admin-body` en
  `styles/admin.css` — mismo efecto visual que legacy, sin pelear con el
  script de tema del sitio público. Documentado en un comentario dentro del
  propio CSS.
- **Verificación real contra Postgres y un servidor real** (`next dev` +
  Playwright headless, mismo patrón que `scripts/test-email-wall.mjs`):
  contraseña incorrecta contra la cuenta sembrada `aldo` → mensaje real
  "Usuario o contraseña incorrectos" en pantalla (no un falso positivo);
  contraseña correcta → aterriza en `/admin/dashboard`, `admin-status`
  muestra "Sesión: aldo"; visitar `/admin` ya logueado redirige de vuelta a
  `/admin/dashboard` (paridad con el `init()` de `legacy/admin/login.js`);
  clic en "Salir" cierra sesión y redirige a `/admin`; visitar
  `/admin/dashboard` después de cerrar sesión vuelve a redirigir a `/admin`
  (el guard funciona en ambas direcciones); navegación entre las tabs
  CMS/Analytics marca `is-active` en la correcta y carga cada placeholder.
  `tsc --noEmit` limpio; `next build` limpio **con y sin `.env.local`**
  (se renombró el archivo temporalmente antes de compilar, no solo se
  probó sin exportar las variables en el shell — la lección de Fase 2 es
  que Next.js lee `.env.local` directo del disco, exportar/no-exportar en
  el shell no simula el caso real de Vercel sin la variable configurada).
- **Pendiente para el siguiente checkpoint**: Server Actions con detección
  de conflictos (`saveSiteContent`, `saveArticle`, `archiveArticle`,
  `createArticle` en `lib/actions/admin.ts`) — checkpoint 2 de 5, ver el
  plan detallado abajo.

### 2026-07-21 — Fase 4 (checkpoint 2 de 5): Server Actions con detección de conflictos

- `lib/actions/admin.ts`: `saveSiteContent(data, expectedVersion)`,
  `saveArticle(id, input, expectedUpdatedAt)`, `archiveArticle(id)`,
  `createArticle(input)`. Todas re-chequean `auth()`/`role==='editor'`
  server-side primero (`requireEditor()`), nunca confían en un guard de
  cliente. `saveSiteContent` usa un solo `UPDATE ... WHERE version =
  expectedVersion RETURNING *` (atómico, sin `SELECT` previo) en vez del
  patrón leer-then-escribir de legacy; inserta una fila en
  `content_revisions` en el mismo write. `saveArticle` calcula `bodyHtml`
  server-side vía `@tiptap/html`'s `generateHTML` usando el mismo array de
  extensiones (`lib/tiptap-extensions.ts`) que va a usar el editor cliente
  del checkpoint 3, para que el HTML generado nunca pueda divergir en
  silencio del schema real del editor. `createArticle` usa `lib/slugify.ts`
  (puerto literal del `slugify()` de `legacy/admin/dashboard.js`) con el
  mismo fallback de sufijo-en-colisión que ya usa
  `app/api/update-articles/route.ts`. `archiveArticle` pone `status:
  'draft'` (nunca `DELETE`).
- **Bug real encontrado y corregido antes de escribir la comparación de
  conflicto de `saveArticle`, no asumido** (la misma clase de bug ya
  atrapada dos veces en este repo — ver Fase 2/sitemap/feed): el plan
  original comparaba `articles.updatedAt` por igualdad exacta contra el
  valor que el cliente manda de vuelta. Antes de escribirlo así se
  consultó Postgres directo (`psql`) sobre los 30 artículos migrados —
  **los 30 tienen microsegundos reales distintos de cero** en `updated_at`
  (ej. `12:15:11.307988+00`), porque la migración inicial dejó que
  disparara el `defaultNow()` del schema (calculado por Postgres, precisión
  de microsegundos) en vez de pasar un `Date` de JS explícito (que solo
  puede representar milisegundos). Un `Date` de JS que viaja
  cliente→servidor→cliente nunca puede recuperar esos microsegundos, así
  que una comparación de igualdad exacta habría reportado un conflicto
  falso en el primer guardado de cualquiera de los 30 artículos migrados,
  aunque nadie más lo hubiera tocado. Corregido comparando
  `date_trunc('milliseconds', ...)` en ambos lados de la condición del
  `WHERE` en vez de igualdad directa — funciona sin importar la precisión
  real guardada, sin necesitar una migración de datos aparte.
- **Verificación real contra Postgres, no solo lectura de código**: como
  `auth()` (usado por `requireEditor()`) lee cookies vía `next/headers`,
  que lanza `` `headers` was called outside a request scope `` fuera de
  una request real de Next.js (confirmado con una prueba directa antes de
  decidir el enfoque, no asumido), un script suelto no puede invocar las
  Server Actions exportadas tal cual. Se verificó en cambio la lógica de
  persistencia real (las mismas queries de Drizzle, copiadas literal de
  `lib/actions/admin.ts`) con un script `tsx` desechable contra Postgres
  local: `site_content` con versión correcta → guarda e incrementa versión
  + inserta revisión; versión vieja → conflicto (sin escritura); un
  artículo real de los 30 migrados con microsegundos reales → la
  comparación `date_trunc` sí hace match (confirmado explícitamente que
  una igualdad ingenua NO habría hecho match en esa misma fila, probando
  que el fix hacía falta de verdad); el mismo `expectedUpdatedAt` reintentado
  después de un guardado real → conflicto; una carrera concurrente real (dos
  updates condicionales simultáneos con el mismo valor esperado, vía
  `Promise.all`) → exactamente un ganador, nunca los dos ni ninguno;
  colisión de `id` en `createArticle` → `23505` real, reintento con sufijo
  exitoso; `archiveArticle` → `status: 'draft'` y la fila desaparece de una
  consulta filtrada por `status: 'published'` sin dejar de existir. Filas
  y revisiones de prueba borradas después, `site_content` restaurado a sus
  datos originales (la versión queda incrementada, mismo criterio que un
  commit de prueba en el historial de legacy). `tsc --noEmit` y
  `next build` limpios, con y sin `.env.local`.
- **Pendiente para el siguiente checkpoint**: editor TipTap +
  subida de imágenes a Vercel Blob (`components/admin/TipTapEditor.tsx`,
  `app/api/admin/upload-image/route.ts`) — checkpoint 3 de 5.

## Fase 4: plan detallado de lo que falta

Contexto ya cargado en el código, no hace falta re-decidir nada de esto:
`package.json` ya tiene `@tiptap/react`, `@tiptap/starter-kit`,
`@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/html`,
`@vercel/blob`, `next-auth`, `@auth/drizzle-adapter`, `bcryptjs` instalados.
`lib/db/schema.ts` ya tiene `content_revisions`, `media`, `editors`,
`articles.sourceUrl` (ver registro arriba). `auth.ts` ya expone
`auth()`/`signIn`/`signOut` con `session.user.role: 'reader'|'editor'`.
`legacy/admin/dashboard.js` (1202 líneas) + `legacy/admin/admin.css` +
`legacy/api/admin-login.js`/`admin-save.js`/`admin-content.js` +
`legacy/lib/github.js` son la referencia de comportamiento exacto — leer
esos archivos antes de construir cada pieza equivalente. El principio
general: **no portar el enfoque de manipulación de DOM de legacy** — Fase 2
ya construyó los componentes de sección de la home
(`OpinionSection`, `ProductsSection`, `VideoSection`, `InfinitasSection`,
`StatsSection`, `TestimonialsSection`, `AboutSection`, más
`LeadStory`/`NewsRow`) como componentes puros que reciben datos por props
sin llamadas server-only propias — el panel de preview en vivo puede
importar y renderizar esos mismos componentes directo contra el estado de
edición local, en vez de duplicar templates HTML-string como hacía legacy.

**Estructura de rutas:**
```
app/admin/
  layout.tsx              → carga admin.css (solo acá, nunca en el bundle público), shell mínimo
  page.tsx                 → login (sin guard — es lo que ve un editor no autenticado)
  (protected)/
    layout.tsx              → guard: redirect('/admin') si session.role !== 'editor'; force-dynamic; topbar (tabs CMS/Analítica, whoami, logout)
    dashboard/page.tsx       → el CMS
    analytics/page.tsx       → panel de analítica
app/api/admin/upload-image/route.ts   → token de subida a Vercel Blob, gateado por sesión de editor
```

**Server Actions** (`lib/actions/admin.ts`), todas re-chequean
`auth()`/`role==='editor'` server-side (nunca confiar en un guard solo del
cliente):
- `saveSiteContent(data, expectedVersion)` — compara `expectedVersion`
  contra `site_content.version` actual; si coincide, escribe + incrementa
  `version` + inserta snapshot en `content_revisions`; si no coincide,
  devuelve `{conflict: true}` (no lanza excepción) para mostrar el mismo
  modal "alguien más guardó primero" que tenía legacy, con opción de
  recargar la versión más reciente.
- `saveArticle(article, expectedUpdatedAt)` — mismo patrón de conflicto pero
  **por artículo** en vez de archivo completo (cada artículo es su propia
  fila con su propio `updatedAt` — mejora deliberada sobre el guardado
  todo-o-nada de legacy). Calcula `bodyHtml` server-side vía
  `@tiptap/html`'s `generateHTML(bodyJson, extensions)` (mismo set de
  extensiones que el editor) en el mismo write.
- `archiveArticle(id)` — pone `status: 'draft'` en vez de `DELETE` (la
  acción "Eliminar" de legacy en efecto, ya que `getAllArticles()` filtra
  por `status: 'published'`), reversible a propósito.
- `createArticle(article)` — insert; `id` por defecto es el título
  slugificado (misma lógica `slugify()` que legacy), con chequeo de unicidad
  antes de insertar (sufijo corto en colisión, mismo fallback que legacy).

**Primitivas de campo reutilizables** (`components/admin/fields/`):
`TextField`, `TextareaField`, `SelectField`, `CheckboxGroupField`,
`StarPickerField`, `ArrayEditor` (colapsable, drag-reorder con eventos
HTML5 nativos, misma interacción que legacy) — componentes controlados de
React sobre estado local, en vez de los helpers `el()`/diffing manual de
DOM que tenía legacy. Cada tab compone estas primitivas en vez de
reimplementar el renderizado de campos.

**Tabs** (`components/admin/tabs/`), un componente por tab de legacy,
mismos campos que las funciones `build*Tab` de `legacy/admin/dashboard.js`:
Articles (título → auto-slug id, excerpt, **editor de cuerpo TipTap**,
autor + checkbox mostrar_autor, publication, source, tres grupos de
checkboxes de tags, date/dateFormatted/reading_time, star-picker de
priority + checkbox featured con el mismo banner de aviso de conflicto de
hero, substack_url, imageUrl, más el panel read-only de cobertura de tags),
Opinion, Video (embeds YouTube featured/secondary, clips, reels de
Instagram), Infinitas, Products, Stats, Testimonials, About, Mid-CTA, Nav,
Footer, Settings (`mostrarAutorGlobal`). Orden de tabs drag-reorderable y
persistido en `localStorage` por usuario editor, igual que legacy.

**Editor TipTap** (`components/admin/TipTapEditor.tsx`): `@tiptap/react`'s
`useEditor` con StarterKit (restringir headings a h2/h3) + Image + Link.
Toolbar con el lenguaje visual ya existente de `admin.css` (`.btn-mini`).
Subida de imagen: el botón de imagen del toolbar y los handlers de
paste/drop llaman a `@vercel/blob/client`'s `upload()` contra
`app/api/admin/upload-image/route.ts`, que verifica la sesión de editor,
emite un token de subida de cliente de corta duración vía el callback
`handleUpload` de Blob (el archivo va directo a Blob, nunca pasa por la
función Node), y registra la subida en la tabla `media`.

**Panel de preview en vivo**: renderiza los mismos componentes de sección
que Fase 2 construyó para el sitio público, alimentados con el estado de
edición local en vez de un fetch a la DB — `NewsGrid`/`LeadStory`/`NewsRow`
para el tab de Articles, `OpinionSection`/`ProductsSection`/etc. para sus
tabs respectivos. Un mockup estático simplificado de header (no el
`<Header>` real, que es un Server Component async) hace de stand-in para el
chrome del sitio.

**Panel de analítica** (`app/admin/(protected)/analytics/page.tsx`): porta
`legacy/lib/ga4.js` y `legacy/lib/vercel-analytics.js` casi literal como
módulos server-only (mismas llamadas REST externas), reemplazando el
`<script>` de Chart.js por CDN con el paquete npm ya instalado.

**Webhook de Make.com**: ya hecho, ver registro arriba — no repetir.

**Verificación esperada** (ejecución real contra Postgres + un servidor
real, mismo estándar que Fases 1-3):
- `tsc --noEmit` y `next build` limpios, incluyendo un build sin
  `POSTGRES_URL` (lección vigente desde el fix de sitemap/feed).
- Login de editor → dashboard carga las 12 tabs → editar + guardar
  `site_content` (confirmar que `version` incrementa, se inserta una fila
  en `content_revisions`) → escenario de conflicto en dos pestañas (editar
  la misma sección en dos sesiones, confirmar que el segundo guardado
  recibe el modal de conflicto, recargar trae la versión más reciente).
- Crear un artículo nuevo con cuerpo TipTap (incluyendo una imagen inline
  si `BLOB_READ_WRITE_TOKEN` está disponible en el sandbox — si no,
  verificar al menos la estructura: la ruta existe, está gateada por
  sesión de editor, el shape de request/response es correcto) → guardar →
  confirmar que `bodyHtml` se generó server-side y coincide con `bodyJson`
  → visitar `/articulo` público y confirmar que el cuerpo nuevo se
  renderiza (primer artículo de esta migración con `bodyJson` real, no
  fallback a `teaser`).
- Archivar un artículo → confirmar que desaparece de `getAllArticles()`
  (sitio público) pero la fila sigue existiendo con `status: 'draft'`.
- `curl` al webhook de Make.com con el secreto real: un artículo nuevo se
  inserta correctamente; hacer POST del mismo `url` dos veces confirma que
  la segunda se deduplica silenciosamente (ya verificado, ver registro).
- Panel de analítica: confirmar que renderiza y degrada con gracia (mismo
  patrón `available: false` por panel que legacy) sin credenciales reales
  de GA4/Vercel Analytics en este sandbox — marcar explícitamente como gap
  de datos en vivo para verificación manual una vez desplegado.
- Actualizar el registro de progreso de este archivo con qué se verificó de
  verdad vs. qué queda como gap de verificación manual/despliegue.

## Próximos pasos (a la fecha de la última entrada del registro)

1. **Fase 4 (continuación)** — Ya listo: schema (`articles.sourceUrl`) y el
   webhook de Make.com (`app/api/update-articles/route.ts`), verificados
   contra Postgres real. Falta: editor TipTap + subida de imágenes a Vercel
   Blob, panel de admin reconstruido (login, layout protegido, primitivas
   de campo reutilizables, las 12 pestañas, Server Actions con detección de
   conflictos, preview en vivo reusando los componentes de sección de la
   Fase 2, panel de analítica portando `lib/ga4.js`/`lib/vercel-analytics.js`).
2. **Fase 5** — Pulido: paridad de modo oscuro, transiciones/estados de
   hover y carga, accesibilidad, Lighthouse. Incluir GA4 + Vercel Web
   Analytics si no se agregaron antes (ver nota de alcance arriba).
3. **Fase 6** — Verificación end-to-end (ver plan completo para el detalle
   de qué probar) y corte a producción.
4. **Pendiente de despliegue, no de código**: verificar el flujo real de
   magic link con una `RESEND_API_KEY` real una vez desplegado (ver nota de
   la Fase 3 arriba).

## Convención: cómo mantener este archivo

Después de cada sesión de trabajo con cambios de código reales (no
correcciones triviales), agregar una entrada nueva al "Registro de
progreso" arriba, con: fecha, qué se hizo, cómo se verificó (no solo "se
escribió"), y qué queda pendiente. Actualizar también "Próximos pasos" si
cambió el orden o el alcance de lo que sigue. El README apunta acá para el
estado del proyecto — no dupliques el registro ahí.

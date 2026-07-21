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

### 2026-07-21 — Fase 4 (checkpoint 3 de 5): editor TipTap + subida a Vercel Blob

- `components/admin/TipTapEditor.tsx`: `useEditor` con
  `lib/tiptap-extensions.ts` (el mismo array que `saveArticle` del
  checkpoint anterior usa para `generateHTML` — un solo lugar decide qué
  puede contener un cuerpo de artículo). Toolbar con `.btn-mini` de
  `admin.css` (bold, italic, H2/H3, listas, cita, enlace, imagen,
  deshacer/rehacer). Paste/drop de imágenes y el botón de imagen del
  toolbar llaman a `@vercel/blob/client`'s `upload()` contra la ruta de
  abajo. `app/api/admin/upload-image/route.ts`: handshake `handleUpload`
  de `@vercel/blob/client`, inserta `{url, uploadedBy}` en `media` en
  `onUploadCompleted`.
- **Decisión tomada leyendo el código fuente real instalado de
  `@vercel/blob@0.27.3` antes de escribir la ruta, no asumida** (mismo
  hábito que el checkpoint 1 con next-auth): `handleUpload` resuelve/valida
  `BLOB_READ_WRITE_TOKEN` de forma incondicional en su primera línea, antes
  de llamar a `onBeforeGenerateToken` — así que un chequeo de rol de editor
  puesto solo dentro de ese callback nunca se habría alcanzado en este
  sandbox (sin un token real configurado) para probarlo. Corregido
  chequeando `auth()`/`role==='editor'` en el propio route handler, antes
  de llamar a `handleUpload` — verificable sin importar si hay credenciales
  reales de Blob, y en la práctica falla más rápido para una request
  claramente no autorizada. También confirmado leyendo el código: minutar
  el client token es HMAC local puro (sin llamada de red), así que el único
  motivo real por el que la subida no se puede probar de punta a punta acá
  es la falta de un `BLOB_READ_WRITE_TOKEN` real, no una limitación de la
  ruta.
- **Verificación real contra un servidor real** (`next dev` + `curl` +
  Playwright, mismo patrón que los checkpoints anteriores): `curl` sin
  sesión → `401` propio antes de tocar el SDK de Blob; sesión de editor
  real vía Playwright → escribir texto, aplicar negrita/H2, confirmar el
  HTML resultante (`<strong>`, `<h2`) y que `onChange` disparó con el JSON
  actualizado; seleccionar un archivo de imagen real (PNG de 1x1 generado
  en el momento) dispara la subida, la request llega a
  `/api/admin/upload-image` (pasa el chequeo propio de autorización) y
  falla con el mensaje esperado y explícito `"No token found..."` — sin
  colgar la página ni fallar en silencio. **Gap reconocido explícitamente**:
  la subida real a Blob no se puede verificar de punta a punta en este
  sandbox sin un `BLOB_READ_WRITE_TOKEN` real, pendiente de verificación
  manual una vez desplegado (mismo criterio que el gap de magic link de la
  Fase 3). Montado temporalmente en `app/admin/(protected)/dashboard/` un
  arnés de humo (`DashboardPlaceholder.tsx`) solo para esta verificación —
  se reemplaza por completo en el checkpoint 4 por las 12 pestañas reales.
  `tsc --noEmit` y `next build` limpios, con y sin `.env.local`.
- **Pendiente para el siguiente checkpoint**: primitivas de campo, las 12
  pestañas del CMS, y el panel de preview en vivo (`AdminDashboard.tsx`
  reemplazando `DashboardPlaceholder.tsx`) — checkpoint 4 de 5.

### 2026-07-21 — Fase 4 (checkpoint 4 de 5): primitivas de campo, las 12 pestañas, preview en vivo

- El checkpoint más grande de la fase. `components/admin/fields/`
  (`TextField`/`NumberField`, `SelectField`, `CheckboxGroupField`,
  `StarPickerField`, `ArrayEditor`, `FormValidationContext`) — puertos
  controlados en React de las funciones equivalentes de
  `legacy/admin/dashboard.js`, mismas clases de `admin.css`. La validación
  de URLs usa un `React.Context` (`FormValidationProvider`, expuesto vía
  `useImperativeHandle`) en vez de las `querySelectorAll` de legacy —
  cada `TextField` de tipo url se registra a sí mismo, `AdminDashboard`
  corre todas las validaciones antes de guardar y enfoca el primer campo
  inválido, mismo comportamiento observable sin tocar el DOM directamente.
  `components/admin/tabs/` — un componente por pestaña (Articles, Opinion,
  Video, Infinitas, Products, Stats, Testimonials, About, MidCta, Nav,
  Footer, Settings), mismos campos/help-text/advertencias que
  `legacy/admin/dashboard.js`. `components/admin/AdminDashboard.tsx`
  (estado central: `content`/`contentBaseline`/`contentVersion`,
  `articleEntries`, orden de tabs persistido en `localStorage` por editor,
  toasts, modal de conflicto) y `components/admin/LivePreview.tsx`
  (reutiliza los componentes reales de sección de la Fase 2 —
  `OpinionSection`, `ProductsSection`, `VideoSection`, `InfinitasSection`,
  `StatsSection`, `TestimonialsSection`, `AboutSection`, `MidCta`,
  `NewsGrid` — alimentados con el estado de edición local; un
  `PreviewHeader`/`PreviewFooter` simplificado hace de stand-in del chrome
  real, que son Server Components async). `app/admin/(protected)/dashboard/page.tsx`
  ahora es un Server Component real que carga `site_content` + todos los
  artículos (incluidos los archivados, vía la nueva
  `getAllArticlesForAdmin()` en `lib/data/articles.ts`) y se los pasa a
  `AdminDashboard`.
- **Decisión de arquitectura no trivial**: `AdminDashboard` vive dentro de
  `{children}` del layout protegido, un hermano del `<header>` con el
  botón de guardar/estado/punto de cambios sin guardar de legacy — no un
  descendiente. Resuelto con un React Portal
  (`components/admin/TopbarSaveSlot.tsx`) hacia un `div` que el layout
  renderiza para este propósito exacto (`#admin-topbar-save-slot`), en vez
  de duplicar ese layout dentro de la página o mover el estado del
  dashboard al layout (un Server Component, que no puede sostener estado
  de cliente).
- **Bug real encontrado y corregido durante la verificación, no solo
  compilación limpia**: `app/(public)/articulo/page.tsx` siempre renderizaba
  `article.teaser`, nunca `article.bodyHtml` — ese branching no se había
  agregado en ninguna fase anterior porque hasta este checkpoint ningún
  artículo tenía un `bodyJson`/`bodyHtml` real. Detectado creando un
  artículo de prueba con cuerpo TipTap real, guardándolo, y visitando
  `/articulo` en el sitio público: el texto nuevo no aparecía, solo el
  `teaser` (vacío). Corregido priorizando `article.bodyHtml` cuando existe,
  con el mismo fallback a `teaser`/`excerpt` de antes para los artículos
  migrados (que siguen con `bodyJson = null` para siempre).
- **Verificación real contra Postgres y un servidor real** (`next dev` +
  Playwright, varios scripts desechables, mismo estándar que los
  checkpoints anteriores):
  - Las 12 pestañas cargan sin errores de consola.
  - Editar y guardar `site_content` (pestaña Navegación): la vista previa
    marca la sección como `is-changed` en vivo, el punto de "sin guardar"
    aparece, el guardado incrementa `version` (confirmado por `psql`) e
    inserta una fila en `content_revisions`.
  - **Escenario de conflicto real con dos sesiones de Playwright**: sesión
    1 carga la pestaña, sesión 2 carga la misma pestaña con la misma
    versión base, sesión 1 guarda con éxito; sesión 2 intenta guardar con
    su versión ahora vieja → modal de conflicto real (no simulado),
    "Entendido, recargar" trae el valor que sesión 1 guardó, no el de
    sesión 2.
  - **Validación de URL bloquea de verdad el guardado**, no solo muestra
    el error: se puso un valor inválido en `ctaUrl`, se hizo clic en
    Guardar, el estado quedó en "Hay campos con errores" y `psql` confirmó
    que la base de datos nunca recibió ese valor.
  - **Artículo nuevo con cuerpo TipTap real**: creado desde la pestaña
    Artículos (id auto-generado desde el título, mismo `slugify()` que
    legacy), escrito texto plano + negrita en el editor, guardado,
    confirmado por `psql` que `body_html` (`<p>Cuerpo de prueba con
    <strong>texto en negrita</strong></p>`) coincide exactamente con
    `body_json` — y que se renderiza en `/articulo` público (ver el bug de
    arriba). Nota de la propia verificación: un primer intento con el
    editor pareció perder el primer fragmento de texto; investigado antes
    de asumir un bug de producto — era el test haciendo clic en el `div`
    con padding en vez del elemento `.ProseMirror` real, confirmado
    reproduciendo ambos casos lado a lado; el editor en sí funciona
    correctamente.
  - **Archivar un artículo**: desaparece de la lista del panel de inmediato
    (vía `archiveArticle`), `psql` confirma `status: 'draft'` con la fila
    intacta, y `sitemap.xml` (que usa `getAllArticles()`, el mismo query
    que la portada/archivo/tag pages) ya no lo incluye — confirmado que
    esto es el comportamiento correcto, no que la página individual
    `/articulo?id=...` deba dar 404 (`getArticleById`/`getArticleMetaById`
    no filtran por `status` a propósito: un enlace directo a un artículo
    archivado sigue resolviendo, solo desaparece de los listados).
  - Todas las filas/artículos de prueba borrados después; `nav.ctaLabel`
    restaurado a su valor original de `content.json`.
  - `tsc --noEmit` y `next build` limpios, con y sin `.env.local`.
- **Gap reconocido explícitamente, no escondido**: el panel de preview en
  vivo no incluye el header/footer reales (son Server Components async);
  el stand-in cubre nav.links + CTA + footer básico, suficiente para ver
  cambios de contenido pero no idéntico pixel a pixel al sitio real —
  documentado en un comentario en `LivePreview.tsx`, mismo criterio que
  el propio plan de Fase 4 ya anticipaba para el header.
- **Pendiente para el siguiente checkpoint**: panel de analítica
  (`lib/ga4.ts`, `lib/vercel-analytics.ts`,
  `app/admin/(protected)/analytics/page.tsx`) — checkpoint 5 de 5, el
  último de la Fase 4.

### 2026-07-21 — Fase 4 (checkpoint 5 de 5, última de la fase): panel de analítica

- **Corrige una suposición del propio plan de Fase 4** (la sección de abajo,
  escrita antes de leer el código legado real): el plan decía portar
  "`legacy/lib/ga4.js` y `legacy/lib/vercel-analytics.js` casi literal" como
  si ambos alimentaran el panel de admin. Leyendo `legacy/api/analytics-data.js`
  (el handler real detrás de `/admin/analytics.html`, no incluido en la
  lista inicial de archivos a leer de esta tarea) se confirma que **solo
  usa `lib/vercel-analytics.js`** (`count`/`aggregateVisits`/`aggregateEvents`)
  — `lib/ga4.js` es usado exclusivamente por `legacy/api/top-articles.js`,
  que alimenta el módulo "Más leídas" de la portada pública, una feature
  completamente distinta y ya marcada como fuera de alcance en el registro
  de la Fase 2 ("GA4 + Vercel Web Analytics... todavía no se portó...
  pendiente para más adelante"). Portar `ga4.js` en este checkpoint habría
  sido trabajo fuera del alcance real de "panel de analítica del admin" —
  no se portó; sigue pendiente para cuando se aborde el módulo "Más leídas"
  (ver Fase 5 abajo).
- `lib/vercel-analytics.ts` — puerto casi literal de
  `legacy/lib/vercel-analytics.js` (mismos endpoints REST, mismas env vars:
  `VERCEL_ANALYTICS_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`/
  `VERCEL_TEAM_SLUG`). `lib/analytics-data.ts` — puerto del cuerpo de
  `analytics-data.js` (KPIs de hoy/7/30 días con deltas, panel de
  artículos más leídos vía eventos personalizados, referidos/países/
  dispositivos), con una simplificación real: el panel de artículos más
  leídos resuelve id→título con `getAllArticlesForAdmin()` (lectura directa
  a la base) en vez del auto-`fetch(${siteUrl}/articles.json)` que legacy
  usaba solo porque esa función serverless no tenía acceso directo a una
  base de datos.
  `app/admin/(protected)/analytics/page.tsx` +
  `components/admin/analytics/{AnalyticsView,BarChart}.tsx`: KPIs, dos
  gráficas de barras con el paquete `chart.js` ya instalado (en vez del
  `<script>` por CDN de legacy), dos listas de barras en CSS puro, mismo
  patrón `available: false` por panel. `lib/actions/analytics.ts` expone
  `refreshAnalytics()` para el botón "Actualizar" (legacy llamaba a
  `/api/analytics-data` por fetch; acá es una Server Action, mismo
  chequeo `auth()`/`role==='editor'`).
- **Gap reconocido explícitamente, no de código**: el panel de artículos
  más leídos necesita un evento personalizado de Vercel Analytics
  (`pageview_article` con `article_id`) disparado desde la página de
  artículo — legacy lo hacía en `js/article-page.js`; esa instrumentación
  cliente no se agregó en esta migración todavía (no estaba en el alcance
  aprobado de este checkpoint, que era portar el panel en sí, no
  instrumentar el sitio público). El panel degrada correctamente a
  `available: false` con o sin esa instrumentación cuando falta el token
  real, así que esto no bloquea nada — solo significa que, incluso con un
  `VERCEL_ANALYTICS_TOKEN` real configurado, el panel de "más leídos"
  seguiría vacío hasta agregar esa instrumentación.
- **Verificación real contra un servidor real** (`next dev` + Playwright):
  las 12 pestañas del checkpoint anterior siguen sin errores; navegación
  a la pestaña Analytics vía el tab del topbar funciona y marca `is-active`
  correctamente; sin `VERCEL_ANALYTICS_TOKEN` configurado en este sandbox
  (a propósito, mismo criterio que `BLOB_READ_WRITE_TOKEN` — credencial
  externa real no disponible acá), las 3 tarjetas KPI muestran "Sin datos
  todavía" y los 4 paneles muestran su mensaje de degradación específico
  (el de artículos más leídos incluso menciona el permiso "Custom Events"
  que hace falta) — sin crashear la página; los mensajes `console.error`
  que aparecen en el navegador son los mismos logs de diagnóstico
  intencionales que legacy también emitía (`VERCEL_ANALYTICS_TOKEN no está
  configurado`), no errores no controlados. El botón "Actualizar" vuelve a
  llamar la Server Action sin errores. Sin escritura a la base de datos en
  ningún punto de este checkpoint (confirmado: 30 artículos y
  `site_content` sin cambios después de correr las pruebas). `tsc --noEmit`
  y `next build` limpios, con y sin `.env.local`.
- **Con esto se completan los 5 checkpoints planeados de la Fase 4.**
  Pendiente real, no de código: verificar el panel de analítica con
  credenciales reales de Vercel Analytics una vez desplegado (mismo
  criterio que el gap de magic link de la Fase 3 y el de subida a Blob del
  checkpoint 3). Ver "Próximos pasos" abajo para Fase 5/Fase 6.

### 2026-07-21 — Fase 5 (checkpoint 1 de 4): módulo "Más leídas" con GA4

- Antes de planear Fase 5 ("Pulido": paridad de modo oscuro,
  transiciones/estados de hover y carga, accesibilidad, Lighthouse), se
  auditó el estado real de cada área contra legacy archivo por archivo, en
  vez de asumir que "Pulido" significa trabajo pendiente en las cuatro.
  Resultado: modo oscuro (6 de 8 `styles/*.css` son byte-idénticos a
  legacy, confirmado con `diff`), las transiciones de `legacy/js/ui.js`
  (scroll-reveal, newsletter, contador de stats) y accesibilidad (cada
  `role`/skip-link/alt-text/atajo de teclado de legacy tiene su
  equivalente exacto) ya están en paridad 1:1 — verificado, no asumido.
  Fase 5 quedó acotada a lo que de verdad falta: el módulo "Más leídas"
  (este checkpoint), Vercel Web Analytics + evento `pageview_article`
  (siguiente), un gap real de estado de carga en la subida de imágenes de
  TipTap, y una limpieza menor de Lighthouse/documentación.
- `lib/ga4.ts` — puerto casi literal de `legacy/lib/ga4.js` (mismo JWT de
  cuenta de servicio firmado a mano con `crypto`, mismas env vars
  `GA4_PROPERTY_ID`/`GA4_SERVICE_ACCOUNT_EMAIL`/
  `GA4_SERVICE_ACCOUNT_PRIVATE_KEY`). **Ajuste real, no cosmético**: legacy
  filtraba `pagePath CONTAINS '/articulo.html'` (su propio esquema de URL);
  este sitio sirve `/articulo` sin extensión (los redirects de
  `next.config.ts` van *hacia* esa ruta, no al revés), así que el filtro
  se cambió a `/articulo` — de lo contrario, ningún pageview post-corte
  matchearía nunca el filtro y el módulo se vería "vacío" para siempre
  aunque GA4 estuviera perfectamente configurado.
- `lib/most-read.ts` resuelve los ids de GA4 contra `getAllArticles()`
  (lectura directa a la base, ya cacheada por request vía `cache()` de
  React y ya usada por la portada) en vez del auto-`fetch(articles.json)`
  que legacy usaba solo por no tener acceso a base de datos — misma
  simplificación que ya se hizo para el panel de analítica del admin en
  la Fase 4.
- `components/home/MostReadSection.tsx` — Server Component nuevo, sin
  pestaña de CMS: confirmado que legacy nunca tuvo un campo editable para
  esta sección (ni siquiera el título "Más leídas" viene de content.json),
  así que no hacía falta tocar `lib/db/schema.ts` ni `SiteContentData`.
  No renderiza nada (ni la sección) cuando `getMostReadArticles()` devuelve
  `null` o `[]` — mismo comportamiento que el `section.hidden` de legacy,
  resuelto en el servidor en vez de con JS de cliente. Reutiliza `NewsRow`
  tal cual, mismo patrón que el propio `rowTemplate` de legacy. Insertado en
  `app/(public)/page.tsx` en la misma posición que `legacy/index.html`
  (después de la grilla de noticias/newsletter, antes de Opinión).
- Agregadas las tres env vars de GA4 a `.env.local.example`, con comentario
  explicando la diferencia con un futuro Measurement ID de cliente (que
  este sitio todavía no tiene).
- **Verificación real contra un servidor real**: sin `GA4_PROPERTY_ID`/etc.
  configuradas en este sandbox (a propósito — credencial externa real no
  disponible acá, mismo criterio que Blob/Resend/Vercel Analytics), se
  confirmó con `curl` + `grep` sobre el HTML real de `/` que `#mas-leidas`
  está genuinamente ausente (no solo oculto por CSS) y que el resto de la
  portada renderiza sin cambios (los 6 `&lt;h2&gt;` de las demás secciones
  presentes, sin errores nuevos en el log de `next dev`). Nota operativa:
  Postgres no estaba corriendo al iniciar esta sesión (contenedor
  reciclado) — se detectó por un 500 real en `/` con `ECONNREFUSED`, se
  arrancó con `pg_ctlcluster 16 main start`, y se confirmó que los datos de
  sesiones anteriores (30 artículos, 3 editores) seguían intactos antes de
  continuar. `tsc --noEmit` y `next build` limpios, con y sin `.env.local`.
- **Gap reconocido explícitamente**: renderizado real con datos de GA4 no
  es verificable en este sandbox sin credenciales reales — pendiente de
  verificación manual una vez desplegado, mismo criterio que los demás
  gaps de credenciales externas ya documentados (Resend, Blob, Vercel
  Analytics).
- **Pendiente para el siguiente checkpoint**: Vercel Web Analytics +
  instrumentar el evento `pageview_article` que el panel de analítica del
  admin (Fase 4) ya espera — checkpoint 2 de 4.

### 2026-07-21 — Fase 5 (checkpoint 2 de 4): Vercel Web Analytics + evento `pageview_article`

- Agregado `@vercel/analytics` (paquete oficial) a `package.json`. `<Analytics
  />` montado en `app/layout.tsx` (root layout, sitio completo — lector y
  admin) reemplazando el shim manual `window.va` + `<script>` a mano de
  legacy. `components/article/ArticleAnalyticsBeacon.tsx` — Client
  Component chico que llama `track('pageview_article', {article_id})` en un
  `useEffect`, montado únicamente en la rama de acceso completo de
  `app/(public)/articulo/page.tsx` (nunca en la vista con muro), mismo
  criterio ya aplicado al bloque JSON-LD de esa página. Agregadas
  `VERCEL_ANALYTICS_TOKEN`/`VERCEL_PROJECT_ID`/`VERCEL_TEAM_ID`/
  `VERCEL_TEAM_SLUG` a `.env.local.example` (ya las necesitaba
  `lib/vercel-analytics.ts` desde la Fase 4, nunca se habían documentado).
- **Bug real encontrado y corregido durante la verificación, no solo
  compilación limpia** (exactamente la clase de bug que este proyecto ya
  viene atrapando con verificación real): el evento `pageview_article` no
  llegaba a `window.vaq` — el `track()` de `@vercel/analytics` hace
  `window.va?.(...)`, un no-op silencioso (sin error, sin warning) si
  `window.va` todavía no existe. Investigado con un script de Playwright
  que interceptaba `window.va` antes de que cargara cualquier código de la
  app: `<Analytics/>` (paquete `@vercel/analytics/next`) envuelve su propio
  `useEffect` que crea `window.va` dentro de un `<Suspense>` (lo necesita
  para `useSearchParams()`/`usePathname()`), así que ese efecto se
  confirma (con trazas) que se resuelve en una pasada posterior a la del
  resto del árbol — **reordenar el JSX no lo arregló** (probado y
  descartado explícitamente), porque el retraso lo causa el límite de
  Suspense, no el orden de hermanos. Corregido con el mismo shim inline que
  legacy ya tenía en el `<head>` de `index.html`/`articulo.html`
  (`window.va = window.va || function(){(window.vaq=window.vaq||[]).push(arguments)}`),
  vía un `<Script strategy="beforeInteractive">` en el layout — se
  ejecuta antes de que hidrate cualquier componente, así que el evento
  temprano de `ArticleAnalyticsBeacon` encola correctamente sin importar
  cuándo se resuelva el Suspense de `<Analytics/>`.
- **Verificación real contra un servidor real** (`next dev` + Playwright):
  confirmado con un interceptor de `window.va` que, después del fix, el
  evento `pageview_article` con el `article_id` correcto llega a la cola
  antes que el propio `pageview` automático de `<Analytics/>`; probado en
  un artículo real de acceso completo (evento presente) y repetido el
  escenario de muro de la Fase 3 (leer 4 artículos con el mismo lector
  anónimo) confirmando que el evento **no** se dispara en la vista con
  muro del cuarto artículo. Script de `<Analytics/>` confirmado inyectado
  en el DOM real (no solo en el HTML servido — el componente es
  `'use client'`, se inyecta vía `useEffect`). `tsc --noEmit` y
  `next build` limpios, con y sin `.env.local`.
- **Gap reconocido explícitamente**: entrega real del evento al backend de
  Vercel no es verificable en este sandbox (sin despliegue real de
  Vercel) — pendiente de verificación manual una vez desplegado, mismo
  criterio que el resto de gaps de credenciales externas ya documentados.
- **Pendiente para el siguiente checkpoint**: estados de carga/error en la
  subida de imágenes de `TipTapEditor` — checkpoint 3 de 4.

### 2026-07-21 — Fase 5 (checkpoint 3 de 4): estados de carga/error en la subida de imágenes de TipTap

- `components/admin/TipTapEditor.tsx`: estado local `uploading`/`uploadError`
  (no se hiló un callback de toast desde `AdminDashboard` — el editor monta
  una vez por tarjeta de artículo en la pestaña Articles, y un toast global
  compartido se pisaría entre dos tarjetas abiertas a la vez; el mensaje
  vive junto al editor al que pertenece). El botón "Imagen" del toolbar
  cambia a "Subiendo imagen…" y se deshabilita junto con el input de
  archivo mientras la subida está en curso; al fallar, aparece un mensaje
  de error real (`role="alert"`, misma clase `.field-error` que el resto
  del panel) en vez del `console.error` silencioso de antes — este era el
  único gap real encontrado en la auditoría de "estados de carga" de este
  checkpoint (legacy nunca tuvo subida de imágenes, así que no había nada
  que portar acá, era una omisión de la Fase 4).
- **Verificación real contra un servidor real** (`next dev` + Playwright):
  se disparó una subida real (mismo patrón que la verificación de la Fase 4
  checkpoint 3) y se capturó el estado del botón/input **durante** la
  subida, no solo antes/después: `"Subiendo imagen…"` visible y el input
  de archivo deshabilitado mientras la request está en vuelo; al fallar
  (sin `BLOB_READ_WRITE_TOKEN` real en este sandbox, el mismo gap ya
  documentado), un mensaje de error real y visible aparece, y el botón/input
  vuelven a su estado normal después — confirmado que no queda "trabado"
  en estado de carga tras un error. Sin filas nuevas en `articles`/`media`
  (el artículo de prueba nunca se guardó, solo se probó la subida). `tsc
  --noEmit` y `next build` limpios, con y sin `.env.local`.
- **Pendiente para el siguiente checkpoint**: limpieza menor de
  Lighthouse/documentación (`width`/`height` en las imágenes de portada de
  artículo, notas desactualizadas en `docs/image-dimensions.md`) —
  checkpoint 4 de 4, el último de la Fase 5.

### 2026-07-21 — Fase 5 (checkpoint 4 de 4, última de la fase): limpieza de Lighthouse/documentación

- Agregados `width={1200} height={750}` explícitos (relación `16:10`, misma
  convención ya usada en `InfinitasSection.tsx` para el mismo ratio) a los
  dos `<img>` de foto destacada que no los tenían:
  `components/article/LeadStory.tsx` (portada) y
  `app/(public)/articulo/page.tsx` (página de artículo individual). Esto no
  era una regresión de la migración — legacy nunca tuvo estos atributos
  tampoco (confirmado leyendo sus templates originales) — sino una mejora
  de consistencia menor: el resto de imágenes editoriales del sitio ya
  llevaban `width`/`height` explícitos además de su `aspect-ratio` en CSS.
- Actualizado `docs/image-dimensions.md`: su sección final decía
  "Pendiente de actualizar cuando se construyan las páginas nuevas" para
  dos decisiones que en realidad ya se habían tomado en las Fases 2-3 (la
  imagen de artículo reutiliza `.lead-photo`, las filas de `/archivo` se
  quedaron sin imagen) — reescrita para reflejar el estado real en vez de
  seguir marcando como pendiente algo que ya está resuelto.
- **Verificación real, no solo visual**: con `next dev` + Playwright se
  midió el `boundingBox()` real de `.lead-photo` en la portada y en la
  página de artículo — ambos dan una relación ancho/alto de exactamente
  `1.600` (`16:10`), confirmando que los atributos `width`/`height`
  explícitos (que solo sirven de señal temprana al navegador) no entran en
  conflicto con el `aspect-ratio` de CSS que en la práctica controla el
  tamaño real — ninguna distorsión de layout. `tsc --noEmit` y
  `next build` limpios, con y sin `.env.local`.
- **Con esto se completan los 4 checkpoints planeados de la Fase 5.** Antes
  de empezar esta fase se verificó (no se asumió) que modo oscuro,
  transiciones/animaciones de `js/ui.js` y accesibilidad ya estaban en
  paridad 1:1 con legacy — así que el trabajo real de esta fase terminó
  siendo el módulo "Más leídas" con GA4, Vercel Web Analytics + el evento
  `pageview_article` (con un bug de carrera real encontrado y corregido en
  el camino), un gap real de estados de carga en la subida de imágenes de
  TipTap, y esta limpieza menor — no una repetición de trabajo ya hecho.
  Pendiente real, no de código: verificar datos reales de GA4/Vercel
  Analytics una vez desplegado (mismo criterio que los demás gaps de
  credenciales externas ya documentados en este archivo). Ver "Próximos
  pasos" abajo para Fase 6.

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

### 2026-07-21 — Fix de despliegue: Vercel rechazaba `middleware.ts` ("Edge Function referencing unsupported modules")

- **Error real reportado desde un deploy real de Vercel** de este mismo
  commit (confirmado con el usuario, no una suposición): `The Edge
  Function "middleware" is referencing unsupported modules: -
  __vc__ns__/0/middleware.js: @/lib/anon-cookie`.
- **Investigado antes de asumir un bug de código**: `lib/anon-cookie.ts`
  (lo único que `middleware.ts` importa además de `next/server`) no tiene
  ningún `import` propio y usa exclusivamente Web Crypto
  (`crypto.subtle.importKey`/`sign`) — nada de `Buffer`, `require()`, ni el
  módulo `crypto` de Node. Confirmado leyendo el archivo committeado
  directo con `git show HEAD:lib/anon-cookie.ts`, no solo de memoria.
  Tampoco hay ninguna cadena de imports hacia `lib/db/client.ts` (que sí
  usa `pg`, genuinamente no compatible con Edge) — `lib/metering.ts`
  importa *de* `anon-cookie.ts`, no al revés, y `middleware.ts` no importa
  `lib/metering.ts` en absoluto. El único archivo realmente Node-only del
  repo (`lib/ga4.ts`, con `crypto.createSign`/`Buffer.from`) no es
  alcanzable desde el grafo de imports de `middleware.ts`.
- **Diagnóstico real, verificado con búsqueda externa** (no inventado):
  dado que el error nombra el propio *especificador* de import
  `@/lib/anon-cookie` como "módulo no soportado" (no un built-in de Node
  específico dentro de él), y que esto coincide con una clase conocida de
  este mismo error en discusiones de `vercel/next.js` (#58584) y de
  Supabase (#19077) — ambas con un import con alias `@/` hacia
  `middleware` — el diagnóstico más probable es que el pipeline de bundling
  de Edge Functions de Vercel para `middleware.ts` (el único archivo de
  este repo bundleado por ese pipeline especial, a diferencia de todo el
  resto de imports con `@/` que vive dentro de `app/`/`components/`/`lib/`
  y se resuelve por el bundling normal por-ruta de Next) no resuelve el
  alias `@/*` de `tsconfig.json` de forma confiable para ese entrypoint
  específico.
- **Corregido** cambiando el import de `lib/anon-cookie` en `middleware.ts`
  de `@/lib/anon-cookie` a una ruta relativa (`./lib/anon-cookie`) —
  elimina la resolución de alias como variable por completo para este
  entrypoint, sin tocar `lib/anon-cookie.ts` (no hacía falta).
- **Verificación real, con una limitación honesta**: `tsc --noEmit` y
  `next build` limpios, con y sin `.env.local`; bundle local
  `.next/server/middleware.js` inspeccionado de nuevo, confirmando que
  sigue usando solo `crypto.randomUUID`/`crypto.subtle` (Web Crypto); `next
  dev` + `curl` confirma que la cookie `pb_anon` se sigue firmando y
  emitiendo igual que antes. **Lo que no se puede verificar desde este
  sandbox**: si esto de verdad resuelve el error específico del bundling de
  Edge Functions de Vercel, ya que no hay forma de disparar un deploy real
  de Vercel desde acá — pendiente de que el usuario redespliegue y
  confirme si el error desaparece.

### 2026-07-21 — Fix de despliegue: `middleware` crasheaba en producción (`MIDDLEWARE_INVOCATION_FAILED`)

- **El fix anterior (import relativo) funcionó**: el usuario confirmó que
  el error de build "Edge Function referencing unsupported modules" ya no
  aparece. Pero el mismo deploy dio un error nuevo, de runtime, no de
  build: `500 INTERNAL_SERVER_ERROR, Code: MIDDLEWARE_INVOCATION_FAILED`.
- **Causa raíz confirmada leyendo el código, no adivinada**: `getKey()` en
  `lib/anon-cookie.ts` hace `if (!secret) throw new Error('AUTH_SECRET is
  not set')`. `middleware.ts` no tenía ningún `try`/`catch` — para
  cualquier visitante sin una cookie `pb_anon` válida (es decir, **todo
  visitante nuevo**, incluida la primerísima request a `/` justo después
  de un deploy), `signAnonId(id)` corre, llama a `getKey()`, y el error
  sale sin capturar de la función `middleware()` exportada. El matcher
  (`/((?!_next/static|_next/image|favicon.ico|assets/).*)`) no excluye
  `/` — confirmado que sí corre ahí. Muy probablemente `AUTH_SECRET` no
  está configurada todavía en las variables de entorno del proyecto de
  Vercel (a diferencia de `VERCEL_ANALYTICS_TOKEN`/`GA4_*`/
  `BLOB_READ_WRITE_TOKEN`, nunca se dejó una nota explícita marcando
  `AUTH_SECRET` como prerrequisito de despliegue).
- **Esto también es un gap real de código, no solo de configuración**: el
  repo ya tiene un patrón establecido de "degradar en vez de tirar todo
  abajo" ante una env var faltante (`lib/db/client.ts` difiere su chequeo
  de `POSTGRES_URL` fuera del build; `lib/vercel-analytics.ts` solo lanza
  hacia un caller aislado que degrada un panel nada más). `middleware.ts`
  corre sin condición en cada request de todo el sitio, sin ningún caller
  en posición de degradar con gracia — una sola env var mal configurada
  ahí tira abajo el sitio entero, a diferencia de cualquier otro
  precedente de este repo. El propio comentario de `lib/anon-cookie.ts`
  ya documenta la filosofía correcta para esta identidad exacta ("fallar
  abierto... está bien, es una identidad de cupo, no un límite de
  seguridad") — a `middleware.ts` solo le faltaba aplicarla en su propio
  nivel.
- **Corregido**: `middleware()` ahora envuelve todo su cuerpo en
  `try`/`catch`; ante cualquier error (falta `AUTH_SECRET` o cualquier otra
  cosa inesperada), registra con `console.error` server-side y devuelve
  `NextResponse.next()` sin cookie, en vez de propagar la excepción. No se
  tocó `lib/anon-cookie.ts` — el `throw` ahí sigue siendo la señal
  correcta para un caller que pueda manejarlo; a `middleware.ts` le
  faltaba ser ese caller.
- **Verificación real, reproduciendo el escenario exacto de producción**:
  se quitó `AUTH_SECRET` de `.env.local` (simulando la config real de
  Vercel), se corrió `next dev` + `curl` sobre `/` → **200, sin crash**,
  sin cookie `pb_anon` seteada, y el log del servidor muestra el error
  atrapado y registrado (no propagado) — reproduce y confirma el fix del
  síntoma exacto reportado. Restaurado `.env.local` con `AUTH_SECRET`
  presente y re-verificado que la cookie se sigue firmando normalmente —
  sin regresión. `tsc --noEmit` y `next build` limpios, con y sin
  `.env.local`.
- **Acción pendiente del usuario, no de código**: este fix evita la caída
  del sitio, pero la funcionalidad de cookie anónima/metering seguirá sin
  hacer nada (sin cookie, `lib/metering.ts` trata a cada lector como
  siempre-nuevo, sin cupo real registrado) hasta que se agregue
  `AUTH_SECRET` de verdad en Project Settings → Environment Variables del
  proyecto de Vercel.

### 2026-07-21 — Investigación: `HEAD /` con `MIDDLEWARE_INVOCATION_FAILED`, `[ReferenceError: __dirname is not defined]`

- **Reporte del usuario**: un log de deploy de Vercel mostrando `500
  MIDDLEWARE_INVOCATION_FAILED` en `HEAD /`, con el detalle
  `[ReferenceError: __dirname is not defined]`. No queda claro por el log
  a qué commit/deploy corresponde — podría ser anterior a los dos fixes de
  middleware ya registrados arriba (import relativo; `try`/`catch` para
  fallar abierto).
- **Verificado contra un build real, no solo leyendo el código**: en este
  entorno sí hay `npm`/`node` disponibles (a diferencia de lo que dice
  `.claude/skills/verify/SKILL.md`, que parece desactualizado post-
  migración a Next — describe rutas `api/*.js`/`articles.json` de la app
  legacy, no `middleware.ts`/`lib/anon-cookie.ts` actuales). Se corrió
  `npm install` (respeta `package-lock.json` committeado, que ya fija
  `next@15.5.20`) y luego `next build` real con variables de entorno
  dummy. Build limpio.
- **El bundle compilado del Edge Middleware (`.next/server/middleware.js`,
  34.4 kB) no contiene ni una sola referencia a `__dirname`** (`grep -n
  "__dirname"` sobre ese archivo: cero resultados). El grafo de imports de
  `middleware.ts` sigue siendo el mismo que se verificó en la entrada
  anterior (`next/server` + `./lib/anon-cookie`, y este último sin
  imports propios, solo Web Crypto) — no hay ningún código alcanzable
  desde `middleware.ts` que pueda evaluar `__dirname`.
- **Conclusión**: con el código y el lockfile actuales de esta rama, no
  existe una causa a nivel de código para este error específico. No se
  hizo ningún cambio de código porque no se encontró ningún bug que
  corregir — cambiar código sin una causa identificada solo enmascararía
  el síntoma real.
- **Limitación honesta de esta verificación**: `next build` local no
  reproduce el empaquetado propio de Vercel para Edge Functions (el paso
  que envuelve la salida de `.next/` en `.vercel/output/functions/`, sin
  CLI de Vercel disponible en este sandbox para correrlo). Si el error
  ocurrió en un deploy del commit actual (no uno viejo), la causa más
  probable pasa a ser un build cacheado corrupto/obsoleto del lado de
  Vercel — una clase de bug de plataforma conocida, no de este repo.
- **Acción pendiente del usuario, no de código**: confirmar a qué commit
  corresponde el deploy que generó ese log (Vercel → Deployments → click
  en el deploy fallido → ver el commit hash) y, si corresponde al código
  actual, volver a desplegar con "Redeploy" → **"Clear Cache and Deploy"**
  en vez de un redeploy normal. Si el error persiste después de eso con
  el commit actual confirmado, es una señal real de que sí hay algo
  código-dependiente que este build local no está reproduciendo, y hay
  que retomar la investigación con esa confirmación en mano.

### 2026-07-21 — El `__dirname` persiste tras "Clear Cache and Deploy"; diagnóstico: middleware no-op temporal

- **El usuario redesplegó con caché limpia y el error siguió idéntico**
  (`[ReferenceError: __dirname is not defined]`, mismo
  `MIDDLEWARE_INVOCATION_FAILED`), lo que descarta la hipótesis de caché
  obsoleta de la entrada anterior.
- **PR #24 (la entrada anterior de este mismo registro) ya está
  mergeada a `main`** (`74c8975`) — confirmado con `git fetch origin
  main` + `git merge-base --is-ancestor`. `middleware.ts` en `main` es
  idéntico, fuente por fuente, al que ya se verificó limpio localmente.
- **Se intentó reproducir el empaquetado real de Vercel, no solo `next
  build`**: `npx vercel build` está disponible en este sandbox, pero
  requiere `vercel pull`/login contra el proyecto real de Vercel del
  usuario — no se tienen esas credenciales acá, y no corresponde
  pedírselas al usuario (un token de Vercel puede desplegar/modificar su
  proyecto real). Este paso específico del pipeline de Vercel (el que
  envuelve la salida de `.next/` en `.vercel/output/functions/`) sigue
  siendo opaco desde este entorno.
- **Diagnóstico desplegado para aislar plataforma vs. código**:
  `middleware.ts` se reemplazó temporalmente por un no-op puro
  (`return NextResponse.next()`), con la lógica real de la cookie
  anónima comentada (no borrada) debajo. Esto desactiva
  temporariamente la funcionalidad de cookie anónima/metering en
  producción — es un cambio deliberado y reversible solo para
  diagnóstico, no una reversión de la feature. Verificado localmente:
  `next build` limpio, bundle de middleware (34 kB, prácticamente el
  mismo tamaño que antes — la mayor parte del bundle es runtime propio
  de Next, no código de este repo) sin `__dirname` en
  `middleware.js` ni en `edge-runtime-webpack.js`, igual que antes.
- **Qué decide cada resultado una vez que el usuario despliegue esto**:
  - Si el no-op **también falla** con `__dirname` → confirma que la
    causa es 100% del lado de Next.js/Vercel (el pipeline de
    empaquetado de Edge Functions), sin relación con
    `lib/anon-cookie.ts` ni con ningún código de este repo. Siguiente
    paso: revertir este no-op y escalar a soporte de Vercel con esta
    evidencia (build local limpio + no-op también falla en producción).
  - Si el no-op **funciona** → descarta a Next.js/Vercel como causa
    universal y apunta de nuevo a algo específico de
    `lib/anon-cookie.ts` o de cómo se referencia desde `middleware.ts`,
    a pesar de que el build local no lo muestre — hay que retomar la
    investigación ahí con esta pista confirmada.
- **Pendiente**: revertir este no-op (descomentar la lógica real) en
  cuanto se tenga el resultado del deploy de diagnóstico. No dejar este
  no-op como estado final — la funcionalidad de metering depende de él.

### 2026-07-21 — Diagnóstico confirmado: el no-op también falló. Se elimina `middleware.ts` para restaurar el sitio

- **El usuario desplegó el no-op del diagnóstico anterior y el mismo
  error `[ReferenceError: __dirname is not defined]` /
  `MIDDLEWARE_INVOCATION_FAILED` siguió ocurriendo**, con una función de
  middleware que no hace absolutamente nada más que
  `return NextResponse.next()`. Esto es la confirmación decisiva: la
  causa no está en `lib/anon-cookie.ts`, ni en ningún código de este
  repo — es el pipeline de empaquetado de Edge Functions de Vercel/
  Next.js el que rompe para *cualquier* `middleware.ts` de este
  proyecto, sin importar el contenido.
- **Prioridad del usuario en este punto: restaurar el sitio ya**, no
  seguir diagnosticando contra un sitio caído en cada request. La única
  forma de eliminar el error sin depender de un fix de la plataforma es
  eliminar `middleware.ts` por completo — Next solo genera la Edge
  Function de middleware si ese archivo existe en la raíz del proyecto;
  sin el archivo, no hay Edge Function que falle.
- **Hecho**: `git rm middleware.ts`. `lib/anon-cookie.ts` y
  `lib/metering.ts` se dejan intactos (no eliminados) — no tienen
  ningún otro caller además del `middleware.ts` ya borrado (verificado
  con grep), así que no quedan imports rotos, pero tampoco hacen nada
  hasta que se reconecten desde algún lado.
- **Verificado**: `next build` limpio; la línea `ƒ Middleware` que
  aparecía en la salida del build (antes con 34 kB) **ya no aparece en
  absoluto** — confirma que no se genera ninguna Edge Function de
  middleware para este build, que es exactamente lo que se necesita
  para que Vercel deje de invocar (y fallar) esa función en cada
  request.
- **Costo real de este fix, explícito**: la funcionalidad de cookie
  anónima/cupo de lectura gratuita queda completamente inactiva — sin
  `middleware.ts`, nunca se firma ni se envía la cookie `pb_anon`, así
  que `lib/metering.ts` trata a todo lector como siempre-nuevo (mismo
  comportamiento degradado que ya pasaba con `AUTH_SECRET` ausente, ver
  entrada anterior de este mismo registro, pero ahora permanente en vez
  de accidental). No hay redirect ni guard de rutas que dependiera de
  este middleware (el guard de `/admin` vive en el layout protegido de
  Fase 4, no acá) — confirmado leyendo el único archivo que existía,
  no había otra lógica mezclada en `middleware.ts`.
- **No resuelto, fuera del alcance de este repo**: la causa raíz real
  (por qué el pipeline de Edge Middleware de este proyecto de Vercel
  específicamente rompe con `__dirname is not defined` incluso para un
  middleware vacío) sigue sin identificarse — es un problema de
  plataforma que este sandbox no puede reproducir (requiere `vercel
  build` autenticado contra el proyecto real, sin credenciales
  disponibles acá). Recomendado abrir un ticket de soporte con Vercel
  usando esta cadena de evidencia: build local limpio → import relativo
  no lo arregló → try/catch no lo arregló → clear-cache redeploy no lo
  arregló → middleware no-op tampoco lo arregló → solo desaparece al
  eliminar el archivo por completo.
- **Para reactivar metering en el futuro**: la cookie anónima necesita
  moverse fuera de Edge Middleware — por ejemplo, firmarla/leerla desde
  un Server Action o Route Handler que corra en runtime Node.js en vez
  de Edge (evitando este pipeline específico de Vercel), o reintentar
  `middleware.ts` una vez que Vercel confirme que el problema de
  plataforma está resuelto.

## Próximos pasos (a la fecha de la última entrada del registro)

1. **Fase 4 — completa.** Los 5 checkpoints planeados están hechos y
   verificados contra Postgres/un servidor real: schema + webhook de
   Make.com, login de editor + guard, Server Actions con detección de
   conflictos, editor TipTap + subida a Vercel Blob, primitivas de campo +
   12 pestañas + preview en vivo, panel de analítica. Ver el registro de
   progreso arriba para el detalle de cada uno (bugs reales encontrados,
   cómo se verificó cada pieza).
2. **Fase 5 — completa.** Auditada primero contra legacy archivo por
   archivo (no asumida por el nombre de la fase): modo oscuro,
   transiciones/animaciones de `js/ui.js` y accesibilidad ya estaban en
   paridad 1:1, así que el trabajo real fueron los 4 checkpoints
   verificados: módulo "Más leídas" con GA4 (`lib/ga4.ts`,
   `lib/most-read.ts`, `components/home/MostReadSection.tsx`), Vercel Web
   Analytics + evento `pageview_article` (con un bug de carrera real
   encontrado y corregido — ver el checkpoint 2 en el registro), estados
   de carga/error en la subida de imágenes de TipTap, y una limpieza menor
   de Lighthouse/documentación. Ver el registro de progreso arriba para el
   detalle de cada uno.
3. **Fase 6** — Verificación end-to-end (ver plan completo para el detalle
   de qué probar) y corte a producción.
4. **Pendiente de despliegue, no de código**:
   - Verificar el flujo real de magic link con una `RESEND_API_KEY` real
     (Fase 3).
   - Verificar la subida real a Vercel Blob con un `BLOB_READ_WRITE_TOKEN`
     real (Fase 4, checkpoint 3).
   - Verificar el panel de analítica del admin con credenciales reales de
     Vercel Analytics (Fase 4, checkpoint 5).
   - Verificar datos reales del módulo "Más leídas" con credenciales de
     GA4 reales, y del evento `pageview_article` llegando de verdad al
     backend de Vercel (Fase 5, checkpoints 1 y 2).

## Convención: cómo mantener este archivo

Después de cada sesión de trabajo con cambios de código reales (no
correcciones triviales), agregar una entrada nueva al "Registro de
progreso" arriba, con: fecha, qué se hizo, cómo se verificó (no solo "se
escribió"), y qué queda pendiente. Actualizar también "Próximos pasos" si
cambió el orden o el alcance de lo que sigue. El README apunta acá para el
estado del proyecto — no dupliques el registro ahí.

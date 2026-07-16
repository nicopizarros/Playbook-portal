# Handoff — Playbook Media Portal

Documento de continuidad. Objetivo: que cualquiera (persona o sesión de
Claude Code nueva) pueda retomar el proyecto sin tener que releer todo el
historial de PRs. Última actualización: 2026-07-16.

## Qué es esto

Portal editorial de Playbook (medio de negocios del deporte, México/LATAM).
HTML/JS vanilla, sin paso de build, desplegado en Vercel. `articles.json` y
`content.json` son la base de datos del sitio; se editan desde `/admin`
(CMS con login) o directo por GitHub (incluyendo un webhook de Make.com que
pega en `/api/update-articles.js`).

Referencias de diseño usadas durante el proyecto: The Athletic, Rest of
World, Estadio MX. Reglas fijas de todo el proyecto: sin framework ni paso
de build, copy de interfaz en español, sin guiones largos (—) en ningún
texto generado, el CMS lo tiene que poder usar gente no técnica del equipo
editorial (Aldo, Eve, Majo), y toda automatización necesita una salida
manual.

## Dónde vive

`https://playbook-portal-phi.vercel.app`

**El equipo no tiene registrado ningún dominio propio.** En particular no
es dueño de `playbookmedia.mx` — ese dominio apareció hardcodeado en varios
lugares del código heredado y fue una fuente real de bugs en producción
(ver `lib/site-url.js` y la sección de incidentes más abajo). Todo el
código quedó limpio de esa referencia.

`playbookmedia.substack.com` es una propiedad real y sí es del equipo (el
newsletter) — no confundir con el dominio inexistente de arriba.

Arquitectura de dominio: las funciones serverless resuelven su propio
origen desde el request entrante (`lib/site-url.js` → `resolveSiteUrl(req)`,
usa `x-forwarded-host` / `host`), y el JS del cliente usa
`window.location.origin`. Si algún día se conecta un dominio propio en
Vercel, el sitio lo empieza a usar solo. Lo único que **no** se vuelve
dinámico son las etiquetas estáticas de `<head>` (canonical, Open Graph) en
los 5 HTML públicos y la línea `Sitemap:` de `robots.txt` — esas apuntan a
mano a `playbook-portal-phi.vercel.app` y hay que actualizarlas una sola
vez si eso pasa (mismo patrón `sed` documentado en el README para el token
de Search Console).

## Estado de credenciales / variables de entorno

| Servicio | Estado | Dónde se usa |
|---|---|---|
| GA4 (Measurement Protocol, `gtag.js`) | **Activo.** ID real `G-0CG7JMK8RZ` cargado en `js/analytics.js` | Las 5 páginas públicas |
| Google Search Console | **Verificado.** Token real cargado en el `<meta>` de las 5 páginas públicas, sitemap enviado | — |
| Vercel Web Analytics (built-in) | **Activo.** Shim `window.va` + `/_vercel/insights/script.js` en las 5 páginas públicas | Panel `/admin/analytics.html` |
| Vercel Analytics REST API (lectura) | **Activo**, requiere `VERCEL_ANALYTICS_TOKEN` y `VERCEL_PROJECT_ID` (este último lo inyecta Vercel solo si está prendido "Enable access to System Environment Variables") | `lib/vercel-analytics.js`, `api/analytics-data.js` |
| GA4 Data API (lectura, para "Más leídas") | **Pendiente.** Faltan `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_EMAIL`, `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` | `lib/ga4.js`, `api/top-articles.js` |
| `ADMIN_USERS` / `ADMIN_TOKEN_SECRET` | Activo (preexistente) | `lib/auth.js`, login de `/admin` |

El módulo "Más leídas" de la portada (`js/most-read.js`) ya está escrito y
verificado; simplemente se queda oculto (`hidden`) mientras
`api/top-articles.js` devuelva `configured: false`. El día que lleguen las
tres variables de GA4 Data API, el módulo se activa solo, sin tocar código.

## Mapa de archivos (lo no obvio)

- `lib/site-url.js` — resuelve el dominio del request, ver arriba. Todo
  self-fetch server-side (sitemap, feed, article-page, top-articles,
  analytics-data) pasa por acá.
- `lib/github.js` — Contents API de GitHub para los saves del admin, con
  concurrencia optimista vía `sha`.
- `lib/auth.js` — tokens de sesión firmados con HMAC para el login del
  admin.
- `lib/ga4.js` — cliente de GA4 Data API. Firma a mano un JWT de service
  account (RS256 vía `crypto` de Node, sin SDK). `isConfigured()` chequea
  las tres env vars en cada request, sin cachear.
- `lib/vercel-analytics.js` — cliente REST de Vercel Web Analytics
  (`api.vercel.com/v1/query/web-analytics`). Separado de GA4 a propósito:
  mide tráfico real del hosting, no depende de que el visitante no bloquee
  el script de Google.
- `api/article-page.js` — server-side rendering liviano solo para bots que
  no ejecutan JS (WhatsApp, Twitterbot, facebookexternalhit, etc.). Lee
  `articulo.html` de disco (`vercel.json` necesita
  `functions."api/article-page.js".includeFiles`), le inyecta OG/Twitter/
  canonical reales por artículo con reemplazo de texto, y sirve el archivo
  sin tocar a humanos. Requiere el rewrite `/articulo.html` →
  `/api/article-page` en `vercel.json`.
- `api/sitemap.js` / `api/feed.js` — generan XML en cada request desde
  `articles.json` (vía self-fetch HTTP, no lectura de disco — el bundler de
  Vercel solo empaqueta lo que puede trazar por imports estáticos). Sitemap
  tiene tiers de prioridad/changefreq documentados en el propio archivo.
- `api/analytics-data.js` — protegido por token, arma todos los paneles de
  `/admin/analytics.html`. Nunca tira 500; cada panel se degrada
  independiente con flags `available`/`error`.
- `admin/analytics.html` + `admin/analytics.js` — dashboard de analítica en
  el admin, Chart.js por CDN (sin dependencia npm). Deliberadamente sin
  tags de analytics propios (no tiene sentido medir a los editores).
- `js/article-page.js`, `js/author-page.js`, `js/most-read.js` — lógica de
  cliente de las páginas públicas nuevas.

## Historial de Pull Requests

| PR | Título | Rama | Contenido |
|---|---|---|---|
| #8 | Add article/archive pages, fix hero link, cap homepage at 6, recolor CTAs | `claude/playbook-portal-audit-upgrade-q3onzo` | Fundacional, previo a este engagement |
| #9 | Open article links in a new tab, add blurred preview filler, smooth motion (+ revert a same-tab) | `claude/playbook-portal-audit-upgrade-q3onzo` | Previo a este engagement |
| — | `vercel/install-vercel-web-analytics-avddkn` (PR #10, autofusionado por `vercel[bot]` directo a `main`) | — | Instaló `@vercel/analytics` como dependencia npm, **pisó `js/analytics.js` con una versión rota** (sin GA4, sin `track()`) y agregó tags de analytics a las páginas de admin. Ver "Incidentes" abajo — se revirtió a mano sin perder Web Analytics real. |
| #11 | Etapa 1 a Etapa 3 completas: SEO por artículo, sitemap, relacionados, quita el muro de contenido, GA4, interruptor de autor, feed RSS, compartir nativo, página de autor, módulo Más leídas con GA4 Data API, resolución del merge conflict con el PR de Vercel | `claude/playbook-portal-audit-roadmap-qfpxgx` | Grande, contiene todo el trabajo de Etapa 1-3 |
| #12 | Etapa 2 (verificación GSC, OG real para bots, performance/CLS, 404), panel de Analítica con Vercel Web Analytics, activación de GA4 con ID real, endurecimiento de sitemap.xml (6 requisitos), fix del bug del dominio hardcodeado, remoción total de referencias a `playbookmedia.mx` | `claude/playbook-portal-audit-roadmap-qfpxgx` | Segunda mitad del roadmap + los dos incidentes de producción |
| #13 | Fix sitemap headers for Google Search Console fetch | `claude/sitemap-gsc-fetch-headers-i4i3ih` | Sesión distinta, concurrente. Agregó `X-Robots-Tag: noindex` y cambió `Cache-Control` a `public, max-age=3600` en `api/sitemap.js` |

Todos estos ya están fusionados en `main` (confirmado por ancestría de git,
no solo por el campo `merged` de la API de GitHub — ese campo mostró
inconsistencias puntuales durante el proyecto, ver incidentes).

## Incidentes reales de producción (y cómo se resolvieron)

1. **OG tags invisibles para WhatsApp/Twitter/Facebook.** Los tags Open
   Graph se inyectaban por JS del lado del cliente; los crawlers de esas
   plataformas no ejecutan JS, así que nunca los veían. Se resolvió con
   `api/article-page.js` (SSR mínimo solo para bots detectados por
   User-Agent).

2. **CLS 0.22 en la página de artículo.** El skeleton loader estaba
   dimensionado para el teaser corto viejo, no para el cuerpo completo
   nuevo. Se agrandó el skeleton (`.skel-photo` + más líneas) hasta CLS
   0.13 y performance 88 a 94 en Lighthouse mobile.

3. **PR automático de `vercel[bot]` se autofusionó a `main`** ("Install
   Vercel Web Analytics", commit `59a2040`) e introdujo una dependencia npm
   no deseada, pisó `js/analytics.js` con una versión rota, y le agregó
   tags de analytics a las páginas de admin. Se resolvió con un merge
   manual (`f083f14`): se restauró `js/analytics.js` real, se sacaron los
   tags duplicados de las páginas públicas y los tags agregados de las
   páginas de admin, y se sacó `package.json`/`package-lock.json` del
   tracking (`git rm --cached`, el proyecto no tiene ni necesita
   dependencias npm).

4. **Dominio hardcodeado inalcanzable, causa raíz de "no funciona" en
   Search Console.** `SITE_URL = 'https://www.playbookmedia.mx'` estaba
   hardcodeado en 7 archivos server-side para los self-fetches internos.
   Ese dominio no responde (confirmado con `curl` directo, error 502 de
   túnel). Esto rompía en silencio tanto `api/sitemap.js` (servía sitemap
   casi vacío) como `api/article-page.js` (los bots nunca recibían OG real,
   o sea que el fix del punto 1 seguía roto en producción sin que se
   notara). Se resolvió centralizando la resolución de origen en
   `lib/site-url.js` (`resolveSiteUrl(req)`), usada por las cinco funciones
   afectadas, más `window.location.origin` del lado del cliente.

5. **`playbookmedia.mx` aparecía en más lugares de lo que el fix del punto
   4 cubría.** El equipo confirmó que no es dueño de ese dominio. Un grep
   completo del repo encontró 8 archivos más con la referencia (canonical/
   OG estáticos, `robots.txt`, documentación). Se reemplazaron todos por el
   dominio real y vivo, sin tocar las referencias legítimas a
   `playbookmedia.substack.com`.

6. **Confusión de estado de PR vía API.** `list_pull_requests` devolvió un
   PR con `state: closed, merged: false` pero con `merged_at` poblado —
   inconsistencia aparente de la API. Se resolvió verificando con
   `git merge-base --is-ancestor` directo contra `main`: el commit sí
   estaba fusionado. Ante esta discrepancia, confiar en la historia de git,
   no en el campo booleano de la API.

## Roadmap: qué se completó

- **Etapa 1** (cimientos de encontrabilidad): SEO por artículo, sitemap,
  artículos relacionados, remoción del muro de contenido, GA4, interruptor
  de visibilidad de autor. Completa.
- **Etapa 3** (adelantada a pedido, antes que la 2): feed RSS, botones de
  compartir nativos (WhatsApp/X, sin SDK de terceros), página de archivo
  por autor. Completa.
- **Etapa 2**: módulo Más leídas (código listo, esperando credenciales de
  GA4 Data API), verificación de Search Console, OG real para bots vía SSR,
  pase de performance con Lighthouse, página 404 con marca propia. Completa.
- **Fuera del roadmap original, agregado a pedido**: panel de Analítica en
  el admin con datos reales de Vercel Web Analytics REST API (KPIs,
  artículos más vistos, referrers, países, dispositivos, gráficos con
  Chart.js por CDN).
- **Etapas 4-6** del roadmap original (páginas de tema/tag, automatización
  supervisada, pulido listo para patrocinadores incluyendo dark mode y
  stubs de paywall): **no iniciadas.**

## Pendientes explícitos (decisiones diferidas, no descuidos)

- **Favicon**: sigue siendo un placeholder. El equipo pidió saltarlo por
  ahora, pendiente de que diseño entregue el real.
- **Credenciales de GA4 Data API**: pendientes de creación de la propiedad;
  el código ya está listo para activarse solo en cuanto lleguen (ver tabla
  de credenciales arriba).
- **Contraste de color (WCAG AA)**: Lighthouse marcó el color de badge
  `--src-lana` y el texto de copyright del footer por debajo de 4.5:1. Es
  una decisión de color de marca, no un bug técnico — no se tocó a la
  espera de que el equipo decida.
- **Dominio propio**: si se compra uno, hace falta actualizar a mano las
  etiquetas estáticas de `<head>` en 5 HTML y la línea `Sitemap:` de
  `robots.txt` (instrucciones exactas en el README, sección Dominio).
- **Etapas 4-6 del roadmap**: no iniciadas, ver arriba.

## Convenciones a mantener

- Sin paso de build, sin dependencias npm nuevas (Chart.js y cualquier otra
  librería de cliente van por CDN, no por `npm install`).
- Copy de interfaz en español.
- Sin guiones largos (—) en texto generado por Claude.
- Toda automatización necesita salida manual (ejemplo: el toggle de mostrar
  autor es una capacidad configurable, no una política fija en código).
- `articles.json`/`content.json` siguen siendo la fuente de verdad; nada de
  esto migra a una base de datos real sin que el equipo lo pida
  explícitamente.

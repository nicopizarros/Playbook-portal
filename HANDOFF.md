# Handoff — Playbook: migración a Next.js

Documento de continuidad. Objetivo: que cualquiera (persona o sesión de
Claude Code nueva) pueda retomar el proyecto sin tener que releer todo el
historial de commits/PRs. **Este archivo se actualiza en cada sesión de
trabajo relevante** — ver la convención al final. Última actualización:
2026-08-05.

**Estado: auditoría pre-lanzamiento hecha.** La rama
`claude/playbook-pre-launch-audit-fu1bzg` contiene una revisión completa
del sitio antes de abrirlo al público, con 15 defectos reales encontrados
ejercitando la app corriendo (no leyendo código) y corregidos — ver la
entrada del 2026-08-04 al final del registro de progreso, que es lo
primero que hay que leer. **Dos cosas siguen bloqueando un lanzamiento
100% limpio y ninguna se puede resolver desde código**: los placeholders
`[DOMICILIO FISCAL]` (`/privacidad`) y `[JURISDICCIÓN]` (`/terminos`).

**PR abierto**: ninguno. Los PR #28/#29/#30/#31 ya mergearon a `main`; la
Fase 6 (migración completa) también mergeó. El plan anterior (Fases 7, 8 y
9, más abajo) ya está completo salvo lo anotado en "Próximos pasos". El PR
#22 original de la migración (rama `claude/playbook-nextjs-migration-9zn6nh`)
sigue superado por el flujo de Fases 1-6 ya mergeado — no seguir trabajando
ahí.

## Plan de desarrollo — Roadmap Agosto 2026 (Fases 0-6)

Backlog acumulado, recibido del usuario como documento de trabajo el
2026-08-01, para ejecutarse en fases — cada fase pensada como una sesión
independiente de Claude Code. Agrupado por tipo de trabajo (no por urgencia
de negocio) para no tocar el mismo sistema en sesiones separadas. Dentro de
cada fase, de más simple a más complejo.

**Antes de arrancar cualquier fase de este plan**: leer primero la entrada
del registro de progreso de la fase anterior (si existe) — varias fases de
este plan tienen ítems que ya estaban resueltos en el código antes de
arrancar (ver Fase 0 abajo) o que dependen de una fase anterior.

### Fase 0 — Bugs visuales críticos — **completa**

- [x] Tag negro del hero del 5+1 y footer: "La Lana del Mundial" → "La Lana
      del Deporte" — corregido en código (31-jul) y en los 4 artículos +
      footer de producción real (`fix:lana-rebrand`, corrido 2026-08-01).
- [x] Foto de portada de "La Lana del Deporte" no carga — verificado
      directo en producción: ya estaba bien, no hacía falta nada.
- [x] Fotos de los testimoniales no cargan — el campo `avatar` no existía
      en absoluto en producción (no una ruta rota); corregido con
      `fix:testimonial-avatars`, corrido 2026-08-01.
- [x] El botón de Playbook (logo del header) no regresa a home cuando estás
      dentro de un tag del 5+1 — resuelto en código
      (`components/layout/BrandLink.tsx`), verificado con Playwright.

**Criterio de aceptación:** revisar el 5+1 completo y el footer en
producción, confirmar que no queda ninguna referencia visual o textual a
"Mundial" donde debería decir "Deporte", y que todas las imágenes cargan en
desktop y mobile.

**Estado**: los 4 ítems tienen fix de código Y de datos de producción
confirmados — ver las entradas del 2026-08-01 en el registro de progreso
(diagnóstico inicial, fix del botón, y la entrada "Fase 0 cerrada de
verdad" donde los 3 scripts de datos corrieron contra la Neon real).
Pendiente solo que el usuario lo confirme visualmente en el sitio
desplegado.

### Fase 1 — Arquitectura de navegación e información

- [x] Borrar el tag "Playbook" y traspasar todos sus artículos al tag
      "Noticias" — código mergeado 2026-08-01; los 5 artículos reales de
      producción reasignados el mismo día (`fix:reassign-playbook-tag`,
      ver la entrada "Fase 0 cerrada de verdad"). **Ítem completo.**
- [x] Cambiar el botón "Ver más" del 5+1 por "Más noticias", moverlo debajo
      del bloque del 5+1 (no arriba) — mergeado 2026-08-01.
- [x] Reemplazar el nombre del tag "Análisis" por "Artículo" en la ficha de
      cada pieza — mergeado 2026-08-01 (interpretado como el CTA por-tarjeta
      de la sección de opinión, ver esa entrada para el porqué).
- [x] Reubicar el módulo de "Tips" y "5 más leídas" debajo del bloque de
      suscripción — "5 más leídas" reubicado 2026-08-01. **"Tips" no existe
      en el código ni en ningún prototipo** (grep sin resultados) — no se
      tocó nada por ese nombre; preguntar al usuario a qué se refiere antes
      de la siguiente sesión.
- [x] Crear carpetas internas para los productos editoriales (en vez de
      redirigir a Substack), con diseño propio por producto, no la vista
      clásica de "ver más" — **hecho el 2026-08-05** sobre los briefs de
      diseño del usuario (ver la entrada del registro de progreso):
      /industry-shots, /la-lana, /futbol-business-review, /infinitas,
      cada uno con identidad propia. Pendiente solo el script de
      producción y la revisión del usuario. Nota original de la sesión de
      planeación, para contexto: separar
      este último ítem del resto de la fase, es un mini-proyecto de diseño
      (hay que definir primero "los temas centrales" de cada producto),
      no un cambio de navegación simple como los otros cuatro. Además, 3 de
      los 4 productos (Noticias, La Lana del Deporte, Infinitas) YA
      enlazan a una colección interna (`/archivo?source=...`) en vez de
      Substack desde una sesión anterior (ver HANDOFF, entrada sin fecha
      dedicada, buscar "Navegación: enlaces de productos editoriales a
      Substack") — lo que falta es el diseño propio por producto, no la
      desconexión de Substack en sí. The Futbol Business Review se deja
      apuntando a Substack a propósito (no tiene `source` propio todavía).

**Criterio de aceptación:** navegar el portal de punta a punta sin
encontrar un link que saque al usuario a Substack que sea evitable, y
confirmar que la jerarquía de tags (Noticias, Artículo, y los productos
editoriales) es consistente en todo el sitio.

### Fase 2 — Automatización de contenido y skills — **completa**

- [x] Entrenar el skill de tags para que asigne todos los tags relevantes
      por artículo
- [x] Modificar el skill para que la portada de cada artículo de opinión
      sea la imagen de portada real de Substack, nunca una foto del cuerpo

**Criterio de aceptación (endurecido en la sesión de planeación, el
original era débil)**: correr el skill sobre una muestra de 10 artículos
existentes (mezcla de noticias y opinión) y exigir un umbral explícito
antes de aplicarlo al catálogo completo — ej. tags correctos en 9/10 sin
ningún falso positivo de portada — no solo "confirmar manualmente que se
ven bien".

**2026-08-02 — hecho:** `publish-newsletter/SKILL.md` reescrito para que
`tagsScope`/`tagsSport`/`tagsVertical` asignen todos los valores que
apliquen por nivel (antes pedía "el más específico", de ahí el
sub-etiquetado — 61 de 62 artículos vivos tenían un solo `tagsSport`).
Se agregó la rama `Opinión`/`opinion` faltante en el mapeo
publication/source (no existía ninguna) y, para `source: 'opinion'`, la
portada ahora sale de la imagen de portada propia del post de Substack en
vez de una búsqueda externa. Auditoría de los 62 artículos publicados:
se corrigieron 3 artículos de Liga MX (les faltaba `Fútbol` junto a `Liga
MX`) y 1 artículo se completó con `Gobernanza y Regulación`; el resto del
catálogo ya tenía un etiquetado de `tagsVertical`/`tagsScope` razonable,
no se tocó por no tener alta confianza editorial. No había ningún
artículo con `source: 'opinion'` publicado (ni en otro estado) al momento
de la auditoría, así que el fix de portada no tuvo nada que retro-aplicar
— aplica hacia adelante.

### Fase 3 — Pulido visual — **completa**

- [x] Glitch/parpadeo del header en Windows en el tab de Infinitas —
      **mecanismo real encontrado y corregido 2026-08-01, sin video**: no
      es el shrink-on-scroll del header, es que cruzar de "página con
      scroll" a "sin scroll" (Infinitas con solo 2 artículos) hace
      aparecer/desaparecer la scrollbar clásica de Windows, reflowing todo
      el ancho de la página — `html{scrollbar-gutter:stable}`
      (`styles/reset.css`). Ver esa entrada del registro para la
      investigación completa. **Pedirle confirmación al usuario en
      Windows real** — no se pudo observar el efecto exacto en este
      sandbox (Chromium headless en Linux no reserva scrollbar de la misma
      forma).
- [x] Agregar el morado de Infinitas al botón de hasta abajo de esa
      sección — mergeado 2026-08-01 (el botón real es el `.inf-pill` del
      footer).
- [x] Refinar el color del pill del buscador — el usuario aclaró la queja
      ("se ve viejo, no pulido"); corregido 2026-08-01, era el único pill
      del sitio con fondo relleno en vez del lenguaje "outline" (borde
      fino sobre `--paper`) que usa el resto del sistema de diseño.
- [x] "Compartir" de cada artículo: agregar logos de redes, sumar más
      opciones, mover el bloque debajo de los tags del artículo —
      mergeado 2026-08-01 (Facebook + LinkedIn + copiar enlace agregados;
      si el usuario quería otras redes específicas, decirlo).

**Criterio de aceptación:** revisar en Chrome, Safari y un navegador en
Windows que no haya parpadeos ni desalineaciones, y que el bloque de
compartir se vea igual de bien en mobile que en desktop.

### Fase 4 — Contenido dinámico

- [x] Hacer dinámico el bloque de artículos de opinión: que rote según
      ranking (recencia + estrellas) con la misma fórmula del 5+1, fuera
      del 5+1 por default salvo excepción manual — mergeado 2026-08-01,
      verificado con artículos de prueba reales contra Postgres local (ver
      esa entrada del registro). **Fase 4 completa.**

**Nota de la sesión de planeación, confirmada leyendo el código**: la
fórmula ya existe como función compartida y reutilizable en `lib/rank.ts`
(`rankScore`/`rankArticles`/`selectHero`, con comentarios explicando cada
decisión de tuning) — extenderla a opinión es bajo riesgo, no hay que
construir una segunda fórmula ni razonar el diseño desde cero.

**Criterio de aceptación:** confirmar que el ranking de opinión usa
exactamente la misma fórmula del 5+1 (sin una segunda fórmula paralela), y
que un artículo de opinión marcado como excepción sí puede forzarse dentro
del 5+1.

### Fase 5 — Sistema de cuentas y autenticación — **efectivamente resuelta**

Orden de preferencia original: (1) Auth vía Substack, (2) Resend como
alternativa, (3) formulario simple solo-correo. **La nota de la sesión de
planeación que describía esto quedó desactualizada** — no reflejaba
`auth.ts` real. Estado real, confirmado en el código (commit `8c24e4d
Switch reader auth from Resend magic-link to Google OAuth`, ya en `main`):

- **(1) Substack: investigado y descartado 2026-08-02.** La Developer API
  pública de Substack (`substack.com/api-tos`) solo expone datos públicos
  de perfil de creador/publicación (nombre, conteo de suscriptores, links
  sociales) para discovery/analítica/embeds — no hay OAuth de login ni
  forma de verificar si un email es suscriptor de una publicación. No es
  una cuestión de esfuerzo, Substack simplemente no ofrece esto para
  terceros.
- **(2) Resend: se intentó, se abandonó por la misma razón que motivó
  reconsiderar esto.** El dominio de envío de Resend nunca se verificó
  (el usuario no administra ese dominio), así que el magic-link de lector
  nunca pudo enviarse a direcciones reales en producción.
- **Lo que reemplazó a (1) y (2), ya en producción:** auth de lector vía
  **Google OAuth** (`auth.ts`, provider `Google`), auth de editor vía
  Credentials (usuario/contraseña contra la tabla `editors`), ambos con
  sesión JWT y el rol derivado del provider que autenticó, nunca del
  cliente. Resend sigue existiendo solo para invitaciones de editor
  (`lib/actions/editor-auth.ts`), con degradación agraciada a un link
  copiable si `RESEND_API_KEY`/`EMAIL_FROM` faltan o fallan — no bloquea
  nada, es un fallback ya contemplado.

**Ítem nuevo pedido explícitamente por el usuario (2026-08-02), no estaba
en el plan original — construido, ver detalle abajo:** una segunda opción
de registro de lector con email + contraseña propios de Playbook,
colapsada por default junto al botón de Google, pensada para bajar la
fricción de no depender de Google. **Todavía sin resolver, pedido en la
misma sesión pero no construido:** exportar/subir esa base de emails a
Substack como suscriptores — no se definió si es manual o automatizado,
así que no se tocó código para eso. Si se construye más adelante,
`/privacidad` va a necesitar un párrafo nuevo declarando esa
transferencia a Substack como tercero.

**2026-08-02 — construido: registro de lector con email + contraseña**
(alternativa a Google, no reemplazo — ambas opciones conviven):
- `lib/db/schema.ts`: columna nueva `password_hash` (nullable) en `user`,
  migración `drizzle/0007_add-user-password-hash.sql` generada con
  `drizzle-kit generate` (no se pudo aplicar contra la Neon real desde
  este sandbox, el pool `pg`/TCP que usa `lib/db/client.ts` en tiempo de
  ejecución de la app sigue bloqueado aquí a diferencia del driver HTTP
  que sí funciona para scripts sueltos — se aplica sola en el próximo
  deploy de Vercel vía `scripts/predeploy-migrate.ts`, que corre en cada
  build).
- `auth.ts`: segundo provider `Credentials` con `id: 'reader-credentials'`
  (distinto del `credentials` de editores), verifica contra
  `users.passwordHash` con bcrypt, nunca compara si el hash es null (cuenta
  Google-only). El `jwt` callback ya clasificaba cualquier provider
  distinto de `'credentials'` como lector, así que no necesitó cambios.
- `lib/actions/reader-auth.ts`: `signUpOrSignInWithPasswordAction`, un
  solo formulario para alta y login (el lector no necesita saber si ya
  tenía cuenta). Rate-limit igual que el login de editor (10 intentos/5
  min por IP). Si el correo ya existe sin `passwordHash` (cuenta de
  Google), rechaza con un mensaje explícito en vez de "adjuntar" una
  contraseña a esa cuenta silenciosamente. Corre con `redirect:true`
  (mismo patrón que `loginAction` de editores): éxito lanza el
  `NEXT_REDIRECT` interno de Next, que debe propagar sin capturarse; solo
  un `AuthError` real se convierte en mensaje de formulario. Maneja la
  condición de carrera de dos altas concurrentes con el mismo correo nuevo
  (violación de unicidad `23505`) sin tronar.
- `components/account/PasswordAuthForm.tsx` (nuevo, cliente): colapsado
  por default detrás de "O continúa con tu correo y contraseña", un solo
  campo de correo + contraseña + botón "Continuar". Montado en
  `EmailWall.tsx` (muro de artículos) y `AccountSignInPrompt.tsx`
  (`/cuenta`), debajo del botón de Google en ambos.
- `/privacidad` y `/terminos` corregidos para reflejar la realidad actual
  (Google OAuth + contraseña propia opcional) — **ya estaban
  desactualizados antes de este cambio**, seguían describiendo el
  magic-link de Resend que el commit `8c24e4d` había retirado; se
  aprovechó para corregir eso también, no solo para documentar lo nuevo.
  Se agregó un tercero nuevo a la lista de `/privacidad` (Google como
  proveedor de identidad, antes solo aparecía como GA4/AdSense) y se quitó
  el bullet de Resend (ya no aplica a lectores).
- **Verificado:** `tsc --noEmit`, `npx eslint` sobre los archivos
  tocados, y `next build`, limpios los tres. **No verificado en
  navegador/DB real:** el pool TCP de `lib/db/client.ts` sigue sin
  conexión posible desde este sandbox (confirmado de nuevo, un `select 1`
  contra Neon vía ese pool cuelga y hay que matarlo por timeout) — no se
  pudo probar el flujo de alta/login end-to-end ni tomar capturas. Pedirle
  al usuario que lo prueba después del próximo deploy: registrarse con
  correo+contraseña nueva, cerrar sesión, volver a entrar con la misma
  contraseña, y confirmar que un correo ya registrado por Google rechaza
  el intento de registro con contraseña con el mensaje esperado.

**Criterio de aceptación:** confirmar el orden de implementación con el
equipo antes de programar, y documentar esa decisión antes de tocar código.

**2026-08-02 — pedido nuevo del usuario, fuera del roadmap original:
panel admin de lectores + sincronización a Google Sheets.**
- **`components/admin/tabs/ReadersTab.tsx`** (nuevo, pestaña "Lectores",
  grupo "Equipo" en `AdminDashboard.tsx`): lista de lectores registrados
  (correo, nombre, método de alta Google/contraseña, fecha, lecturas
  totales), con buscador por correo/nombre. Mismo patrón de
  auto-carga sin draft que `TeamTab.tsx`. Fuente: `getReadersData()` en
  `lib/actions/readers.ts` (nuevo), un solo query con `leftJoin` +
  `count` contra `article_reads`, sin paginar todavía (pocos lectores a
  esta altura, revisar si la lista crece).
- **`lib/google-sheets.ts`** (nuevo): agrega una fila a una Google Sheet
  cada vez que se crea una cuenta de lector nueva, vía Google o vía
  correo+contraseña. Reutiliza el mismo service account que ya usa
  `lib/ga4.ts` (mismo JWT hand-rolled, sin paquete `googleapis`), pidiendo
  el scope de Sheets en vez del de Analytics — no hace falta una
  credencial nueva, pero sí dos pasos de setup fuera de código:
  1. Habilitar la **Google Sheets API** en el mismo proyecto de Google
     Cloud del service account de GA4 (es una API separada de la
     Analytics Data API que GA4 ya tiene habilitada).
  2. Crear la hoja de cálculo y **compartirla con el correo del service
     account** (`GA4_SERVICE_ACCOUNT_EMAIL`) como Editor, igual que se
     comparte con cualquier persona — el acceso a Sheets no depende de
     los permisos de la propiedad de GA4 en absoluto, es un share aparte.
  3. Poner el ID de esa hoja (la cadena larga en su URL) en la variable
     nueva `READERS_SHEET_ID` (Vercel + `.env.local.example` ya
     documentado ahí).
  Sin `READERS_SHEET_ID` configurada, `appendReaderRow()` no hace nada —
  nunca bloquea ni falla un registro real, mismo criterio de degradación
  agraciada que el resto de las integraciones opcionales del proyecto
  (`isConfigured()` + try/catch que solo loguea, nunca lanza).
- **Columnas escritas** (pedido explícito del usuario): fecha de
  registro, correo, nombre, método (Google/Contraseña), lecturas totales.
  **La columna de lecturas totales se queda en 0** en la fila que este
  append escribe al momento del alta (un lector recién registrado no leyó
  nada todavía) — resuelto con la sincronización periódica de más abajo,
  no con este append en sí.
- **Dos puntos de enganche**, uno por cada camino de alta (no hay un solo
  lugar que cubra ambos): `auth.ts`'s `events.createUser` (dispara solo
  para altas vía el adapter, o sea Google) y directamente después del
  `db.insert(users)` exitoso en `lib/actions/reader-auth.ts` (alta por
  contraseña, que nunca pasa por el adapter). El caso de condición de
  carrera (23505, dos altas concurrentes con el mismo correo) no dispara
  el append por partida doble — solo la request que efectivamente creó la
  fila lo hace.
- **Verificado:** `tsc --noEmit`, `npx eslint` sobre los archivos
  tocados, y `next build`, limpios los tres. **No verificado**: ni la
  pestaña de lectores ni el append a Sheets se probaron contra Neon/Google
  reales desde este sandbox — mismo bloqueo de siempre (pool TCP no
  conecta aquí) más el hecho de que `READERS_SHEET_ID` no está configurada
  todavía (el usuario no ha hecho los 3 pasos de setup de arriba). Pedirle
  al usuario que, después de configurar la hoja y hacer deploy, registre
  un lector de prueba y confirme que la fila aparece.

**2026-08-02 — construido, mismo día: sincronización periódica completa a
Sheets** (pedido del usuario tras leer el caveat de arriba: "Build it").
- `lib/data/readers.ts` (nuevo): la query de lectores se movió acá desde
  `lib/actions/readers.ts` sin cambiar su forma, para que tanto la pestaña
  admin (que la envuelve en `requireEditor()`) como el cron de abajo
  (que la protege distinto, ver siguiente punto) compartan una sola
  fuente en vez de dos copias de la misma query.
- `lib/google-sheets.ts`: `syncAllReadersToSheet()`, nueva. A diferencia
  de `appendReaderRow` (agrega una fila), esta **limpia la hoja entera y
  la reescribe completa** con el conteo de lecturas actualizado de cada
  lector — se eligió sobre "actualizar solo las filas que cambiaron"
  porque hacer eso bien requeriría rastrear en qué fila de la hoja quedó
  cada lector, y eso se rompe apenas alguien edita la hoja a mano. Las dos
  formas de escritura conviven sin pisarse: el append por alta dice "este
  lector ya existe" casi al instante, y la resincronización completa
  (corre una vez al día) termina sobrescribiendo esa fila con el conteo
  real la próxima vez que corre.
- `app/api/cron/sync-readers-sheet/route.ts` (nuevo) + `vercel.json`
  (nuevo, no existía): un cron de Vercel, todos los días a las 9:00 UTC
  (~3-4am Ciudad de México, tráfico bajo a propósito). Protegido con
  `CRON_SECRET` vía el header `Authorization: Bearer` que Vercel firma
  solo con que la variable exista — no hay nada que configurar del lado
  de Vercel más allá de poner un valor random en esa variable de entorno.
  Sin `READERS_SHEET_ID` configurada todavía, el cron sigue disparando en
  su horario pero no hace nada (`{synced:false, reason:'not configured'}`),
  arranca a sincronizar solo con que el usuario complete el setup de
  Sheets, sin tocar código ni el cron en sí.
- **Verificado:** `tsc --noEmit`, `npx eslint`, `next build`, limpios los
  tres. **No verificado**: el cron en sí (necesita un deploy real en
  Vercel para disparar por primera vez, no algo simulable desde este
  sandbox) ni la escritura real a Sheets (mismo bloqueo de siempre:
  `READERS_SHEET_ID` sin configurar todavía). Una vez desplegado y
  configurado, confirmar desde el dashboard de Vercel (pestaña Cron Jobs
  del proyecto) que la primera corrida programada de verdad sincronizó.

**2026-08-02 — investigado, sin cambio de código: bug reportado de
"Iniciar sesión" duplicado en el header (iPad, captura del usuario).**
Este bug exacto — dos links "Iniciar sesión" visibles al mismo tiempo en
la barra superior en un iPad — **ya estaba arreglado en código antes de
esta sesión**, commit `a834d09` ("Fix duplicate header controls, header
fit 1181-1400px, archive orphan rows", 2026-07-24), **ya mergeado a
`main`** (confirmado con `git merge-base --is-ancestor` y comparando
`styles/header.css`/`styles/responsive.css`/`HeaderNav.tsx` contra `main`
línea por línea: sin diferencias en esa lógica entre esta rama y `main`).
El fix convirtió lo que eran dos media queries que debían coincidir
(`min-width:921px` ocultando las copias del drawer, `max-width:920px`
ocultando las de escritorio) en una sola regla de un solo lado (oculto
por default, encendido solo dentro de la media query del drawer,
`max-width:1180px`) — estructuralmente ya no puede desincronizarse porque
no tiene una regla pareja de la que desincronizarse. Revisado de nuevo
esta sesión sin encontrar ninguna regresión ni ningún tercer lugar que
renderice "Iniciar sesión".

**Conclusión: no es un bug de código vigente, es casi con certeza un
deploy de producción desactualizado** (playbook.la sirviendo un build
anterior a `a834d09`) o caché de CDN/navegador — la lógica actual, la
misma en esta rama y en `main`, no permite que las dos versiones se vean
a la vez. El push de esta sesión a `main` (que ya incluía este fix, así
que no lo repite, pero sí dispara un deploy nuevo) es lo que debería
resolverlo. **Pedirle al usuario que, después del próximo deploy,
recargue `playbook.la` con caché forzada (Cmd+Shift+R o equivalente) y
confirme en el iPad real.** Si el bug persiste incluso después de un
deploy confirmado como posterior a `a834d09`, eso apuntaría a algo más
sutil (un ancho de viewport específico no cubierto por los 1180px, poco
probable dado el diseño de regla única, pero no descartado sin poder
probarlo en un iPad real) y ameritaría una sesión dedicada con acceso a
production real.

### Fase 6 — Legal y compliance

- [x] Corregir argentinismos en los términos y condiciones
- [ ] Llevar el compliance general al 100% (definir primero el checklist:
      aviso de privacidad, cookies, términos, todo lo que aplique a un
      medio digital en México) — checklist definido y casi todo
      implementado, ver nota 2026-08-02; quedan dos placeholders que
      necesitan un dato de negocio real, no algo que se pueda inventar
      desde código.

**Dependencia no explícita en el doc original, anotada en la sesión de
planeación**: si Fase 5 termina eligiendo Resend o un formulario de email
(en vez de, o adicional a, Substack), el aviso de privacidad de esta fase
tiene que reflejar esa recolección de datos — no tratar esta fase como
aislada de la decisión de Fase 5.

**Criterio de aceptación:** que un tercero (no quien escribió el texto) lea
los términos y condiciones completos y confirme que el español es
neutro/mexicano, y que exista un checklist de compliance marcado como
completo.

**2026-08-02 — hecho:** se corrigió el voseo argentino tanto en
`/terminos` como en `/privacidad` (`sos`/`escribinos`/`te registrás`/
`trabajás`/`visitás`/`podés` → `eres`/`escríbenos`/`te registras`/
`trabajas`/`visitas`/`puedes`; "casilla de correo" → "cuenta de correo
electrónico"); no había más voseo en el resto del sitio (`app/`,
`components/`).

Checklist de compliance definido para un medio digital en México
(LFPDPPP + buenas prácticas), con estado de cada punto:
- [x] Aviso de Privacidad (`/privacidad`): identidad del responsable,
  datos recolectados, finalidades, terceros, derechos ARCO, ya existía.
- [x] Términos y Condiciones (`/terminos`): ya existía.
- [x] Mecanismo de consentimiento de cookies granular
  (`components/CookieNotice.tsx` + `lib/consent.ts`): esenciales/analítica
  siempre activas, publicidad opt-in, ya existía.
- [x] CMP certificado (Google Funding Choices) para tráfico EEA/UK/CH, ya
  existía (`app/layout.tsx`).
- [x] `ads.txt`, ya existía.
- [x] Autoservicio de derechos ARCO (exportar/eliminar cuenta) en
  `/cuenta`, ya existía.
- [x] Enlaces a ambos documentos legales visibles en el footer de cada
  página, ya existía.
- [x] **Gap real encontrado y corregido:** no había forma de revisar o
  cambiar la elección de publicidad después del primer aviso, solo se
  sugería borrar cookies del navegador a mano. Se agregó un link
  "Preferencias de cookies" al footer (`CookiePreferencesLink.tsx`) que
  reabre el banner en modo edición vía un evento
  (`REOPEN_COOKIE_NOTICE_EVENT`); `/privacidad` actualizado para
  mencionarlo.
- [x] **Gap real encontrado y corregido:** el aviso de privacidad no
  tenía cláusula de menores de edad. Se agregó una sección estándar
  ("Menores de edad") a `/privacidad`.
- [ ] **Pendiente, necesita un dato real, no se puede completar desde
  código:** `/terminos` tiene `[JURISDICCIÓN]` y `/privacidad` tiene
  `[DOMICILIO FISCAL]` como placeholders literales — LFPDPPP exige el
  domicilio real del responsable en el aviso de privacidad, y los
  términos necesitan una jurisdicción real, no una inventada. Esto es lo
  único que falta para marcar el checklist 100% completo.

### Notas de secuencia del roadmap

- Fase 0 y Fase 3 pueden correr en paralelo (no tocan los mismos archivos)
  si hay dos sesiones disponibles.
- Fase 2 debería completarse antes de re-generar contenido masivamente,
  para no re-etiquetar todo dos veces.
- Fase 5 es la única que necesita una decisión de producto (no solo de
  código) antes de empezar a construir.

## Plan de desarrollo — Fases 7, 8 y 9

Este plan fue definido el 2026-07-22 y cubre las tres próximas áreas de
trabajo del portal. Cada fase tiene su propio prompt de sesión. Leer esta
sección antes de arrancar cualquier sesión nueva para saber en qué fase
estamos y qué está pendiente.

### Fase 7 — Infraestructura publicitaria y capa de consentimiento

Objetivo: que el portal esté listo para publicidad desde el lanzamiento,
con los espacios correctamente posicionados, diseño premium y
consentimiento legal en orden. No se conecta ninguna red todavía; la
infraestructura es agnóstica.

Seis posiciones de ad slot identificadas:
- leaderboard-home: banner horizontal debajo del hero, encima del feed.
  970×90 desktop, 320px mobile.
- inline-feed: dentro del grid de noticias, después de la sexta historia.
  Formato nativo.
- rail-home: sidebar derecho sticky. 300×250 mobile / 300×600 desktop.
  Desaparece en mobile.
- inline-mid-editorial: entre secciones editoriales. 970×180, formato
  nativo. Centrado.
- inline-article: dentro del cuerpo del artículo, después del tercer
  párrafo. 100% del ancho.
- vertical-sponsor-base / vertical-sponsor-infinitas: patrocinio nombrado
  de vertical, no programático. Una marca presenta la sección sin
  intervenir en el criterio editorial.

Principio rector: la experiencia siempre gana sobre los ingresos. Solo
marcas triple A. Nada de casinos, apuestas ni categorías de baja calidad.
La curaduría es editorial, no algorítmica.

Componente central: components/ads/AdSlot.tsx. Recibe un prop slot:
string y renderiza el contenedor con las dimensiones correctas. Vacío
hasta que se conecte una red. Lee la preferencia de consentimiento del
usuario antes de renderizar cualquier contenido externo.

Consentimiento: la cookie notice actual se expande a dos categorías
explícitas (esenciales siempre activas, publicidad y análisis opt-in).
Botones "Aceptar todo" y "Gestionar preferencias". Persiste en
localStorage bajo playbook_consent_v1. AdSlot y GoogleAnalytics leen esta
preferencia. Framework de referencia: LFPDPPP (México) + mejores
prácticas internacionales.

Estado: **hecho** — ver la entrada 2026-07-22 "Fase 7: rediseño de
homepage + infraestructura publicitaria + capa de consentimiento" en el
registro de progreso. La misma sesión cubrió además buena parte de la
Fase 9 (sidebar con Más leídas, sección de análisis, directorio de
temas) — releer esa entrada antes de arrancar la Fase 9 para no repetir
trabajo.

---

### Fase 8 — Admin Studio y mejora de auth de editores

Dos sub-tareas independientes dentro del mismo PR.

Sub-tarea A — Sistema de invitación por email para editores: El flujo
actual (seed manual con contraseña aleatoria) se reemplaza por invitación
vía email. Un editor autenticado invita a otro por email. El invitado
recibe un link temporal (48h) para elegir su propia contraseña. Nueva
tabla editor_invitations en el schema. Nueva página pública
/admin/set-password. Nueva tab "Equipo" en el admin. El seed manual sigue
disponible para emergencias.

Sub-tarea B — Biblioteca de prompts (Studio): Nueva tab "Studio" en el
panel de admin. Es una página estática de referencia: el equipo copia el
prompt que necesita y lo pega en su propia sesión de Claude. No llama a
ninguna API. Diseño: tarjetas con textarea de fondo oscuro, botón Copiar,
secciones colapsables con explicaciones. Usa las variables CSS del
sistema de diseño del admin.

Secciones del Studio:
1. Publicación de newsletter (dos variantes: directa y con revisión,
   integrar el flujo que ya usa el equipo)
2. Artículos (redacción desde URL externa, todos los campos del admin en
   el mismo orden del formulario)
3. Redes sociales (hilo X/Twitter, post LinkedIn, carrusel Instagram)
4. Investigación y preparación (brief de artículo, preparación de
   entrevista)
5. Newsletter semanal (digest editorial desde lista de títulos)
6. Playbook Base (entradas de diccionario y explainers de contenido
   evergreen)

Todo el Studio en español. El equipo usa sus propias suscripciones de
Claude; el Studio solo es la biblioteca de referencia.

Estado: **hecho** — ver la entrada 2026-07-23 "Fase 8: invitaciones de
editores + Studio" en el registro de progreso.

---

### Fase 9 — Mejoras de UX en homepage y páginas

Objetivo: que el portal se sienta como un medio de referencia de primer
nivel. La comparación interna correcta es FT Digital, NYT Digital, The
Athletic. No se copia ninguno; se comparte el estándar.

Regla de trabajo: cada cambio empieza por lo que el usuario ve primero.
Se verifica en el navegador antes de pasar al siguiente. Un cambio que no
mejora la experiencia de forma evidente no se hace.

Elementos a implementar en homepage:

A. News ticker: barra de 35px debajo del header sticky. Fondo --ink,
   borde superior 2px var(--green). Label "ÚLTIMAS" a la izquierda,
   títulos de los 8 artículos más recientes en scroll CSS continuo con
   links al artículo. Desaparece en mobile.

B. Topic filter chips: fila de chips sobre el feed de noticias. Todos /
   Fútbol / Liga MX / NFL / NBA / Béisbol / Tenis / Golf / F1 / Olímpico.
   Filtran el grid en cliente sin llamadas al servidor. Scroll horizontal
   en mobile sin scrollbar visible.

C. Sidebar mejorado: columna derecha sticky (300px) junto al feed
   principal. Contiene: Most Read (ya construido en Fase 5), AdSlot
   rail-home (Fase 7), bloque de newsletter compacto. En mobile colapsa
   debajo del feed.

D. Sección Análisis Playbook: grilla 3 columnas después del newsletter
   band. Los 3 artículos de mayor importancia (priority >= 4) que no sean
   el destacado del hero. Tarjetas con título en Anton 24px, excerpt,
   meta. Primera tarjeta en --green si priority = 5. Query nueva:
   getAnalysisArticles(3).

E. Sección Playbook Base: fondo --soft antes del footer. 4 tarjetas
   estáticas de tipos de contenido evergreen (Diccionario, Explainers,
   Mapas, Intelligence). Slot de patrocinio vertical integrado. Sección
   de Infinitas con la nota de mayor priority de ese vertical y links a
   las demás.

Orden de implementación dentro de la sesión: A → B → C → D → E. Verificar
tsc, lint y build entre cada parte.

Estado: pendiente. Prompt de sesión listo.

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

### 2026-07-21 — Fix: metering restaurado con Node.js Middleware (Next.js 15.5)

- **Reabre la investigación anterior con una vía no probada todavía**: las
  cinco entradas previas de este registro agotaron el diagnóstico de por qué
  el Edge Function pipeline de Vercel rompía con `__dirname is not defined`
  para cualquier contenido de `middleware.ts`, y terminaron eliminando el
  archivo por completo para restaurar el sitio — dejando el cupo de lectura
  gratuita completamente inactivo (todo visitante anónimo tratado como
  siempre-nuevo). Esa vía no exploraba una alternativa real: Next.js 15.5
  soporta middleware en runtime Node.js (`export const config = { runtime:
  'nodejs' }`), un pipeline de build distinto al de Edge Functions.
- **Verificado leyendo el código fuente real instalado, no asumido**: se
  confirmó en `node_modules/next/dist/server/next-server.js` que existe
  `loadNodeMiddleware()` como ruta de carga separada de
  `getEdgeFunctionInfo()`, sin ningún flag experimental que la gatee en esta
  versión (`next@15.5.20`, confirmado contra `package-lock.json`). Probado
  de forma empírica con un middleware mínimo: `next build` con
  `runtime: 'nodejs'` genera `.next/server/middleware.js` acompañado de
  `middleware.js.nft.json` (Node File Trace, el artefacto que Vercel usa
  para funciones serverless Node normales) y dejó
  `middleware-manifest.json` con `"middleware": {}` vacío — es decir, cero
  Edge Functions registradas. Esto confirma que el runtime Node evita por
  completo el pipeline de empaquetado de Edge Functions que rompía para este
  proyecto, sin necesidad de escalar a soporte de Vercel.
- **Restaurado `middleware.ts`** (recuperado de `git show 838f8f7^:middleware.ts`,
  la última versión con la lógica real) con un solo cambio real: se agregó
  `runtime: 'nodejs'` a `config`. El import relativo a `./lib/anon-cookie`
  se mantuvo (ya no hace falta para evitar el bug de alias del pipeline de
  Edge, pero tampoco hay motivo para reintroducir el alias `@/` como
  variable) — comentarios del archivo actualizados para reflejar el
  diagnóstico real en vez del ya obsoleto.
- **Verificación real de punta a punta contra Postgres y un servidor real**
  (no solo build limpio): Postgres local recreado desde cero (contenedor
  reciclado, sin datos de sesiones anteriores — password reseteada, DB
  `playbook` creada, `db:migrate` + `migrate:json` corridos de nuevo, 30/30
  artículos). `next build` limpio. `next dev` + `curl` con cookie jar
  persistente: primer request confirma `Set-Cookie: pb_anon=...` con los
  mismos atributos que la versión Edge original (`HttpOnly`, `SameSite=Lax`,
  `Max-Age` de 2 años); secuencia de 4 artículos reales confirma acceso
  completo en los primeros 3 y muro real en el 4º; re-leer el primer
  artículo sigue con acceso completo (no re-cobra cupo); `psql` confirma
  exactamente 3 filas en `article_reads` para el `anon_id` de la cookie,
  con `month_key` correcto. `tsc --noEmit` limpio. Filas de prueba borradas
  después.
- **Pendiente real, no de código**: verificar en un deploy real de Vercel
  que el runtime Node.js del middleware efectivamente no dispara
  `MIDDLEWARE_INVOCATION_FAILED` — este sandbox no puede reproducir el
  empaquetado real de Vercel (mismo límite ya documentado en las entradas
  anteriores de este mismo registro). Si por algún motivo el runtime Node
  también fallara en un deploy real (no hay evidencia de que vaya a pasar,
  pero no es verificable desde acá), el siguiente paso sería escalar a
  soporte de Vercel con toda esta cadena de diagnóstico.
- **Bug de configuración real encontrado aparte, no de este archivo**:
  auditando las variables de entorno de Vercel con el usuario se encontraron
  tres con nombre mal escrito por mayúsculas/minúsculas —
  `Playbook_secret` en vez de `PLAYBOOK_SECRET`
  (`app/api/update-articles/route.ts` lee el nombre exacto), y
  `GA4_property_id`/`GA4_service_account_email`/`GA4_service_account_private_key`
  en vez de `GA4_PROPERTY_ID`/`GA4_SERVICE_ACCOUNT_EMAIL`/
  `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` (`lib/ga4.ts` ídem) — las variables de
  entorno son case-sensitive, así que ninguna de las cuatro estaba siendo
  leída por la app pese a estar cargadas en Vercel. Corrección pendiente del
  lado del usuario en el dashboard de Vercel (no es algo que un cambio de
  código pueda arreglar). También se confirmó que `GA4_MEASUREMENT_ID` (el
  ID público de cliente que `legacy/js/analytics.js` ya usa,
  `G-0CG7JMK8RZ`) está cargado en Vercel pero nunca se portó a la app
  nueva — pendiente, ver tarea de este mismo día sobre GA4 cliente +
  banner de cookies.

### 2026-07-21 — Fix: ESLint configurado (no existía, `next lint` estaba roto)

- **Estado real encontrado, no asumido**: `package.json` ya tenía
  `"lint": "next lint"` desde el scaffold de Fase 1, pero no existía ningún
  archivo de configuración de ESLint en el repo — corriéndolo tal cual
  dispara el prompt interactivo de `next lint` para crear uno, así que
  nunca pudo haber corrido limpio en una sesión no interactiva (CI, por
  ejemplo, que ni siquiera existe todavía — ver próxima entrada).
- Agregado `eslint.config.mjs` (flat config, `next/core-web-vitals` +
  `next/typescript` vía `FlatCompat`), con `eslint`, `eslint-config-next`,
  `@eslint/eslintrc` como devDependencies nuevas.
- **Bug real encontrado instalando, no solo configurando**: `npm install
  eslint-config-next` sin versión trajo `16.2.11` (la línea de Next 16) en
  vez de matchear el `next@15.5.20` real del proyecto — la combinación rompía
  `next lint` y `eslint .` por igual con `TypeError: Converting circular
  structure to JSON` dentro de `@eslint/eslintrc`. Corregido fijando
  `eslint-config-next@15.5.20` explícito, igual major.minor.patch que
  `next` en `package.json`.
- **Segundo hallazgo real corriendo el lint ya funcional**: sin `ignores`
  explícito, ESLint lintaba `.next/**` completo (bundles compilados de
  Next/Drizzle/next-auth) — 4041 problemas, el 99% ruido de código generado,
  no del repo. Agregado `ignores: ['legacy/**', '.next/**', 'node_modules/**',
  'next-env.d.ts', 'drizzle/**']`. Con eso, el estado real del repo: 22
  problemas (0 errores, 22 warnings — mayormente `@next/next/no-img-element`
  en `<img>` sin migrar a `next/image`, pre-existentes, fuera de alcance de
  este fix). Quedaba 1 error real (`@typescript-eslint/no-explicit-any` en
  `app/api/update-articles/route.ts`'s catch block) — corregido con el mismo
  patrón `catch (err: unknown)` + cast puntual que ya usa
  `lib/actions/admin.ts`'s `createArticle` para el mismo caso (colisión de
  id `23505`), en vez de dejar el primer lint de CI arrancando en rojo.
- `package.json`'s `"lint"` script cambiado de `"next lint"` a `"eslint ."`
  — `next lint` está deprecado (aviso propio de Next.js 15.5, se elimina en
  Next 16) y además demostró estar roto en este repo por el mismo bug de
  versión de arriba; `eslint .` directo es lo que la propia documentación de
  Next recomienda migrar.
- **Verificado real, no solo "corre sin crashear"**: `npm run lint` → 0
  errores; `npm run typecheck` → limpio; `next build` limpio con y sin
  `POSTGRES_URL` (sin regresión de los fixes anteriores).
- **Pendiente, no de este fix**: los 22 warnings pre-existentes (`<img>` sin
  `next/image` en 10 componentes, algunos `eslint-disable` ya innecesarios,
  variables sin usar) — no bloquean nada, quedan para una limpieza aparte
  si se decide hacerla.

### 2026-07-21 — Fix: CI agregado (no existía ningún workflow)

- No había ningún `.github/workflows` — nada corría `typecheck`/`lint`/
  `build` automáticamente en push/PR, dependiendo enteramente de que cada
  sesión lo corriera a mano (que sí venía pasando, ver registro completo
  arriba, pero sin ninguna garantía estructural).
- Agregado `.github/workflows/ci.yml`: un solo job (`verify`) en push a
  `main` y en cada PR, Node 22 (matchea `@types/node@^22.9.0`), `npm ci` →
  `npm run typecheck` → `npm run lint` → `npm run build`.
- **Decisión deliberada, verificada antes de escribirla**: el job no
  configura `POSTGRES_URL` ni `AUTH_SECRET` — confirmado corriendo
  `next build` localmente sin ninguna de las dos variables (con red normal,
  no la del sandbox con proxy propio) que compila limpio, mismo
  comportamiento ya documentado para `POSTGRES_URL` en el fix de
  sitemap/feed de la Fase 2 y ahora confirmado que aplica igual a
  `AUTH_SECRET`/`middleware.ts`. Esto evita tener que cargar ningún secreto
  real en GitHub Actions solo para verificar que el código compila.
- **Verificado real, no solo "el YAML parsea"**: los tres comandos
  (`npm run typecheck`, `npm run lint`, `npm run build`) corridos a mano en
  secuencia, mismo orden que el workflow, todos limpios.
- **Pendiente**: este workflow no corre contra Postgres real (no hay
  ninguna suite de tests automatizada todavía — ver auditoría de este
  mismo día, es deuda técnica real, las verificaciones de cada fase
  anterior fueron manuales con Playwright desechable). Migrar esos scripts
  a una suite real en CI queda pendiente, no es parte de este fix.

### 2026-07-21 — Fix: headers de seguridad agregados a `next.config.ts`

- No existía ningún header de seguridad (CSP, HSTS, X-Frame-Options,
  Referrer-Policy, Permissions-Policy, X-Content-Type-Options) — auditoría
  de este mismo día. Agregado `headers()` en `next.config.ts`.
- **CSP construida a partir de orígenes externos reales, no adivinados**:
  grepeado `articles.json`/`content.json` antes de escribirla — confirma que
  las fotos editoriales vienen hotlinkeadas de `images.unsplash.com`,
  `assets.goal.com`, `www.espn.com`, `abcnoticias.mx`, `i.ytimg.com`, etc.
  (más lo que suba el webhook de Make.com o el pipeline de
  publish-newsletter a futuro) — por eso `img-src` es deliberadamente
  `https: data: blob:` y no un allowlist fijo, imposible de enumerar para
  un sitio que ingesta fotos de cualquier medio que cite una nota. Leído el
  código fuente instalado de `@vercel/analytics` (confirma que el script en
  producción es same-origin, `/_vercel/insights/script.js`, sin necesitar
  entrada externa en `script-src`) y de `@vercel/blob` (confirma
  `blob.vercel-storage.com` como destino real de subida, para `connect-src`)
  antes de escribir esas directivas, no asumidas.
- **Verificación real con Playwright, no solo "el header está presente"**:
  build + `next start` real (no `next dev`) contra Postgres real; script de
  Playwright navegando `/`, `/archivo`, `/articulo`, `/admin` con un listener
  de consola filtrando mensajes de CSP → **cero violaciones** en las
  cuatro. Comparación A/B real (mismo recorrido con el `next.config.ts`
  anterior sin headers) para confirmar que los únicos errores de consola
  restantes (404 de `/_vercel/insights/script.js`, que solo existe en un
  deploy real de Vercel; `ERR_CONNECTION_RESET` hacia hosts externos
  bloqueados por la política de red de este sandbox) ya estaban presentes
  sin la CSP — no son una regresión introducida por este cambio. Login de
  editor de punta a punta con Playwright contra las 12 tabs del dashboard
  (incluida la tab Artículos, que monta el editor TipTap) con la CSP activa
  → sesión válida, cero violaciones de CSP, cero errores de página.
- **Gap reconocido explícitamente**: los embeds de YouTube/Instagram
  (`frame-src`/`script-src` para esos dos orígenes) no se pudieron probar
  cargando de verdad — la política de red de este sandbox bloquea salida a
  esos hosts (mismo límite ya documentado en el smoke test de la Fase 2).
  Las directivas están escritas a partir de los `src` reales del código
  (`components/sections/VideoSection.tsx`,
  `components/sections/InstagramReels.tsx`), no adivinadas, pero la carga
  real de esos dos embeds specficamente queda pendiente de verificación
  manual una vez desplegado.
- `script-src`/`style-src` incluyen `'unsafe-inline'` — **tradeoff
  deliberado, no un descuido**: este sitio usa `dangerouslySetInnerHTML`
  para el cuerpo de artículos (ver Fase 3 arriba) y estilos inline en varios
  componentes; una CSP basada en nonces sería más estricta pero requiere
  generar y propagar un nonce por request desde `middleware.ts` (que recién
  hoy volvió a funcionar, ver entrada de arriba) y verificar que no rompe
  la hidratación de Next — no se hizo en este pase por el riesgo de romper
  algo no verificable sin un deploy real. Queda como mejora futura, no
  como bug de este fix.

### 2026-07-21 — Fix: rate limiting básico agregado (login, magic link, webhook)

- No existía ningún rate limiting — auditoría de este mismo día. Agregado
  `lib/rate-limit.ts` (ventana fija en memoria, keyed por string libre,
  reusa el patrón de `global.__pb*` de `lib/db/client.ts` para sobrevivir
  entre invocaciones de la misma instancia) y `lib/request-ip.ts`
  (`x-forwarded-for` vía `next/headers`).
- **Límite deliberadamente no distribuido, documentado como tal en el
  propio archivo**: no hay Redis/KV conectado (agregar uno es una
  credencial externa nueva, fuera de alcance de este fix) — un atacante
  repartiendo requests entre varias instancias concurrentes de Vercel no
  queda completamente bloqueado. Sí frena el caso realista de un script
  golpeando un endpoint desde un solo lugar.
- Aplicado en tres puntos, cada uno con semántica distinta según lo que
  protege:
  - `lib/actions/editor-auth.ts` (`loginAction`): 10 intentos / 5 min por
    IP — generoso para un editor real que se equivoca de contraseña,
    suficiente para frenar fuerza bruta.
  - `lib/actions/reader-auth.ts` (`requestMagicLink`): 5 intentos / 10 min
    por IP — más estricto porque cada envío le cuesta dinero al proyecto
    (Resend cobra por email) y porque un magic link llega a una bandeja de
    entrada real, así que esto también es un freno contra usar el sitio
    como vector de email-bombing hacia la dirección de otra persona.
  - `app/api/update-articles/route.ts`: 10 intentos fallidos / 10 min por
    IP, contando **solo** intentos con secreto incorrecto — un request con
    el secreto correcto nunca cuenta contra el límite ni se ve afectado,
    a propósito (un digest real de Make.com puede publicar varios artículos
    seguidos legítimamente).
- **Verificación real contra un servidor real, no solo lectura de
  código**: `curl` directo con secreto incorrecto al webhook — intentos
  1-10 devuelven `401` real, intento 11 en adelante `429`; confirmado
  aparte que un request con el secreto correcto sigue funcionando (`200`)
  aunque esa misma IP ya esté por encima del límite de fallos. Playwright
  llenando el formulario de login real con credenciales incorrectas —
  intentos 1-10 muestran el error real "Usuario o contraseña incorrectos",
  intento 11 muestra el mensaje de rate limit. Playwright completando el
  muro de email real (después de agotar el cupo de 3 artículos gratis) con
  5 direcciones distintas — intentos 1-5 fallan por falta de
  `RESEND_API_KEY` real en este sandbox (gap ya documentado, no relacionado
  a este fix), intento 6 muestra el mensaje de rate limit exactamente en el
  umbral esperado. `tsc --noEmit` y `next build` limpios; `npm run lint`
  sin errores nuevos. Filas de prueba borradas después.

### 2026-07-21 — GA4 de cliente + aviso de cookies + páginas legales

- Pedido del usuario, fuera de las fases de migración ya planeadas: portar
  la medición GA4 del lado del cliente (nunca se había hecho — Fase 2 la
  marcó fuera de alcance a propósito) y agregar aviso de cookies + páginas
  legales, inexistentes tanto en legacy como acá. Decisiones tomadas con el
  usuario antes de escribir código: banner de cookies **solo informativo,
  sin bloquear** nada (no gatea GA4 ni ninguna otra cookie); texto legal en
  **borrador para revisión** (no soy abogado, no se inventó una entidad
  legal real); placeholders donde falta información real
  (`[NOMBRE LEGAL DE LA EMPRESA]`, `[EMAIL DE CONTACTO...]`, etc.).
- `components/analytics/GoogleAnalytics.tsx` — puerto de
  `legacy/js/analytics.js`'s `loadGtag()`. **Decisión de nombre de env var
  deliberada**: se lee `GA4_MEASUREMENT_ID` (ya cargada en Vercel, según
  auditoría de env vars de este mismo día) server-side en
  `app/(public)/layout.tsx` y se pasa como prop al componente, en vez de
  usar el prefijo `NEXT_PUBLIC_*` que Next.js exige para leer una env var
  directo en código de cliente — evita tener que agregar/renombrar nada en
  Vercel para una variable que ya está cargada con ese nombre. Montado
  únicamente en `app/(public)/layout.tsx`, nunca en el layout de `/admin`
  — misma paridad que legacy ("editors aren't the audience being
  measured").
- `components/CookieNotice.tsx` + `styles/cookie-notice.css` — banner fijo
  inferior, dismissable, recuerda el cierre en `localStorage`
  (`playbook_cookie_notice_dismissed`), degrada con gracia si
  `localStorage` no está disponible (modo privado). Enlaza a `/privacidad`.
- `app/(public)/privacidad/page.tsx` y `app/(public)/terminos/page.tsx` +
  `styles/legal.css` — páginas nuevas, cada una con un aviso visible de
  "borrador pendiente de revisión legal" arriba de todo (no solo un
  comentario en el código — si esto llega a producción sin revisión, un
  visitante real lo ve, no queda escondido). Contenido de Privacidad
  redactado a partir de lo que el sitio *realmente* recolecta (auditado
  antes de escribir: correo vía magic link, cookie `pb_anon` de cupo, GA4 +
  Vercel Analytics, cuentas de editor), marco LFPDPPP (México) con derechos
  ARCO. Enlazadas desde el footer (`components/layout/Footer.tsx`,
  `.footer-legal-row` en `styles/sections.css`).
- **Verificación real contra un servidor real y Postgres real, no solo
  lectura de código** (Playwright): banner visible en la primera carga de
  `/`; clic en "Entendido" lo oculta y el cierre sobrevive un reload real
  (confirmado con dos cargas de página distintas, no solo estado de
  React); script real de `gtag` presente en el DOM cuando
  `GA4_MEASUREMENT_ID` está seteada, **ausente** cuando no lo está
  (probadas ambas ramas, no asumida la del caso feliz nada más) y
  **ausente en `/admin`** aunque esté seteada; `window.dataLayer` real
  inspeccionado después de cargar `/` confirma la llamada
  `gtag('config','G-TESTID123')` con el ID correcto; enlaces del footer
  cuentan 1 cada uno hacia `/privacidad`/`/terminos`; ambas páginas legales
  devuelven `200`, título/h1 correctos, y `/terminos` menciona el límite
  real de artículos gratuitos (`FREE_ARTICLES_PER_MONTH`, no un número
  hardcodeado aparte que pudiera desincronizarse). `tsc --noEmit` y
  `next build` limpios (`/privacidad` y `/terminos` aparecen en la tabla de
  rutas). `npm run lint` sin errores nuevos (mismo baseline de 22 warnings
  pre-existentes).
- **Pendiente real, no de código**: el usuario todavía no proveyó el
  nombre legal de la empresa ni un email de contacto real — los
  placeholders quedan hasta que los dé. El texto de ambas páginas necesita
  revisión de un abogado real antes de sacar el aviso de "borrador" —
  ninguna de las dos cosas es algo que este fix pueda resolver por su
  cuenta.

### 2026-07-21 — Datos legales reales + módulo "Mi cuenta" para lectores

- El usuario confirmó la entidad legal (**Playbook SAPI de C.V.**) y el
  contacto (**hola@playbook.la** — corregido de un typo real que escribió,
  "playboook.la" con tres oes, contra las referencias reales ya presentes
  en el repo: handles de Instagram/TikTok y el copyright del footer, todas
  con dos oes) y dio el visto bueno de un abogado sobre el contenido de
  `/privacidad`/`/terminos`. Reemplazados los placeholders y **eliminado el
  aviso de "borrador pendiente de revisión legal"** de ambas páginas (y su
  CSS, ahora sin uso). Quedan sin dato real, todavía como placeholder,
  `[DOMICILIO FISCAL]` (privacidad) y `[JURISDICCIÓN]` (términos) — el
  usuario no los dio.
- **Pedido nuevo, decisiones tomadas con el usuario antes de escribir
  código**: un "account manager" de lector con stats, preferencias e info,
  a hacer antes de Fase 6. Alcance acordado: datos básicos de cuenta +
  autoservicio de derechos ARCO (exportar/eliminar), **no** preferencias de
  notificación/tema (no existe ningún sistema que las lea todavía, hubiera
  sido UI sin efecto real).
- **Verificación real de una pieza nunca antes probada de punta a punta en
  este proyecto**: todas las fases anteriores dejaron registrado como gap
  "no se puede verificar un magic link real sin bandeja de entrada" (Fase 3
  en adelante). Antes de construir la página de cuenta hacía falta saber si
  `session.user.email` llega poblado para un lector real — se verificó
  leyendo `node_modules/@auth/core/lib/actions/signin/send-token.js` (el
  `Promise.all([sendRequest, createToken])` confirma que la fila de
  `verification_token` se crea igual aunque el envío por Resend falle,
  porque ambas promesas se disparan en paralelo) y
  `.../actions/callback/index.js` (confirma que el callback verifica
  hasheando `token+secret` con SHA-256 vía Web Crypto). Con eso, se generó
  un token de prueba, se calculó su hash exacto con el mismo algoritmo, se
  insertó directo en Postgres, y se pegó la URL de callback real
  (`/api/auth/callback/resend?...`) — sesión real creada,
  `/api/auth/session` confirma `{email, id, role:"reader"}` completo. Esto
  cierra (parcialmente, ver "pendiente" abajo) un gap de verificación que
  venía arrastrando el proyecto desde la Fase 3, sin depender de una
  `RESEND_API_KEY` real.
- `lib/data/reader-account.ts` (email, fecha de alta, total de lecturas,
  lecturas del mes, últimas 10 con título vía join a `articles`),
  `lib/actions/reader-account.ts` (`deleteMyAccount`: borra la fila de
  `users`, lo que en cascada borra `accounts`/`article_reads` por FK
  `onDelete:'cascade'` ya existentes en el schema; `verification_token` no
  tiene FK a `users` — Auth.js la indexa por email, no por id — así que se
  borra aparte), `app/api/account/export/route.ts` (JSON descargable, Route
  Handler en vez de Server Action porque hace falta un header
  `Content-Disposition` real), `app/(public)/cuenta/page.tsx`,
  `components/account/{AccountSignInPrompt,DeleteAccountButton}.tsx`.
  Enlazado desde el email del lector en el header (`HeaderNav.tsx`, antes
  texto plano, ahora un link a `/cuenta`).
- **Bug real encontrado y corregido antes de que llegara a producción, no
  solo en la verificación**: el primer borrador de `DeleteAccountButton`
  invocaba `deleteMyAccount()` a mano dentro de un `try/catch` (patrón
  `useTransition`). `deleteMyAccount` termina en
  `signOut({redirectTo:'/'})`, que funciona lanzando la señal especial
  `NEXT_REDIRECT` de Next.js — un `catch` genérico alrededor de una llamada
  directa la hubiera atrapado como si fuera un error real, mostrando "No se
  pudo eliminar la cuenta" en el caso exitoso. Corregido usando el mismo
  patrón que ya usa el logout de admin (`app/admin/(protected)/layout.tsx`):
  un `<form action={deleteMyAccount}>` real en vez de una llamada manual,
  que deja que Next maneje la redirección internamente sin pasar por
  ningún `catch` de este componente.
- **Verificación real de punta a punta contra Postgres y un servidor
  real**, no solo lectura de código: vista sin sesión de `/cuenta` (curl)
  muestra el formulario de acceso; con la sesión de prueba de arriba, dos
  lecturas reales (`curl` a `/articulo?id=...`) confirmadas en
  `article_reads`, y la página `/cuenta` las muestra con el conteo correcto
  (2 este mes, 2 en total) y los títulos reales enlazados; `/api/account/export`
  devuelve el JSON completo y correcto; **flujo de borrado con Playwright
  real**: clic en "Eliminar mi cuenta y mis datos" dispara el diálogo
  `window.confirm` real (texto verificado), aceptarlo ejecuta la Server
  Action real → `psql` confirma después: 0 filas en `"user"` para ese
  email, 0 en `article_reads` para ese `reader_id` (cascada), 0 en
  `verification_token` para ese email (borrado explícito) — los tres
  efectos del borrado confirmados contra la base, no asumidos por el
  código. `tsc --noEmit` y `next build` limpios (`/cuenta` y
  `/api/account/export` aparecen en la tabla de rutas); `npm run lint` sin
  errores nuevos. Todas las filas de prueba (`user`, `article_reads`,
  `verification_token`) borradas después, `articles`/`editors` sin tocar.
- **Gap real, no de código**: aunque esta sesión probó que el mecanismo de
  sesión de lector funciona de punta a punta con un token fabricado a
  mano, **enviar y recibir un magic link real desde una bandeja de entrada
  real sigue sin verificar** — sigue pendiente de una `RESEND_API_KEY` real
  en producción, mismo criterio que el resto de gaps de credenciales
  externas ya documentados en este archivo.

### 2026-07-21 — Fix: página se sentía "trabada" al volver de un artículo + falta de login directo

- Dos bugs reales reportados por el usuario, investigados y corregidos
  antes de la Fase 6 (a pedido explícito, en un PR nuevo).
- **"Se traba" al picarle a una noticia y volver atrás**: reproducido con
  Playwright, no asumido — un ciclo home → artículo → atrás tomaba
  **~13 segundos** en volver a considerarse "navegado" (medido vía
  `page.waitForURL`, que por defecto espera el evento `load`). Rastreado
  con una traza de red por request: `VideoSection` embebía dos iframes de
  YouTube y `InstagramReels` inyectaba `embed.js` de Instagram **sin
  ninguna condición**, en cada carga de portada — con `loading="lazy"` ya
  puesto en los iframes, pero confirmado empíricamente que no alcanza (las
  requests salían a los ~120-200ms de cualquier forma, la heurística de
  distancia-al-viewport de Chromium es demasiado permisiva para el alto
  real de esta portada). El evento `load` de la página espera a que esas
  requests terminen (o fallen) antes de resolver — en redes que
  descartan en silencio (en vez de rechazar activamente) tráfico hacia
  ciertos hosts de terceros, algo común en redes corporativas/móviles
  restrictivas, eso puede tardar muchos segundos, dejando el indicador de
  carga del navegador activo y la página con sensación de trabada.
  Corregido con `components/LazyEmbed.tsx` (mismo patrón
  `IntersectionObserver` que ya usa `components/ScrollReveal.tsx`): los dos
  iframes de YouTube y el script + procesamiento de Instagram ahora no se
  montan hasta que su contenedor está a punto de entrar al viewport.
  **Verificado con el mismo test exacto, antes/después**: la traza de red
  ya no incluye ninguna request a youtube.com/instagram.com durante la
  carga inicial (0 requests confirmadas), la navegación de vuelta pasó de
  ~13.267ms a **655ms**; segunda verificación aparte confirma que scrollear
  la sección de video sí dispara las 3 requests reales (Instagram +
  2 YouTube) — el contenido sigue cargando, solo que cuando corresponde.
  `tsc --noEmit` y `npm run lint` limpios (se corrigió también un warning
  nuevo de `react-hooks/exhaustive-deps` en el propio `LazyEmbed.tsx`
  durante la verificación).
- **No había forma de iniciar sesión directo**: el CTA "Suscríbete gratis"
  del header (`nav.ctaUrl`/`ctaLabel` en `content.json`) siempre apuntó a
  `https://playbookmedia.substack.com/` — confirmado que es la suscripción
  al newsletter por email (un producto real y separado, no algo para
  eliminar), no el login de lector de este sitio (cupo de artículos
  gratis vía magic link, construido hoy mismo en `/cuenta`). No existía
  ningún otro punto de entrada a `/cuenta` salvo toparse con el muro de
  artículos. Agregado un link "Iniciar sesión" nuevo (`.nav-login-link` en
  escritorio, `.nav-drawer-login` en el drawer móvil) que aparece en el
  mismo lugar donde se muestra el estado de sesión una vez logueado —
  mismo patrón show/hide por breakpoint que ya usan `#nav-cta`/
  `.nav-drawer-cta`. El CTA de Substack se deja intacto.
  **Verificado con Playwright real, escritorio y mobile**: sin sesión, el
  link aparece y lleva a `/cuenta` (confirmado con clic real, no solo el
  `href`); con una sesión de lector real (mismo truco de token fabricado a
  mano que la verificación de `/cuenta`), el link desaparece y vuelve a
  mostrarse el estado de sesión existente (correo + Salir); el CTA de
  Substack sigue presente y sin cambios en ambos casos.

### 2026-07-21 — Fix: algoritmo de ranking (portada/ticker mostraba noticias de hasta 13 días)

- Reportado por el usuario: la portada mostraba noticias viejas en los
  primeros lugares. Confirmado leyendo `lib/rank.ts` (la función
  `rankArticles` compartida por portada, ticker, archivo, autor, tema y el
  preview del admin — "so 'what counts as important' is defined in exactly
  one place", su propio comentario): el algoritmo real era **prioridad
  primero, fecha solo como desempate** — sin ningún decaimiento por
  antigüedad. Un artículo de 5 estrellas de hace dos semanas le ganaba a
  cualquier artículo de 1 estrella de hoy, siempre.
- **Confirmado con datos reales, no hipotéticos**: consultado el estado
  real de Postgres (fecha del sistema: 2026-07-21) — dos artículos de
  5 estrellas de **12 y 13 días de antigüedad**
  (`la-llamada-que-expuso-a-fifa`, `mexico-inglaterra-audiencia-record`)
  efectivamente estaban en el top 6 real de la portada, exactamente el
  caso que describió el usuario.
- **Corregido** con un score que combina prioridad y antigüedad en vez de
  ordenar por prioridad pura: `score = priority * 1.5 - díasDesdeLaFecha`.
  El peso (1.5 días por estrella) se eligió para que un artículo bastante
  más importante pero de unos días de antigüedad sí pueda ganarle a algo
  fresco pero menor ("chance algo más importante pero un poquito más
  viejo", en palabras del usuario) — pero un artículo de dos semanas nunca
  puede ganarle a nada de hoy, sin importar su prioridad (el boost máximo
  posible, 5×1.5=7.5 días, queda bien por debajo de 14). No se agregó
  ningún filtro/corte duro por antigüedad — el cambio es solo de **orden**,
  así que archivo/autor/tema (que sí necesitan mostrar contenido viejo a
  propósito) siguen mostrando todo, solo mejor ordenado; el efecto de
  "no aparece en el top 6" sale naturalmente de que el score de algo muy
  viejo cae por debajo de cualquier cosa reciente, no de una exclusión
  explícita.
- `rankArticles`/`selectHero` ganaron un parámetro `now` opcional
  (default `new Date()`) para quedar como funciones puras testeables sin
  tocar ningún call site real (todos ya lo omiten y siguen con
  comportamiento en vivo).
- **Verificación real, en capas**: (1) casos sintéticos con fechas/
  prioridades controladas contra un `now` fijo, vía `tsx` — los 5 casos
  clave (empate mismo día, importante-pero-unos-días-viejo gana,
  importante-pero-dos-semanas-viejo pierde, importante-pero-una-semana-
  vieja pierde, mismo priority el más viejo siempre pierde) más
  `selectHero` respetando `featured`, todos `PASS`. (2) Los 30 artículos
  reales de Postgres, algoritmo viejo vs. nuevo lado a lado: confirmado
  que los dos artículos de 12-13 días **desaparecen** del top 6 nuevo,
  reemplazados por artículos de 4-6 días de prioridad menor. (3)
  `next build` + `next start` reales: el HTML real de la portada
  (`curl` + parseo de los primeros 6 `<a href="/articulo?id=...">`
  únicos) coincide exactamente con lo calculado en (2). `tsc --noEmit` y
  `npm run lint` limpios (mismo baseline de 22 warnings).

### 2026-07-21 — Limpieza de los 22 warnings de ESLint pre-existentes (0 quedan)

- Pedido por el usuario, que los vio en un log de build de Vercel y los
  interpretó como "errores" (son warnings, no bloquean el build — pero
  igual valía la pena dejar el log limpio de verdad).
- Triviales, sin riesgo, corregidos directo: import `sql` sin uso en
  `lib/db/schema.ts`; `eslint-disable` de `no-var` ya innecesario en
  `lib/db/client.ts` (mismo caso que `lib/rate-limit.ts`, fix de sesiones
  anteriores); import `newArticleEntry` sin uso en `AdminDashboard.tsx`
  (la creación real vive en `ArticlesTab.tsx`, quedó un import huérfano de
  un refactor); `eslint-disable` de `react-hooks/exhaustive-deps` ya
  innecesario en el mismo archivo; 4 `eslint-disable` de `react/no-danger`
  en `app/(public)/articulo/page.tsx` — esa regla no está activa en la
  config actual (`eslint.config.mjs`, agregada hoy mismo), así que nunca
  hacían falta.
- Los 14 restantes eran todos `@next/next/no-img-element` (`<img>` en vez
  de `next/image`). **Separados en dos grupos reales, no tratados igual**:
  - **7 son assets propios y fijos** (el logo, en 6 archivos:
    `Header.tsx`, `Footer.tsx`, `LoginForm.tsx`,
    `app/admin/(protected)/layout.tsx`, `LivePreview.tsx` ×2) — sin ningún
    riesgo de dominio externo, convertidos a `next/image` de verdad.
    `fetchPriority="high"` en el logo del header se tradujo a la prop real
    equivalente de `next/image` (`priority`), no se descartó sin más.
  - **7 son imágenes editoriales con URL arbitraria** (`data.image`,
    `card.image`, `product.image`, `clip.thumbnail`, `article.imageUrl` en
    `articulo/page.tsx` y `LeadStory.tsx`) — **no convertidas**, a
    propósito: `next/image` exige que cada dominio esté en
    `images.remotePatterns` de `next.config.ts` o falla en runtime con un
    error real, y este sitio ingesta fotos de cualquier medio que una nota
    cite (confirmado en la auditoría de CSP de hoy mismo: Unsplash, ESPN,
    Goal.com, medios arbitrarios vía el webhook de Make.com) — no hay un
    conjunto de dominios enumerable. Convertir esto a ciegas habría sido
    un cambio de alto riesgo para bajar un warning cosmético, verificable
    solo parcialmente en este sandbox (sin salida de red a esos hosts).
    Cada uno lleva un `eslint-disable-next-line` puntual con el motivo en
    un comentario (apuntando al comentario completo en
    `AboutSection.tsx`), no un silenciamiento sin explicación.
- **Verificación real, no solo "el lint da 0"**: `next build` limpio,
  los 7 logos convertidos confirmados con Playwright/curl sirviendo de
  verdad vía el pipeline de `next/image` (`/_next/image?url=...`,
  `srcSet` real con 1x/2x, `200 image/jpeg` confirmado con `curl` directo
  a esa ruta) en las 4 superficies donde aparecen (header público, footer,
  login de admin, topbar+preview del admin ya autenticado); la imagen
  externa de `LeadStory` confirmada sirviendo su URL original de Unsplash
  sin pasar por `/_next/image` (como se espera, sigue siendo `<img>`
  plano). `tsc --noEmit` limpio. `npm run lint` → **0 problemas** (antes:
  22).

### 2026-07-21 — Bug real reportado: página de inicio en blanco tras el muro de artículos; causa raíz real: cero error boundaries en toda la app

- **Reporte real del usuario**: en producción (`playbook-portal-phi.vercel.app`),
  tras agotar el cupo de artículos gratis y volver a la portada, la página se
  ve completamente en blanco — sin contenido, sin mensaje de muro, sin nada.
  Investigado con la misma disciplina de verificación real que el resto de
  este archivo, no se asumió una causa antes de tener evidencia.
- **Reproducción local, exhaustiva y negativa** (no se forzó un fix sin
  evidencia): Postgres real levantado desde cero, 30/30 artículos migrados,
  `next build` + `next start` reales. Secuencia exacta reportada probada dos
  veces: (1) `curl` con cookie jar persistente — 3 lecturas con acceso
  completo, muro real en la 4ª, `GET /` después devuelve 200 con el HTML
  completo de la portada, byte-idéntico a una carga fresca; (2) Playwright
  con Chromium real haciendo clic de verdad en "← Volver a Playbook" (soft
  nav del lado del cliente, no solo `curl`) — portada renderiza con
  contenido real, sin errores de consola más allá del ruido esperado de la
  política de red del sandbox. **No se pudo reproducir el bug en ningún
  camino disponible acá.**
- **Evidencia real de producción, pedida al usuario antes de seguir
  investigando a ciegas** (Vercel Runtime Logs del deployment actual,
  `dpl_GYoVvNAvQSi4NVxBD13BEyLBvA1q`): cero errores 500, cero
  `MIDDLEWARE_INVOCATION_FAILED` en `/`, `/articulo`, `/archivo`, `/cuenta`
  — tanto `source: serverless` como `source: serverless-middleware`
  devuelven 200 consistentemente. **Esto responde una pregunta abierta
  desde la entrada anterior de este registro**: el middleware en runtime
  Node.js (ver "Fix: metering restaurado con Node.js Middleware") sí
  empaqueta y corre correctamente en un deploy real de Vercel — no es la
  causa de este bug. Los únicos errores `[ReferenceError: __dirname is not
  defined]` visibles en el log pertenecen a deployments de *preview* viejos
  de ramas ya abandonadas (`claude/playbook-nextjs-migration-9zn6nh`,
  `claude/session-tikjl0`), no al deployment de producción actual.
- **Hallazgo real y separado, no la causa de este bug pero confirmado en el
  mismo log**: el envío de magic link por correo está roto en producción —
  `[auth][error] Error: Resend error: {"statusCode":403,"message":"The
  authjs.dev domain is not verified..."}` en cada `POST /cuenta`. Causa
  confirmada leyendo el código fuente instalado de
  `@auth/core/providers/resend.js` (`from: "Auth.js <no-reply@authjs.dev>"`
  hardcodeado como default) y `@auth/core/lib/utils/merge.js` (el merge de
  opciones de proveedor omite explícitamente claves `undefined` — `else if
  (source[key] !== undefined)` — así que si `EMAIL_FROM` no está seteada en
  Vercel, `Resend({ from: process.env.EMAIL_FROM })` en `auth.ts` no
  sobrescribe el default de Auth.js en absoluto). Confirma que `EMAIL_FROM`
  no está configurada (o tiene un nombre distinto) en las variables de
  entorno de producción de Vercel — mismo patrón ya visto con
  `PLAYBOOK_SECRET`/`GA4_*` en la entrada anterior. **No es un bug de
  código** (el error ya se maneja bien: `lib/actions/reader-auth.ts` lo
  atrapa y muestra "No se pudo enviar el enlace..." en vez de crashear o
  dar un falso positivo) — **acción pendiente del usuario**: configurar
  `EMAIL_FROM` real en Vercel (el placeholder de `.env.local.example`,
  `Playbook <onboarding@resend.dev>`, es un valor seguro de partida porque
  `resend.dev` no necesita verificación de dominio).
- **Causa raíz real del bug reportado, encontrada empíricamente, no
  adivinada**: esta app no tenía **ningún `error.tsx` en absoluto**, en
  ningún nivel — confirmado con `find app -iname "error*.tsx"` (cero
  resultados) antes de escribir nada. Se verificó qué pasa realmente sin
  uno: se forzó un `throw` temporal dentro de `app/(public)/page.tsx` (una
  página real) en un build de producción real (`next build` + `next
  start`, no `next dev`, que oculta este comportamiento con su overlay de
  error) y se capturó con Playwright lo que un visitante real vería.
  Resultado, con captura de pantalla: una página **casi enteramente blanca**
  con una sola línea de texto gris sin estilo, centrada verticalmente,
  chica: *"Application error: a server-side exception has occurred while
  loading localhost..."* — el comportamiento default de Next.js cuando no
  hay ningún error boundary. Sin encabezado, sin nav, sin footer, sin
  ninguna marca de Playbook — indistinguible, para un lector real (más aún
  en mobile, más aún si no lee el inglés técnico), de "la página está en
  blanco". Se confirmó además que `components/layout/Header.tsx` (usado por
  `app/(public)/layout.tsx`, o sea en *cada* página pública) hace sus
  propias queries (`getSiteContent()`, `getAllArticles()`, `auth()`) — una
  falla transitoria real de Postgres ahí (la base es Neon serverless, que
  puede fallar o tardar al despertar de estar inactiva) tira abajo la
  portada entera de la misma forma, sin que ningún código la atrape. Esto
  explica por qué el bug no se pudo reproducir localmente ni aparece en los
  logs como un 500 de ruta: **no hace falta que nada esté mal en el código
  para que esto ocurra — solo que una query a la base falle una vez, en
  cualquier request**, algo plausible de forma intermitente en producción y
  prácticamente imposible de forzar en este sandbox con Postgres local
  siempre disponible.
- **Corregido**: tres archivos `error.tsx` nuevos, siguiendo el sistema de
  boundaries por segmento de Next.js (un `error.tsx` no atrapa errores de
  su *propio* layout, solo de su `page.tsx` y descendientes — hace falta
  uno en el segmento padre para eso):
  - `app/(public)/error.tsx`: atrapa errores de cualquier `page.tsx` bajo
    este grupo de rutas (portada, `/articulo`, `/archivo`, `/autor`,
    `/tema`, `/cuenta`, `/privacidad`, `/terminos`). Header/Footer siguen
    intactos porque viven en el layout, un boundary distinto. Mensaje de
    marca ("No pudimos cargar esta página") + botón "Reintentar" (llama a
    `reset()`) + link a inicio.
  - `app/error.tsx`: un nivel arriba, atrapa errores del *layout* de
    `(public)` (y de `admin`) — el caso real de `Header.tsx` fallando.
    Sigue anidado dentro de `app/layout.tsx`, así que fuentes/CSS/tokens
    siguen disponibles aunque Header/Footer no rendericen.
  - `app/global-error.tsx`: último nivel, solo si el propio
    `app/layout.tsx` fallara (no hace queries hoy, muy improbable) — debe
    definir su propio `<html>/<body>`, CSS inline nada más, sin depender de
    nada externo.
- **Verificación real, reproduciendo el escenario exacto antes/después**:
  con el mismo `throw` de diagnóstico en `app/(public)/page.tsx`, Playwright
  contra un build de producción real ahora muestra Header (nav completo,
  "Iniciar sesión", buscador) + Footer + `CookieNotice` intactos, con el
  área de contenido mostrando "Algo salió mal / No pudimos cargar esta
  página / Reintentar / Volver al inicio" en vez de blanco — 1440
  caracteres de texto real en el body, contra 143 antes del fix. Con el
  mismo diagnóstico movido a `Header.tsx` (simulando la falla real de DB
  que puede ocurrir en cualquier página), `app/error.tsx` atrapa
  correctamente un nivel más arriba (confirmado por el log `[root error
  boundary]`) y muestra "Playbook no está disponible en este momento /
  Reintentar / Volver al inicio" — visible, con marca, con salida, en vez
  de la pantalla casi en blanco de Next.js. Ambos diagnósticos revertidos
  después de confirmar. Re-verificado el camino feliz completo sin
  cambios: la secuencia real de 3 lecturas + muro + vuelta a portada (curl
  y Playwright) sigue funcionando exactamente igual que antes, sin
  regresión; `/articulo?id=inexistente` sigue dando 404 real (`notFound()`
  no pasa por estos `error.tsx`, tiene su propio boundary ya existente en
  `not-found.tsx`). `tsc --noEmit` y `npm run lint` limpios; `next build`
  limpio con y sin `.env.local`.
- **Gap reconocido explícitamente, no escondido**: esto no reproduce (ni
  puede reproducir) el trigger exacto que vio el usuario en Vercel —
  arregla la *consecuencia* (pantalla en blanco sin ningún mensaje ni
  salida) de cualquier error no atrapado en cualquier página pública, que
  es exactamente el síntoma reportado, pero no hay confirmación de que una
  falla transitoria de Postgres/Neon haya sido el disparador real en el
  momento puntual que el usuario vio el bug (los Runtime Logs de ese rango
  de tiempo no mostraban ningún 500, lo cual es consistente con esta
  teoría — un error de Server Component sigue devolviendo `200` con el
  digest, no un 500 de función, así que no iba a aparecer como error en el
  log de todas formas — pero no es una confirmación directa). Si el bug
  vuelve a ocurrir, ahora en vez de blanco debería mostrarse el mensaje de
  `error.tsx`/`app/error.tsx` correspondiente, lo cual además va a dejar un
  `console.error` con el `digest` real, mucho más diagnosticable. Pendiente
  de que el usuario confirme si el bug reaparece post-deploy y, si aparece,
  reportar qué mensaje de error (blanco puro vs. el nuevo fallback de
  marca) se ve ahora.

### 2026-07-22 — Causa raíz real encontrada (con captura de pantalla del usuario): `ScrollReveal` nunca vuelve a correr tras una navegación cliente-side

- **El usuario mandó una captura real de iPad tras la entrada anterior**:
  el bug no era una pantalla en blanco por un error no atrapado (la teoría
  de la entrada de ayer, defendible con la evidencia que había en ese
  momento, pero no confirmada) — la captura muestra el header, el ticker,
  el encabezado "ÚLTIMO EN PLAYBOOK" y los botones de filtro renderizando
  perfectamente, pero **el área de tarjetas de artículos, debajo de los
  filtros, completamente vacía** — y el usuario reportó que tocar esa zona
  vacía sí navega al artículo. Eso descarta un error de render (que
  hubiera disparado los `error.tsx` de ayer y reemplazado *todo*, incluido
  el header) y apunta a algo más quirúrgico: contenido presente en el DOM
  pero invisible, no ausente.
- **Causa raíz confirmada con Playwright real, no adivinada**: cada
  elemento con clase `.reveal` (`components/article/LeadStory.tsx`,
  `components/article/NewsRow.tsx`) arranca en `opacity:0` por CSS
  (`styles/layout.css`) y solo pasa a `opacity:1` cuando
  `components/ScrollReveal.tsx` le agrega `.is-visible` vía
  `IntersectionObserver`, dentro de un `useEffect(() => {...}, [])` — array
  de dependencias vacío, corre **una sola vez**. `ScrollReveal` vive en
  `app/(public)/layout.tsx`, y ese layout permanece montado entre
  navegaciones cliente-side dentro del mismo grupo de rutas (portada ↔
  artículo ↔ archivo) — es exactamente el comportamiento que un layout de
  Next.js App Router está diseñado para tener. Reproducido de punta a
  punta con Playwright: aterrizar en `/articulo?id=...` (monta el layout +
  `ScrollReveal` por primera vez, corre para los 3 `.reveal` de esa
  página), clickear el link real "← Volver a Playbook" (nav cliente-side,
  no recarga) — la portada monta 39 elementos `.reveal` nuevos vía
  `NewsGrid`, pero como `ScrollReveal` no se desmontó/remontó, su efecto no
  vuelve a correr: **los 39 quedan en `opacity:0` para siempre** — presentes
  en el DOM, con sus `<a href>` reales y clickeables, pero invisibles.
  Confirmado también con el botón de "atrás" real del navegador
  (`page.goBack()`), no solo con el link en-app. Control: una carga directa
  y fresca de "/" sí revela 11/39 elementos correctamente (los que están en
  el viewport inicial) — el mecanismo funciona bien, solo falla al
  sobrevivir una navegación cliente-side subsiguiente.
- **Por qué la entrada de ayer no lo agarró**: la verificación de esa
  sesión sí hizo la navegación cliente-side exacta (clic real en el link,
  Playwright) y comprobó que el `body.innerText` tenía contenido real — pero
  nunca comprobó opacidad/visibilidad computada, solo presencia de texto en
  el DOM. `opacity:0` no vacía el `innerText`, así que ese chequeo pasó
  sin detectar el bug real. Lección para la próxima vez que se verifique
  "¿la página se ve bien?": chequear `getComputedStyle(...).opacity` o una
  captura de pantalla real, no solo contenido textual del DOM.
- **Corregido**: `ScrollReveal` ahora usa `usePathname()` (de
  `next/navigation`) como dependencia del `useEffect`, así que el efecto
  (y su cleanup, que desconecta el `IntersectionObserver` anterior) vuelve
  a correr en cada cambio de ruta, sin importar si el layout se mantuvo
  montado. El selector pasó de `.reveal` a `.reveal:not(.is-visible)` para
  no reiniciar el `transitionDelay` de elementos ya revelados que
  sobrevivan la navegación (ej. un cambio que solo toca el query string).
- **Verificación real, mismo escenario exacto reportado, antes/después**:
  con Playwright, secuencia completa (3 lecturas reales + muro en la 4ª +
  clic real en "Volver a Playbook") — antes del fix, la portada quedaba con
  `visible: 0` de 39 y `opacity:'0'` en la primera tarjeta (reproducido);
  después del fix, `visible: 11` de 39 y `opacity:'1'`, idéntico a una
  carga fresca. Captura de pantalla tomada después del fix confirma
  visualmente el grid completo (foto, título, excerpt, tags, fecha) en vez
  del vacío de la captura original del usuario. Repetido con `/archivo` y
  con el botón de atrás real del navegador — mismo resultado correcto en
  ambos. Re-verificado que el camino feliz sin bug (carga directa de cada
  página) sigue exactamente igual, sin regresión. `tsc --noEmit` y `npm run
  lint` limpios; `next build` limpio con y sin `.env.local`.
- **Relación con la entrada de ayer**: los tres `error.tsx` agregados ayer
  siguen siendo una mejora real y se quedan (la app seguía sin ningún
  error boundary, un gap real independiente de este bug) pero **no eran la
  causa** de lo que el usuario vio — esta entrada la reemplaza como
  diagnóstico definitivo del síntoma reportado. Ambos fixes son
  complementarios, no contradictorios.

### 2026-07-22 — Fase 6 (checkpoint 1 de 2): pasada de regresión end-to-end consolidada — sin bugs nuevos encontrados

- Primer checkpoint de la Fase 6 ("Próximos pasos" #3 la nombraba pero
  nunca tuvo un plan detallado, a diferencia de la Fase 4 — se escribió uno
  antes de empezar). A diferencia de las Fases 1-5, que se verificaron
  fase por fase, esta pasada recorre **todo el sitio a la vez** en una
  sola sesión, sobre Postgres local (recreado desde cero: `db:migrate` +
  `migrate:json`, 30/30 artículos + 11 secciones, `db:seed-editors` con
  3 cuentas de prueba) — la misma clase de verificación que ya atrapó el
  bug de `ScrollReveal` de ayer (un bug que ninguna verificación aislada
  por fase hubiera encontrado).
- **Falso positivo real encontrado y descartado antes de tocar código**:
  al levantar `next start` (no `next dev`, para acercarse más a
  producción) con `NEXTAUTH_URL=http://localhost:3000` de
  `.env.local.example` pero sirviendo en el puerto 3100 (el que ya
  asumían `scripts/smoke-test.mjs`/`test-email-wall.mjs`), Auth.js v5
  rechazó cada intento de magic link con `UntrustedHost` — confirmado
  leyendo `node_modules/@auth/core/lib/utils/env.js`: `trustHost` solo se
  activa solo si `NODE_ENV !== 'production'` (cierto en `next dev`, falso
  en `next start`) o si están `AUTH_URL`/`AUTH_TRUST_HOST`/`VERCEL`/
  `CF_PAGES` — ninguna presente acá. Esto hizo que
  `scripts/test-email-wall.mjs` reportara "éxito" en un envío que en
  realidad nunca llegó a intentar Resend — un falso positivo de la
  verificación, no un bug de la app. Corregido en este sandbox ajustando
  `NEXTAUTH_URL` a `http://localhost:3100` y volviendo a `next dev` para
  el resto de la sesión (mismo patrón que usaron las Fases 1-5); en
  producción real esto no aplica: Vercel setea `VERCEL=1` automáticamente,
  lo que activa `trustHost` sin configuración adicional — confirmado
  leyendo el mismo archivo fuente, no asumido.
- **Verificado de punta a punta, con scripts de Playwright desechables
  (no quedan en el repo, mismo criterio que otros checkpoints de la
  Fase 4)**:
  - **Lector anónimo completo**: 3 lecturas con acceso completo → muro
    real en la 4ª → magic link fabricado a mano (mismo truco SHA-256
    `token+AUTH_SECRET` ya usado en la sesión de "Mi cuenta", verificado
    de nuevo contra el código fuente real de `@auth/core` antes de
    reusarlo) → sesión real con `role:"reader"` → releer el artículo #1
    ya no consume cupo → `/cuenta` muestra el email real → exportar datos
    → borrar cuenta con el diálogo real → confirmado por `psql` que
    `user`/`article_reads`/`verification_token` quedan en 0 para ese
    email. Los 8 pasos, `OK`.
  - **Navegación cliente-side cruzada** (la clase exacta de bug de ayer):
    portada → artículo → volver (link real y botón "atrás" del
    navegador) → mismo resultado en ambos casos, `opacity` correcta en
    los 39 `.reveal` de portada tras la vuelta (no solo presencia en el
    DOM); en `/articulo`, los 3 `.reveal` de "artículos relacionados"
    arrancan en `opacity:0` (están debajo del pliegue) y las 3 se revelan
    al scrollear — comportamiento esperado del `IntersectionObserver`, no
    un bug.
  - **Admin completo**: login → las 12 pestañas cargan sin errores de
    consola → editar+guardar `site_content` (Navegación) → `version`
    incrementa + fila en `content_revisions` → **escenario de conflicto
    real con dos sesiones de Playwright simultáneas** (ambas cargan la
    misma versión, la primera guarda, la segunda choca con el modal real,
    "Entendido, recargar" trae el valor de la primera) → crear artículo
    nuevo con cuerpo TipTap real (negrita) → `body_html` coincide con
    `body_json` en Postgres → se renderiza en `/articulo` público →
    "Eliminar" (que llama a `archiveArticle`, nunca un DELETE real) →
    `status:'draft'` confirmado, desaparece de `/archivo` pero la URL
    directa sigue resolviendo.
  - **Webhook de Make.com** (`curl` directo): campos faltantes → 400;
    secreto incorrecto → 401; inserción normal → 200 `ok`; mismo
    `sourceUrl` repetido → 200 `duplicate` sin insertar una segunda fila;
    dos ítems de un mismo digest "Industry Shots" compartiendo
    `substackUrl` (el caso que motivó el cambio de schema de la Fase 4)
    → ambos se insertan con éxito; inferencia de tags (`NFL`, `Liga MX`)
    confirmada en las filas insertadas.
  - **Boundaries de error** (regresión del fix de ayer, "reproduciendo el
    escenario exacto"): con un `throw` temporal en `app/(public)/page.tsx`
    contra un build de producción real (`next build` + `next start` en un
    puerto aparte, revertido de inmediato después) — Playwright confirma
    el fallback de marca ("Algo salió mal", botón "Reintentar") con
    header/footer intactos, no la pantalla en blanco de Next.js. `git
    diff` confirma que el archivo quedó exactamente como estaba antes del
    diagnóstico.
  - `sitemap.xml` (52 URLs), `feed.xml` (30 items) y `robots.txt`
    verificados contra el conteo real de Postgres (30 artículos
    publicados); rutas de borde (`/articulo?id=inexistente` → 404 real,
    `/tema`/`/autor` con valores inválidos → 200 con `noindex`, ruta no
    registrada → 404) sin cambios respecto a lo ya documentado en fases
    anteriores.
  - Cierre: `tsc --noEmit` limpio, `npm run lint` → 0 problemas, `next
    build` limpio con y sin `.env.local`.
- **Resultado de esta pasada: cero bugs nuevos encontrados** — a
  diferencia de lo que las Fases 1-5 fueron encontrando sistemáticamente,
  esta corrida no descubrió ningún comportamiento incorrecto de la app en
  sí (el único hallazgo, el falso positivo de `NEXTAUTH_URL`/`trustHost`
  de arriba, fue un problema del propio arnés de verificación local, no
  del código). Consistente con que las Fases 4 y 5 ya dejaron cada pieza
  verificada por separado, y que los dos bugs de integración reales que
  sí existían (el de `error.tsx` y el de `ScrollReveal`) ya se encontraron
  y corrigieron ayer, antes de que arrancara esta Fase 6.
- Todas las filas/artículos/usuarios de prueba creados durante esta
  verificación borrados después; `site_content.ctaLabel` restaurado a su
  valor original (`version` quedó en 11, mismo criterio de fases
  anteriores: un guardado de prueba incrementa la versión igual que un
  commit de prueba incrementa el historial). `git status` limpio al
  cierre — ningún script de verificación desechable quedó en el repo.
- **Pendiente para el checkpoint 2 de 2**: borrar `legacy/` (confirmado
  de nuevo en esta sesión, vía `git grep`, que ningún archivo de
  `app/`/`lib/`/`components/`/`scripts/` lo importa — solo comentarios
  que documentan de qué código legado se portó cada pieza) y la limpieza
  de documentación (README sin el framing "en migración",
  actualizar "Próximos pasos" de este archivo).

### 2026-07-22 — Fase 6 (checkpoint 2 de 2, última de la fase): corte final — `legacy/` eliminado

- Con el checkpoint 1 confirmando cero regresiones, este checkpoint hace
  el corte real de la migración.
- **Re-confirmado antes de borrar, no asumido de la sesión anterior**: un
  `grep` recursivo sobre `.ts`/`.tsx`/`.js`/`.mjs` (excluyendo
  `node_modules`/`.next`/`legacy` mismo) buscando cualquier `import ...
  from` o `require(...)` que apunte a `legacy/` → cero resultados. Las
  ~46 menciones de "legacy/" que sí existen en el código son comentarios
  explicando de qué archivo legado se portó cada pieza (quedan intactas,
  son historia útil) — ninguna es un import real.
- **Hecho**: `git rm -r legacy/` (484 KB, todo el sitio estático original:
  HTML/CSS/JS, `admin/`, `api/`, `lib/`, `vercel.json` propio —
  confirmado huérfano, no hay `vercel.json` en la raíz del repo).
- **Verificado, no solo "compila"**: `tsc --noEmit`, `npm run lint`
  (0 problemas) y `next build` limpios, con y sin `.env.local`, igual que
  el estándar de todas las fases anteriores. Con el servidor real
  (`next dev`) corriendo después del borrado: `/`, `/archivo`, `/admin` y
  un asset estático (`/assets/img/playbook-logo.webp`) sirven `200` sin
  cambios — confirma que la app en runtime nunca dependió de `legacy/`
  (los assets reales ya viven en `public/assets/` desde la Fase 1, tal
  como documenta el "Mapa de archivos" de este archivo).
- **Limpieza de documentación**: `README.md` pierde el framing "**En
  migración**" (la migración termina con esta fase) y la entrada de
  `legacy/` en su sección "Estructura". La cabecera de este archivo
  ("PR abierto") se actualizó para reflejar que los PR #28-#31 ya
  mergearon y no hay ninguno abierto todavía para esta rama. La sección
  "Próximos pasos" de abajo se reescribe completa: el ítem 5 anterior
  ("En curso: ESLint/CI/headers/rate limiting... páginas legales") estaba
  desactualizado desde hace varias sesiones — todo eso ya se completó
  (ver los commits/entradas de ESLint config, CI, security headers, rate
  limiting, y "Datos legales reales" más arriba en este mismo registro).
- **Con esto se completan los 2 checkpoints planeados de la Fase 6.** La
  migración de Playbook de sitio estático a Next.js queda funcionalmente
  completa y verificada de punta a punta contra Postgres/servidores
  reales. Lo único que queda — ver "Pendiente de despliegue" abajo — no es
  código: son credenciales reales (Resend, Vercel Blob, GA4, Vercel
  Analytics) que solo el usuario puede configurar en el dashboard de
  Vercel, y su verificación en producción real una vez configuradas.

### 2026-07-22 — Auditoría de UX + fixes de bugs + tareas de contenido/CMS

- Primera sesión post-Fase 6, sin número de fase (ver ítem 3 de "Próximos
  pasos" de la entrada anterior — no hace falta inventar una fase para
  trabajo nuevo). Pedido del usuario: auditoría crítica de UX + una lista
  de bugs/tareas de contenido/CMS/navegación puntuales.
- **Bug real encontrado y corregido, verificado con A/B real, no
  asumido**: `html{scroll-behavior:smooth}` en `styles/reset.css` — global,
  sin ningún uso real de scroll-a-ancla en el sitio (los únicos anchors
  internos son los skip-links, que saltan al tope de la propia página).
  Este selector hace que **todo** `scrollTo` programático, incluida la
  restauración nativa del navegador al usar "atrás" después de un scroll
  profundo, se anime en vez de saltar — y esa animación queda expuesta a
  interrupción por cualquier reflow/paint concurrente. Reproducido con
  Playwright de forma determinística (scroll a Y conocido en `/archivo`,
  clic en un artículo, "atrás", medir scrollY resultante): con el bug,
  scrollTo(700/1400/2200) leía de vuelta 513/590/832 (nunca llegaba,
  atrapado a mitad de animación) y la restauración de "atrás" erraba por
  187–704px; sin `scroll-behavior:smooth`, ambos casos dan el valor exacto
  (diff 0 en 2 de 3 pruebas, -14px en la tercera). Este es el bug real
  detrás de "salto de contenido al volver de un artículo" que pidió el
  usuario. Corregido quitando la regla (y la línea ahora redundante en
  `prefers-reduced-motion:reduce` que la reseteaba).
- **Segundo bug real encontrado y corregido, mismo nivel de verificación**:
  `.article-page{padding:28px 0 60px;max-width:760px;}` en
  `styles/article.css` usaba la forma corta de `padding`, que pisaba por
  completo el `padding:0 24px` de `.container` (la misma clase, aplicada
  al mismo `<main>`) — sin que nadie lo notara porque a >808px de ancho de
  viewport el `max-width:760px` ya centra la caja con margen de sobra. Por
  debajo de eso (todo teléfono y tablet chica, la mayoría del tráfico real
  de un sitio de noticias), el titular y el cuerpo del artículo se
  renderizaban pegados al borde de la pantalla, sin margen lateral alguno
  — confirmado midiendo `getBoundingClientRect()` del `<h1>` real (x=0) y
  con un recorte de pantalla al pixel. Esto es el bug real detrás de
  "márgenes inconsistentes en ciertas áreas" — auditados los demás
  templates (home/archivo/tema/autor/legal) y ninguno tiene el mismo
  patrón. Corregido a `padding-top`/`padding-bottom` (sin tocar
  left/right), dejando que `.container` vuelva a aportar los 24px que ya
  usa el resto del sitio.
- **Tercer bug de contenido real encontrado y corregido**: la tarjeta
  "Más que un triunfo: lo que México–Brasil cambia" de `infinitasSection`
  (la pieza a la que se refería el pedido "Infinitas de México Brasil") sí
  tenía un campo `image`, pero la URL de Unsplash devolvía **404** real
  (confirmado con `curl`, no asumido) — las otras dos imágenes de esa
  misma sección devuelven 200. Reemplazada por una foto real y verificada
  (200, tema de fútbol femenil, buscada y confirmada con WebSearch/curl)
  en `content.json` (y aplicada a Postgres local vía `migrate:json`, que
  también es idempotente para `articles.json`).
- **CMS: "Opinión" no tenía tipo de contenido ni storage propio** —
  confirmado leyendo `components/sections/OpinionSection.tsx`/
  `OpinionTab.tsx`: son tarjetas curadas a mano dentro del JSON de
  `site_content`, cada una enlazando afuera a Substack, sin página propia
  ni fila en `articles`. En vez de construir una tabla/pipeline paralelo
  completo (metering, relacionados, sitemap, RSS, taxonomía — todo lo que
  `articles` ya tiene), se agregó `'opinion'` a `KNOWN_SOURCES`/
  `SOURCE_LABELS` (`lib/constants.ts`) más su color de marca
  (`--src-opinion` en los 3 lugares de la cascada de `tokens.css`, más
  `admin.css`, `hero.css`, `components.css`) — un editor ahora puede crear
  un artículo real con `source: 'opinion'` desde la pestaña Artículos y
  obtiene automáticamente página `/articulo` propia, filtro en
  `/archivo?source=opinion`, tags, sitemap/RSS, todo gratis. Verificado
  insertando un artículo de prueba real (`source: 'opinion'`) y
  confirmando que renderiza con su propio badge/color y aparece en el
  filtro de `/archivo` — fila borrada después. La tarjeta curada existente
  de Opinión en la portada (con links a Substack) se deja intacta a
  propósito: no se pidió cambiar ese widget, solo que exista un storage
  real para piezas de opinión.
- **CMS: teaser personalizado para el muro de registro** — antes, un
  lector sin sesión que agotaba sus 3 lecturas gratis del mes veía el
  header del artículo (imagen/título/tags) y directo el formulario de
  correo, sin ningún adelanto de texto — ni excerpt ni nada se mostraba
  ahí (confirmado leyendo `app/(public)/articulo/page.tsx`: la rama
  `walled` nunca renderizaba `excerpt`). Agregada una columna nueva y
  separada, `articles.wall_teaser` (nullable, sin default —
  `drizzle/0002_curly_dragon_man.sql`), distinta tanto de `excerpt`
  (resumen de tarjeta) como del `teaser` existente (respaldo de cuerpo
  para artículos legado) para no sobrecargar ninguno de los dos con un
  propósito nuevo. Campo nuevo en la pestaña Artículos ("Teaser del muro
  de registro"), incluido en `getArticleMetaById` (seguro: nunca expone
  cuerpo/HTML a un lector sin acceso, mismo criterio que el resto de esa
  función) y en `saveArticle`/`createArticle`. Si el campo queda vacío, el
  muro no muestra ningún adelanto — no cae de vuelta al excerpt.
  **Verificado de punta a punta con Postgres y un servidor real**: login
  de editor real, campo guardado desde la pestaña Artículos (toast
  "Guardado" real), después una sesión anónima real leyendo 3 artículos
  distintos y topando el muro en un 4º confirma que el texto guardado
  aparece arriba del mensaje de muro, con su propio separador visual. Fila
  de prueba y editor de prueba borrados después.
- **Navegación: enlaces de productos editoriales a Substack** — las 4
  tarjetas de "Productos editoriales" (`site_content.productsSection`)
  enlazaban las 4 a Substack. 3 de las 4 corresponden a un `source` real
  del sitio (Noticias→`industry-shots`, La Lana del Deporte→`la-lana`,
  Infinitas→`infinitas`) y ahora enlazan a su colección interna
  (`/archivo?source=...`) en vez de salir del sitio — verificado con
  Playwright que los 3 `href` cambiaron y el 4º no. **The Futbol Business
  Review se deja apuntando a Substack a propósito, no por omisión**: es un
  producto explícitamente "en inglés", sin ningún artículo ni `source`
  propio en este sistema — no existe ninguna colección interna real a la
  que enlazar todavía. `components/sections/ProductsSection.tsx` ahora
  solo abre en pestaña nueva (`target="_blank"`) los enlaces que de verdad
  son externos (`http(s)://`), no los internos — antes todos forzaban
  pestaña nueva sin importar el destino.
- **Bug de tags/breadcrumb del pedido original — resuelto tras recibir una
  captura real del usuario** (producción, Safari/iPadOS, modo oscuro,
  `/archivo`): no era una tag pill sino el propio skip-link
  ("Saltar al contenido"), enfocado y superpuesto sobre el logo del header.
  Confirmado por la forma exacta del elemento en la captura (el
  `border-radius:0 0 8px 0` asimétrico del `.skip-link` de
  `styles/reset.css` es una huella dactilar inconfundible) y reproducido
  localmente enfocándolo con `Tab`. **La superposición visual en sí es el
  comportamiento estándar y correcto de cualquier skip-link** (así
  funciona en prácticamente todo sitio accesible — aparece flotando arriba
  solo mientras tiene foco). El bug real, encontrado leyendo
  `app/(public)/layout.tsx`, era de **orden de tabulación**: cada página
  pública declaraba su propio skip-link como primer hijo de sus propios
  `children`, pero el layout renderiza `<Header/>{children}`, así que el
  logo, los links de nav, el buscador y el toggle de tema — todo el
  header — quedaban *antes* que el skip-link en el orden de tabulación.
  Un usuario de teclado tenía que tabular a través de todo el header antes
  de llegar al único link cuyo propósito es dejarlo saltarse eso — y para
  cuando llegaba, aparecía flotando sobre el logo en medio de su
  navegación, en vez de ser lo primero que ve. Confirmado con Playwright
  antes del fix: el primer `Tab` enfocaba `.brand` (el logo), no el
  skip-link. Corregido moviendo un único skip-link a
  `app/(public)/layout.tsx`, antes de `<Header/>`, apuntando a un
  `<div id="main-content">` nuevo que envuelve `{children}` — y borrando
  las 9 declaraciones duplicadas de cada página pública (`page.tsx`,
  `archivo`, `tema`, `autor`, `articulo` ×2 ramas, `cuenta` ×2 ramas,
  `privacidad`, `terminos`). Ningún otro código depende de los ids
  `*-main` que tenían esos `<main>` (confirmado con `grep`), así que se
  dejaron intactos — no hacía falta tocarlos. **Verificado con Playwright,
  no solo leído**: primer `Tab` en `/`, `/archivo` y `/articulo` ahora
  enfoca el skip-link (antes: el logo); activarlo con `Enter` salta a
  `#main-content` (scrollY resultante = justo debajo del header+ticker
  fijos); tabular una segunda vez sin activarlo pasa correctamente al
  logo, confirmando que el resto del orden de navegación no se rompió.
- **Evaluación pedida, no implementada** (correcta: es una pregunta de
  "¿vale la pena?", no un bug): un cross-fade de tema ya existe hoy
  (`styles/reset.css`, `@media(prefers-reduced-motion:no-preference)`,
  solo en `body`/`header.topbar`/`.search-results`, con comentario
  explícito de por qué el alcance es angosto — muchos componentes ya
  declaran su propia `transition` para hover/interacción, y una regla
  amplia (`*`) chocaría con esas). Recomendación entregada al usuario en
  el chat: no vale la pena ampliarlo más por ahora — el beneficio marginal
  es bajo frente al costo real de auditar cada componente para evitar
  colisión con sus transiciones existentes; si se quiere más adelante,
  sumar 2-3 superficies puntuales a la lista ya existente, no un selector
  global.
- **Verificación real, no solo compilación**: `tsc --noEmit` y
  `npm run lint` limpios; `next build` limpio con y sin `POSTGRES_URL`
  (misma disciplina que todas las fases anteriores); `migrate:json`
  re-corrido para confirmar que el seed local coincide con
  `articles.json`/`content.json` después de todos los cambios de
  contenido. Todas las filas/editores de prueba (artículo de opinión,
  cuenta `testadmin`, lecturas anónimas de prueba) borrados al cierre.
- **Con esto, todos los ítems de la lista original del usuario quedaron
  atendidos** — el de tags/breadcrumb se cerró en un segundo commit de
  esta misma sesión, después de recibir la captura. Nada pendiente para la
  siguiente sesión salvo lo ya documentado en "Próximos pasos"
  (credenciales de despliegue).

### 2026-07-22 — Planificación: Fases 7, 8 y 9 definidas

- Revisión completa del estado del proyecto después de cerrar todas las
  tareas de la sesión de auditoría y fixes.
- Definidas tres nuevas fases de desarrollo con prompts de sesión listos
  para Claude Code.
- Fase 7: infraestructura publicitaria (6 ad slots, componente AdSlot,
  capa de consentimiento TCF/LFPDPPP).
- Fase 8: Admin Studio con biblioteca de 6 categorías de prompts +
  sistema de invitación por email para editores.
- Fase 9: mejoras de UX en homepage (ticker, topic chips, sidebar,
  sección Análisis, sección Playbook Base).
- Sin cambios de código en esta sesión. Solo documentación y
  planificación.
- Pendiente: ejecutar las tres fases en el orden recomendado arriba.

### 2026-07-22 — Fix: sitio caído en producción (`wall_teaser` faltante) + migración automática en cada deploy

- **Reportado por el usuario** con captura real de `playbook-portal-phi.vercel.app`
  mostrando el fallback de `app/error.tsx` y un export CSV de Vercel
  Runtime Logs. Investigado contra el log real: 13 de 19 líneas de
  producción (deployment `dpl_DKgNq5JfHzjx4Qu3Y6XgeesSTbDF`, el deploy de
  `main`) devuelven `500` con `error: column "wall_teaser" does not
  exist` (Postgres `42703`), a partir de las 20:33:41 UTC.
- **Causa raíz confirmada contra el código**: un PR anterior agregó
  `wallTeaser: text('wall_teaser')` a `lib/db/schema.ts` y generó
  `drizzle/0002_curly_dragon_man.sql`, pero esa migración nunca se corrió
  contra la base de producción. `getAllArticles()` hace
  `db.select().from(articles)` sin lista de columnas explícita, así que
  Drizzle pide todas las columnas del schema — y esa función alimenta
  portada, `/archivo`, `/autor`, `/tema` y el sitemap, así que el sitio
  entero caía, no solo `/`. No era un bug de código: el schema y la
  migración eran correctos entre sí, era un paso manual (`npm run
  db:migrate` contra producción) que nadie corrió después de mergear.
- **Corregido con una migración automática en cada build de producción**,
  en vez de un fix puntual de una sola vez, para que esta clase de
  incidente no pueda repetirse:
  - `scripts/predeploy-migrate.ts` — corre `migrate()` (mismo mecanismo
    que `scripts/run-migrations.ts`/`npm run db:migrate`) contra
    `POSTGRES_URL`, pero **solo si `VERCEL_ENV === 'production'`**.
    Deliberadamente acotado a producción real y no a cualquier build:
    los deploys de preview comparten la misma base de datos (confirmado
    contra los Runtime Logs reales — ramas de preview sirven artículos
    reales), así que una migración a medio escribir en una rama sin
    mergear no debe poder aplicarse sola solo porque su preview build
    corrió. Un build local (`next build`) o de CI
    (`.github/workflows/ci.yml`, que a propósito nunca setea
    `POSTGRES_URL`) tampoco setea `VERCEL_ENV`, así que ambos siguen
    sin tocar ninguna base de datos, sin cambios respecto a antes.
  - Si `VERCEL_ENV=production` pero falta `POSTGRES_URL`, se loguea un
    `console.error` (probable error de configuración real) pero no se
    bloquea el build — mismo criterio de "degradar, no tirar abajo" que
    ya usa `lib/db/client.ts`.
  - Si la migración en sí falla (SQL inválido, un lock, un conflicto real
    contra datos existentes) el build **sí falla** (`process.exit(1)`) a
    propósito: desplegar código nuevo contra una base que no recibió el
    schema que ese código espera es exactamente el incidente que este
    script existe para evitar.
  - `package.json` gana un script `vercel-build` (`tsx
    scripts/predeploy-migrate.ts && next build`) — Vercel lo detecta y
    corre en vez de `build` automáticamente (convención propia de
    Vercel). El script `build` normal (usado por `next dev`/CI/local) no
    se tocó.
- **Verificación real, no solo lectura de código**: Postgres local
  levantado desde cero (`pg_ctlcluster 16 main start`), reproducido el
  estado exacto de producción antes del incidente (migraciones 0000+0001
  aplicadas, 0002 deliberadamente omitida — confirmado con `\d articles`
  que `source_url` está y `wall_teaser` no). Corrido
  `VERCEL_ENV=production POSTGRES_URL=... npx tsx
  scripts/predeploy-migrate.ts` contra esa base → `wall_teaser` aparece
  (`\d articles` confirma la columna nueva), exit code `0`; reejecutado
  una segunda vez para confirmar idempotencia (drizzle ya la tiene
  registrada como aplicada, no falla ni duplica). Probados también los
  dos casos de skip: sin `VERCEL_ENV` (build local/CI) → skip, exit `0`;
  `VERCEL_ENV=production` sin `POSTGRES_URL` → warning + skip, exit `0`.
  `npm run typecheck` y `npm run lint` limpios; `npm run build` (el
  script normal, no `vercel-build`) corrido sin `POSTGRES_URL` ni
  `VERCEL_ENV` — limpio, sin regresión, confirmando que CI y el flujo
  local no cambiaron.
- **No se pudo aplicar el fix directamente contra la base de producción
  real desde este sandbox** (sin `.env.local` ni credenciales de
  producción — mismo límite ya documentado en la entrada de incidente
  anterior). El mecanismo de esta sesión resuelve el incidente actual
  como efecto colateral de su próximo deploy real: al mergear este PR a
  `main`, Vercel dispara un nuevo deploy de producción, ese deploy corre
  `vercel-build`, y la migración pendiente se aplica sola antes de que
  `next build` siquiera empiece.
- **Confirmado resuelto, con tráfico real de producción, no solo
  lectura de logs**: tras el merge, `curl` directo contra
  `playbook-portal-phi.vercel.app` confirma `/`, `/archivo`,
  `/sitemap.xml` y `/feed.xml` en `200` reales; el HTML de `/` contiene
  markup real de artículos (`lead-story`/`news-row`) y ya no el texto del
  fallback de `app/error.tsx` ("Playbook no está disponible"). El
  mecanismo de `vercel-build` funcionó exactamente como se diseñó: no
  hizo falta el fallback manual — Vercel sí tiene acceso TCP real a Neon
  desde su entorno de build (a diferencia de este sandbox, que solo tiene
  salida HTTPS — confirmado aparte en un intento manual con
  `npm run db:migrate` contra la base real, que dio `ETIMEDOUT` al
  puerto 5432 con el hostname resuelto correctamente vía DNS, o sea un
  límite de red del sandbox, no de la credencial ni del código; mismo
  motivo documentado en `scripts/publish-newsletter.ts` para usar el
  driver HTTP de Neon en vez de `pg`).
- **Nota aparte, no relacionada con el incidente de base de datos**: la
  pantalla de error que vio el usuario mostraba "Probá de nuevo" — voseo
  argentino, fuera de tono para un sitio Mexico/LATAM. Barrido completo
  del repo (no adivinado) encontró voseo real en 7 archivos:
  - "Probá" (imperativo): `app/error.tsx`, `app/global-error.tsx`,
    `app/(public)/error.tsx`, `components/NotFoundContent.tsx` (también
    "buscá" en la misma línea), `lib/actions/reader-auth.ts`,
    `lib/actions/editor-auth.ts`.
  - "tenés"/"Podés"/"podés" (presente voseo): `app/(public)/cuenta/page.tsx`,
    `app/(public)/privacidad/page.tsx`, `app/(public)/terminos/page.tsx`.
  - "vos" (pronombre) y "sos" (voseo de "eres"): `app/(public)/privacidad/page.tsx`.
  - Pendiente: reemplazar todo por tuteo estándar ("Prueba"/"tienes"/
    "puedes"/"tú"/"eres"), consistente con el resto de la copy del sitio
    (que ya usa tuteo en todos lados salvo estos 7 archivos). No
    corregido en esta sesión — ver "Próximos pasos".
- **Nota operativa, no de código**: durante el cierre de este incidente
  el usuario compartió la contraseña real de la base de producción en el
  chat de la sesión, al intentar el fallback manual antes de que se
  confirmara que la migración automática ya lo había resuelto.
  Recomendado rotarla en el dashboard de Neon (Settings → reset password
  del rol `neondb_owner`) y actualizar `POSTGRES_URL` en las variables de
  entorno de Vercel para que coincida, como buena práctica — no porque
  haya evidencia de un uso indebido, sino porque una credencial de
  producción no debería quedar registrada en el historial de una
  conversación.

### 2026-07-22 — Fase 7: rediseño de homepage + infraestructura publicitaria + capa de consentimiento

- Sesión en `claude/playbook-homepage-ads-7vayvz`. Ejecuta la Fase 7
  completa más el rediseño de portada del brief de homepage (que absorbe
  varios ítems de la Fase 9). Referencias de diseño: los tres prototipos
  ya committeados en `docs/` (`playbook-portal-v23-medio-consulta.html`,
  `playbook-portal-v24-medio-consulta(1).html`,
  `playbook-ux-02-trafico-interno-ads.html`) — se extrajo el vocabulario
  CSS real de cada uno (rank-list, analysis-grid, story-visual/visual-label,
  topic-directory, inf-card) en vez de adivinar el patrón.
- **Infraestructura publicitaria** (`components/ads/AdSlot.tsx` +
  `styles/ads.css`): un solo componente cliente con prop `slot`; seis
  posiciones montadas — `leaderboard-home` (entre el paquete principal y
  el feed), `inline-feed` (dentro de la grilla del feed, después de la
  sexta tarjeta), `rail-home` (sidebar, debajo de Más leídas),
  `inline-mid-editorial` (entre Productos y Video), `inline-article`
  (cuerpo del artículo, después del tercer párrafo),
  `vertical-sponsor-infinitas` (dentro de la sección Infinitas, después
  de las tarjetas). Sin ningún chrome de placeholder (los bordes
  punteados de los prototipos eran demostrativos, no producción): cada
  slot reserva espacio limpio. **Decisión propia documentada**: los
  formatos de dimensión fija (leaderboard/rail/mid-editorial/article)
  reservan su espacio siempre (cero CLS el día que se conecte una red);
  los formatos nativos (`inline-feed`, `vertical-sponsor`) colapsan vía
  `:empty` mientras estén vacíos — una celda vacía en la grilla del feed
  era un hueco visible real (verificado en render), y un formato nativo
  no tiene dimensión fija que reservar. `data-ad-consent` expone el
  estado de consentimiento en el DOM para la integración futura; el
  atributo se actualiza en vivo al aceptar (evento
  `playbook:consent-change`).
- **Capa de consentimiento** (`lib/consent.ts` +
  `components/CookieNotice.tsx` reescrito): shape
  `{essential:true, advertising:boolean, timestamp:number}` bajo
  `playbook_consent_v1`. Banner con "Aceptar todo" y "Gestionar
  preferencias" (panel inline, sin modal ni position:fixed extra);
  esenciales siempre activas y deshabilitadas, publicidad/analítica
  opt-in. Migración one-shot del flag viejo
  (`playbook_cookie_notice_dismissed` → `advertising:true` + se borra la
  key vieja). `GoogleAnalytics.tsx` pasó a componente cliente gateado:
  gtag solo se inyecta con `advertising:true`, y reacciona al evento de
  consentimiento en el mismo pageview (aceptar activa GA sin recargar).
  De paso, la copy nueva del banner eliminó el "aceptás" (voseo) que
  tenía el banner viejo.
- **Homepage reordenada** (`app/(public)/page.tsx`): 1) paquete
  principal + leaderboard + dos columnas (feed de tarjetas izquierda,
  sidebar 300px derecha); 2) Análisis/Opinión (subida); 3) una sola
  banda de newsletter — **se conservó `MidCta` (la editable por CMS) y se
  eliminó el `nl-box` hardcodeado**, no al revés; 4) directorio de temas
  nuevo; 5) Productos; ad mid-editorial; 6) Video recortado + 7) tiles
  de Instagram; 8) Infinitas a tres columnas + patrocinio vertical;
  10) números + testimonios comprimidos en una banda; 11) Acerca.
- **Sidebar** (`components/home/HomeSidebar.tsx` +
  `MostReadSection.tsx` restilado): Más leídas con el patrón rank-list
  exacto del v24 (contador CSS `decimal-leading-zero` en Anton gris,
  tiempo de lectura a la derecha, cabecera con `border-top:2px solid
  var(--ink)`), degradación `available:false` intacta (sin GA4 no
  renderiza nada, verificado); ad rail debajo. Sticky con `top:132px`
  (no los 112px del prototipo: el header real mide 76px de nav + 40px de
  ticker + bordes — 112 quedaba debajo del header). El sidebar entra a
  `NewsGrid` (cliente) como ReactNode ya renderizado en servidor: los
  filtros re-rankean el feed sin re-renderizar el sidebar.
- **Feed con inteligencia visual** (`components/home/StoryCard.tsx` +
  `LeadStory.tsx`): tarjetas nuevas patrón v23; artículo sin imagen →
  fondo editorial + titular grande en Anton (la tipografía es la
  imagen). El heading se mueve **adentro** del visual en ese caso (un
  solo h1/h3 por tarjeta, nunca título duplicado). **Divergencia
  deliberada del brief, con evidencia**: el mapeo estricto
  fuente→un-color pintaba el feed entero de verde (17 de 22
  industry-shots no tienen imagen — verificado contra Postgres y en un
  render real, captura revisada) — se cambió a fuente→**paleta** (verde/
  grid/tinta para industry-shots, amarillo/grid/tinta para la-lana,
  tinta/grid para infinitas) rotada por hash estable del id, así el
  color de marca sigue siendo exclusivo de su fuente pero funciona como
  puntuación y no como wallpaper. Token `--yellow:#e4fd51` agregado a
  `tokens.css` — no es un color nuevo inventado: es el amarillo que los
  tres prototipos definen como par de `--green` y que el brief lista
  como parte del sistema fijo; el portal simplemente nunca lo había
  necesitado. Superficies fijas (no se invierten con el tema), texto
  `--ink-fixed`/blanco según fondo.
- **Análisis/Opinión** (`OpinionSection.tsx` restilado in place):
  patrón analysis-grid/analysis-card del v24 — 1.2fr 1fr 1fr sin gaps,
  border-top de tinta compartido, primera tarjeta destacada en
  `--ink-fixed` con eyebrow verde. La variante 'banner' (TFBR) se
  pliega a tarjeta tipográfica (la grilla es estrictamente editorial —
  su imagen ya no se muestra; el tab de CMS sigue editando los mismos
  campos). En modo oscuro la destacada gana un filo interior
  (`box-shadow` inset) para no fundirse con el fondo — detectado en
  captura, mismo patrón de contraparte oscura del resto del sistema.
- **Directorio de temas** (`components/home/TopicDirectory.tsx`):
  patrón v23, 6 columnas (3 en mobile), hover `--green`, 12 enlaces a
  filtros reales de `/archivo` (6 deportes + 6 verticales, valores
  exactos de `lib/taxonomy.ts` — cada celda aterriza en una colección
  filtrada que funciona, verificado con request real).
- **Video + Instagram** (`VideoSection.tsx` recortado,
  `InstagramGrid.tsx` nuevo, `InstagramReels.tsx` **eliminado**): queda
  el bloque de dos videos + lista de episodios; fuera la grilla de 4
  clips de YouTube y los embeds de Instagram (la causa del hueco en
  blanco cuando embed.js no carga — bug visible en el sitio vivo).
  Tiles propios 9/16 en dos columnas (acotadas a 640px para que el
  formato vertical no domine), gradiente + ícono + handle, hover scale,
  un solo "Ver en Instagram →" (URL del perfil tomada de
  `footer.socialLinks`, con fallback). **Divergencia honesta**: el brief
  pedía "image grid", pero no existen thumbnails de reels sin cargar
  scripts de Instagram — exactamente la dependencia que se elimina — así
  que los tiles son superficies de marca, no fotos. Los campos `clips`
  del tab Video siguen editables y alimentando el preview del admin,
  solo dejaron de renderizar en portada (documentado en el componente).
- **Infinitas** (`InfinitasSection.tsx`): grilla 1.3fr 1fr 1fr del v24
  (texto en overlay absoluto con gradiente), mismos datos
  featured+sideCards, tab de CMS intacto. AdSlot de patrocinio vertical
  al final de la sección.
- **Banda de prueba** (`StatsSection`/`TestimonialsSection`
  comprimidos): sin encabezados de sección (los campos `heading` siguen
  en el CMS, sin uso en portada a propósito), stats como tira horizontal
  con reglas verticales, 3 testimonios debajo del mismo ancho, bordes
  alineados (padding/bordes movidos a las grillas para que las dos
  mitades de la banda compartan filos).
- **Búsqueda en español** (`SearchBox.tsx`): normalización NFD +
  eliminación de diacríticos combinantes en query y texto indexado —
  "futbol" encuentra "fútbol", "mexico" encuentra "México" (verificado
  con el buscador real: 8 y 4 resultados respectivamente). Era el único
  filtro de texto del lado del cliente (los filtros de /archivo son
  links server-side; el filtro del feed es por fuente, no texto).
- **Ad de artículo** (`lib/split-after-paragraph.ts`): el slot
  inline-article entra después del **tercer párrafo de nivel superior**
  — el splitter cuenta `</p>` solo con blockquote/ul/ol/li balanceados
  (un cuerpo TipTap anida `<p>` dentro de blockquote/li; partir ahí
  emitiría HTML inválido), y devuelve null si no queda contenido real
  después (un ad colgando del último párrafo es peor que ningún ad).
  Cubre los tres shapes de cuerpo (bodyHtml nativo, teaser-HTML legado,
  texto plano); la rama con muro nunca llega a este código.
- **LivePreview del admin sin trabajo extra, por diseño**: todas las
  secciones se restilaron *in place* (mismos componentes, mismas props)
  en vez de crear componentes paralelos nuevos, así el preview del CMS
  refleja el rediseño automáticamente. `NewsGrid` ganó un prop opcional
  `sidebar` que el preview simplemente no pasa.
- **Verificación real contra Postgres y un servidor real** (Playwright,
  mismo estándar de siempre): suite de **37/37 checks** — flujo completo
  de consentimiento (banner → preferencias inline → guardar; aceptar
  todo; recarga persiste; migración del flag legado verificada con la
  key vieja plantada a mano; camino de rechazo persiste
  `advertising:false` y los slots quedan `denied`), las 6 posiciones de
  ad presentes y sin chrome visible (computed styles verificados), CLS
  de slots, búsqueda con acentos, filtros de fuente sobre el feed,
  sticky del sidebar en desktop y colapso + rail oculto en mobile,
  directorio 6/3 columnas, links de temas → 200, ad de artículo después
  de exactamente 3 `<p>` (y artículo corto sin ad), rutas de regresión
  (/archivo /privacidad /cuenta /terminos /admin → 200; artículo
  inexistente → 404). Admin: login real, las 12 pestañas cargan sin
  errores de JS, el preview renderiza las secciones nuevas. Más leídas:
  verificado el render real del rank-list con un stub temporal de GA4
  (revertido antes del commit — `git diff` limpio en `lib/most-read.ts`)
  y verificado que sin GA4 `#mas-leidas` está genuinamente ausente.
  Capturas de pantalla revisadas de: portada completa (claro), columnas
  claro/oscuro, análisis oscuro, banda de prueba oscura, portada mobile
  390px completa, página de artículo con el espacio del ad. `tsc
  --noEmit`, `npm run lint` (0 problemas) y `next build` limpios, **con
  y sin `.env.local`** (renombrado fuera del disco, la disciplina de
  siempre). Editor de prueba borrado de la base al cierre.
- **Pendiente para futuras sesiones, no de código**: conectar la red
  publicitaria real (solo cambia `AdSlot.tsx`: montar el tag de la red
  cuando `data-ad-consent="granted"`); credenciales GA4 de producción
  para que Más leídas aparezca en el sidebar (hasta entonces el rail
  muestra solo la reserva del ad); verificación manual del flujo de
  consentimiento contra una red real una vez conectada; y la limpieza de
  voseo de la entrada anterior sigue pendiente en los 7 archivos ya
  listados (esta sesión solo eliminó el del banner de cookies).

### 2026-07-22 — Fase 7, segunda pasada: corrección de rumbo por feedback del usuario

- Feedback directo del usuario sobre la primera pasada (entrada
  anterior), en tres puntos, todos atendidos en esta misma rama:
  1. **"Más senior, menos startupy" — el color sobraba.** Las tarjetas
     tipográficas con fondos verde/amarillo/tinta lograban lo contrario
     de lo buscado. Se eliminaron `StoryCard.tsx`, la rotación de
     paletas por fuente, las clases `visual-green/yellow/black` y el
     token `--yellow` (revertido — el sistema de tokens queda como
     estaba antes de la sesión). Lo único que queda del tratamiento
     tipográfico es UNA superficie muda: papel cuadriculado
     (`visual-grid`) con el titular en Anton, solo para el hero sin
     imagen (`LeadStory`). La identidad de fuente la siguen dando el
     borde izquierdo y los colores de tag, como siempre.
  2. **El 1+5 era un compromiso negociado con el equipo comercial**
     (bloque de texto corto antes de las secciones que les interesan) —
     la grilla de 9 tarjetas extra de la primera pasada trabajaba en
     contra de ese acuerdo. Eliminada por completo (`FEED_COUNT` fuera
     de `lib/constants.ts`, con un comentario que deja el acuerdo por
     escrito para que ninguna sesión futura vuelva a "mejorarlo").
     El paquete de noticias ahora es UNA banda de tres columnas:
     hero (1.35fr) + lista de 5 (1fr) + rail de 300px — el layout de
     lead-card + sidebar del prototipo ux02. El slot `inline-feed`
     quedó al final de la lista (después de la sexta historia, igual
     que el plan original de Fase 7); `leaderboard-home` se movió a
     `page.tsx`, entre el paquete de noticias y Análisis.
  3. **Instagram descartado del todo** (el fix de tiles tampoco
     convenció): `InstagramGrid.tsx` eliminado. El espacio de la banda
     de video se cierra ahora con `.video-cta` — franja angosta con el
     link al canal que ya edita el CMS (campos `clips`/`instagramReels`
     siguen almacenados y editables, solo no se renderizan).
- **El rail ganó contenido real**: además de Más leídas y el ad
  `rail-home`, un módulo compacto de newsletter (`side-newsletter` en
  `HomeSidebar.tsx` — la spec de sidebar que la Fase 9 ya planeaba),
  con el `pill-form` existente adaptado a columna para los ~270px del
  rail. Así el rail no queda vacío mientras GA4/red publicitaria no
  existan, y el lado comercial conserva un punto de conversión arriba.
- **UX run como lector (desktop 1440 / mobile 390, claro y oscuro,
  portada + artículo + archivo), con dos hallazgos reales corregidos**:
  1. **~400-500px de aire muerto** entre el paquete de noticias y
     Análisis: eran las reservas vacías de los ad slots (el rail de
     250-600px estiraba la banda entera de la grilla; el leaderboard
     sumaba 90px+márgenes). Corregido con `.ad-slot:empty{display:none}`
     global en `ads.css`: un slot sin red conectada no ocupa lugar; las
     `min-height` por slot quedan declaradas y aplican solas cuando la
     red inyecte contenido. El comentario del archivo documenta cómo
     volver a reserva dura anti-CLS (borrar una regla) al integrar la
     red. La portada pasó de 5141px a 4535px de alto sin perder ninguna
     sección.
  2. **Ritmo de párrafos roto en el punto de corte del ad de artículo**:
     `.article-body p:last-child{margin-bottom:0}` también pescaba al
     último párrafo del primer `<div>` de un cuerpo HTML partido en dos
     por el slot inline-article — el hueco entre los párrafos 3 y 4
     quedaba visiblemente más chico que el resto. Corregido acotando el
     selector (`.article-body > p:last-child, .article-body >
     div:last-child > p:last-child`); verificado midiendo los gaps
     reales entre todos los párrafos post-fix: `[20,20,20,20,20,20]`.
- **Verificación real** (mismo estándar): suite de 29 checks Playwright
  — consentimiento (banner, aceptar todo, slots a `granted` en vivo),
  las 6 posiciones de ad en DOM y colapsadas sin cajas visibles,
  paquete 1+5 exacto sin feed-grid, módulo de newsletter del rail,
  `#mas-leidas` ausente sin GA4, cero superficies de color ni restos de
  Instagram (selectores y scripts), franja `.video-cta`, filtros,
  búsqueda con acentos, colapso mobile/sticky desktop, ad de artículo
  tras exactamente 3 párrafos con gaps uniformes, rutas de regresión
  (todas 200; artículo inexistente 404). El único "fail" de la corrida
  fue un falso negativo de timing del banner (verificado aparte con
  `waitForSelector` → visible). Más leídas re-verificado visualmente
  con el stub temporal de GA4 (revertido antes del commit). Capturas
  revisadas: portada completa antes/después del fix de aire muerto,
  fold claro/oscuro, mobile completo, cuerpo de artículo, panel de
  preferencias de consentimiento en mobile, /archivo completo (sin
  cambios). `tsc --noEmit`, `npm run lint` y `next build` limpios con y
  sin `.env.local`. (Nota operativa: el contenedor se reinició a mitad
  de esta verificación — Postgres se relevantó con `pg_ctlcluster` y
  los builds se re-corrieron completos después del reinicio.)
- **Sin cambios** en: capa de consentimiento, AdSlot, búsqueda,
  Análisis/directorio de temas/Infinitas/banda de prueba (todo lo de la
  primera pasada que no tocó el feedback), /archivo, admin (el preview
  sigue reflejando las secciones reales — `NewsGrid` solo cambió por
  dentro, misma interfaz).
- **Pendiente**: igual que la entrada anterior (conectar red, GA4 de
  producción, voseo), más una decisión de producto chica: al integrar
  la red publicitaria, decidir si se reactivan las reservas duras de
  espacio (anti-CLS) o se deja el colapso `:empty` — hoy colapsan
  porque una reserva vacía sin red era puro aire muerto.

### 2026-07-22 — Fase 7, tercera pasada: placeholders visibles en los ad slots

- Pedido del usuario tras aprobar la segunda pasada: mientras no se
  conecte la red real, que los slots se VEAN. `AdSlot.tsx` ahora
  renderiza un placeholder visible en cada posición — el lenguaje de
  rayas diagonales + borde punteado que los prototipos (ux02/v23) usaban
  para los espacios publicitarios, apagado a los tokens del sistema
  (`--paper`/`--paper-soft`/`--rule`/`--gray-txt`, sigue el tema solo) —
  con etiqueta "Publicidad" + el formato del plan de Fase 7 por slot
  (Leaderboard · 970×90, Rail · 300×250, etc.), para que cualquiera que
  mire la página sepa qué va a vivir en cada posición.
- Con el placeholder, los slots dejan de estar `:empty`, así que las
  `min-height` por slot aplican solas y las seis posiciones ocupan su
  espacio real. La regla `.ad-slot:empty{display:none}` queda intacta:
  cuando la integración reemplace el placeholder por el tag de la red,
  un slot sin fill vuelve a colapsar solo. `inline-feed` ganó una
  min-height propia (96px) para que su placeholder nativo tenga
  presencia dentro de la lista.
- El ad del rail volvió a su posición de spec (debajo de Más leídas,
  arriba del módulo de newsletter) ahora que es visible — cuando estaba
  invisible se había dejado al fondo para no partir el contenido real.
- Cómo conectar la red después (documentado también en el componente):
  reemplazar el `<div className="ad-slot-placeholder">` por el tag de la
  red cuando `data-ad-consent="granted"`, y borrar el bloque
  `.ad-slot-placeholder` de `ads.css`. Nada más se mueve.
- **Verificado**: capturas revisadas de portada completa (los 5 slots de
  portada visibles con su etiqueta), cuerpo de artículo (in-article tras
  el tercer párrafo) y grilla de noticias en modo oscuro (las rayas
  siguen el tema). `tsc --noEmit`, `npm run lint` y `next build` limpios
  con y sin `.env.local`.

### 2026-07-23 — Auditoría UI/UX: sistema de tags del artículo + experiencia de lectura

- Sesión en `claude/playbook-portal-audit-862cln`. Brief: auditoría completa
  del portal con la página de artículo como prioridad — primero los tags,
  después la lectura, después hacia afuera. Restricción explícita: construir
  sobre el sistema de diseño existente, no inventar uno nuevo (se respetó el
  acuerdo 1+5 del paquete de noticias y el criterio "senior, no startupy" de
  la segunda pasada de Fase 7).
- **Diagnóstico del problema de tags** (la superficie más rota según el
  brief): (1) la taxonomía usaba el mismo lenguaje visual de punto+etiqueta
  que los badges de fuente (`.tag-mini`), así que seis tags leían como seis
  badges idénticos sin jerarquía; (2) los tres niveles se volcaban en una
  sola fila plana encajada entre byline y cuerpo; (3) el cuerpo no tenía
  estilos para links/H2/H3/blockquote/listas — un cuerpo TipTap renderizaba
  defaults del navegador y un link dentro del texto era literalmente
  invisible (el reset global quita el subrayado).
- **Sistema de tags nuevo, tres piezas**:
  - **Kicker** (`.article-kicker`): ficha de publicación + alcance·deporte
    primarios como links en small-caps, una sola línea de clasificación
    arriba del titular (patrón kicker clásico de prensa).
  - **Temas al pie** (`components/article/ArticleTopics.tsx`): el índice
    completo de los tres niveles se movió al pie del artículo como fichas
    cuadradas silenciosas ("Temas") — cuadrado = metadato (familia de la
    ficha `.tag`), redondo = acción (`.btn`/`.filter-btn`); la distinción de
    forma es parte del sistema.
  - **`TagPillRow` restilado** (compartido por hero y filas de archivo):
    ya no usa `.tag-mini` — los puntos de color quedan exclusivos de los
    badges de fuente. Taxonomía como links de texto separados por
    interpunto, con jerarquía por peso/color vía `data-tier`
    (alcance+deporte en tinta, verticales en gris).
- **Experiencia de lectura**: cabecera reordenada (kicker → titular →
  byline → foto; antes la ficha flotaba sola arriba de la foto y los tags
  cortaban entre byline y cuerpo); titular en `clamp(28px…40px)`; byline con
  autor en tinta ("Por X"), "min de lectura" completo y regla de pelo que
  cierra la cabecera; y una suite tipográfica real para `.article-body`:
  lede (primer párrafo un punto más grande, en tinta), links subrayados en
  verde de marca, H2/H3 en sans negrita (Anton se queda para display, no
  grita dentro de la columna), blockquote con borde de tinta, listas con
  markers en gris, `hr` como regla corta centrada, imágenes con margen, y
  remate editorial (cuadrado verde al final del último párrafo).
  line-height 1.75, párrafos a 22px. Los selectores de lede/remate cubren
  las dos formas de cuerpo (párrafos directos y `<div>`s del split del ad
  inline-article, mismo criterio del fix de ritmo de la Fase 7).
- **Hacia afuera**: muro de correo con eyebrow "Para seguir leyendo" +
  fondo `--paper-soft` (y se quitó el "gratis… sin costo" redundante);
  `/tema` gana eyebrow con el nivel del tag (Alcance/Deporte/Vertical de
  negocio) y `/autor` eyebrow "Autor"; los tres listados (`/archivo`,
  `/tema`, `/autor`) cambian el style inline repetido por la clase
  `.section-head.page-head`. **Voseo eliminado de los 9 archivos pendientes**
  (la limpieza que venía arrastrándose desde el incidente de `wall_teaser`):
  Probá→Prueba, buscá→busca, tenés→tienes, Podés/podés→Puedes/puedes,
  Iniciá→Inicia, aceptás→aceptas, vos→tú, sos→eres — barrido verificado con
  grep, cero restos.
- **Verificación real** (mismo estándar de siempre): Postgres local desde
  cero + `db:migrate` + `migrate:json` (30 artículos), `next dev` real y
  Playwright contra el servidor — checks de DOM (cero `<a>` anidados en
  las tarjetas restiladas, kicker presente, 4 fichas de tema al pie, fila
  vieja ausente) y capturas revisadas de: artículo completo claro/oscuro/
  móvil 390px, portada (hero con la fila de taxonomía nueva), archivo
  completo (filas con jerarquía de tags), `/tema` con eyebrow, y el muro
  real (quota de 3 quemada en contexto anónimo — la 4ª visita muestra el
  muro con el kicker nuevo y sin cuerpo en el DOM). `tsc --noEmit`,
  `npm run lint` y `npm run build` limpios sin env vars (paridad CI).
- **Sin cambios** en: ranking, metering, ads (posiciones y placeholders
  intactos), consentimiento, admin (LivePreview refleja los restyles solo,
  mismos componentes), RSS/sitemap, y el paquete 1+5 comercial.
- **Pendiente**: igual que la entrada anterior (red publicitaria, GA4 de
  producción, credenciales) — la limpieza de voseo ya NO está pendiente.

### 2026-07-23 — Fase 8: invitaciones de editores + Studio (biblioteca de prompts)

- Misma rama de la auditoría UI/UX (`claude/playbook-portal-audit-862cln`),
  sesión posterior. Ejecuta la Fase 8 completa del plan (dos sub-tareas en
  el mismo PR, como estaba definido).
- **Sub-tarea A — Invitaciones de editores por email**:
  - Tabla nueva `editor_invitations` (`lib/db/schema.ts` + migración
    `drizzle/0003_dizzy_the_initiative.sql`): email, username,
    displayName, `tokenHash` (unique), invitedBy (FK a editors, SET
    NULL), createdAt, expiresAt (48 h), usedAt. **Solo se guarda el
    SHA-256 del token**, nunca el token (misma postura que los
    verification tokens de Auth.js: una fuga de base no alcanza para
    aceptar una invitación). Las filas usadas se conservan con `usedAt`
    como rastro; reinvitar borra la pendiente anterior del mismo
    email/usuario.
  - `lib/actions/team.ts`: `getTeamData()` (editores + invitaciones
    pendientes con estado de vencimiento), `inviteEditor()` (valida
    email/usuario/nombre, usuario único contra `editors`, token de 256
    bits aleatorios), `revokeInvitation()`, y `acceptInvitation()` —
    acción **pública** (el invitado no tiene sesión), rate-limited
    5/10min/IP, valida token+vencimiento+uso único, crea el editor con
    bcrypt costo 12 (mismo que `seed-editors`) en una transacción que
    marca la invitación como usada; colisión de username (23505) da
    error legible en vez de crashear.
  - `lib/email.ts`: cliente Resend REST directo (los magic links de
    lectores siguen por Auth.js; esto es para correos que Auth.js no
    cubre). Degrada con `{sent:false, reason}` — sin `RESEND_API_KEY` o
    con el send fallando, **la invitación igual se crea y el panel le da
    al editor el enlace copiable** para compartirlo por su propio canal.
    Decisión deliberada: el editor que invita ya es totalmente confiable,
    y con Resend roto en producción (ver §12) este fallback es lo que
    deja la función usable desde el día uno.
  - Página pública `/admin/set-password?token=...`
    (`app/admin/set-password/page.tsx`, fuera de `(protected)` a
    propósito): valida el token en el render para el error amable
    (inválida/vencida) y OTRA VEZ dentro de la acción (el check de
    render es UX, no la frontera de seguridad). Form cliente
    (`SetPasswordForm.tsx`) con confirmación de contraseña, mínimo 8,
    `autocomplete` correcto para gestores de contraseñas, y estado de
    éxito con link al login.
  - Pestaña **Equipo** (`components/admin/tabs/TeamTab.tsx`): form de
    invitación (correo/usuario/nombre), callout con el enlace copiable,
    lista de pendientes (vencimiento visible, revocar) y de editores
    activos. A diferencia de las demás pestañas no edita borradores:
    actúa directo contra el servidor, así que **el botón Guardar del
    topbar se oculta** en Equipo y Studio (`SAVELESS_TABS` en
    `AdminDashboard`). El seed manual queda documentado en la pestaña
    como camino de emergencia.
- **Sub-tarea B — Studio**: pestaña estática de referencia
  (`components/admin/tabs/StudioTab.tsx` + contenido en
  `components/admin/studio-prompts.ts`): 6 secciones colapsables con 10
  prompts en total, cada tarjeta con textarea oscura de solo lectura y
  botón Copiar ("Copiado ✓", con fallback de selección si el clipboard
  falla). No llama a ninguna API, por diseño. Los prompts están
  alineados con el flujo real: la sección 1 usa el skill
  publish-newsletter (variante directa y con revisión, pasos 1-3 vs 5
  del skill), la sección 2 lista los campos **en el orden exacto del
  formulario de la pestaña Artículos** con la taxonomía y la escala de
  Importancia literales de `lib/taxonomy.ts`/el skill, y todos llevan el
  bloque de voz editorial (directa, tuteo MX, sin rayas largas, ángulo
  LATAM) repetido a propósito para que cada prompt funcione pegado solo.
- **Fix de paso, preexistente**: el LivePreview mostraba el encabezado
  "Último en Playbook" duplicado — desde la Fase 7 `NewsGrid` renderiza
  su propio section-head y el del preview quedó encima. Eliminado el
  duplicado del preview (detectado en captura durante esta verificación,
  re-verificado en render real: 1 solo encabezado).
- **Verificación real end-to-end** (Postgres local + `next dev` +
  Playwright, mismo estándar): migración 0003 aplicada, editor `aldo`
  sembrado, y el flujo completo ejercitado de verdad — login de aldo →
  pestaña Equipo → invitación creada (sin RESEND_API_KEY: toast honesto
  + enlace fallback mostrado, capturado) → pendiente listada → el enlace
  abierto en un contexto SIN sesión → contraseñas que no coinciden
  rechazadas → activación → **el mismo enlace reusado da "Invitación no
  válida"** (uso único confirmado, también vía curl) → login real de la
  editora nueva con su contraseña → de vuelta en la sesión de aldo la
  pendiente desapareció y la editora aparece activa. Studio: 6 secciones,
  colapso/expansión, botón Copiar confirmando, botón Guardar oculto en
  ambas pestañas nuevas, cero errores de JS de página en todo el flujo.
  Capturas revisadas de Equipo, set-password, activación y Studio.
  `tsc --noEmit`, `npm run lint` y `npm run build` limpios sin env vars
  (paridad CI). La migración de producción la aplica solo `vercel-build`
  en el próximo deploy (mecanismo de la entrada del incidente
  `wall_teaser`).
- **Pendiente**: para que el correo de invitación salga de verdad en
  producción faltan las mismas credenciales Resend de siempre
  (`RESEND_API_KEY` + `EMAIL_FROM` con dominio verificado, ver §12) —
  hasta entonces el flujo funciona vía enlace copiable. Fase 9 sigue
  pendiente según su lista (revisar contra lo ya construido).

### 2026-07-23 — Ajuste por feedback: taxonomía del artículo plegada (cero tags de entrada)

- Feedback directo del usuario sobre la pasada de auditoría: al lector no
  lo deben recibir los tags — esconderlos detrás de un control, tipo
  filtro. Aplicado en la página de artículo:
  - **Cabecera sin taxonomía**: se quitaron los links alcance·deporte del
    kicker; queda solo la ficha de publicación (identidad de marca, no
    tag). El orden cabecera → titular → byline → foto de la auditoría se
    mantiene.
  - **"Temas del artículo" plegado**: el bloque del pie pasó a un
    `<details>` nativo cerrado por defecto — summary silencioso
    ("Temas del artículo (N)" + chevron que rota), fichas adentro.
    `<details>/<summary>` a propósito: funciona sin JS, teclado gratis, y
    las fichas quedan en el DOM así que los links a `/tema` siguen
    crawleables.
  - Las filas de tarjetas (hero de portada, archivo) conservan su línea
    única de taxonomía en texto silencioso de la auditoría — el feedback
    apuntaba a la experiencia de entrada del artículo; extenderlo a las
    tarjetas queda a decisión del usuario.
- **Verificado** (Postgres local + dev server + Playwright): cerrado por
  defecto (`open:false`), cero links de taxonomía en la cabecera, al
  abrir aparecen las 4 fichas, capturas revisadas de ambos estados.
  `tsc --noEmit`, `npm run lint` y `npm run build` limpios sin env vars.

### 2026-07-23 — Ajuste por feedback: filtros del archivo plegados + vista compacta

- Feedback directo del usuario (con captura de /archivo): las cuatro filas
  de chips de filtro (fuente + Alcance + Deporte + Vertical) hacían la
  página demasiado ruidosa para barrer el archivo rápido — esconderlas
  detrás de un botón/dropdown — y el listado necesitaba un modo de vista
  alterno. Aplicado en `/archivo`:
  - **Filtros plegados**: toda la taxonomía vive ahora en un `<details>`
    cerrado por defecto con summary tipo pastilla ("Filtros" + ícono +
    chevron) — el mismo patrón que ArticleTopics ("al lector no lo
    reciben los tags"). El panel abierto agrupa las cuatro filas con
    etiqueta (la fila de fuente ganó la etiqueta "Sección" para ser
    consistente). Se re-abre solo mientras hay filtros activos, con
    contador `(N)` en el summary y link "Limpiar filtros" (que preserva
    el modo de vista) — el estado que recorta la lista nunca queda
    invisible. Los filtros siguen siendo links reales (cero JS nuevo).
  - **Toggle de vista Lista/Compacta**: dos pastillas `.filter-btn` a la
    derecha del toolbar, vía `?view=compact` (mismo esquema de links que
    los filtros, se preserva al filtrar). La vista compacta es una línea
    por artículo — badge de fuente, titular, fecha·minutos a la derecha,
    sin tag pills — reutilizando `NewsRow` sin `withTagPills` y
    re-acomodando el layout solo desde `.news-list-compact` (los colores
    de borde por fuente y el hover se heredan tal cual).
  - CSS nuevo en `styles/article.css` (sección archivo): `.archive-toolbar`,
    `.archive-filters*`, `.view-toggle`, `.news-list-compact`. El
    `<details>` va con `flex:1 1 0` para que el toggle no se caiga de la
    fila al abrir el panel, y bajo 640px toma la fila completa (con
    `flex-basis:0` el panel abierto quedaba en una columna de ~160px).
- **Verificado** (Postgres local + `next dev` + Playwright, 18 checks):
  cerrado por defecto sin chips visibles, panel con 4 grupos al abrir,
  click en NFL navega con `?sport=NFL` + panel auto-abierto + badge (1),
  toggle a compacta preserva el filtro, vista compacta sin pills, limpiar
  filtros conserva `view=compact`, cero `<a>` anidados; capturas desktop y
  móvil de ambos estados revisadas. `tsc --noEmit`, `npm run lint` y
  `npm run build` limpios.

### 2026-07-23 — Ajuste por feedback: vista "Compacta" reemplazada por "Cuadrícula"

- Follow-up inmediato a la entrada anterior: el usuario pidió que el
  segundo modo de vista fuera una cuadrícula de tarjetas cuadradas en vez
  de otra lista de líneas. Reemplazado en `/archivo`:
  - Nuevo componente `components/article/ArchiveGridCard.tsx`: tarjeta
    cuadrada (`aspect-ratio:1/1`) con el mismo tratamiento tipográfico de
    `LeadStory` para artículos sin imagen (superficie `.visual-grid` +
    titular en Anton, pero cuadrado en vez de 16/10, porque todas las
    tarjetas de una cuadrícula tienen que compartir forma). Foto real
    hace `object-fit:cover` del cuadrado. Sin tag pills, mismo criterio
    que la vista compacta que reemplaza: esta vista es para barrer rápido,
    no para navegar taxonomía.
  - El toggle de vista pasó de `Lista`/`Compacta` a `Lista`/`Cuadrícula`,
    parámetro `?view=grid` (antes `?view=compact` — cambio de valor, no
    solo de etiqueta). `styles/article.css`: `.news-list-compact` se
    reemplazó por `.archive-grid` (grid de 4 columnas en desktop, 2 bajo
    920px y bajo 480px).
- **Verificado** (Postgres local + `next dev` + Playwright, 18 checks,
  mismo arnés de la entrada anterior con las aserciones de compacta
  swapeadas por cuadrícula): `?view=grid` navega y preserva filtros,
  cuadrícula sin tag pills, toggle activo correcto, limpiar filtros
  conserva `view=grid`; capturas desktop (con y sin filtros) y móvil (grid
  de 2 columnas) revisadas. `tsc --noEmit`, `npm run lint` y
  `npm run build` limpios.

### 2026-07-23 — Ritmo tipo revista en Lista y Cuadrícula (destacados periódicos, gateados por rating)

- Follow-up inmediato: el usuario dijo que la cuadrícula (y de rebote, la
  lista) "se ve demasiado uniforme y aburrida" y pidió investigar cómo lo
  resuelven los medios grandes y adaptarlo. Research (búsqueda web +
  precedente propio del repo — `.analysis-grid`'s `.featured`, `LeadStory`,
  el acento por fuente de `.news-row` en `hero.css`) converge en un patrón:
  un artículo destacado que crece periódicamente, con CSS Grid
  auto-placement acomodando el resto alrededor — sin masonry, sin JS.
  Feedback de seguimiento a media planificación: el destacado no debía
  elegirse solo por posición ("cada 5") — el rating editorial (`priority`,
  el mismo campo ★1-5 que elige el hero de portada) tenía que pesar.
  - **`app/(public)/archivo/page.tsx`**: `pickFeaturedIds()` recorre
    `articles` (ya viene ordenado por `rankArticles()`) en bandas
    COMPLETAS de 5 (`FEATURE_INTERVAL`); el primer artículo de cada banda
    completa (= el de mayor rank de esa banda, porque la lista ya viene
    ordenada) se marca destacado solo si su `priority` es ≥4
    (`FEATURE_MIN_PRIORITY`) — si no llega, la banda entera renderiza
    como fichas normales, sin forzar nada. Bandas parciales al final (con
    menos de 5 artículos, ej. tras filtrar) nunca califican — evita el
    único caso real donde el truco de "cero huecos" de CSS Grid se rompe
    (un destacado necesita EXACTAMENTE 4 vecinos regulares después en su
    propia banda para llenar el bloque 2×2 sin dejar celda vacía). El
    mismo `Set` de ids se comparte entre Lista y Cuadrícula, así que
    alternar entre vistas siempre destaca los mismos artículos.
  - **`components/article/ArchiveGridCard.tsx`**: ganó `featured`/`priority`
    props. No destacada: exactamente igual que antes (mismo `<a>` plano).
    Destacada: cambia de forma a `<div>` + `.card-link` + stretched-link
    (porque ahora también renderiza `TagPillRow`, que mete sus propios
    `<a>` — mismo problema de anidar `<a>` que `LeadStory`/`NewsRow` ya
    resuelven así), foto 16:10 en vez de 1:1, titular en `--serif-display`
    (clamp 20-24px, entre los 14.5px de una ficha normal y los 34px del
    hero de portada), excerpt con clamp de 2 líneas.
  - **`components/article/ArchiveFeatureRow.tsx`** (nuevo): equivalente
    horizontal para Lista — "una LeadStory chica metida en la lista", que
    hoy era 100% texto. Mismo criterio de forma (div + card-link +
    stretched-link + TagPillRow) y mismo tamaño de titular que la ficha
    destacada de la cuadrícula, para que ambas vistas lean con el mismo
    peso visual al alternar entre ellas.
  - **`styles/article.css`**: acento superior por fuente en TODAS las
    fichas de la cuadrícula (`.archive-grid-card[data-source="..."]`,
    calca el borde izquierdo de `.news-row` en `hero.css` pero arriba,
    porque es una ficha no una fila) — la mitad "textura" del pedido,
    prácticamente gratis porque `data-source` ya estaba en el elemento.
    `.archive-grid-card.is-featured` con `grid-column:span 2;grid-row:span
    2`; matemática del 2×2 documentada in-line (grilla de 4 columnas, una
    ficha 2×2 dentro deja exactamente 4 celdas para las 4 fichas normales
    siguientes — auto-placement "sparse" del navegador, deliberadamente
    SIN `:dense` porque dense puede reordenar visualmente por delante del
    orden del DOM, un problema real de WCAG 1.3.2). `.archive-feature-row`
    nuevo para Lista, con el mismo mecanismo de acento (borde izquierdo) y
    las mismas convenciones de hover que `.news-row`/`.lead-story`.
  - **Bug real encontrado y corregido durante la verificación visual** (no
    solo en teoría — capturas de pantalla lo mostraron): los titulares sin
    clamp (`.archive-grid-card h3` no tenía `-webkit-line-clamp`) hacían
    que el alto "natural" de una fila normal variara banda a banda: como
    CSS Grid reparte el alto extra de una ficha destacada muy alta entre
    LAS DOS filas de su banda aunque la ficha corta de esa fila no lo
    necesite, algunas bandas dejaban un hueco visible debajo del texto
    corto de sus vecinas. Fix: `-webkit-line-clamp:2` en el titular normal
    Y en el titular/excerpt del destacado (tanto grilla como lista) —
    alturas de fila predecibles en toda la grilla, confirmado con
    mediciones de `getBoundingClientRect` antes/después (después: el
    contenido de cada ficha normal llena exactamente su celda, cero
    sobrante).
  - **Segundo bug real, mobile-only**: `.archive-feature-row` es un flex
    ROW en desktop (`.card-link` al lado de `.tag-pill-row`). El primer
    intento de responsive solo apilaba el `.card-link` interno
    (foto+cuerpo) a columna bajo 640px, olvidando que el contenedor
    EXTERIOR (`.archive-feature-row`) seguía siendo flex row — con
    `.card-link` (que tiene `min-width:0`, libre de encogerse) compitiendo
    por ancho contra `.tag-pill-row` (sin ese override), lo que colapsaba
    `.card-link` a ~0px de ancho en mobile (confirmado con
    `getComputedStyle`: `width:"0px"`). Capturas de pantalla lo mostraban
    como texto roto/apilado verticalmente palabra por palabra. Fix: el
    `≤640px` media query también pone `.archive-feature-row` mismo en
    columna, no solo su `.card-link` hijo.
- **Verificado** (Postgres local + `next dev` + Playwright, 20 checks
  nuevos sobre los 30 artículos reales sembrados): exactamente 2 fichas/filas
  destacadas sin filtrar (confirmado contra Postgres directo que ambas
  tienen `priority=4`, ninguna con `priority<4` cuela); al menos una banda
  sin destacar (el gate realmente suprime, no solo decora); geometría sin
  huecos verificada con `getBoundingClientRect` (alto del destacado, techo
  de fila2 alineado, cero salto vertical inesperado); filtro `sport=NFL`
  (2 artículos en el archivo, <5) sin tratamiento destacado en ninguna
  vista; cero `<a>` anidados; mobile con destacado a ancho completo en
  cuadrícula y apilado correcto en lista; dark mode revisado visualmente
  (acentos y contraste correctos, sin colores nuevos fuera de los tokens
  existentes). `tsc --noEmit`, `npm run lint` y `npm run build` limpios.

### 2026-07-23 — Cuadrícula es default + jerarquía de 5 niveles directa al rating

- Follow-up inmediato: (1) Cuadrícula pasa a ser la vista por defecto de
  `/archivo` (antes era Lista) — `?view=list` es ahora el opt-in, `/archivo`
  sin query es Cuadrícula. (2) Pedido explícito de reemplazar el ritmo
  posicional cada-5 de la pasada anterior por una jerarquía DIRECTA: el
  tamaño de cada tarjeta es función de su propio rating (`priority`,
  ★1-5), no de dónde cae en la lista — "1 estrella una línea de texto, 2
  estrellas una línea no tan chica, 3 estrellas un cuadrado chico, 4
  estrellas más grande, etc." Investigado con la skill `ui-ux-pro-max`
  (`--domain style "bento grid masonry variable card size"` →
  recomienda exactamente este patrón: CSS Grid/flex con spans variados,
  Apple-style, alta legibilidad; producto "Magazine/Blog" recomienda
  Swiss Modernism 2.0 + Motion-Driven).
  - **`tierFor(article)`**: `priority` (1-5) mapea 1:1 a tier, sin banda ni
    posición — reemplaza `pickFeaturedIds`/`FEATURE_INTERVAL` para
    Cuadrícula (Lista conserva el sistema de bandas de la pasada anterior
    sin cambios, ver `archivo/page.tsx`).
  - **`groupRiver(articles)`**: agrupa ★3/★4 consecutivos en "clusters"
    (fluyen juntos en una fila `flex-wrap`); ★1/★2 (texto, sin foto) y ★5
    (banda de ancho completo, reusa `ArchiveFeatureRow` tal cual, mismo
    componente que ya usaba Lista) siempre cortan el flujo en su propia
    línea. Por qué NO CSS Grid con spans (como la pasada anterior): con 5
    tamaños arbitrarios en vez de un ritmo fijo cada 5, ya no hay manera
    de garantizar cero huecos con matemática de grilla — flexbox con wrap
    no reserva celdas, así que no hay huecos que dejar (lo que no entra
    en la fila pasa a la siguiente, como el margen derecho irregular de
    un párrafo). Mantener ★1/★2/★5 siempre fuera de los clusters de
    cuadrados evita además el problema de sincronía de alto de fila entre
    tamaños muy distintos (visto y corregido en la pasada anterior) —
    chico y mediano comparten forma y alto similar, así que ese choque no
    ocurre entre ellos.
  - **`ArchiveGridCard`**: perdió la prop `featured` (y con ella, la rama
    `is-featured`/`TagPillRow`/nested-`<a>` — ya no hace falta, ★5 pasó
    completo a `ArchiveFeatureRow`); ganó `size: 'sm' | 'md'`. Siempre un
    `<a>` plano ahora, más simple que antes.
  - **`ArchiveLineRow`** (nuevo): fila de una sola línea, sin foto en
    absoluto — el nivel que deliberadamente NO se gana una imagen. La
    diferencia ★1 vs ★2 se hizo bien perceptible (no solo 1.5px de más):
    ★1 en gris (`--gray-txt`/`--gray-dark`), 12px, peso 500, trunca duro a
    una línea; ★2 en tinta plena, 16px, peso 600 (cerca del titular normal
    de `.news-row`), puede pasar a dos líneas — confirmado con
    `getComputedStyle` antes/después del ajuste (13px vs 14.5px no se
    notaba a simple vista en las capturas; 12px vs 16px con cambio de
    color y peso sí).
  - **Pregunta del usuario sobre imágenes**: pidió "pull the images in the
    articles for the blank space" — se revisó Postgres directo: los 30
    artículos sembrados NO tienen `body_html`/`body_json` (0 de 30), así
    que no hay imagen embebida en el cuerpo del artículo de la que tirar
    en este dataset — no hay nada real que "pull". Se decidió NO
    fabricar fotos de stock para artículos de noticias reales (aunque
    sean datos de prueba) — insertar una imagen genérica no verificada en
    una tarjeta de una noticia real implicaría una procedencia
    fotográfica que no existe, algo a evitar incluso en un dataset de
    desarrollo. En cambio, el nuevo sistema de niveles reduce el problema
    estructuralmente: ★1/★2 (que en este dataset concentran casi todos
    los artículos sin imagen real, ver correlación priority/imageUrl más
    abajo) ahora no muestran caja de foto en absoluto — se resuelve buena
    parte del "muro de recuadros beige" sin necesitar imágenes nuevas. El
    placeholder mudo (`.visual-grid`) para ★3/★4/★5 sin imagen real se
    mantiene sin cambios (ver ArchiveGridCard/ArchiveFeatureRow), ya
    verificado legible a los tres tamaños. Respuesta a "does format
    matter if shrunken": no — `object-fit:cover` + `aspect-ratio`
    reservado hace que el formato/dimensión original de una imagen real
    no importe al achicarla, siempre que la resolución fuente no sea
    ya muy baja para empezar.
  - **Correlación priority/imagen en los 30 artículos sembrados** (dato
    real, verificado por SQL, no supuesto): ★5→5/5 con imagen, ★4→0/7,
    ★3→0/9, ★2→1/6, ★1→3/3. Es decir en este dataset de prueba
    específicamente los artículos ★4 y ★3 son 100% sin imagen — el caso
    de peor estrés para el placeholder mudo a tamaño chico/mediano,
    revisado visualmente y se ve bien.
  - **Bug real encontrado en la primera verificación visual**: la
    diferencia ★1 vs ★2 no se notaba en las capturas (font-size 13px vs
    14.5px, gap insuficiente) — corregido ampliando la diferencia (ver
    arriba) en vez de solo confiar en que la clase CSS estaba aplicada
    (lo estaba, confirmado con `getComputedStyle`, pero no bastaba).
  - **Segundo bug real, mobile-only, misma categoría que el de
    `.archive-feature-row` en la pasada anterior**: el intento inicial de
    `.archive-line-row` en mobile usaba `margin-left:90px` en el byline
    para "empujarlo" a su propia línea — pero un margin NO fuerza un
    salto de línea en flexbox; con `min-width:0` en el título, el
    algoritmo prefería aplastar el título a ~52px de ancho real antes que
    respetar el margen (confirmado con `getBoundingClientRect`, capturas
    mostraban el titular cortado a 2-3 palabras). Fix: columna de verdad
    (`flex-direction:column`) en vez de un empujón cosmético — mismo
    principio que ya se había aprendido y aplicado al feature-row.
- **Verificado** (Postgres local + `next dev` + Playwright, 17 checks
  nuevos): Cuadrícula activa por defecto sin query param, Lista vía
  `?view=list`; los 5 niveles presentes y suman exactamente los 24
  artículos del archivo sin filtrar (2/6/7/6/3 — coincide con el conteo
  real de `priority` en Postgres); tamaños de fuente estrictamente
  decrecientes ★5>★4>★3 y ★2>★1 confirmado con `getComputedStyle`; solo
  ★5 muestra excerpt/tag-pills; cero `<a>` anidados; filtro `sport=NFL`
  (2 artículos) no rompe con set chico; mobile con título de línea a
  ancho completo (342px, no aplastado). Capturas desktop, mobile y dark
  mode revisadas visualmente en cada iteración del arreglo (no solo al
  final). `tsc --noEmit`, `npm run lint` y `npm run build` limpios.

### 2026-07-23 — Fix: tarjetas del río se veían inconsistentes (feedback con capturas del preview real)

- El usuario mandó capturas de un deploy preview real de Vercel (no de
  este entorno local) mostrando `/archivo` en Cuadrícula: "no se ve
  uniforme, vamos por buen camino pero hay que mejorarlo". Dos bugs
  reales, ambos confirmados con medición antes de tocar código (no solo
  mirando las capturas):
  1. **`.archive-grid-card.tier-sm`/`.tier-md` tenían `flex-grow:1`**
     (`flex:1 1 180px`/`flex:1 1 260px`) — una ficha que quedaba sola o
     casi sola al final de su fila se estiraba para llenar el espacio
     sobrante, así que la MISMA talla nominal medía distinto de una fila
     a otra según cuántas vecinas le tocaran ese renglón — confirmado
     con `getBoundingClientRect` antes del fix (anchos dispares) y
     después (7 tarjetas `tier-sm` a 200px exactos, 6 `tier-md` a 280px
     exactos, sin excepción). Fix: `flex:0 1 200px`/`flex:0 1 280px` —
     talla fija, sin crecer; lo que no entra en la fila pasa a la
     siguiente y el espacio sobrante queda en blanco a la derecha (como
     el margen irregular de un párrafo) en vez de forzar una talla
     distinta.
  2. **`groupRiver()` agrupaba CUALQUIER racha de ★3+★4 en un mismo
     cluster** — aunque cada ficha ya medía su talla correcta (bug 1
     resuelto), una ficha de 200px al lado de tres de 280px en la MISMA
     fila seguía leyéndose como roto, no como jerarquía a propósito
     (visto en captura real: 3 anchas + 1 angosta en una fila). Fix:
     `groupRiver` ahora solo encadena artículos del MISMO tier exacto —
     una racha ★4→★4→★3 corta el cluster en dos (uno de ★4, otro de ★3)
     en vez de uno mixto. Cada fila queda perfectamente uniforme; el
     salto de tamaño ahora ocurre ENTRE filas, nunca dentro de una.
  - **De paso, se investigó si el preview real tenía más imágenes que el
    dataset local** (las capturas mostraban headlines del ticker que no
    existen en `articles.json` local, ej. "FIFA vende el pasto que pagó
    Nueva Jersey" — evidencia de que el deploy preview corre contra un
    Postgres de producción con más artículos que los 30 sembrados acá).
    No hay acceso a esa base desde este entorno, pero las capturas
    mismas muestran el mismo patrón (solo el hero real tiene foto, el
    resto de los cuadrados están en blanco) — consistente con lo ya
    encontrado localmente (revisar `articles.json`/Postgres local:
    `image_url` vacío confirmado para todos los artículos ★3/★4). El
    placeholder mudo se mantiene sin cambios; no se fabricaron fotos de
    stock (mismo criterio que la entrada anterior).
- **Verificado** (Postgres local + `next dev` + Playwright): mismos 17
  checks del pase anterior siguen pasando (conteo de tiers, tamaños de
  fuente, sin `<a>` anidados, toggle, filtro chico, mobile) más
  medición directa de `getBoundingClientRect` confirmando talla uniforme
  dentro de cada tier (200px×7, 280px×6, sin variación) y captura dark
  mode revisada confirmando cada fila de cuadrados ahora homogénea.
  `tsc --noEmit`, `npm run lint` y `npm run build` limpios.

### 2026-07-23 — El tamaño del río ahora decae con la antigüedad, no solo el rating

- Feedback del usuario: "en un portal de noticias lo que más importa es
  la recencia". Gap real: `tierFor` (Cuadrícula) y el piso de
  `pickFeaturedIds` (Lista) usaban `priority` crudo — un artículo ★5 de
  hace tres semanas recibía exactamente el mismo tratamiento gigante que
  uno de esta mañana. Mal para un sitio de noticias: la importancia
  editorial debería decaer con el tiempo, y un artículo apenas más nuevo
  debería poder superar en jerarquía visual a uno "importante" pero
  viejo — el mismo principio que `rankScore` (`lib/rank.ts`) ya aplica
  para el ORDEN de artículos del home (prioridad × recencia).
  - **`lib/rank.ts`**: `rankScore` ahora acepta un tercer parámetro
    opcional `dayWeight` (default `PRIORITY_DAY_WEIGHT`, sin cambios de
    comportamiento en ningún call site existente — home, ticker, admin
    tab, todos siguen llamándolo con 2 argumentos). `daysSince` pasó a
    exportarse también.
  - **`archivo/page.tsx`**: `tierFor` ahora computa `rankScore(article,
    now, ARCHIVE_TIER_DAY_WEIGHT)` en vez de leer `priority` directo.
    Intento inicial: reusar el mismo peso que el home (`PRIORITY_DAY_WEIGHT
    = 1.5`, "1 estrella ≈ 1.5 días") — resultado, verificado directo
    contra los 24 artículos reales del archivo: los 24 caían en tier 1,
    cero en cualquier otro tier. Ese peso está calibrado para competencia
    del mismo día en el home; el archivo es lo opuesto por definición
    (todo lo que hay ahí ya es más viejo que lo que muestra el home, acá
    típicamente 1-5+ semanas con el ritmo de publicación real del sitio).
    Se barrieron valores de peso contra los datos reales (`W=3` hasta
    `W=30`) hasta encontrar uno que produjera una distribución sana en
    los 5 tiers: `ARCHIVE_TIER_DAY_WEIGHT = 30` ("1 estrella ≈ 1 mes") da
    {1:4, 2:7, 3:5, 4:6, 5:2} — y de paso demuestra que la recencia
    realmente pesa: dos artículos ★3 de 16 días decaen POR DEBAJO de
    otros ★3 de 9-14 días, cayendo un tier completo solo por antigüedad.
  - **`pickFeaturedIds` (Lista)**: el piso pasó de `priority >= 4` a
    `tierFor(candidate, now) === 5` — reusa el mismo tier recalibrado que
    la Cuadrícula, así que un artículo ★4 viejo ya no fuerza la fila
    destacada solo porque un editor lo calificó bien alguna vez, y ambas
    vistas coinciden exactamente en qué 2 artículos son "los grandes"
    (verificado: los mismos 2 IDs aparecen como destacado en Lista y como
    tier-5 en Cuadrícula).
- **Verificado** (Postgres local + `next dev` + Playwright): la
  distribución real en vivo (`{"tier5":2,"tierSm":5,"tierMd":6,"tier1":4,
  "tier2":7}`) coincide exactamente con la predicción del barrido hecho
  contra Postgres antes de tocar código; los 17 checks anteriores (conteo
  suma 24, tamaños de fuente decrecientes, sin `<a>` anidados, toggle,
  filtro chico, mobile) siguen pasando sin cambios; capturas desktop
  (Cuadrícula y Lista) revisadas confirmando que los mismos 2 artículos
  aparecen como destacados en ambas vistas y que artículos ★3 viejos
  correctamente bajaron a línea de texto. `tsc --noEmit`, `npm run lint`
  y `npm run build` limpios; confirmado que ningún otro call site de
  `rankScore`/`rankArticles`/`selectHero` (home, ticker, admin) cambió de
  comportamiento — el nuevo parámetro es opcional con default compatible.

### 2026-07-23 — Banner de The Futbol Business Review + fotos de testimonios (2 de 3)

- El usuario subió 4 imágenes: un banner nuevo para "The Futbol Business
  Review" (ya existía como producto en `content.json`'s `productsSection`,
  imagen en `public/assets/img/tfbr-banner.webp`) y 3 fotos para los
  testimonios existentes (Bárbara González Briseño, Adriana Briz, Juan
  Pablo Robert — `testimonialsSection`, sin campo de foto hasta ahora).
  - **Banner**: la imagen subida (900×160, exacto al tamaño ya esperado
    por `ProductsSection.tsx`) se convirtió a webp con `sharp` y
    reemplazó el archivo estático existente — mismo path
    (`/assets/img/tfbr-banner.webp`), cero cambios de código necesarios,
    porque `content.json` ya apuntaba ahí.
  - **`Testimonial` type** (`lib/data/site-content.ts`) ganó `avatar?:
    string`. `TestimonialsSection.tsx` renderiza `<img>` cuando hay
    avatar, si no cae al círculo decorativo vacío de siempre — mismo
    patrón "URL editor-supplied" que `AboutSection`/`ProductsSection`.
    `.quote .avatar` (sections.css) subió de 20px a 36px — una foto real
    necesita algo de tamaño para leerse como cara. `TestimonialsTab.tsx`
    (admin) ganó el campo "Foto (URL)" para poder editarlo desde el CMS
    a futuro.
  - **Bloqueo real encontrado, no ignorado**: la foto subida para
    Adriana Briz (`IMG_0602.jpeg`) trae en su EXIF el string literal
    `"Copyright Rex Shutterstock No reproduction without permission"` —
    parece un stock photo de banco de imágenes, no una foto real de la
    persona nombrada en el testimonio. Se integraron Bárbara y Juan
    (recortados a cuadrado 400×400 con `sharp`, `sharp.strategy.attention`
    para Bárbara, recorte manual para Juan porque el auto-crop incluía
    demasiado fondo/cuerpo) — Adriana quedó sin foto (círculo vacío,
    comportamiento de siempre) hasta que el usuario confirme que esa
    imagen específica está autorizada o mande una distinta.
  - Archivos nuevos: `public/assets/img/testimonial-barbara.jpg`,
    `public/assets/img/testimonial-juan.jpg`.
- **Verificado** (Postgres local + `migrate:json` + `next dev` +
  Playwright): capturas de la sección de testimonios y de productos en
  el home, light y dark mode, confirmando ambas fotos nuevas cargando
  sin roturas y el círculo de Adriana sin cambios. `tsc --noEmit`, `npm
  run lint` y `npm run build` limpios.
- **Pendiente/importante**: este cambio actualiza `content.json` y el
  Postgres LOCAL de este sandbox (vía `migrate:json`), no la base de
  producción — este entorno no tiene `POSTGRES_URL` de producción. Para
  que se vea en el sitio real hace falta uno de: (a) dar acceso a la
  Postgres real vía variable de entorno del Environment (ver pregunta
  del usuario sobre "acceso permanente a la base" en esta misma
  sesión — respondida en el chat, no en este archivo), (b) que un
  editor entre a `/admin` → Testimonios y pegue las URLs de foto ahí
  una vez que este código esté deployado, o (c) volver a correr
  `migrate:json` contra producción (riesgo: pisa cualquier edición
  hecha desde el CMS que no esté reflejada en `content.json`).

### 2026-07-30 — El hero ya no se queda pegado en un ★5 viejo

- Feedback del usuario: "way too much importance on the stars, what
  matters most is recency" para el hero/top-five de portada. Gap real
  encontrado en `lib/rank.ts`: `rankScore` (el blend prioridad×recencia,
  ver entrada 2026-07-21 arriba) ya hacía bien el ORDEN de la lista, pero
  `selectHero()` filtraba candidatos a `featured===true || priority===5`
  **antes** de aplicar ese score — así que mientras existiera un solo
  artículo ★5/Destacado en toda la tabla, ningún artículo más fresco de
  menor prioridad podía ser hero jamás, sin importar cuánto le ganara en
  `rankScore`. Exactamente el mismo bug de "historia vieja importante
  atascada" que esa entrada dice haber arreglado, reintroducido un nivel
  arriba.
  - **`lib/rank.ts`**: `selectHero()` ahora toma directo el primero de
    `rankArticles()` (mismo score que ordena la lista); `featured===true`
    sigue siendo la única forma de forzar el puesto sin importar estrellas
    ni fecha (columna que ya existía para eso). El gate de `priority===5`
    se eliminó — 5 estrellas da el boost de recencia más grande posible,
    pero ya no es un requisito para calificar.
  - **`components/admin/tabs/ArticlesTab.tsx`**: se actualizó la copia que
    le prometía al editor "5 estrellas o Destacado = hero" (ya no es
    cierto) y se sacó el banner de "conflicto" por artículos ★5
    simultáneos (ya no hay tal conflicto — el score decide solo). El
    banner de "Destacado" duplicado se mantiene, porque `featured` sigue
    siendo un override real.
  - **`docs/ENCYCLOPEDIA.md`** (§8.1): actualizado para reflejar el nuevo
    comportamiento de `selectHero()`.
- **Verificado**: `tsc --noEmit`, `npm run lint` y `npm run build`
  limpios. Chequeo directo con `tsx` sobre `lib/rank.ts`: con un artículo
  ★5 de 15 días, uno ★3 de hoy y uno ★1 de ayer, `selectHero` ahora
  devuelve el ★3 de hoy (antes hubiera devuelto el ★5 viejo por ser el
  único candidato); agregando un cuarto artículo `featured:true` viejo,
  ese gana igual — confirma que el override editorial sigue intacto.

### 2026-07-30 — El placeholder de ads se apaga; queda listo para AdSense

- Pedido directo del usuario, revirtiendo el de 2026-07-22: ya no hay
  ganas de mostrar el placeholder rayado mientras no exista una red de
  ads conectada — "collapse this places right now [...] we establish the
  connection automatically" en cuanto haya cuenta de AdSense real. Sin
  cuenta de AdSense todavía (confirmado con el usuario), así que este
  cambio es apagar el placeholder ahora + dejar el código listo para que
  conectar la red sea nada más setear variables de entorno, no volver a
  tocar componentes.
  - **`components/ads/AdSlot.tsx`**: ya no renderiza el `<div
    className="ad-slot-placeholder">` fijo. Ahora, si no hay consentimiento
    de publicidad, o no hay `ADSENSE_CLIENT_ID`, o no hay un
    `ADSENSE_SLOT_*` configurado para ese slot puntual, el componente
    devuelve `null` — ni caja, ni espacio reservado, ni atributos. Recién
    cuando las tres condiciones se cumplen renderiza el `<ins
    class="adsbygoogle">` real (con el script de Google cargado vía
    `next/script`, `strategy="afterInteractive"`) dentro del mismo `<div
    className="ad-slot ad-slot--{slot}">` de siempre, para que ese slot sí
    reserve su tamaño planeado (cero CLS) una vez que hay un anuncio real
    que mostrar. El contrato de consentimiento (`lib/consent.ts`) no
    cambió: sin consentimiento de publicidad, nunca se carga el script de
    Google, config de AdSense o no.
  - **`lib/adsense.ts`** (nuevo): `getAdSenseConfig()` lee
    `ADSENSE_CLIENT_ID` + los seis `ADSENSE_SLOT_*` (uno por posición) del
    lado del servidor — mismo criterio que `GA4_MEASUREMENT_ID` en
    `app/(public)/layout.tsx`: no son secretos, pero se leen server-side y
    se pasan hacia abajo en vez de vivir como `NEXT_PUBLIC_*`.
  - **`components/ads/AdSenseProvider.tsx`** (nuevo): contexto liviano que
    reparte esa config a los seis call sites de `AdSlot` sin tener que
    pasarla a mano por cada uno; `app/(public)/layout.tsx` lo instancia una
    sola vez con la config leída server-side.
  - **`app/ads.txt/route.ts`** (nuevo): AdSense exige este archivo en la
    raíz del dominio una vez que hay inventario real, o marca el sitio
    como no autorizado para vender su propio espacio. Sirve vacío (200)
    hasta que `ADSENSE_CLIENT_ID` tenga valor — mismo criterio que
    `AdSlot.tsx`, una variable de entorno lo activa.
  - **`styles/ads.css`**: se borraron las reglas del placeholder
    (`.ad-slot-placeholder` y compañía); quedan solo las reglas de tamaño
    por slot, que ahora solo aplican mientras un `<ins>` real está
    montado.
  - **`.env.local.example`**: documenta `ADSENSE_CLIENT_ID` y los seis
    `ADSENSE_SLOT_*`, todos vacíos por ahora.
- **Pendiente/importante**: no hay cuenta de AdSense todavía — eso es un
  paso manual del usuario (alta en Google AdSense, verificación del
  sitio, aprobación) que este entorno no puede hacer por él. Una vez
  aprobada, conectar la red real es: pegar el publisher ID en
  `ADSENSE_CLIENT_ID` y, a medida que se crean los ad units en el
  dashboard de AdSense, ir completando cada `ADSENSE_SLOT_*` — cada slot
  se activa solo en cuanto su variable tiene valor, sin tocar código ni
  volver a desplegar.
- **Verificado**: `tsc --noEmit`, `npm run lint` y `npm run build`
  limpios. Local con Postgres real (`db:migrate` + `migrate:json`) +
  `next dev` + Playwright: (1) sin ninguna variable de AdSense seteada,
  cero elementos `[data-ad-slot]` en el DOM del home, con o sin
  consentimiento otorgado — confirma el colapso total pedido; (2)
  seteando `ADSENSE_CLIENT_ID` + `ADSENSE_SLOT_LEADERBOARD_HOME` (valores
  de prueba, no reales) y otorgando consentimiento, solo el slot
  `leaderboard-home` renderiza su `<ins class="adsbygoogle">` con el
  client/slot correctos; el resto de los slots (sin su variable seteada)
  siguen colapsados — confirma que cada posición se activa
  independientemente. Sin consentimiento, ningún slot renderiza nada
  aunque esté configurado. Sin errores nuevos en consola del navegador
  (los dos que aparecen, `MissingSecret` de next-auth y el bloqueo de
  Vercel Web Analytics, son gaps preexistentes del sandbox sin relación
  con este cambio).

### 2026-07-31 — CMP certificado de Google (Funding Choices) para AdSense

- **Motivo**: la capa de consentimiento de Fase 7 (`lib/consent.ts` +
  `CookieNotice.tsx`) es un opt-in binario propio, marco de referencia
  LFPDPPP — nunca fue un CMP certificado IAB TCF v2 (no había
  `window.__tcfapi`, ni Vendor List, ni registro CMP; una entrada previa de
  este archivo, 2026-07-22, lo etiquetaba mal como "TCF/LFPDPPP"). AdSense
  exige un CMP certificado por Google para servir anuncios a visitantes de
  la UE/Reino Unido/Suiza. De las tres formas que ofrece Google de cumplir
  esto (mensaje propio vía "Privacy & messaging"/Funding Choices, un CMP de
  terceros certificado como Cookiebot/OneTrust/Sourcepoint, o un CMP propio
  registrado directamente ante IAB), se eligió la primera — es la que Google
  aloja y certifica por completo, no requiere cuenta ni credencial de un
  tercero, y usa el mismo publisher ID que ya existe para AdSense.
- **`lib/adsense.ts`**: nueva `getFundingChoicesPublisherId()` — deriva el
  ID de Funding Choices (`pub-XXXX`) de `ADSENSE_CLIENT_ID` (`ca-pub-XXXX`)
  quitando el prefijo `ca-`. Ninguna variable de entorno nueva.
- **`app/layout.tsx`**: agrega el snippet oficial de Google (tag loader +
  script `googlefcPresent`) como `<Script strategy="beforeInteractive">`,
  condicionado a que `ADSENSE_CLIENT_ID` tenga valor. Va en el root layout
  (no en `app/(public)/layout.tsx` donde vive el resto de ads/analytics)
  porque Next.js exige que los scripts `beforeInteractive` estén ahí — ver
  el comentario junto a `FUNDING_CHOICES_PRESENT_SCRIPT` para el porqué de
  mantenerlo inline en vez de un componente en `components/` (un componente
  separado dispara una falsa alarma de
  `no-before-interactive-script-outside-document`, la regla de ESLint solo
  ignora archivos bajo `app/`).
- **`next.config.ts`**: CSP ampliada — `script-src`/`connect-src` suman
  `pagead2.googlesyndication.com` (AdSense, que ya cargaba un script de ahí
  sin tener el dominio permitido — gap preexistente, ahora corregido) y
  `fundingchoicesmessages.google.com`; `frame-src` suma esos dos dominios
  más `googleads.g.doubleclick.net`/`tpc.googlesyndication.com` (iframes de
  creatividades/mensaje de consentimiento).
- **`app/(public)/privacidad/page.tsx`**: agrega mención de la cookie de
  publicidad (AdSense, opt-in) y, para visitantes de la UE/Reino
  Unido/Suiza, del aviso de consentimiento propio de Google gestionado como
  CMP certificado bajo el marco IAB TCF. Esto es una mención mínima, no una
  reescritura legal completa — el resto del documento sigue enfocado en
  LFPDPPP; falta una revisión legal si el sitio empieza a recibir tráfico
  real de la UE (base legal, representante en la UE, lista de proveedores
  IAB, etc., ver "Pendiente" abajo).
- **Sin cambios**: `AdSlot.tsx`/`GoogleAnalytics.tsx` — el propio tag de
  AdSense ya es TCF-aware (respeta el TC string automáticamente una vez que
  Funding Choices lo genera); nuestra propia gate de `advertising===true`
  sigue siendo una capa adicional independiente, no reemplazada.
- **Verificado**: `tsc --noEmit`, `npm run lint` (cero warnings, incluida
  la regla `no-before-interactive-script-outside-document`) y `npm run
  build`, limpios los tres.
- **Pendiente/importante**: igual que Fase 7, no hay cuenta de AdSense
  todavía, así que `ADSENSE_CLIENT_ID` vacío = nada de esto se renderiza.
  Una vez que exista la cuenta: (1) pegar el publisher ID en
  `ADSENSE_CLIENT_ID` (ya activa Funding Choices sin cambio de código); (2)
  configurar el mensaje real de GDPR/UK en el dashboard de AdSense
  ("Privacy & messaging") — qué mensaje mostrar, a quién, y si bloquea la
  carga de anuncios hasta obtener consentimiento es todo configuración de
  dashboard, no código; (3) revisión legal del aviso de privacidad si hay
  tráfico real de la UE.

### 2026-07-31 — GA4 deja de requerir consentimiento (solo publicidad sigue opt-in)

- **Motivo, reportado por el usuario**: "Google Analytics no funciona" —
  dio el measurement ID real (`G-0CG7JMK8RZ`, ya confirmado en
  `docs/ENCYCLOPEDIA.md`) y el snippet estándar de `gtag.js`. El código ya
  leía ese mismo ID desde `GA4_MEASUREMENT_ID` y montaba el snippet
  equivalente — no había ningún bug de wiring ni de ID incorrecto.
  Diagnóstico real: desde Fase 7 (2026-07-22), `GoogleAnalytics.tsx` solo
  cargaba `gtag` si el visitante otorgaba la categoría "advertising" del
  banner de cookies — la inmensa mayoría de visitantes reales nunca
  interactúa con el banner, así que la medición quedó, en la práctica, casi
  en cero pese a estar bien configurada. Es un cambio de comportamiento
  deliberado de esa sesión, no un bug de código, así que se le preguntó al
  usuario cómo resolverlo antes de tocar nada — eligió separar analítica de
  publicidad en vez de revertir todo el consentimiento o solo auditar el
  banner.
- **`components/analytics/GoogleAnalytics.tsx`**: ya no lee
  `lib/consent.ts` — vuelve a cargar `gtag` incondicionalmente para toda
  visita a una página pública (igual que antes de Fase 7, igual que el
  snippet que Google entrega). Ya no necesita `'use client'` (sin hooks).
  Sigue montado solo en `app/(public)/layout.tsx`, nunca en `/admin` — esa
  parte no cambió.
- **`lib/consent.ts`** + **`components/CookieNotice.tsx`**: el shape
  guardado (`{essential, advertising, timestamp}`) no cambió — solo se
  angostó el alcance de lo que representa. El banner ahora muestra tres
  filas en "Gestionar preferencias" (antes dos): Esenciales (siempre
  activa), Analítica (siempre activa, informativa, sin checkbox
  interactivo), Publicidad (el único opt-in real, sigue gateando
  `components/ads/AdSlot.tsx` sin cambios). Texto superior del banner
  actualizado para no prometer que la analítica requiere permiso.
- **`app/(public)/privacidad/page.tsx`**: aclarado que Analítica está
  "siempre activa" (ya no aparecía distinguida de Publicidad, que sigue
  siendo la única con consentimiento).
- **Verificado**: `tsc --noEmit`, `npm run lint`, `npm run build` limpios
  los tres.
- **Pendiente/importante, no de código**: seguir sin poder confirmar desde
  acá si `GA4_MEASUREMENT_ID` está realmente cargada en Vercel Production
  ahora mismo (una auditoría de 2026-07-21 la encontró cargada, pero este
  entorno no tiene acceso al dashboard de Vercel para reverificar) — si
  después de este cambio GA4 real-time sigue sin mostrar datos, ese es el
  primer lugar a revisar, no el código.

### 2026-07-31 — Panel de analítica del admin: GA4 primero, Vercel de respaldo

- **Pedido del usuario**: el panel `/admin/analytics` (`lib/analytics-data.ts`)
  solo leía de Vercel Analytics (`lib/vercel-analytics.ts`); el usuario, ante
  la sospecha de que se agotó la cuota mensual de eventos de Vercel, pidió
  traer del lado de Google todo lo que se pueda, dejando en Vercel solo lo
  que sea exclusivo de Vercel. Auditados los cinco paneles (KPIs, artículos
  más leídos, referidos, países, dispositivos): los cinco tienen equivalente
  en la GA4 Data API, así que no queda nada genuinamente exclusivo de Vercel
  para este panel — Vercel pasa a ser el respaldo, no una fuente aparte.
- **`lib/ga4.ts`**: `runReport()` extraído como export compartido (antes
  vivía inline dentro de `topArticleIds()`) — mismo login de JWT/token, ahora
  reutilizable. `topArticleIds()` no cambió de comportamiento, solo de
  implementación interna.
- **`lib/ga4-analytics.ts`** (nuevo): `count`/`aggregateVisits`/
  `aggregateEvents`, mismas firmas que sus equivalentes de
  `lib/vercel-analytics.ts` — reemplazos directos. `aggregateVisits` mapea
  las dimensiones de Vercel a las de GA4 (`referrerHostname`→`sessionSource`,
  `country`→`country`, `deviceType`→`deviceCategory`) y devuelve las filas
  bajo la misma clave que espera `breakdownPanel()` en `analytics-data.ts`
  (`row[dimension]`), así que ese archivo no necesitó tocar su lógica de
  lectura. `aggregateEvents` no tiene equivalente real de evento
  personalizado en GA4 (el sitio nunca dispara uno) — reusa la misma técnica
  de `topArticleIds()` (`pagePath` que contiene `/articulo`, `?id=` como
  identificador del artículo).
- **`lib/analytics-data.ts`**: nuevo `withGa4Fallback()` — si GA4 está
  configurado (`ga4Analytics.isConfigured()`), lo intenta primero; si tira
  error, cae a Vercel; si GA4 no está configurado, va directo a Vercel. Los
  tres call sites (`safeCount`, `topArticlesPanel`, `breakdownPanel`) pasan
  por ahí. `getAnalyticsSnapshot()` y todo lo que la consume
  (`AnalyticsView.tsx`, `refreshAnalytics()`, la página del panel) no
  cambiaron — mismo shape de siempre.
- **Advertencia dejada como comentario, no resuelta**: los rangos de fecha de
  GA4 (`YYYY-MM-DD`) se interpretan en la zona horaria de la propiedad (GA4
  Admin → Configuración de la propiedad), no necesariamente UTC, mientras que
  los límites de este panel se calculan en UTC — puede haber un desfase de
  algunas horas justo en el cambio de día. No se resolvió con una segunda
  llamada a la Admin API solo para un panel que ya rotula sus propios números
  de país/dispositivo como "aproximado" en otro lado.
- **Verificado**: `tsc --noEmit`, `npm run lint`, `npm run build` limpios los
  tres. Además, con credenciales de GA4 falsas (par RSA descartable, sin
  tocar Vercel) y `global.fetch` mockeado para las dos URLs reales que llama
  `lib/ga4.ts` (token OAuth + `:runReport`), confirmado con un script
  standalone (no un test formal, no queda en el repo) que `count()`,
  `aggregateVisits()` (las tres dimensiones) y `aggregateEvents()` de
  `lib/ga4-analytics.ts` devuelven la forma exacta que espera
  `analytics-data.ts`, incluida la extracción del id de artículo desde
  `pagePath` y el mapeo de dimensión-a-clave para countries/devices/referrers.
  No se pudo probar `getAnalyticsSnapshot()` completo con datos simulados en
  este entorno porque, apenas hay filas de "artículos más leídos", llama a
  `getAllArticlesForAdmin()` (Postgres real) para resolver títulos, y este
  sandbox no tiene acceso rápido a esa base — no es una limitación del
  cambio, ya pasaba antes de este mismo.
- **Pendiente/importante, no de código**: para que esto realmente empiece a
  traer datos de Google, faltan migrar en Vercel las tres variables de
  entorno de GA4 con el casing correcto (`GA4_property_id` →
  `GA4_PROPERTY_ID`, etc. — bug real ya encontrado y anotado el 2026-07-21,
  ver ese día en este mismo registro) y confirmar que la cuenta de servicio
  tiene rol Viewer en la propiedad real. Sin eso, `isConfigured()` sigue
  devolviendo `false` y el panel sigue leyendo de Vercel como hasta ahora.

### 2026-08-01 — Roadmap Agosto 2026 recibido; arranque de Fase 0 (bugs visuales)

- **Contexto**: el usuario compartió un roadmap nuevo de 7 fases (0-6,
  sección propia arriba, "Roadmap Agosto 2026") para el trabajo pendiente
  del portal. Antes de programar nada se discutieron los ítems con el
  usuario y se anotaron ajustes de secuencia/alcance directamente en cada
  fase de esa sección — no repetirlos acá.
- **Fase 0, ítems 1-3 (tag negro "Mundial", footer, portada de La Lana del
  Deporte): diagnosticados a fondo, NO son bugs de código.** Investigación,
  no asumida:
  1. `git log` muestra el commit `f7359f1` ("Rebrand La Lana del Mundial a
     La Lana del Deporte", 31-jul, ya en `main`) — cambió
     `lib/constants.ts` (`SOURCE_LABELS`), `app/api/update-articles/route.ts`
     (`detectPublication`), `content.json`/`articles.json`, y reemplazó
     `public/assets/img/lana-banner.webp` por `lana-banner.jpg`. Grep de
     "Mundial" en todo el árbol de código/JSON (excluyendo `docs/`, que son
     prototipos HTML estáticos de archivo) no encuentra ninguna ocurrencia
     de la frase de marca — el código ya está limpio.
  2. Pero el tag negro del hero (`components/article/LeadStory.tsx`, línea
     `<span className="tag">{article.publication}</span>`) y el footer
     (`Footer.tsx` vía `site_content.footer.brandBlurb`) **leen de
     Postgres, no de `content.json`/`articles.json`** — esos JSON solo
     existen como semilla de un migrador manual
     (`scripts/migrate-json-to-db.ts`, `npm run migrate:json`).
  3. Ese migrador **no corre solo**: `scripts/predeploy-migrate.ts`, lo
     único que sí corre automático en cada build de producción
     (`vercel-build` en `package.json`), solo aplica migraciones de
     *schema* de Drizzle — nunca resincroniza contenido. Confirmado leyendo
     el archivo, no asumido.
  4. Conclusión: cualquier artículo o fila de `site_content` que ya
     existía en Postgres antes del commit de rebrand se quedó con el texto
     viejo para siempre, hasta que algo la reescriba explícitamente — y
     nadie corrió `npm run migrate:json` contra producción después de ese
     merge (no hay entrada de HANDOFF documentándolo, y el propio commit
     del rebrand no lo menciona). Esto explica por qué el usuario sigue
     viendo "Mundial" en producción un día después del merge: es un
     **desfase de datos, no una regresión de código**.
  5. Además, re-correr `npm run migrate:json` tal cual **no alcanzaría**:
     ese script hace upsert solo de los ids que ya están en el
     `articles.json` del repo — cualquier artículo insertado directo en
     Postgres por el webhook de Make.com después de que se tomó esa
     foto (con el `detectPublication()` viejo, antes del rebrand) quedaría
     fuera del upsert igual.
- **Fix escrito para lo anterior**: `scripts/fix-lana-rebrand-content.ts`
  (nuevo, agregado a `package.json` como `npm run fix:lana-rebrand`). Es un
  find/replace acotado y seguro de correr contra datos reales: busca la
  frase exacta de 4 palabras `"La Lana del Mundial"` (nunca aparece
  legítimamente — un artículo real sobre el torneo dice "el Mundial 2026",
  nunca la frase de marca completa) y la ruta vieja del asset
  (`lana-banner.webp`) en `articles.publication`/`articles.imageUrl` y de
  forma recursiva en todo el árbol JSON de `site_content.data`, y
  solo reescribe lo que de verdad cambió — usa el mismo patrón de
  concurrencia optimista (`version`) que `saveSiteContent()` en
  `lib/actions/admin.ts`, e inserta una fila en `content_revisions` para
  mantener el registro de auditoría. Soporta `--dry-run`.
  **No se pudo correr contra producción ni contra ninguna Postgres real**:
  este sandbox no tiene salida de red hacia el host de Neon (confirmado con
  un `psql`/TCP directo, ambos con timeout — la política de red del
  entorno solo permite el proxy HTTPS configurado, no puertos Postgres
  arbitrarios), así que el script está escrito, tipado limpio
  (`tsc --noEmit`), lint limpio, y probado en modo `--dry-run` hasta el
  punto de intentar conectar (falla ahí por la misma razón), pero **nunca
  ejecutado de punta a punta contra datos reales**. `next build` completo
  sí corrido y limpio después de estos cambios.
  **Queda pendiente, de operación, no de código**: correr
  `POSTGRES_URL=<producción real> npm run fix:lana-rebrand -- --dry-run`
  primero para ver el diagnóstico exacto, y sin `--dry-run` para aplicarlo,
  desde un entorno con salida de red hacia Postgres (local del equipo, o
  una sesión con acceso real).
- **Fase 0, ítem 3 (fotos de testimoniales) — mismo diagnóstico probable,
  sin confirmar**: `content.json` y los archivos
  `public/assets/img/testimonial-barbara.jpg`/`testimonial-juan.jpg` ya
  existen y son correctos en el repo (commit `71128cb`). El script de
  arriba no los toca porque no hay una ruta vieja conocida para buscar (a
  diferencia del banner de La Lana, nunca se identificó cuál era el valor
  stale exacto en Postgres para estos dos avatares — podrían estar
  simplemente vacíos si se crearon antes de que existieran esos archivos).
  Si tras desplegar este código las fotos siguen sin cargar, es edición
  directa de dos campos vía el tab Testimonios del admin, no requiere
  código: pegar `/assets/img/testimonial-barbara.jpg` y
  `/assets/img/testimonial-juan.jpg` en los avatares de Bárbara y Juan
  Pablo respectivamente.
- **Fase 0, ítem 4 (botón de Playbook no regresa a home dentro de un tag
  del 5+1) — causa real distinta a la investigada primero, y ya
  corregida.** El usuario aclaró el repro real: no es un problema de
  navegar DESDE una página de tag, es que **el logo no hace nada estando
  ya en `/`**. Causa raíz, una vez con el repro correcto: `<Link
  href="/">` de Next.js no dispara ninguna navegación cuando ya estás en
  esa misma ruta — así que filtrar el paquete 5+1 por una fuente (`.filter-
  btn`, estado `activeSource` local de `components/home/NewsGrid.tsx`, sin
  cambio de URL) y después clickear el logo esperando volver a la vista
  "todo" arriba de la página no hacía absolutamente nada, ni scroll ni
  reset de filtro. Fuera de `/` el comportamiento ya era correcto (App
  Router resetea el scroll y remonta la página en una navegación real), así
  que el fix solo intercepta el caso mismo-ruta.
  - `components/layout/BrandLink.tsx` (nuevo): extrae el link/logo del
    header a su propio client component (`Header.tsx` es un Server
    Component async, no puede tener el `onClick` necesario). En `onClick`,
    si `usePathname() === '/'`: `preventDefault`, limpia cualquier hash de
    la URL, hace `scrollTo({top:0, behavior:'smooth'})` y dispara un
    `CustomEvent('playbook:reset-home')` en `window`. Fuera de `/` deja que
    el `<Link>` navegue normal.
  - `components/home/NewsGrid.tsx`: escucha ese evento y llama
    `selectSource('all')` (a través de un ref que siempre apunta a la
    versión más reciente de esa función, para no capturar un closure
    viejo de `activeSource`) — reutiliza el mismo fade GSAP que ya usa el
    click en un chip de filtro, en vez de duplicar esa lógica.
  - **Verificado de punta a punta contra un servidor real, no solo
    compilación** — ver la entrada de infraestructura de verificación local
    abajo para cómo se levantó: Playwright headless contra `next dev` real
    con Postgres real (local, sembrada con `migrate:json`): clic en el chip
    "La Lana del Deporte" → `activeSource` pasa a `la-lana`; scroll manual a
    600px; clic en el logo → `activeSource` vuelve a `all` y `scrollY` baja
    a `0`, confirmado leyendo el DOM real después de cada paso, no
    asumido. **No se reprodujo el bug original antes del fix** (no se
    corrió el mismo script contra el `Header.tsx` viejo) — la causa se
    infirió del comportamiento documentado de Next.js (`<Link>` a la ruta
    actual no navega) más la descripción del usuario, y se verificó
    directamente que el fix funciona; si alguien quiere el antes/y-después
    exacto, revertir `BrandLink.tsx` a un `<Link>` plano y correr el mismo
    script de Playwright lo confirmaría en un minuto.
- **Nueva infraestructura de verificación local, releer antes de asumir que
  este sandbox no puede levantar el sitio**: `postgresql-16` viene
  preinstalado en este entorno (servidor, no solo el cliente `psql` que ya
  se sabía que existía) pero apagado por defecto. `service postgresql
  start` lo levanta; la sesión creó un rol/base `playbook`/`playbook` local
  y corrió `db:migrate` + `migrate:json` contra ella con `POSTGRES_URL`
  **pasada inline en el comando** (no alcanza con escribir `.env.local`:
  este sandbox ya trae un `POSTGRES_URL` real de Neon exportado como
  variable de entorno del proceso, y eso pisa cualquier `.env.local` — hay
  que sobreescribirlo explícitamente en cada comando/en el env del server).
  Con eso, `next dev` corre normal contra datos reales locales y Playwright
  (mismo patrón de import que documenta `.claude/skills/verify/SKILL.md`,
  aunque esa skill en sí describe el setup del sitio legado — desactualizada,
  ver nota de abajo) puede manejar el navegador real. Esto **cierra el gap
  de verificación** que bloqueó a la sesión anterior de este mismo día
  (diagnóstico de Fase 0 sin poder reproducir nada en vivo) — la próxima
  sesión que necesite probar algo contra un servidor real puede repetir
  esto en vez de asumir que no se puede. La Neon de producción real sigue
  sin ser alcanzable desde acá (confirmado con timeout de TCP directo) —
  esto es un Postgres local nuevo y vacío, no un atajo a producción.
- **Fase 0, ítem 5 no evaluado todavía**: la skill `verify` del repo
  (`.claude/skills/verify/SKILL.md`) describe un setup de servidor Node
  plano para el sitio **legado pre-migración** (`api/sitemap.js`,
  `articulo.html`, sin `package.json`) — quedó desactualizada desde la
  migración a Next.js (este repo sí tiene `package.json`/`next.config.ts`
  hoy). Con Postgres local ya resuelto (ver arriba), lo único que le falta
  a esa skill es reemplazar su sección de setup por "levantar Postgres
  local + `next dev`" — no se reescribió en esta sesión por no ser parte
  del pedido, pero ya no hay excusa de infraestructura para no hacerlo
  cuando alguien la retome.
- **`scripts/fix-lana-rebrand-content.ts` verificado de punta a punta
  contra el Postgres local**, algo que la entrada anterior de este mismo
  día no había podido hacer: se corrompieron a propósito 3 filas de
  `articles` (`publication`/`image_url` puestos al valor viejo) y
  `site_content.footer.brandBlurb` de la misma forma, se corrió el script
  con `--dry-run` (reportó las 3 filas + el campo de `site_content`
  correctamente, sin escribir nada — confirmado con una segunda lectura de
  la base) y después sin `--dry-run` (las 3 filas y el blurb quedaron en
  "La Lana del Deporte"/`lana-banner.jpg`, `site_content.version`
  incrementó de 1 a 2, confirmado con `SELECT` directo). Sigue pendiente
  correrlo contra la Neon real de producción — eso sigue bloqueado por red
  desde este sandbox — pero ya no es "código sin probar", es "probado
  localmente, pendiente de ejecutarse donde haya red hacia producción".
- **Verificado**: `tsc --noEmit`, `npx eslint` sobre los archivos tocados y
  `next build`, limpios los tres, con `node_modules` instalado en este
  sandbox para poder correrlos (no estaba instalado al arrancar la
  sesión). Postgres local y `.env.local` de este sandbox son desechables
  (base vacía sin datos reales, `.env.local` con secretos falsos,
  ignorado por git) — no queda nada de esto en el repo.

### 2026-08-01 — Fase 1 (parcial): tag Playbook, "Más noticias", "Leer el artículo", sidebar

- **Contexto**: cerrado el botón de Playbook (ver entrada anterior de este
  mismo día), el usuario pidió seguir directo con Fase 1 sin más aviso.
  Cubiertos 4 de los 5 ítems de esa fase (1, 2, 3, 4); el 5 (carpetas
  internas con diseño propio, ya anotado como su propio mini-proyecto,
  separado del resto) queda para la siguiente sesión.
- **Ítem 1, "borrar el tag Playbook, traspasar sus artículos a Noticias"**:
  `'playbook'` era un cuarto `source` real (`KNOWN_SOURCES`/
  `SOURCE_LABELS`, `lib/constants.ts`), no una etiqueta cosmética — tocaba
  10 archivos. Cambios de código: `lib/constants.ts` (removido de
  `KNOWN_SOURCES`/`SOURCE_LABELS`), `lib/taxonomy.ts` (removida la entrada
  `SECTION_TOPICS.playbook`), `app/api/update-articles/route.ts`
  (`detectPublication()`'s fallback pasa de `Playbook`/`playbook` a
  `Noticias`/`industry-shots`), `lib/db/schema.ts` (los *defaults* de las
  columnas `publication`/`source` cambian a `'Noticias'`/`'industry-shots'`
  — nueva migración `drizzle/0006_freezing_ben_grimm.sql`, generada con
  `drizzle-kit generate`, no escrita a mano), `scripts/migrate-json-to-db.ts`
  (mismo cambio en sus fallbacks JS), `components/admin/article-entry.ts`
  (`newArticleEntry()` ya no propone Playbook por default a un editor
  creando un artículo nuevo), y limpieza de CSS muerto (`--src-playbook` en
  `tokens.css` y los 6 selectores `[data-source="playbook"]`/
  `.tag-mini.playbook` en `hero.css`/`article.css`/`components.css` —
  ningún artículo va a volver a tener ese `source`, así que esas reglas ya
  no podían matchear nunca). `articles.json`: los 4 artículos con
  `source: "playbook"` pasan a `"industry-shots"`/`"Noticias"`.
  **Documentación actualizada para que no se reintroduzca el bug**:
  `docs/ENCYCLOPEDIA.md` (§1, la tabla del schema de `articles`) y los dos
  skills de publicación (`publish-newsletter`, `publish-sourced-article`)
  — ambos tenían un fallback `"Playbook"`/`"playbook"` explícito en sus
  instrucciones que, de correr sin corregir, habría vuelto a crear
  artículos con un `source` que ya no es válido. De paso, `publish-
  newsletter/SKILL.md` todavía decía "La Lana del Mundial" en 5 lugares
  (branding, no URLs — los slugs `la-lana`/`la-lana-del-mundial-...` de
  Substack NO se tocaron, siguen siendo el identificador real) — corregido
  a "La Lana del Deporte" mientras se estaba ahí, mismo bug de fondo que
  el diagnóstico de Fase 0 de esta mañana, solo que en un skill en vez de
  en Postgres: de no corregirse, la próxima vez que este skill publicara
  algo de La Lana habría reintroducido el texto viejo.
  **Dato existente en producción, mismo patrón que Fase 0**: cualquier
  artículo con `source='playbook'` que ya esté en Postgres real se queda
  así hasta que algo lo reasigne — `scripts/reassign-playbook-tag.ts`
  (nuevo, `npm run fix:reassign-playbook-tag`, soporta `--dry-run`) hace
  exactamente eso, mismo patrón que `fix-lana-rebrand-content.ts`. No
  alcanza con la migración de schema por sí sola: esa solo cambia el
  *default* para filas nuevas, no toca las que ya existen.
- **Ítem 2, "Ver más" → "Más noticias", reubicado debajo del bloque**:
  `components/home/NewsGrid.tsx` — el link salió de `.section-head`
  (arriba, junto al título) y ahora vive en un `.news-grid-more` nuevo,
  centrado, después de todo el bloque hero+lista+sidebar. Mismo `id`
  (`btn-ver-archivo`, nada más lo referencia) y mismo conteo de overflow
  entre paréntesis, solo cambió el texto y la posición. CSS nueva en
  `styles/hero.css`.
- **Ítem 3, tag "Análisis" → "Artículo" en la ficha de cada pieza**:
  interpretado como el CTA por-tarjeta de la sección de opinión
  (`components/sections/OpinionSection.tsx`, `<span className="read">Leer
  el análisis →</span>` → "Leer el artículo →") — es literalmente lo único
  en el código que dice "análisis" **por pieza individual** ("ficha de
  cada pieza" del pedido original). No se tocó el link de nav "Análisis"
  (`content.json` → `nav.links`, apunta a toda la sección, no a una pieza)
  ni la palabra "análisis" donde aparece como prosa genérica (meta
  descriptions, términos) — ninguno de esos es "el tag... en la ficha de
  cada pieza". Si el usuario quería también el link de nav, decirlo
  explícito en la siguiente sesión.
- **Verificado de punta a punta contra un servidor real** (mismo Postgres
  local + Playwright que la entrada anterior, no solo compilación):
  aplicada la migración 0006 y re-corrido `migrate:json` contra la base
  local; confirmado con `psql` que 0 artículos quedan con
  `source='playbook'`; corrompida a propósito 1 fila a `source='playbook'`
  y confirmado que `fix:reassign-playbook-tag` (dry-run y aplicado) la
  corrige igual que como se probó `fix-lana-rebrand-content.ts` en la
  entrada anterior. Con `next dev` real: el filtro de fuente del 5+1 ya no
  tiene chip "Playbook" (`['all','industry-shots','la-lana','infinitas']`,
  leído del DOM); el link "Más noticias (24)" ya no está dentro de
  `.section-head` y aparece después de `.news-grid` en el orden real del
  DOM (`compareDocumentPosition`, no solo CSS visual); las 3 tarjetas de
  opinión dicen "Leer el artículo →", ninguna dice "análisis". Re-corrida
  también la verificación del fix del logo de la entrada anterior sobre
  este mismo estado, sin regresión.
- **Ítem 4, "reubicar Tips y 5 más leídas debajo del bloque de
  suscripción"**: `components/home/HomeSidebar.tsx` — el orden pasa de
  [Más leídas, ad rail, newsletter] a [newsletter, Más leídas, ad rail]. El
  ad rail se dejó pegado a Más leídas (el pedido no decía nada sobre
  moverlo a él) en vez de quedarse atrás en el viejo primer lugar.
  **"Tips" no se tocó porque no existe**: grep de "Tips" en todo el
  código, `docs/` y los prototipos HTML no encuentra ningún módulo,
  componente, ni sección con ese nombre — el sidebar del homepage hoy solo
  tiene Más leídas + ad + newsletter (ver el propio comentario de
  `HomeSidebar.tsx` antes de este cambio, documentaba exactamente esos
  tres). O es un nombre informal del usuario para algo que sí existe con
  otro nombre en código, o es algo que nunca se construyó — **preguntar
  antes de inventar un módulo nuevo** en la siguiente sesión en vez de
  asumir cuál de las dos es.
  **No se pudo confirmar visualmente el nuevo orden con Más leídas
  presente**: `MostReadSection` (GA4-backed) renderiza `null` sin
  credenciales de GA4 reales (comportamiento documentado en el propio
  componente, no un bug), y este sandbox no las tiene — confirmado con
  Playwright que el bloque de newsletter ya es el primer hijo de
  `.sidebar-sticky`, pero no que Más leídas efectivamente aparece después
  de él con contenido real dentro, porque no hay contenido real que
  mostrar acá. Verificación visual completa pendiente contra producción
  real (o un entorno con credenciales de GA4).
- **Verificado**: `tsc --noEmit`, `npx eslint .` (proyecto completo) y
  `next build`, limpios los tres.

### 2026-08-01 — Fase 3 (parcial): morado de Infinitas, compartir reubicado y ampliado

- **Contexto**: pedido explícito del usuario de "seguir con el siguiente
  fix que no requiera decisiones", dejando Fase 1 ítem 5 (carpetas
  internas) parqueado. De los 4 ítems de Fase 3, el del glitch de Windows
  sigue bloqueado (el usuario tiene un video pero todavía no lo mandó) y
  "refinar el color del pill del buscador" se dejó afuera por ser
  subjetivo ("refinar" sin una referencia concreta de qué está mal, eso sí
  es una decisión de diseño) — cubiertos los otros dos, que tenían
  respuesta objetiva sin pedir nada al usuario.
- **"Agregar el morado de Infinitas al botón de hasta abajo de esa
  sección"**: el botón real es `.inf-pill` en el footer
  (`components/layout/Footer.tsx`, `<a className="pill inf-pill">`) — el
  único botón de marca Infinitas que existe hoy, y literalmente el más
  abajo de toda la página (footer). Antes usaba `var(--green)` (verde
  genérico del sitio) con texto `--ink-fixed`; ahora usa el morado de
  marca. **No se reusó `--src-infinitas` directamente**: ese token cambia
  de valor con el tema (`#6b2fbf` claro / `#a875e8` oscuro, pensado para
  texto/bordes legibles contra el fondo de PÁGINA que sí cambia), pero el
  footer es una superficie siempre oscura que nunca se invierte
  (`--ink-fixed`, mismo criterio documentado en `styles/sections.css`) —
  usar el valor de tema oscuro más claro como fondo de botón con texto
  blanco habría quedado con contraste pobre. Se agregó
  `--src-infinitas-fixed` en `tokens.css` (mismo patrón que `--ink-fixed`:
  declarado una vez en `:root`, nunca sobreescrito en las capas de tema
  oscuro) fijado al valor claro (`#6b2fbf`), y el texto pasó de
  `--ink-fixed` a blanco (el morado es oscuro/saturado, no claro como
  `--green`, necesita texto claro para contraste).
- **"Compartir": logos + más opciones + reubicado debajo de los tags**:
  `app/(public)/articulo/page.tsx` — `<ArticleTopics>` (los tags, antes
  llamado así porque es literalmente el índice de temas del artículo) y
  `<ShareRow>` intercambiaron orden; compartir ahora renderiza después.
  `components/article/ShareRow.tsx` — WhatsApp y X ya tenían ícono; se
  agregaron Facebook y LinkedIn (mismo patrón sin SDK, solo URLs de
  share-intent, igual que los dos existentes — no se agregó ninguna cuenta
  ni API key nueva) y un botón de "Copiar enlace" (`navigator.clipboard`,
  con estado local `copied` que muestra "¡Copiado!" con un check por 2s,
  silencioso si el navegador niega el permiso de portapapeles en vez de
  mostrar un error por algo no esencial). Elegidos Facebook (alcance
  amplio en México) y LinkedIn (la audiencia B2B de sports business de
  Playbook) como las dos redes nuevas — es la única parte de este ítem que
  implicó un juicio de implementación en vez de una respuesta puramente
  mecánica; si el usuario quería otras (Telegram, email), decirlo en la
  siguiente sesión.
- **Verificado de punta a punta contra un servidor real** (mismo Postgres
  local + Playwright de las entradas anteriores, con capturas de pantalla
  además esta vez): `getComputedStyle` del `.inf-pill` real confirma
  `rgb(107, 47, 191)` (el morado, no el verde de antes); orden real del
  DOM confirma que `.share-row` aparece después de `.article-topics`
  (`compareDocumentPosition`); los 5 botones de compartir están presentes
  (`WhatsApp`, `Facebook`, `X`, `LinkedIn`, `Copiar enlace`); clic real en
  "Copiar enlace" con permisos de portapapeles otorgados en el navegador
  headless confirma que el texto cambia a "¡Copiado!" Y que el portapapeles
  real contiene la URL canónica del artículo, no solo que el botón cambió
  de texto. Capturas de pantalla del footer y del bloque de compartir
  revisadas visualmente (contraste del texto blanco sobre el morado,
  layout de los 5 botones con wrap).
- **Verificado**: `tsc --noEmit`, `npx eslint .` y `next build`, limpios
  los tres.

### 2026-08-01 — Fase 4: bloque de opinión dinámico, con excepción manual al 5+1

- **Contexto**: siguiendo el mismo criterio de "próximo fix sin decisiones"
  que Fase 3, se saltó Fase 2 (entrenar el skill de tags/portada no es un
  fix de código, es una tarea de evaluación/iteración aparte) y se fue
  directo a Fase 4, que sí tenía una implementación mecánica sin ninguna
  pregunta abierta — la nota de la sesión de planeación ya había
  confirmado que la fórmula de `lib/rank.ts` es reutilizable tal cual.
- **"Que rote según ranking, misma fórmula que el 5+1"**:
  `components/sections/OpinionSection.tsx` — `live` ahora pasa por
  `rankArticles()` (de `lib/rank.ts`, la misma función que ordena el 5+1)
  antes de cortar a `MAX_CARDS`, en vez de quedarse con el orden que
  devolviera la query. Cero fórmula nueva, cero parámetro nuevo.
- **"Por default fuera del 5+1 salvo excepción manual"**: el "por default
  fuera" ya existía desde antes (`NewsGrid.tsx` ya excluía `source ===
  'opinion'` del paquete de noticias). Lo que faltaba era la excepción.
  `components/home/NewsGrid.tsx` — el filtro pasa de `a.source !==
  'opinion'` a `a.source !== 'opinion' || a.featured`. **No se agregó
  ningún campo nuevo**: `featured` es exactamente el mismo booleano que
  `selectHero()`/`featuredBoost()` (`lib/rank.ts`) ya usan como "el editor
  lo marcó a propósito" para forzar un artículo al puesto de hero — acá
  simplemente también desbloquea la ENTRADA al pool para un artículo de
  opinión (uno no marcado sigue sin competir nunca, no solo "compite y
  pierde"). Una vez adentro, compite por rankScore como cualquier otro —
  "puede forzarse" no es "se fuerza incondicionalmente": si su score no es
  competitivo, no gana ningún lugar, tal como debe ser.
- **Verificado de punta a punta contra Postgres local, con datos reales
  insertados a propósito para probar los cuatro comportamientos, no solo
  leyendo el código**: insertadas 3 filas de prueba (`test-op-low-old`
  prioridad 1/vieja, `test-op-high-recent` prioridad 5/reciente,
  `test-op-featured` prioridad 3→5, `featured` true) —
  1. Orden de `OpinionSection` coincide exactamente con el orden esperado
     por rankScore, confirmado dos veces con dos configuraciones de datos
     distintas (una vez con `test-op-featured` en prioridad 3 quedando en
     medio, otra vez subida a prioridad 5/fecha de hoy quedando primera —
     el orden se movió exactamente como predice la fórmula, no una vez
     fija).
  2. Con `test-op-featured` en su configuración más competitiva, apareció
     como HERO real del 5+1 (`.lead-story h1`, leído del DOM, no asumido
     por su sola presencia en el HTML).
  3. Los otros dos artículos de opinión (no `featured`, uno de ellos con
     prioridad 5 igual de alta) **nunca** aparecieron en `.news-grid` en
     ninguna de las corridas — confirma que "opinión" solo entra al pool
     vía la excepción manual, nunca por ranking alto solo.
  4. Puesto `featured = false` de nuevo en la misma fila (vía `psql`
     directo, sin pasar por `saveArticle`) y confirmado que **volvió a
     desaparecer** del 5+1 tras reiniciar `next dev` — el primer intento
     de esta verificación dio un falso "sigue apareciendo" por el cache de
     60s de `unstable_cache` en `lib/data/articles.ts` (un SQL directo no
     dispara `revalidateTag`, a diferencia de `saveArticle` en producción
     real) — no un bug del cambio; anotado acá para que la próxima sesión
     no se confunda con el mismo falso positivo si prueba con SQL directo.
  Filas de prueba borradas al cierre.
- **Verificado**: `tsc --noEmit`, `npx eslint .` y `next build`, limpios
  los tres.

### 2026-08-01 — Fase 0 cerrada de verdad: los 3 scripts corrieron contra producción real

- **Contexto**: el usuario corrigió una suposición equivocada de la
  entrada anterior — este sandbox **sí tiene forma de llegar a la Neon de
  producción**, solo que no por TCP directo (`psql`, `pg` Pool — eso sigue
  bloqueado, confirmado de nuevo). `scripts/publish-newsletter.ts` ya
  resolvía exactamente este problema desde antes: usa
  `@neondatabase/serverless` + `drizzle-orm/neon-http`, el driver HTTP de
  Neon, que sí pasa por el proxy HTTPS de este entorno. Los tres scripts
  de esta fase (`fix-lana-rebrand-content.ts`, `reassign-playbook-tag.ts`,
  y uno nuevo, `fix-testimonial-avatars.ts`) se migraron al mismo driver
  (antes importaban `db` de `lib/db/client.ts`, el Pool de `pg`, TCP-only)
  y **corrieron de verdad contra la Neon real de producción**, no contra
  el Postgres local de las entradas anteriores.
- **`fix-lana-rebrand-content.ts` corrido contra producción**: `--dry-run`
  encontró 4 artículos reales con `publication="La Lana del Mundial"`
  (`lana-pausa-hidratacion-timeout`, `lana-fifa-super-bowl-halftime`,
  `el-futuro-del-mundial-mexico-en-2038`,
  `la-lana-del-deporte-el-deal-que-le-volteo-el-tablero-a-infantino`) más
  el `footer.brandBlurb` de `site_content` — exactamente lo que predecía
  el diagnóstico de la entrada de la mañana. Corrido sin `--dry-run`:
  los 4 quedaron en `"La Lana del Deporte"`, `site_content.version` subió
  de 1 a 2. Re-corrido `--dry-run` después: 0 resultados, confirma que
  quedó aplicado.
- **`reassign-playbook-tag.ts` corrido contra producción**: encontró 5
  artículos reales con `source='playbook'`
  (`atleti-metropolitano-conciertos`, `coi-regreso-ruso-la2028`,
  `mexico-inglaterra-audiencia-record`, `chelsea-strava`,
  `breaking-news-infantino-cancela-plan-de-privatizacion`). Corrido sin
  `--dry-run`: los 5 pasaron a `source='industry-shots'`,
  `publication='Noticias'`. Re-corrido `--dry-run` después: 0 resultados.
- **Nuevo hallazgo verificando producción directamente, antes no
  confirmado**: los 3 testimonios de `site_content.testimonialsSection`
  **no tenían campo `avatar` en absoluto** — no era una ruta rota, el
  campo nunca se llegó a guardar (ni siquiera Adriana lo tiene en el seed
  local, así que dejarla sin foto es correcto, no un hueco). Creado
  `scripts/fix-testimonial-avatars.ts` (mismo patrón que los otros dos:
  driver HTTP de Neon, `--dry-run`, matchea por `name` en vez de índice
  de array porque `site_content` es editable desde el admin y el orden
  podría haber cambiado, nunca pisa un avatar que ya exista). Corrido
  contra producción: Bárbara González Briseño y Juan Pablo Robert
  recibieron sus rutas reales (`/assets/img/testimonial-barbara.jpg`,
  `/assets/img/testimonial-juan.jpg`, los archivos ya están en el repo
  desde el commit `71128cb`). Re-corrido `--dry-run` después: "nada que
  cambiar", confirma que quedó aplicado.
- **También verificado de paso, sin necesidad de arreglar nada**: la
  portada de "La Lana del Deporte" en `productsSection` (el ítem 3
  original de Fase 0) **ya estaba bien en producción**
  (`image: "/assets/img/lana-banner.jpg"`, `imageAlt: "La Lana del
  Deporte"`) — no hacía falta ningún fix ahí. El `url` de esa tarjeta
  sigue apuntando al slug viejo de Substack
  (`la-lana-del-mundial-por-que-fifa`) a propósito, mismo criterio que el
  propio commit del rebrand documentó: los slugs de Substack ya guardados
  no se tocan para no romper enlaces existentes.
- **Con esto, Fase 0 queda cerrada del todo** — los 4 ítems originales
  tienen fix de código Y de datos de producción confirmados. Nada
  pendiente de esta fase salvo que el usuario lo confirme visualmente en
  el sitio real.
- **Verificado**: `tsc --noEmit`, `npx eslint` sobre los 3 scripts y
  `next build`, limpios los tres. Los tres scripts corridos con
  `--dry-run` antes y después de cada escritura real, no solo una vez.

### 2026-08-01 — Fase 3: glitch de Windows (mecanismo real encontrado) y color del buscador

- **Glitch del header en Windows — causa real encontrada, no la que se
  sospechaba primero.** El usuario aclaró el síntoma real (sin video, por
  texto): "el logo se hacía chico y grande, probablemente porque
  Infinitas solo tiene 2 [artículos] en el 5+1". Investigado a fondo antes
  de tocar nada:
  1. Confirmado en `header.topbar.is-scrolled .brand img{height:42px}`
     (`styles/header.css`) que SÍ existe un tratamiento que encoge el logo
     — así que "el logo cambia de tamaño" tiene una causa real en el CSS,
     no es percepción.
  2. Primera hipótesis (descartada tras medir): que filtrar a Infinitas
     encoge la altura de la página lo suficiente como para que el scroll
     se recorte por debajo del umbral de 4px que activa `.is-scrolled`
     (`components/layout/HeaderScrollEffect.tsx`, GSAP ScrollTrigger).
     Reproducido con Playwright en Postgres local: el recorte de scroll sí
     ocurre (de 1386px a 1098px al filtrar), pero **nunca cruza el umbral
     de 4px** en un escenario realista — el navegador solo recorta el
     scroll a la nueva altura máxima, no lo manda a 0 (un primer intento
     de la prueba SÍ vio un salto a 0px, pero era un artefacto del propio
     Playwright — `.click()` hace scroll-into-view automático antes de
     clickear — no algo que le pase a un usuario real; confirmado
     repitiendo la prueba con un `.click()` de DOM real, sin ese
     comportamiento).
  3. **Causa real, confirmada con datos medidos**: `/archivo` con todas
     las fuentes tiene `scrollHeight: 2469` (con scroll) en un viewport de
     1200px; `/archivo?source=infinitas` (2 artículos reales en
     producción) tiene `scrollHeight: 1200`, exactamente igual al
     viewport — **cruza de "con scroll" a "sin scroll"**. En Windows
     (Chrome/Firefox/Edge reservan espacio para la scrollbar vertical por
     default, a diferencia de las scrollbars superpuestas de macOS/iOS),
     cruzar ese umbral hace que la scrollbar aparezca o desaparezca, lo
     que reacomoda el ancho disponible de toda la página unos 15-17px —
     el header, con logo en un layout flex, se redibuja con ese ancho
     nuevo. Esto es exactamente el tipo de bug conocido como "layout
     shift por scrollbar", específico de sistemas con scrollbar clásica
     (Windows), invisible en macOS (donde probablemente se probó esto
     antes) y no relacionado con `.is-scrolled`/ScrollTrigger en absoluto
     — la pista del usuario ("Infinitas solo tiene 2") apuntaba al
     síntoma correcto (contenido corto) pero el mecanismo real es el
     reflow de la scrollbar, no el shrink-on-scroll del header.
  - **Fix**: `html{scrollbar-gutter:stable;}` en `styles/reset.css` —
     reserva el espacio de la scrollbar siempre, haya o no contenido para
     hacer scroll, así que cruzar ese umbral nunca vuelve a cambiar el
     ancho disponible de la página. Una sola propiedad CSS, soporte amplio
     de navegadores modernos, sin riesgo de romper nada más.
  - **No se pudo confirmar visualmente el efecto exacto en este sandbox**:
    Chromium headless en Linux no reserva/libera espacio de scrollbar de
    la misma forma que un Windows real (`scrollbarWidth` midió 0 en ambos
    casos en las pruebas), así que no hay captura de "antes vs después"
    real del glitch — sí se confirmó con certeza la condición que lo
    dispara (`scrollHeight` cruzando el viewport al filtrar por Infinitas
    en producción real, mismos 2 artículos que el usuario mencionó).
    **Pedirle al usuario que confirme en Windows real** después del
    siguiente deploy en vez de asumir que esto lo cierra del todo.
- **Color del pill del buscador**: el usuario aclaró la queja ("se ve
  viejo, no pulido") en vez de dejarlo bloqueado. Causa encontrada:
  `.nav-search` (`styles/header.css`) era el único pill/chip de todo el
  sitio con un fondo RELLENO (`background:var(--rule)`, un gris/beige
  plano) — cada otro pill del sistema de diseño (`.filter-btn`,
  `.share-btn`) usa el mismo lenguaje "outline": fondo `--paper`, borde
  fino `--rule` en reposo, borde `--ink` en hover. Corregido a ese mismo
  patrón (fondo `--paper`, borde `1.5px solid var(--rule)`, hover oscurece
  el borde) — el estado de foco (borde ink + glow verde) ya estaba bien y
  no se tocó. Confirmado visualmente con capturas de Playwright: pasó de
  un óvalo gris plano a un pill con borde fino sobre fondo claro,
  consistente con el resto del header.
- **Verificado**: `tsc --noEmit`, `npx eslint .` y `next build`, limpios
  los tres.

### 2026-08-01 — "Tips" era un typo, sin acción

El usuario confirmó que "Tips" (Fase 1, ítem 4) fue un error de tipeo, no
un módulo real pendiente de construir. Cierra la pregunta dejada en la
entrada de Fase 1 — no hace falta preguntar de nuevo ni construir nada por
ese nombre.

### 2026-08-01 — Copy de la tarjeta "La Lana del Deporte" (Productos editoriales)

- **Pedido del usuario**: reemplazar la descripción de esa tarjeta por "Un
  espacio semanal para meternos a fondo en el dinero, el poder y las
  decisiones que mueven al deporte fuera de la cancha", con permiso
  explícito para acortarla si no entraba.
- **Se acortó, a propósito**: el texto del usuario mide ~123 caracteres,
  más largo que las otras 3 tarjetas del mismo grid (86-110 caracteres,
  todas taglines cortas y declarativas, no oraciones de apertura). Se
  publicó tal cual: **"El dinero, el poder y las decisiones que mueven al
  deporte fuera de la cancha."** (80 caracteres) — se recortó únicamente
  el arranque ("Un espacio semanal para meternos a fondo en"), que además
  duplicaba el campo `meta` de la misma tarjeta (ya dice "Viernes"); el
  resto de la frase del usuario quedó intacta, palabra por palabra.
- **De paso, corrigió un problema de fondo que no era el pedido pero
  estaba ahí**: el texto que reemplazó en `content.json` todavía decía
  "...alrededor del Mundial 2026" (el mismo tipo de framing viejo que
  Fase 0 encontró en otros lugares, solo que este nunca usaba la frase
  exacta "La Lana del Mundial" así que el script de esa fase no lo tocó).
  El copy nuevo no menciona "Mundial" en absoluto.
- **Aplicado en los dos lugares que hace falta, mismo patrón que el resto
  de la sesión**: `content.json` (semilla local) editado directo, y
  `scripts/update-la-lana-description.ts` (nuevo, mismo driver HTTP de
  Neon, `--dry-run` primero) corrido contra la Neon real de producción —
  el valor que había ahí en verdad era distinto al de la semilla local
  ("Deep Dives sobre el negocio del Mundial 2026.", confirma que
  producción y `content.json` ya habían divergido, esperable porque
  `site_content` se edita desde el admin). Confirmado con un segundo
  `--dry-run` después: "ya coincide, nada que cambiar".
- **Verificado visualmente, no solo que el string cambió**: Postgres local
  re-sembrado con el `content.json` nuevo, `next dev` real, captura de
  Playwright de la tarjeta completa — el texto entra en 3 líneas sin
  desbordar el `.product-copy`, se ve consistente con el resto del grid.
- **Verificado**: `tsc --noEmit`, `npx eslint` sobre el script nuevo, y
  `next build`, limpios los tres.

### 2026-08-02 — Fase 2 completa (skill de tags/portada) + Fase 6 casi completa (legal)

Sesión larga, sin decisiones de producto pendientes: se avanzó todo lo que
no dependía de que el usuario eligiera algo (Fase 1 ítem 5 y Fase 5 siguen
bloqueadas por eso, no se tocaron).

- **Fase 2, completa** (ver su propia sección arriba para el detalle):
  `publish-newsletter/SKILL.md` corregido para tags multi-valor por nivel
  y portada de opinión desde Substack en vez de búsqueda externa; rama
  `Opinión`/`opinion` agregada al mapeo publication/source, que antes no
  existía. Backfill aplicado contra la Neon real (driver HTTP, mismo
  patrón que sesiones anteriores): 3 artículos de Liga MX + `Fútbol`, 1
  artículo + `Gobernanza y Regulación`.
- **Fase 6, ítem 1 (argentinismos): completo.** Voseo corregido en
  `/terminos` y `/privacidad` (la entrada del 2026-07-23 que decía esto ya
  estaba resuelto solo cubría otros 9 archivos, no estas dos páginas
  legales — confirmado con grep antes y después).
- **Fase 6, ítem 2 (compliance 100%): checklist definido, casi todo
  cerrado**, ver el detalle completo en la sección de Fase 6 arriba. Dos
  gaps reales encontrados y corregidos (nadie los había pedido
  explícitamente, salieron de auditar contra LFPDPPP + buenas prácticas):
  no había forma de revisar la elección de cookies de publicidad después
  del primer aviso (ahora hay un link "Preferencias de cookies" en el
  footer), y no había cláusula de menores de edad en el aviso de
  privacidad (agregada). Lo único que queda para el 100%:
  `[DOMICILIO FISCAL]` en `/privacidad` y `[JURISDICCIÓN]` en `/terminos`
  son placeholders literales que necesitan un dato de negocio real — no
  se pueden inventar desde código, es lo único de esta fase que sigue
  necesitando que el usuario lo provea.
- **Verificado**: `tsc --noEmit` limpio. No se corrió `next build`/
  Playwright esta sesión (cambios de texto/copy y de un skill markdown,
  sin superficie visual nueva más allá del link del footer, que sí quedó
  cubierto por el `tsc` limpio + revisión manual del JSX).
- **Pendiente para la siguiente sesión**: si el usuario quiere Fase 6 al
  100% de verdad, pedirle el domicilio fiscal real y la jurisdicción antes
  de tocar esos dos placeholders. Fuera de eso, lo único que queda en el
  roadmap activo son Fase 1 ítem 5 y Fase 5 completa, ambas bloqueadas en
  una decisión de producto, no en código.

### 2026-08-04 — Auditoría pre-lanzamiento completa: 15 defectos reales encontrados y corregidos

Sesión en `claude/playbook-pre-launch-audit-fu1bzg`. Último checkpoint
antes de abrir el sitio al público. A diferencia de la pasada de regresión
de la Fase 6 (2026-07-22), que cerró con "cero bugs nuevos", esta sesión
encontró **15 defectos reales**, casi todos por *ejercitar la app corriendo*
en vez de leer código: navegador real con Playwright, Postgres real,
`next build` + `next start` reales, y medición de estilos computados en vez
de confiar en la cascada CSS.

**Infraestructura de verificación (releer antes de asumir límites):**
Postgres local + `next dev`/`next start` como siempre, más un hallazgo
nuevo que cambia bastante lo que se puede verificar acá: **Chromium no
puede salir por el proxy del sandbox (CONNECT resetea), pero el `fetch` de
Node sí con `NODE_USE_ENV_PROXY=1`**. Interceptando las requests externas
de Playwright y resolviéndolas con Node, las fotos editoriales reales, los
embeds de YouTube y los links a Substack cargan de verdad — es decir, las
capturas de pantalla por fin muestran el sitio como lo ve un lector. Todas
las entradas anteriores que dicen "no se pudo verificar por la política de
red" quedan parcialmente superadas. Documentado en
`.claude/skills/verify/SKILL.md`, que además se reescribió completo: seguía
describiendo el sitio estático pre-migración (`api/*.js`, `articulo.html`,
"no hay package.json"), gap que el propio HANDOFF venía anotando desde el
2026-08-01.

**Trampa de verificación encontrada y documentada** (costó tiempo real
antes de identificarla): una captura `fullPage` tomada después de un scroll
programático rápido que le gana a la hidratación muestra secciones enteras
en blanco, porque el `IntersectionObserver` de `ScrollReveal` todavía no
existe cuando el scroll pasa por esos elementos. **No es un bug del sitio**
— se comprobó que con scroll a velocidad humana los 34 elementos `.reveal`
se revelan correctamente en 390/1024/1440px, y también después de un salto
pre-hidratación. Pero produce capturas que parecen mostrar un bug grave.

#### Defectos corregidos

**1. Cualquier URL que no matcheaba ninguna ruta caía en el 404 nativo de
Next** — texto en inglés sobre fondo blanco, sin header, sin footer, sin
buscador, sin ninguna salida. Confirmado con `curl` antes de tocar nada:
solo los `notFound()` disparados *desde adentro* del grupo `(public)`
llegaban a la página con marca. Corregido con
`app/(public)/[...slug]/page.tsx`, que arrastra las URLs no matcheadas
hacia adentro de ese grupo (así heredan Header/Footer reales), más
`app/not-found.tsx` como respaldo. Misma clase de bug que los `error.tsx`
del 2026-07-21: el código correcto existía, simplemente no era alcanzable
desde donde caía la falla.

**2. Sin imagen social en ninguna ruta salvo `/articulo`.** `twitter:card`
es `summary_large_image`, así que la portada — la URL que la gente pega
cuando un sitio lanza — se compartía como un link de texto pelado. Se
agregó `public/assets/img/og-default.png` (1200×630, generado con el
Anton/Inter reales del sitio) como default de todo el sitio, y también como
fallback de artículos sin foto de portada, donde antes se usaba el wordmark
de 180×44 que las redes rechazan por tamaño mínimo. **Además**: la portada
no tenía `canonical` en absoluto (y hay tres hostnames sirviéndola:
playbook.la, www.playbook.la y el `*.vercel.app` del proyecto), y se
confirmó que Next **no** hace merge profundo de `openGraph` entre segmentos
— una página que declara `openGraph` pisa el objeto entero del layout, así
que `/articulo` venía perdiendo `og:site_name` y `og:locale`. `lib/og-image.ts`
centraliza los campos compartidos.

**3. El header no entraba a 320px de ancho.** Medido: la fila necesitaba
346px de contenido en una caja de 305px (320 menos los 15px que reserva
`scrollbar-gutter:stable`), con el botón de hamburguesa — el único acceso a
la navegación en un teléfono — en x=278-322, o sea recortado, y sin poder
scrollearlo a la vista porque `html{overflow-x:clip}`. Nueva capa
`@media(max-width:400px)` en `responsive.css`.

**4. `/archivo`, `/tema` y `/autor` no tenían `<h1>`**: su título de página
era un `<h2>` sin nada arriba. Promovidos a `<h1>` (con
`.section-head h1` en `components.css` para conservar la tipografía).

**5. El formulario de newsletter nunca suscribió a nadie.** Los forms
mandan el correo por GET a la raíz de la publicación de Substack, que
ignora el `?email=`. Verificado contra la publicación real, no asumido:
`/?email=…` renderiza la caja de suscripción **vacía**, `/subscribe?email=…`
la renderiza **con el correo puesto**. O sea: el lector escribía su correo,
leía "¡Listo! Revisa tu correo.", aterrizaba en un formulario vacío, y no
quedaba suscrito ni recibía nada. `lib/newsletter-url.ts` normaliza el
destino para todos los forms de una sola vez, y la copy dice lo que
realmente pasa (te llevamos a Substack a confirmar) tanto en código como en
el campo del CMS — `scripts/fix-newsletter-success-copy.ts`, **corrido
contra la Neon de producción**, con `--dry-run` antes y después.

**6. Registrarse desde el muro dejaba al lector en la portada**, no en el
artículo que estaba tratando de leer. `EmailWall` pasaba la URL canónica
absoluta como `redirectTo` de Auth.js, y Auth.js descarta cualquier
redirect cuyo origen no coincida con el de la request. Producción hoy
coincide por casualidad; todo preview deploy, el `*.vercel.app` del
proyecto (que sirve el sitio y es alcanzable) y el dev local, no. Ahora es
una ruta relativa.

**7. Con `AUTH_GOOGLE_ID` sin configurar, "Continuar con Google" mandaba al
lector a Google con `client_id=undefined`** y una pantalla de error en
inglés ("Access blocked … Error 401: invalid_client"), fuera del sitio y
sin vuelta. Este proyecto ya mandó a producción tres variables de entorno
con el nombre mal escrito (ver 2026-07-21), así que el botón ahora solo se
renderiza si Google está realmente configurado, y correo+contraseña se
despliega expandido como único camino cuando no lo está
(`lib/auth-providers.ts`).

**8. Todas las tarjetas `.reveal` del preview en vivo del admin computaban
`opacity: 0`** — el hero y las 5 filas de noticias de la pestaña Artículos
eran cajas en blanco. `LivePreview` las revelaba agregando `.is-visible`,
lo cual dejó de hacer algo cuando `ScrollReveal` pasó a GSAP y esa clase
quedó como puro marcador de bookkeeping. Resuelto en CSS
(`.admin-preview-page .reveal`), donde no se puede volver a desacoplar de
una implementación de animación.

**9 y 10. Dos bugs de especificidad CSS, vivos en TODO viewport menor a
1180px — o sea todo teléfono y todo iPad**, encontrados midiendo estilos
computados:
- El CTA "Suscríbete gratis" del drawer se veía como una pastilla negra en
  blanco: `.nav-links a` (`header.css`) fija `color:var(--ink)` con
  especificidad (0,1,1), que le gana a `.btn` (0,1,0), así que el botón
  conservaba el fondo `--ink-fixed` de `.btn` pero tomaba el color de texto
  del nav. Medido: color y fondo ambos `rgb(10,10,10)`, contraste 1:1.
- **No existía el toggle de tema en absoluto por debajo de 1180px.** La
  regla base que oculta la copia del drawer se escribe
  `.theme-toggle.theme-toggle-drawer` (0,2,0) a propósito, para ganarle a
  `.theme-toggle{display:flex}`; pero la media query que lo vuelve a
  encender usaba la clase sola (0,1,0) y perdía. Como la copia de
  escritorio también está oculta ahí, **el modo oscuro era inalcanzable en
  móvil y tablet**. Verificado después del fix clickeando el control real a
  390 y 1024px, en ambos sentidos, sobreviviendo un reload.

**11. El foco de teclado se escapaba del drawer abierto.** Con el drawer
abierto, `.nav-overlay` cubre la página con `pointer-events:auto`, así que
un mouse no llega a nada de atrás — pero tabular después del último ítem
del drawer caía en el buscador del header y en los filtros de la portada,
atenuados y no clickeables. Ahora el Tab cicla dentro del panel.

**12. XSS almacenado en el sanitizador del webhook.** `stripHtml` de
`app/api/update-articles` quitaba tags y *después* decodificaba entidades,
o sea que el paso de decode reconstruía exactamente el markup que el paso
de strip acababa de sacar. Demostrado contra la función real antes de
tocarla: `"&lt;script&gt;alert(document.cookie)&lt;/script&gt;"` salía como
`"<script>alert(document.cookie)</script>"`. Ese valor se guarda en
`articles.teaser`, y la página de artículo renderiza `teaser` con
`dangerouslySetInnerHTML` cuando "parece HTML" — o sea que un ítem del
webhook se convertía en HTML almacenado en una página pública. Ahora
decodifica primero, strippea después, y repite hasta estabilizar (una sola
pasada dejaba pasar entrada doble-codificada). De paso se arregló una
pérdida de datos del patrón viejo: `<[^>]*>` era tan goloso que
`"Precio &lt; 100 y algo &gt; 50"` salía como `"Precio 50"`; el patrón
nuevo solo matchea formas de tag reales.
**Alcance honesto**: llegar a esto requiere un `PLAYBOOK_SECRET` válido, así
que era superficie de integración autenticada, no anónima. Igual es un bug:
una función cuyo único trabajo es "dejá esto en texto plano" no debería
poder emitir markup, la llame quien la llame.

**13. Inyección en el bloque JSON-LD.** Se emitía con `JSON.stringify`
pelado, que no escapa nada que le importe a un parser de HTML: un título
con `</script>` cierra el bloque antes de tiempo y todo lo que sigue se
parsea como markup. `lib/json-ld.ts` escapa `<`, `>` y U+2028/9. Probado
insertando un artículo hostil real: el payload no ejecuta, el JSON sigue
parseando y el headline queda intacto. Fila de prueba borrada.

**14. Errores factuales en las páginas legales** (todo verificable contra
el código, nada inventado):
- `/terminos` decía que el lector se registra "con tu correo electrónico
  usando un enlace de acceso" — el magic link de Resend, retirado hace
  meses. Ahora dice Google o correo+contraseña, que es lo que hace el
  código y lo que la sección de abajo ya decía (el documento se
  contradecía a sí mismo).
- `/privacidad` decía "tres tipos de cookies" arriba de una lista de
  cuatro.
- Las dos fechas de "última actualización" eran anteriores a cambios
  reales del texto — algo que el propio aviso de privacidad promete
  mantener al día.
- **Dos terceros sin declarar**: Substack (los formularios de newsletter le
  entregan el correo del lector) y Google Sheets (`lib/google-sheets.ts`
  copia correo, nombre, método de alta y conteo de lecturas de cada lector
  a una hoja). El HANDOFF ya anticipaba lo primero como pendiente; lo
  segundo se construyó el 2026-08-02 sin actualizar el aviso.

**15. Peso de imágenes**: 3.2 MB de portadas committeadas bajaron a 0.9 MB.
Una portada de artículo era un **PNG de 1.8 MB** (1920×1080, servido tal
cual: las imágenes editoriales usan `<img>` plano a propósito, ver
2026-07-21), re-encodeada a 477 KB; tres JPEG sobredimensionados (uno de
2559px de ancho para una columna de 760px) redimensionados a su tamaño real
de display; y un huérfano borrado tras confirmar cero referencias en
código, docs, `site_content`, `content_revisions` y `articles` de cualquier
status. **No se cambió ninguna extensión de archivo a propósito**: pasar el
PNG a JPEG bajaría a 177 KB pero obliga a reescribir el `image_url` en
producción, y entre esa escritura y el deploy la portada quedaría rota.
Queda anotado como mejora futura, a hacer después de un deploy.

#### Verificado (y qué no)

- **Suite final: 32/32 checks contra `next build` + `next start` reales**
  (no `next dev`), Postgres real, cero violaciones de CSP: las 10 rutas
  públicas en 200, 404 con marca en una URL inexistente, muro en la 4ª
  lectura sin filtrar el cuerpo al DOM, alta con contraseña devolviendo al
  artículo correcto, búsqueda sin acentos, filtros de archivo, form de
  newsletter apuntando a `/subscribe`, drawer móvil (contraste del CTA,
  toggle de tema funcionando), 320px sin scroll horizontal con la
  hamburguesa completa en pantalla, canonical + og:image en la portada,
  sitemap/feed/robots en 200, y las rutas de API devolviendo 401 sin sesión.
- **Flujo de lector completo contra Postgres real**: 3 gratis → muro en la
  4ª → alta con correo+contraseña → releer no gasta cupo → `/cuenta` con
  los datos correctos → export con `Content-Disposition` real → salir →
  volver a entrar con la misma contraseña → contraseña incorrecta
  rechazada → cuenta Google-only rechazada con el mensaje esperado.
- **Admin completo**: guard de `/admin/dashboard`, `/admin/analytics` y
  `/admin/guia` redirigiendo a `/admin` sin sesión; login fallido y
  exitoso; **las 14 pestañas cargan sin un solo error de consola**; panel de
  analítica degradando correctamente sin credenciales; **flujo de
  invitación de editor de punta a punta con Resend sin configurar**
  (invitación creada, enlace copiable, activación, enlace de un solo uso
  rechazado al reusarlo, login real de la editora nueva).
- **Barrido responsive**: capturas de página completa de portada, artículo
  y archivo a 390/768/1024/1194/1440px en claro y oscuro — cero scroll
  horizontal, cero imágenes rotas, cero errores de consola propios de la
  app (los que aparecen son telemetría interna de YouTube y hosts que la
  política de red del sandbox bloquea).
- **Enlaces e imágenes reales**: crawl de 120 links internos (todos
  resuelven) y 24 externos; los 2 "rotos" eran 429 de YouTube por
  rate-limit del proxy compartido — confirmados vivos vía oEmbed. Y contra
  la **base de producción real**: las 72 portadas de artículos publicados y
  las 14 URLs de imagen de `site_content` resuelven todas como imágenes.
- **Accesibilidad**: cada página pública tiene exactamente un `<h1>`, cero
  imágenes sin `alt`, cero botones/links/inputs sin nombre accesible,
  `lang="es"`, un solo `<main>`, skip-link primero en el orden de tabulación
  con foco visible, drawer con Escape que devuelve el foco al botón.
- **Degradación agraciada**: toda la auditoría corrió con **GA4, AdSense,
  Vercel Blob, Resend, Google Sheets y Vercel Analytics sin configurar** —
  esa es la evidencia más fuerte de que ninguna de las seis puede romper
  una página ni un flujo. Confirmado además que `ads.txt` responde 200
  vacío, y que no se inyecta gtag, adsbygoogle ni Funding Choices.
- `tsc --noEmit`, `npx eslint .` y `next build`: limpios los tres.

**No verificable desde acá, sin cambio de código pendiente**: el
round-trip real de Google OAuth (hace falta un client id real), envío real
por Resend, subida real a Vercel Blob, datos reales de GA4/Vercel
Analytics, render real de AdSense, y la escritura real a Google Sheets.
Mismo criterio que el resto de este archivo: se dice, no se insinúa que se
probó.

**Gap conocido, no corregido a propósito**: en `/archivo`, `/tema` y
`/autor` el orden de encabezados salta de `h1` a `h3` (las filas de
artículo son `h3`). Saltar un nivel es una recomendación de buenas
prácticas, no un incumplimiento de WCAG, y cerrarlo obliga a renombrar tags
en cuatro componentes compartidos y sus selectores CSS — no es un cambio
que valga la pena la víspera del lanzamiento. Queda anotado, no escondido.

**Otro gap conocido**: el panel de preview del admin renderiza el layout
del sitio dentro de una columna de ~660px, y como las media queries del
sitio son por viewport (no por contenedor), no colapsa a su versión móvil —
los titulares se parten en pocas palabras por línea. Ahora al menos se ve
contenido (antes eran cajas en blanco, ver punto 8); arreglarlo bien es
una tarea de diseño del CMS, no un fix de una línea.

### 2026-08-05 — Fase 1 ítem 5: hubs de producto ("carpetas internas") + módulo "Lo que sigue importando"

Sesión sobre los briefs de diseño recibidos del usuario (2026-08-05): un
módulo de curaduría en la portada y cuatro sub-sitios de producto, cada
uno construido desde la identidad visual real de su tarjeta de "Productos
editoriales", no una plantilla re-pintada. Rama
`claude/playbook-portal-design-o0vts1`.

**Lo que se construyó:**

- **Portada — "Lo que sigue importando"**
  (`components/home/StillMattersSection.tsx`): hasta 4 historias con
  estrellas altas (★≥4) o `featured` dentro de una ventana rodante de 12
  días (el brief propone 10–14 — **confirmar con editorial**), excluyendo
  lo que la rotación 1+5 ya muestra en su vista default (misma derivación
  de pool que NewsGrid, comentado en el componente). Kicker editorial
  "Sigue siendo noticia", tarjetas de regla superior fina (no ficha
  completa), directamente debajo del paquete de noticias. Colapsa a nada
  en semanas sin candidatos.
- **`/la-lana` — "El Expediente"**: superficie oscura fija con grano CSS,
  masthead stencil con marca naranja, investigaciones numeradas por caso
  (001, 002… cronológico, calculado, sin cambio de schema), sello de
  estado (Caso abierto ≤45 días o `featured` / Archivado), héroe con la
  cifra más grande de la historia extraída del copy
  (`extractPullFigure`), archivo como fila de expedientes, foto con borde
  de papel rasgado. El motivo de la pizarra de salidas es un componente
  interactivo real (`components/products/MoneyTrail.tsx`): una ruta SVG
  que se dibuja al hacer scroll (GSAP ScrollTrigger, ya vendoreado).
  **Convención de autoría**: un párrafo "Ruta del dinero: México → Zúrich
  → Riad" en el cuerpo (TipTap o texto plano) se convierte en la ruta
  animada dibujada con el scroll del lector; los blockquotes de artículos
  la-lana llevan el tratamiento de recorte de papel.
- **`/industry-shots` — "El Trago"**: lista vertical densa (velocidad de
  escaneo, no grid de revista), acento azul sobre grunge oscuro, badge de
  cadencia con el día real de cada edición (Martes/Jueves resaltados),
  lectura medida en shots (1 shot ≈ 3 min, `lib/product-hubs.ts`). En el
  artículo: indicador de progreso de lectura como caballito que se llena
  (`ShotProgress.tsx`, medido contra `.article-body`), y la convención
  "La opinión de Playbook: …" convierte ese párrafo en un callout
  cercado con tapita de botella — la línea hecho/opinión explícita.
  `splitAfterParagraph` ahora trackea `<aside>` para que el ad split no
  corte el callout.
- **`/futbol-business-review` — "La Sala de Juntas"**: negro fijo, tira
  de partner sticky (Interticket × Playbook) que viaja con el scroll,
  flecha roja como indicador direccional en todo el hub, banda de números
  desde `statsSection` del CMS (datos reales ya mantenidos, no
  indicadores inventados). No existe `source` propio todavía (decisión
  previa, ver Fase 1): el hub consulta `futbol-business-review` y
  mientras tanto muestra la "minuta" con CTA a Substack — el día que
  editorial cree el source, las ediciones aparecen sin tocar código. El
  toggle ES/EN del brief NO se construyó a propósito: es una decisión
  estructural para discutir con el equipo antes de construir.
- **`/infinitas` — "El Marcador"**: violeta plano, cero grunge (el único
  de los cuatro, a propósito), masthead de bloque plano con el wordmark
  en minúsculas, y el marcador de métricas de negocio reales que cuentan
  hacia arriba al entrar en vista (`Scoreboard.tsx`; cifras públicas
  atribuidas — Deloitte/FIFA/FC Barcelona — congeladas al 2026-08-05,
  **refrescar con el equipo de Infinitas cada temporada** o cablear al
  CMS). Fotos con duotono violeta puro CSS (`.inf-duotone`).
- **Navegación**: las 4 tarjetas de Productos editoriales apuntan a los
  hubs (content.json para el seed; producción vía
  `scripts/point-products-at-hubs.ts`, mismo patrón dry-run que
  update-la-lana-description). El chip de publicación del artículo ahora
  enlaza al hub de su producto. Hubs en el sitemap. Registro central en
  `lib/product-hubs.ts`; CSS todo en `styles/product-hubs.css`
  (superficies de color fijo, mismo criterio --ink-fixed del footer).

**Cómo se verificó** (app corriendo, no solo compilando): Postgres local
seedeado, fechas locales desplazadas +19 días para ejercitar la ventana
del módulo de portada, párrafos de prueba inyectados para las dos
convenciones de autoría. Playwright a 1366px y 390px sobre portada, los 4
hubs y 2 artículos (uno la-lana con ruta, uno industry-shots con
opinión): 0 anchors anidados, 0 overflow horizontal, 0 errores de consola
nuevos, capturas revisadas a ojo. Dos defectos reales encontrados y
corregidos así: (1) `<footer class="hub-foot">` heredaba el estilo global
`footer{}` de sections.css — banda negra en medio del hub de Infinitas;
ahora son `<div>`; (2) en 390px las filas de expedientes partían el
título en una palabra por línea — ahora grid con el título a ancho
completo. `tsc`, `eslint` y `next build` limpios (con y sin `.env.local`).

**Pendiente:**
- Correr `scripts/point-products-at-hubs.ts` contra producción (con
  `--dry-run` primero) — hasta entonces las tarjetas de producción siguen
  apuntando a `/archivo?source=…`/Substack.
- Editorial: confirmar ventana (10–14 días) del módulo de portada,
  refrescar las cifras del Marcador cada temporada, y decidir el toggle
  ES/EN de TFBR antes de construirlo.
- Las convenciones "Ruta del dinero:" y "La opinión de Playbook:" están
  documentadas en `lib/product-hubs.ts` — vale agregarlas al skill
  publish-newsletter para que los artículos nuevos las traigan puestas.

### 2026-08-05 — Hubs, segunda pasada: feedback del usuario sobre el preview real

El usuario revisó el preview de Vercel (capturas de iPad, tema oscuro) y
pidió cambios producto por producto. Todo en la misma rama
`claude/playbook-portal-design-o0vts1`.

- **Noticias (antes /industry-shots)**: la página ya NO se llama Industry
  Shots — masthead, metadata y registro dicen "Noticias", la ruta es
  `/noticias` y `/industry-shots` hace 301 (next.config.ts). El acento
  azul se reemplazó por el verde Playbook ("¿por qué hay colores
  distintos?" — el azul era ajeno a la marca; el arte de la tarjeta usa
  verde). Los badges de día perdieron el tratamiento de dos colores (con
  el calendario real de publicación, los días fuera de cadencia se veían
  como colores aleatorios) — ahora un solo estilo neutro. Más dinamismo y
  jerarquía: la última edición abre en grande (bloque destacado con
  excerpt) y el tamaño del titular de cada fila escala con el `priority`
  editorial (★5 → Anton grande, ★4 → bold intermedio, resto compacto).
- **La Lana del Deporte**: mismo concepto (expedientes, sellos, ruta del
  dinero), formato y paleta nuevos — fuera el grunge oscuro/naranja, ahora
  es un dossier literal sobre los colores de la casa: papel, tinta, verde
  Playbook (marcador en el título, subrayado de la cifra, sello "caso
  abierto") y el dorado la-lana para lo secundario. Fólders manila con
  pestaña (número de caso + fecha), anexo fotográfico tipo impresión
  matte, archivero en grid de fólders. Superficie clara FIJA (un fólder es
  papel en cualquier tema). El fallback "Nº 00X" del pull-figure se
  eliminó (duplicaba la pestaña); sin cifra, abre el título.
- **Infinitas — legibilidad**: bug real encontrado gracias a la captura
  del usuario: las clases `.inf-grid`/`.inf-card` del hub COLISIONABAN con
  las del bloque Infinitas de la portada (sections.css, tarjetas oscuras
  #111) — títulos tinta-oscura sobre caja oscura, ilegible. Todas las
  clases del hub ahora son `infhub-*` (no reutilizar el prefijo `inf-`).
  Además: texto secundario más oscuro (.78), tarjetas blancas con borde
  sobre el papel pálido, tipografías un punto más grandes.
- **Links de Productos editoriales**: `scripts/point-products-at-hubs.ts`
  corrido contra la Neon de producción (dry-run primero) — las 4 tarjetas
  de la portada real ya apuntan a /noticias, /la-lana,
  /futbol-business-review e /infinitas.

**Verificación**: Playwright contra la app corriendo (Postgres local), a
1366px y 390px, tema claro y OSCURO (el usuario navega en oscuro — la
colisión de Infinitas solo se veía así): 0 anchors anidados, 0 overflow,
0 errores de consola; capturas revisadas a ojo. `tsc`/`eslint`/`next
build` limpios. El 301 de /industry-shots verificado con curl (308 en
dev es el equivalente de Next).

### 2026-08-05 — Hubs, tercera pasada: el pipeline de publicación mantiene los hubs solo

Pregunta del usuario: "si subo un artículo nuevo de La Lana ahora, ¿cómo
se integra?" Respuesta corta: los hubs YA se actualizan solos (consultan
la DB por `source` en cada request, caché de 60s) — un artículo publicado
con `source: 'la-lana'` se vuelve el Expediente N+1 con sello "caso
abierto", cifra destacada y todo, sin pasos manuales. Lo que NO era
automático eran los dispositivos del cuerpo, y ahí había un bug real:

- **El callout de opinión nunca disparaba con contenido real.** El
  detector buscaba "La opinión de Playbook:" pero el pipeline escribe
  `**Opinión de Playbook:**` (sin "La" — verificado contra el corpus: 10
  artículos vivos, todos esa forma exacta). Regex corregida
  (`lib/product-hubs.ts`), tolera ambas variantes, y el callout ahora
  aplica a TODOS los sources de producto (Noticias/La Lana/Infinitas/TFBR
  comparten el estándar de 4 párrafos), tinteado por producto (verde
  default, violeta Infinitas, rojo TFBR). Resultado: todo el catálogo
  existente gana el callout retroactivamente, sin re-editar nada —
  verificado con Playwright sobre dos artículos reales del seed.
- **El skill `publish-newsletter` ahora conoce los hubs** (sección nueva
  "The product hub pages read the body"): el lead-in `**Opinión de
  Playbook:**` es contrato de UI (no reformular); la convención "Ruta del
  dinero: A → B → C" para La Lana (cuándo sí, cuándo no, máximo una);
  la cifra más grande del caso debe ir textual en title/excerpt para el
  héroe del hub; y si una nota de Infinitas supera una cifra de El
  Marcador, se reporta en una línea (no se edita código en un run).
- **Dos mapeos rancios corregidos en el skill**: publicaba
  `publication: "La Lana del Mundial"` (el rebrand de Fase 0 lo habría
  regresado a producción) → ahora "La Lana del Deporte"; el fallback
  `"playbook"` (source borrado en Fase 1, artículos inalcanzables) →
  industry-shots. Y se agregó el mapeo de The Futbol Business Review
  (`"The Futbol Business Review"` / `"futbol-business-review"`): el día
  que se publique contenido TFBR con ese par, el hub deja solo su estado
  vacío. `publish-sourced-article` recibió la nota del contrato del
  lead-in también.

**Verificación**: transforms probados con tsx contra las formas reales
del corpus (bold/colon/variantes, ruta del dinero con before/after);
Playwright sobre artículos reales confirmó 1 callout en cada uno;
tsc/eslint/build limpios. Nota backlog: al subir contenido histórico, la
numeración de expedientes se recorre (es cronológica calculada, "dated by
case") — si algún día se quiere numeración congelada, haría falta campo
en DB.

### 2026-08-05 — Hubs, cuarta pasada: ruta con significado, panel de CMS y río en Noticias

Feedback del usuario sobre el preview (captura del masthead de La Lana):
la gráfica de ruta gustaba como elemento pero "no es autoexplicativa"
(ciudades arbitrarias sin etiqueta), pidió un panel para editar todo esto
en el CMS, y Noticias seguía siendo "una lista aburrida".

- **La ruta ahora se explica sola y es real.** El masthead de /la-lana
  intenta primero la "Ruta del dinero" declarada en el CUERPO del último
  expediente (extractTrailStops en lib/product-hubs.ts — el hub pide la
  fila completa vía getArticleById porque las queries de lista quitan el
  cuerpo) y la rotula "La ruta del dinero · Expediente NNN" + "Así se
  movió el dinero del último caso: <título>". Si el caso no declara ruta,
  cae a la ruta y nota configuradas en el CMS. MoneyTrail ganó props
  label/note (figcaption).
- **Panel "Hubs de producto" en el admin** (grupo Contenido editorial,
  components/admin/tabs/HubsTab.tsx): edita mastheads de los 4 hubs, la
  ruta por defecto de La Lana, la nota de cadencia de Noticias, el
  tagline/URL de TFBR y — clave — las cifras de El Marcador de Infinitas
  (cifra/prefijo/sufijo/descripción/fuente), que dejaron de estar
  hardcodeadas en la página. **Arquitectura**: la sección `productHubs` es
  OPCIONAL en site_content; todo se lee vía `productHubsContent()` en
  `lib/product-hubs-content.ts` (módulo aparte y client-safe a propósito:
  el dashboard es client component y lib/data/site-content.ts importa el
  cliente de DB server-only — no mover esto de vuelta). Defaults en
  código; una fila vieja se edita igual y el primer guardado escribe la
  sección. No hace falta tocar datos de producción.
- **Noticias es un río, no una lista**: la última edición abre grande;
  después bloques alternados por prioridad — banda destacada full-width
  (★5: foto si hay, y la cifra más grande de la nota como chip verde
  rotado), tarjetas a dos columnas (★4, thumbnail si hay; una tarjeta
  sola se estira a todo el ancho), y clusters "Shots rápidos" (el resto,
  filas densas detrás de una regla verde para que la densidad lea como
  registro deliberado). Agrupación por corridas consecutivas del mismo
  tier, orden de publicación intacto (mismo principio que el río del
  archivo).

**Verificación** (app corriendo, Postgres local): Playwright — /noticias
(0 anchors anidados, 0 overflow, capturas revisadas: bandas, pares,
clusters y chips "MX$42.8 millones"/"60 millones" reales), /la-lana con
ruta auto-derivada del cuerpo del caso 003 (rótulo confirmado por texto),
y login real al admin (reset-editor-password local) con el tab nuevo
renderizando todos los campos junto al preview. tsc/eslint/build limpios.

### 2026-08-05 — Hubs, quinta pasada: el tablero de salidas en La Lana

Tercera ronda de feedback sobre la gráfica del masthead de La Lana: la
línea de ruta (aun rotulada) seguía sin gustar — el usuario pidió el
tablero de aeropuerto del arte de la tarjeta, con las CONEXIONES que los
expedientes destaparon como vuelos ("Infantino ↔ Trump", "AR Monex ↔
Europa", "Isaac del Toro ↔ UAE").

- **`components/products/DeparturesBoard.tsx`**: panel oscuro tipo
  split-flap (mono, verde sobre negro), columnas SALIDA / CONEXIÓN /
  VUELO / ESTADO. Las conexiones entran con efecto de flaps
  (ScrambleTextPlugin del bundle GSAP vendoreado, registrado LOCAL en el
  componente, no en lib/gsap — ver la nota de ese archivo sobre por qué);
  estados "Abierto"/"En curso" parpadean como llamada de abordaje;
  reduced-motion muestra todo estático. Filas con URL son clickeables.
- **Dos fuentes de filas**: automáticas — los expedientes recientes (hasta
  3, fetch por id acotado) que declaran "Ruta del dinero:" en el cuerpo
  se vuelven una salida con su ruta, su número de caso como vuelo y su
  estado real, enlazada al artículo — y curadas: filas del CMS (Hubs tab,
  `boardRows`: conexión/fecha/vuelo/estado/url). El modelo `lana` en
  productHubs cambió de routeLabel/routeNote/routeStops a
  boardLabel/boardNote/boardRows (sección aún nueva; el merge de defaults
  absorbe cualquier fila vieja).
- La línea de ruta animada (MoneyTrail) sigue viva DENTRO de los
  artículos — el reemplazo es solo del masthead del hub.

**Verificación**: Playwright a 1366px y 390px — 5 filas reales (2 auto de
los casos seedeados con ruta + 3 curadas), texto final del scramble
verificado ("Zúrich → Miami → CDMX"), 0 overflow, 0 errores de consola;
en móvil el tablero colapsa a conexión + estado. tsc/eslint/build
limpios. Pendiente editorial: las 3 conexiones default del tablero las
nombró el usuario — confirmarlas/curarlas en el tab de Hubs.

### 2026-08-05 — Hubs, sexta pasada: el pipeline alimenta el tablero y todos los elementos dinámicos

Cierre del ciclo de hubs: el usuario pidió que el skill de publicación
extraiga solo la información que los elementos dinámicos necesitan
(varias conexiones por artículo si aplica, con tope para que el tablero
no se infle) y que siempre recorra los elementos dinámicos de cada
página.

- **`scripts/update-lana-board.ts`**: el skill lo corre después de
  publicar artículos la-lana. Entrada mínima
  `[{conexion, articleId}]` — todo lo demás (nº de expediente, fecha,
  estado abierto/archivado, link) se DERIVA de la fila real del artículo
  para que el caller no pueda desalinearse. Merge: filas nuevas arriba,
  una conexión repetida se REEMPLAZA (normalizado sin acentos/case), tope
  de 6 filas curadas (MAX_CURATED_ROWS); articleId inexistente se salta
  con warning. `--dry-run` soportado; `mergeBoardRows` exportada y
  probada con tsx (el driver neon-http no llega al Postgres local). La
  página además dedupea auto+curadas por conexión y corta el tablero a 8
  filas visibles.
- **Corrido contra producción** (dry-run y real): el tablero vivo quedó
  con conexiones verificadas contra los artículos reales — "AR Monex ↔
  Europa" y "Isaac del Toro ↔ UAE" (EXP. 006, la nota del Torito, que
  confirma la inversión de €3M de A.R. Monex) e "Infantino ↔ UEFA y
  Concacaf" (EXP. 005, el deal de FIFA Forward). "Infantino ↔ Trump"
  quedó como fila curada SIN link: el expediente 005 no menciona a Trump
  y no se inventan vínculos — **el usuario debe confirmar/linkear esa
  fila en el tab de Hubs**.
- **Skill entrenado** (`publish-newsletter`): paso obligatorio de
  extracción de conexiones (qué califica — relación documentada central
  al caso, no cualquier entidad nombrada; 0-2 por artículo; ↔ vs →;
  lados cortos) + "Dynamic-elements checklist" que cada run recorre por
  artículo antes de reportar: lead-in de opinión exacto, priority
  honesto (en /noticias es el LAYOUT), cover image, cifra textual en
  title/excerpt, Ruta del dinero cuando aplica, tablero actualizado,
  flag del Marcador, par publication/source de TFBR, y nunca escribir
  números de expediente en el copy (se renumeran con backlogs).
  `publish-sourced-article` apunta al checklist para su salida
  industry-shots.

**Verificación**: mergeBoardRows probado (reemplazo de duplicados, tope,
orden); script dry-run + real contra Neon de producción con salida
inspeccionada; tsc/eslint/build limpios.

## Próximos pasos

### Bloqueantes de lanzamiento (2026-08-04) — ninguno se resuelve con código

1. **`[DOMICILIO FISCAL]` en `/privacidad`.** La LFPDPPP exige el domicilio
   real del responsable en el aviso de privacidad. Hoy el placeholder
   literal está visible para cualquier visitante. **No se inventó un
   domicilio a propósito** — hace falta el dato fiscal real de Playbook
   SAPI de C.V.
2. **`[JURISDICCIÓN]` en `/terminos`.** Mismo caso, en la cláusula de ley
   aplicable. Los dos son ediciones de una línea en cuanto lleguen los
   datos: `app/(public)/privacidad/page.tsx` y
   `app/(public)/terminos/page.tsx`.

Todo lo demás que la auditoría pre-lanzamiento encontró está corregido y
verificado — ver la entrada del 2026-08-04 en el registro de progreso.

### Recomendado antes o justo después de abrir al público

- **Confirmar en Vercel que `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` existen
  con ese nombre exacto.** Desde el 2026-08-04 el botón de Google no se
  renderiza si faltan (antes mandaba al lector a una pantalla de error de
  Google), así que un nombre mal escrito ya no rompe nada — pero deja el
  camino de alta más usado invisible sin ningún aviso. Este proyecto ya
  mandó tres variables con el nombre mal escrito a producción.
- **`playbook-portal-phi.vercel.app` sirve el sitio completo y es
  indexable.** Los canonical apuntan a `www.playbook.la`, así que Google
  debería consolidar, pero lo más limpio es redirigir ese dominio a
  playbook.la desde Vercel.
- **Probar el alta con correo+contraseña en producción real.** Se verificó
  de punta a punta contra Postgres local (alta, login, logout, re-login,
  contraseña incorrecta, cuenta Google-only rechazada), pero nunca contra
  la base real.
- **Mejora de imagen pendiente de un deploy**: la portada
  `la-lana-del-deporte-deal-infantino.png` quedó en 477 KB; pasarla a JPEG
  la deja en 177 KB, pero hay que reescribir el `image_url` de ese artículo
  en producción *después* de que el archivo nuevo esté desplegado, o la
  portada queda rota en el medio.

**Plan activo: "Roadmap Agosto 2026" (Fases 0-6), sección propia arriba.**
El plan anterior (Fases 7, 8 y 9, más abajo) está completo salvo lo
anotado en su propia sección — no es lo que sigue ahora.

**Estado por fase, a 2026-08-02, fin de sesión:**
- **Fase 0 (bugs visuales): completa.** Código y datos de producción
  resueltos. Solo falta que el usuario confirme visualmente en el sitio
  desplegado, en particular el glitch de Windows (`scrollbar-gutter`) —
  no se pudo observar el efecto exacto en este sandbox, Chromium headless
  en Linux no reserva scrollbar igual que Windows real.
- **Fase 1 (navegación): en progreso.** Ítems 1-4 completos (código y
  datos de producción). Ítem 5 (carpetas internas por producto editorial,
  diseño propio) sigue sin arrancar — las decisiones de producto ya están
  tomadas (diseño 100% custom por producto, no una plantilla compartida;
  The Futbol Business Review entra al mismo tratamiento que los otros
  tres, con su propio `source`; el usuario da el visto bueno al
  posicionamiento antes de construir nada), pero **el trabajo en sí
  (redactar el posicionamiento de cada producto para aprobación) todavía
  no se hizo** — quedó pendiente cuando la sesión se desvió a Fase 5. Es
  lo próximo si el usuario retoma esto.
- **Fase 2 (skills de contenido): completa.**
- **Fase 3 (pulido visual): completa.**
- **Fase 4 (contenido dinámico): completa.**
- **Fase 5 (cuentas/auth): efectivamente resuelta**, con un cabo suelto.
  Auth de lector: Google OAuth (ya estaba) + email/contraseña propio
  (agregado hoy, ver esa sección para el detalle técnico completo).
  Substack se investigó y se descartó (su API pública no ofrece login de
  terceros). Sin construir todavía, pedido por el usuario en esta misma
  sesión: exportar/subir los emails de lectores registrados a Substack
  como suscriptores — falta que el usuario diga si es un export manual o
  algo automatizado antes de tocar código. **Tampoco verificado en
  navegador/DB real** el flujo nuevo de correo+contraseña (alta, login,
  rechazo de una cuenta Google-only) — el pool TCP de
  `lib/db/client.ts` no conecta desde este sandbox, solo el driver HTTP
  que usan los scripts sueltos. Probarlo después del próximo deploy.
- **Fase 6 (legal): ítem 1 completo**, argentinismos corregidos en ambas
  páginas legales. **Ítem 2 (compliance 100%): checklist definido, casi
  todo implementado**, ver esa sección para el detalle. Lo único que
  falta: `[DOMICILIO FISCAL]` en `/privacidad` y `[JURISDICCIÓN]` en
  `/terminos` son placeholders literales, necesitan un dato de negocio
  real del usuario, no se pueden completar desde código.

**Resumen de lo que falta, en una lista (a 2026-08-02, revisado el
2026-08-04 — el ítem 4 es el único que bloquea el lanzamiento):**
1. Fase 1 ítem 5 — redactar y aprobar el posicionamiento de cada producto
   editorial, después construir las 4 páginas custom. **Actualización
   2026-08-05: construido** (los 4 hubs + módulo de portada, ver esa
   entrada del registro) — queda correr
   `scripts/point-products-at-hubs.ts` contra producción y la revisión
   del usuario sobre el deploy.
2. Fase 5 — decidir manual vs. automatizado para subir emails de lectores
   a Substack como suscriptores, y construirlo.
3. Fase 5 — verificar en navegador real (después de deploy) el flujo de
   registro/login con correo y contraseña. **Actualización 2026-08-04**:
   ya está verificado de punta a punta contra un Postgres real y un
   navegador real (alta, login, logout, re-login, contraseña incorrecta,
   rechazo de cuenta Google-only), pero contra la base *local*, no la de
   producción — queda solo esa confirmación.
4. Fase 6 — el usuario provee domicilio fiscal real y jurisdicción para
   cerrar los dos placeholders. **Es lo único que bloquea el lanzamiento**
   (ver "Bloqueantes de lanzamiento" arriba).
5. Verificaciones manuales sin cambio de código, solo necesitan deploy
   con credenciales reales: subida de imágenes a Vercel Blob (gap desde
   Fase 4), panel de analítica con credenciales reales de Vercel
   Analytics (gap desde Fase 4), datos reales de GA4 en el módulo "Más
   leídas" (gap desde Fase 5 original), y confirmar en el dashboard de
   Vercel que las variables de entorno tienen el nombre correcto —
   PLAYBOOK_SECRET (no Playbook_secret), GA4_PROPERTY_ID,
   GA4_SERVICE_ACCOUNT_EMAIL, GA4_SERVICE_ACCOUNT_PRIVATE_KEY — el código
   ya usa el nombre correcto en todos lados, es solo el valor en Vercel el
   que puede estar mal.

Antes de arrancar cada sesión: leer la sección de la fase correspondiente
en HANDOFF.md para saber el estado actual y si hubo cambios desde que se
escribió el prompt.

## Convención: cómo mantener este archivo

Después de cada sesión de trabajo con cambios de código reales (no
correcciones triviales), agregar una entrada nueva al "Registro de
progreso" arriba, con: fecha, qué se hizo, cómo se verificó (no solo "se
escribió"), y qué queda pendiente. Actualizar también "Próximos pasos" si
cambió el orden o el alcance de lo que sigue. El README apunta acá para el
estado del proyecto — no dupliques el registro ahí.

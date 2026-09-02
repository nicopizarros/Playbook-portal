import { NextResponse, type NextRequest } from 'next/server';
// Relative import, not the '@/' tsconfig alias: kept from the Edge-runtime
// version of this file (see HANDOFF.md) even though it's no longer required
// now that `runtime: 'nodejs'` below routes this through Next's normal
// per-route bundling — no reason to reintroduce alias resolution as a
// variable for a one-line import.
import { ANON_COOKIE_NAME, signAnonId, verifyAnonCookie } from './lib/anon-cookie';

// Ensures every visitor has a valid signed anonymous-reader cookie before
// they ever reach an article — this is what lets metering (lib/metering.ts)
// enforce the free-article quota server-side without JavaScript. Runs on
// every request (not just /articulo) so the cookie is already present by
// the time it matters, and so a visitor's very first pageview isn't a
// special case. Deliberately does NOT write to the database — see
// lib/metering.ts for where the anon_readers row actually gets created,
// lazily, only once someone actually reads a metered article.
const TWO_YEARS_SECONDS = 60 * 60 * 24 * 365 * 2;

// ------------------------------------------- Consolidación de La Lana (R2)
// El producto tenía DOS destinos — el hub y la lista pelona filtrada del
// archivo — y la ronda 2 retira el segundo. El 301 es para enlaces internos
// y marcadores, no para el buscador: /archivo ya canonicaliza toda
// combinación de filtros a la URL pelona, robots.ts deshabilita /archivo?*
// y app/sitemap.ts sólo publica /archivo sin query, así que la lista
// filtrada nunca fue una página indexada.
//
// Por qué acá y no en next.config.ts, que es donde vive el precedente
// (/industry-shots → /noticias): los redirects de next.config reenvían
// siempre el query string al destino, o sea que el lector aterrizaba en
// /la-lana?source=la-lana. El middleware es el único punto del pipeline
// donde el destino es nuestro, y next.config corre ANTES que él — así que
// esto no puede estar en los dos lados.
//
// Sólo se retira la lista PELONA. /archivo tiene cuatro tiers de filtro
// independientes (source × scope × sport × vertical); un cruce legítimo
// como ?source=la-lana&sport=NFL se queda en el archivo, porque mandarlo
// al hub perdería el otro filtro sin avisar. `view` no cuenta como cruce:
// la lista pelona en grilla o en lista sigue siendo la lista pelona.
const RETIRED_SOURCE_LIST = { source: 'la-lana', hub: '/la-lana' };
const CROSS_FILTER_KEYS = ['sport', 'vertical', 'scope'];

function retiredListRedirect(request: NextRequest): URL | null {
  if (request.nextUrl.pathname !== '/archivo') return null;
  const params = request.nextUrl.searchParams;
  if (params.get('source') !== RETIRED_SOURCE_LIST.source) return null;
  if (CROSS_FILTER_KEYS.some(key => params.has(key))) return null;
  // Se construye desde cero, sin heredar searchParams: el hub no lee
  // ninguno y arrastrarlos forkearía la ruta en analytics.
  return new URL(RETIRED_SOURCE_LIST.hub, request.nextUrl.origin);
}

// ------------------------------------- URLs limpias de artículo (2026-09-02)
// `/articulo?id=<slug>` pasó a ser `/articulo/<slug>`. El motivo: de las 243
// URLs del sitemap, 237 eran query strings — 211 artículos y 25 temas — y
// Google las estaba tratando como parámetros de UNA página en vez de como
// artículos distintos. `articles.id` (lib/db/schema.ts:56) ya era un slug
// legible acuñado por lib/slugify.ts, así que el cambio fue de ruteo: ni
// migración de datos ni columna nueva.
//
// Este redirect NO se retira nunca. Todo lo que apunta a Playbook hoy —
// backlinks, envíos de Substack, y los 55 cross-links que viven dentro del
// cuerpo de los artículos en Postgres (docs/2026-08-25-incoherence-audit.md)
// — usa la forma vieja. Retirarlo convierte cada uno de esos enlaces en 404.
//
// Por qué acá y no en next.config.ts: exactamente la misma razón que el
// bloque de arriba. Los redirects de next.config reenvían siempre el query
// string, así que `/articulo?id=X` aterrizaría en `/articulo/X?id=X`. El
// middleware es el único punto donde el destino se construye desde cero.
//
// 301 y no 308 como el redirect de arriba: son equivalentes para Google,
// pero éste es el que van a buscar las herramientas de auditoría y el que
// lee cualquiera revisando el fix. La diferencia real (308 preserva el
// método) no aplica: una URL de artículo sólo se pide por GET.
function legacyArticleRedirect(request: NextRequest): URL | null {
  if (request.nextUrl.pathname !== '/articulo') return null;
  const id = request.nextUrl.searchParams.get('id');
  // `/articulo` pelado (sin id) no se redirige: cae al catch-all y recibe el
  // 404 branded, que es lo que siempre fue — nunca hubo una página ahí.
  if (!id) return null;
  // Desde cero, sin heredar searchParams: arrastrar `?id=` al destino
  // duplicaría la URL canónica justo después de haberla limpiado.
  return new URL(`/articulo/${encodeURIComponent(id)}`, request.nextUrl.origin);
}

// ------------------------------------------- Un solo host (2026-09-02)
// El deployment de producción responde en DOS hosts: www.playbook.la y el
// alias playbook-portal-phi.vercel.app. Verificado — el alias devuelve 200
// con el sitio completo y un robots.txt que dice `Allow: /`. Es una copia
// entera del sitio en un dominio que no es nuestro.
//
// Los canonicals ya apuntan a playbook.la, así que Google probablemente
// consolide igual, pero "probablemente" no es una razón para dejar un
// duplicado servido. Un 308 lo cierra.
//
// Sólo corre en producción. En preview cada deployment tiene su propio host
// *.vercel.app y redirigirlo a producción haría imposible revisar un cambio
// antes de publicarlo — que es exactamente para lo que existen los previews.
function nonCanonicalHostRedirect(request: NextRequest): URL | null {
  if (process.env.VERCEL_ENV !== 'production') return null;

  // Misma resolución que lib/site-url.ts, MENOS su fallback hardcodeado.
  //
  // La primera versión de esto leía sólo SITE_URL y se desplegó inerte: en
  // producción SITE_URL no está seteada — el host canónico sale de
  // VERCEL_PROJECT_PRODUCTION_URL, que es de dónde los canonicals ya sacaban
  // www.playbook.la. Verificado después del deploy del 2026-09-02: el alias
  // seguía devolviendo 200 en vez de 308.
  //
  // El fallback de lib/site-url.ts (playbook-portal-phi.vercel.app) queda
  // deliberadamente afuera: si se colara acá, el host canónico sería el
  // alias y estaríamos redirigiendo www.playbook.la HACIA el duplicado —
  // exactamente al revés de lo que este redirect existe para hacer.
  const canonicalOrigin =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null);
  // Sin nada configurado no hay contra qué comparar. Fallar abierto: servir
  // el sitio en un host de más es un problema de SEO, un loop de redirects
  // lo deja completamente caído.
  if (!canonicalOrigin) return null;

  let canonicalHost: string;
  try {
    canonicalHost = new URL(canonicalOrigin).host;
  } catch {
    // Valor mal formado en la env var: mismo criterio, fallar abierto.
    return null;
  }

  const host = request.headers.get('host');
  if (!host || host === canonicalHost) return null;

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${canonicalHost}`);
  return target;
}

export async function middleware(request: NextRequest) {
  // Primero de todo: si estamos en el host equivocado, nada más de lo que
  // sigue importa — la cookie anónima se acuña en el host bueno.
  const canonicalHost = nonCanonicalHostRedirect(request);
  if (canonicalHost) return NextResponse.redirect(canonicalHost, 308);

  // Antes del try: es lectura pura de la URL, no puede lanzar, y el lector
  // recogerá su cookie anónima en el request al hub.
  const retired = retiredListRedirect(request);
  if (retired) return NextResponse.redirect(retired, 308);

  const legacyArticle = legacyArticleRedirect(request);
  if (legacyArticle) return NextResponse.redirect(legacyArticle, 301);

  // Fails open on any error (e.g. AUTH_SECRET missing in this environment —
  // signAnonId/verifyAnonCookie both throw in that case) instead of letting
  // it propagate: this function runs unconditionally on every request
  // site-wide (see matcher below), with no caller positioned to degrade
  // gracefully the way e.g. lib/vercel-analytics.ts's callers can isolate a
  // failure to one admin panel — an uncaught throw here becomes a real
  // MIDDLEWARE_INVOCATION_FAILED 500 on literally every page for every
  // visitor. Same "fail open, this is a quota-tracking identity, not an
  // auth boundary" reasoning lib/anon-cookie.ts already documents for a
  // tampered cookie, just applied one level up so a config problem
  // degrades to "no anon cookie this request" (lib/metering.ts treats that
  // reader as always-fresh) instead of taking the whole site down.
  try {
    const existing = request.cookies.get(ANON_COOKIE_NAME)?.value;
    const verifiedId = await verifyAnonCookie(existing);
    if (verifiedId) return NextResponse.next();

    const response = NextResponse.next();
    const id = crypto.randomUUID();
    const signed = await signAnonId(id);
    response.cookies.set(ANON_COOKIE_NAME, signed, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: TWO_YEARS_SECONDS,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[middleware] anon-cookie signing failed, serving without a cookie:', err);
    return NextResponse.next();
  }
}

export const config = {
  // Node.js runtime, not the Edge default: this project's Vercel Edge
  // Function pipeline broke with `[ReferenceError: __dirname is not
  // defined]` for *any* middleware content, including a literal no-op —
  // confirmed by deploying one, see HANDOFF.md's diagnostic history. Node
  // middleware (stable as of Next.js 15.5, no experimental flag needed —
  // verified by inspecting a real `next build` output: it produces
  // `.next/server/middleware.js` with a `.nft.json` Node-file-trace
  // artifact and zero entries in `middleware-manifest.json`'s `middleware`
  // map) compiles as a standard Node serverless function instead, which
  // never enters that broken pipeline.
  runtime: 'nodejs',
  // Skip static assets and Next internals — no point minting/checking the
  // cookie for a font file or a JS chunk request.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};

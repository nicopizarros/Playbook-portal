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

export async function middleware(request: NextRequest) {
  // Antes del try: es lectura pura de la URL, no puede lanzar, y el lector
  // recogerá su cookie anónima en el request al hub.
  const retired = retiredListRedirect(request);
  if (retired) return NextResponse.redirect(retired, 308);

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

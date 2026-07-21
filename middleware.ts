import { NextResponse, type NextRequest } from 'next/server';
// Relative import, not the '@/' tsconfig alias, deliberately: Vercel reported
// "The Edge Function middleware is referencing unsupported modules:
// @/lib/anon-cookie" on a real deploy of this exact file, even though
// lib/anon-cookie.ts is fully Web Crypto-based with zero imports (verified —
// see HANDOFF.md). middleware.ts is bundled through Vercel's separate root-level
// Edge Function pipeline, distinct from Next's normal per-route bundling that
// every other '@/'-aliased import in this repo goes through unreported; a
// known class of this exact error involves a '@/'-aliased import into
// middleware failing to resolve in that pipeline specifically. A plain
// relative path removes alias resolution as a variable entirely.
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

export async function middleware(request: NextRequest) {
  // Fails open on any error (e.g. AUTH_SECRET missing in this environment —
  // signAnonId/verifyAnonCookie both throw in that case) instead of letting
  // it propagate: this function runs unconditionally on every request
  // site-wide (see matcher below), with no caller positioned to degrade
  // gracefully the way e.g. lib/vercel-analytics.ts's callers can isolate a
  // failure to one admin panel — an uncaught throw here becomes a real
  // MIDDLEWARE_INVOCATION_FAILED 500 on literally every page for every
  // visitor, confirmed against a real Vercel deploy. Same "fail open, this
  // is a quota-tracking identity, not an auth boundary" reasoning
  // lib/anon-cookie.ts already documents for a tampered cookie, just
  // applied one level up so a config problem degrades to "no anon cookie
  // this request" (lib/metering.ts treats that reader as always-fresh)
  // instead of taking the whole site down.
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
  // Skip static assets and Next internals — no point minting/checking the
  // cookie for a font file or a JS chunk request.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};

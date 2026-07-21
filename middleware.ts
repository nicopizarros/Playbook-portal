import { NextResponse, type NextRequest } from 'next/server';

// TEMPORARY DIAGNOSTIC — see HANDOFF.md entry dated 2026-07-21
// ("Diagnóstico: middleware no-op para aislar __dirname de Vercel vs.
// código"). The real anon-cookie logic (previously here, importing
// ./lib/anon-cookie) is commented out below, not deleted. This no-op
// deploy exists only to determine whether `[ReferenceError: __dirname is
// not defined]` / MIDDLEWARE_INVOCATION_FAILED still happens with zero
// app-level middleware logic — isolating Vercel's Edge Function packaging
// from this repo's code. Revert to the commented-out version once that's
// answered; do not build on top of this no-op.
//
// import { ANON_COOKIE_NAME, signAnonId, verifyAnonCookie } from './lib/anon-cookie';
// const TWO_YEARS_SECONDS = 60 * 60 * 24 * 365 * 2;

export async function middleware(_request: NextRequest) {
  return NextResponse.next();

  // try {
  //   const existing = request.cookies.get(ANON_COOKIE_NAME)?.value;
  //   const verifiedId = await verifyAnonCookie(existing);
  //   if (verifiedId) return NextResponse.next();
  //
  //   const response = NextResponse.next();
  //   const id = crypto.randomUUID();
  //   const signed = await signAnonId(id);
  //   response.cookies.set(ANON_COOKIE_NAME, signed, {
  //     httpOnly: true,
  //     sameSite: 'lax',
  //     secure: process.env.NODE_ENV === 'production',
  //     maxAge: TWO_YEARS_SECONDS,
  //     path: '/',
  //   });
  //   return response;
  // } catch (err) {
  //   console.error('[middleware] anon-cookie signing failed, serving without a cookie:', err);
  //   return NextResponse.next();
  // }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};

import Link from 'next/link';

// Root-level backstop for Next's not-found convention. Almost every 404 a
// reader can hit is now handled one level down by app/(public)/not-found.tsx
// (with the real Header/Footer), because app/(public)/[...slug]/page.tsx
// pulls unmatched public URLs into that group on purpose — see that file.
// This one covers what's left: an unmatched path under a segment outside
// that group (e.g. /admin/typo). Before it existed those fell through to
// Next's built-in page — bare English text on a blank white screen, no
// branding, no way back — the same failure mode app/error.tsx was added to
// stop for thrown errors.
//
// Renders inside app/layout.tsx only, so fonts, tokens and CSS are
// available but Header/Footer are not (they live in the (public) layout) —
// same constraint and same standalone shape as app/error.tsx.
export default function RootNotFound() {
  return (
    <main
      className="container"
      style={{ textAlign: 'center', padding: '120px 24px', minHeight: '60vh' }}
    >
      <span className="eyebrow" style={{ justifyContent: 'center' }}>Error 404</span>
      <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, fontSize: 38, lineHeight: 1.15, margin: '14px 0 16px', textTransform: 'none' }}>
        No encontramos esta página
      </h1>
      <p style={{ fontSize: '15.5px', color: 'var(--gray-txt)', maxWidth: '52ch', margin: '0 auto 30px' }}>
        El enlace puede estar roto o la página se movió.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="btn accent" href="/">Volver al inicio</Link>
        <Link className="btn light" href="/archivo">Ver el archivo</Link>
      </div>
    </main>
  );
}

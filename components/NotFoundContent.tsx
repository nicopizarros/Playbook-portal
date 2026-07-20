import Link from 'next/link';

// Shared by app/not-found.tsx (Next's catch-all convention) and
// app/404/page.tsx (the literal path some legacy links/bookmarks may still
// hit) so both render identically — ported from legacy/404.html.
export function NotFoundContent() {
  return (
    <main className="container article-page" id="error-main" style={{ textAlign: 'center', padding: '80px 24px 100px' }}>
      <span className="eyebrow" style={{ justifyContent: 'center' }}>Error 404</span>
      <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, fontSize: 38, lineHeight: 1.15, margin: '14px 0 16px', textTransform: 'none' }}>
        No encontramos esta página
      </h1>
      <p style={{ fontSize: '15.5px', color: 'var(--gray-txt)', maxWidth: '52ch', margin: '0 auto 30px' }}>
        El enlace puede estar roto o la página se movió. Probá desde el inicio o buscá lo que necesitas arriba.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="btn accent" href="/">Volver al inicio</Link>
        <Link className="btn light" href="/archivo">Ver el archivo</Link>
      </div>
    </main>
  );
}

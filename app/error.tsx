'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// One level above app/(public)/error.tsx and app/admin/error.tsx: catches a
// thrown error from a *layout* itself (app/(public)/layout.tsx or
// app/admin/layout.tsx), which a segment's own error.tsx cannot catch —
// Next.js only lets error.js handle errors from its page.tsx and deeper,
// never its own segment's layout.tsx (see Next.js docs on error.js
// boundaries). Concretely: components/layout/Header.tsx (rendered by
// app/(public)/layout.tsx on every single public page) does its own
// getSiteContent()/getAllArticles()/auth() calls — a transient failure
// there (this project's DB is Neon serverless Postgres, which can briefly
// error or time out waking from a cold start) throws above where
// app/(public)/error.tsx can reach, and before this file existed it fell
// through all the way to Next's bare default error page: a few lines of
// unstyled gray text on an otherwise fully blank white screen, no
// header/footer/branding — indistinguishable from "the page went blank"
// to a reader, which is the real production bug this fixes. Still nested
// inside app/layout.tsx (the root <html>/<body>, styles, fonts), so those
// keep working here even though Header/Footer themselves are unavailable.
export default function RootSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

  return (
    <main
      className="container"
      style={{ textAlign: 'center', padding: '120px 24px', minHeight: '60vh' }}
    >
      <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, fontSize: 38, lineHeight: 1.15, margin: '0 0 16px', textTransform: 'none' }}>
        Playbook no está disponible en este momento
      </h1>
      <p style={{ fontSize: '15.5px', color: 'var(--gray-txt)', maxWidth: '52ch', margin: '0 auto 30px' }}>
        Fue un problema temporal de nuestro lado, no tuyo. Probá de nuevo en unos segundos.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn accent" onClick={() => reset()}>Reintentar</button>
        <Link className="btn light" href="/">Volver al inicio</Link>
      </div>
    </main>
  );
}

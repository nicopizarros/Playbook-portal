'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Catches a thrown error from any page.tsx under this route group (home,
// /articulo, /archivo, /autor, /tema, /cuenta, /privacidad, /terminos) —
// Header/Footer still render normally here since they live in this same
// segment's layout.tsx, which is a separate, unaffected error boundary
// (see app/error.tsx's comment for why a layout-level failure needs its
// own boundary one level up).
//
// Real production motivation, not speculative: before this file existed,
// there was zero error boundary anywhere in the app, so any unhandled
// Server Component exception (e.g. a transient Postgres connection error —
// this project's DB is Neon serverless Postgres, which can briefly fail or
// time out on cold start after idling, see lib/db/client.ts) fell all the
// way through to Next.js's own default error UI: a few lines of unstyled
// gray text ("Application error: a server-side exception has occurred...")
// on an otherwise fully blank white page, no header/footer/branding at
// all. Reproduced locally by forcing a throw in this segment's page.tsx
// and screenshotting the result — visually indistinguishable from "the
// page went blank" to a reader who isn't inspecting DOM text. This file
// replaces that with an on-brand message and a real retry action.
export default function PublicSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[public route error boundary]', error);
  }, [error]);

  return (
    <main className="container article-page" id="error-main" style={{ textAlign: 'center', padding: '80px 24px 100px' }}>
      <span className="eyebrow" style={{ justifyContent: 'center' }}>Algo salió mal</span>
      <h1 style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, fontSize: 38, lineHeight: 1.15, margin: '14px 0 16px', textTransform: 'none' }}>
        No pudimos cargar esta página
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

'use client';

import { useEffect } from 'react';

// Last resort: only fires if app/layout.tsx (the actual root <html>/<body>)
// itself throws, which none of the other error.tsx boundaries in this app
// can catch (each of them still relies on the root layout rendering
// successfully around it). Root layout.tsx does no data fetching today —
// see its own comments — so this is very unlikely to ever trigger, but
// it's the one gap a global-error.tsx is specifically for, and costs
// nothing to add. Must render its own <html>/<body> (replacing the root
// layout entirely) and can't rely on styles/fonts from it, so this stays
// plain inline CSS only, no imported classes/design tokens.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global error boundary]', error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '120px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 16px' }}>
          Playbook no está disponible en este momento
        </h1>
        <p style={{ color: '#555', maxWidth: '52ch', margin: '0 auto 30px' }}>
          Fue un problema temporal de nuestro lado, no tuyo. Probá de nuevo en unos segundos.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ padding: '10px 20px', fontSize: 15, cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}

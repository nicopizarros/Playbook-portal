'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'playbook_cookie_notice_dismissed';

// Notice-only, not a consent gate: dismissing this doesn't unblock
// anything, because nothing is blocked in the first place — GA4
// (components/analytics/GoogleAnalytics.tsx) and the anon-reader quota
// cookie (middleware.ts) already fire regardless, matching how legacy
// operated (deliberate choice, not an oversight — see HANDOFF.md).
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // Private browsing / storage disabled: fail open to not showing the
      // banner rather than crashing the page over it.
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Same fail-open reasoning as above — dismissal just won't persist.
    }
  }

  if (!visible) return null;

  return (
    <div className="cookie-notice" role="note" aria-label="Aviso de cookies">
      <p>
        Usamos cookies propias y de terceros para analítica y para contar tus lecturas gratuitas del
        mes. Al seguir navegando aceptás su uso. <Link href="/privacidad">Más información</Link>.
      </p>
      <button type="button" className="btn accent cookie-notice-dismiss" onClick={dismiss}>
        Entendido
      </button>
    </div>
  );
}

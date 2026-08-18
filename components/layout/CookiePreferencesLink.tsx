'use client';

import { REOPEN_COOKIE_NOTICE_EVENT } from '@/components/CookieNotice';

// Footer-level way to revisit the advertising-consent choice made in
// CookieNotice.tsx after first dismissing it — previously the only way to
// change that choice was clearing cookies by hand (still what
// /privacidad tells readers as a fallback). Dispatches instead of holding
// its own copy of the banner's state, see CookieNotice.tsx.
export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      className="footer-cookie-prefs-link"
      onClick={() => window.dispatchEvent(new CustomEvent(REOPEN_COOKIE_NOTICE_EVENT))}
    >
      Preferencias de cookies
    </button>
  );
}

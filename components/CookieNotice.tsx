'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readConsent, writeConsent } from '@/lib/consent';

// Fase 7: upgraded from the old notice-only banner to a real advertising
// consent flow (LFPDPPP framework — essential always on, advertising/
// analytics strictly opt-in). Two paths: "Aceptar todo" grants advertising
// in one tap; "Gestionar preferencias" expands an inline panel (not a
// modal, deliberately — no position:fixed layering beyond the banner
// itself, no focus-trap machinery to get wrong) with the two categories.
// The stored shape and the migration of the old dismissal flag live in
// lib/consent.ts; GA4 (components/analytics/GoogleAnalytics.tsx) and every
// ad slot (components/ads/AdSlot.tsx) gate on what this banner persists.
export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [advertisingChecked, setAdvertisingChecked] = useState(false);

  useEffect(() => {
    // readConsent() also migrates the pre-Fase-7 dismissal flag
    // (playbook_cookie_notice_dismissed → advertising:true), so previously
    // informed readers never see the banner again.
    if (!readConsent()) setVisible(true);
  }, []);

  function acceptAll() {
    writeConsent(true);
    setVisible(false);
  }

  function savePreferences() {
    writeConsent(advertisingChecked);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-notice" role="region" aria-label="Preferencias de cookies">
      <p>
        Usamos cookies esenciales para que el sitio funcione (como contar tus lecturas gratuitas
        del mes) y, solo con tu permiso, cookies de analítica y publicidad.{' '}
        <Link href="/privacidad">Más información</Link>.
      </p>

      {showPrefs && (
        <div className="cookie-prefs">
          <label className="cookie-pref">
            <input type="checkbox" checked disabled />
            <span>
              <b>Esenciales</b> — siempre activas. Sesión, seguridad y conteo de lecturas
              gratuitas.
            </span>
          </label>
          <label className="cookie-pref">
            <input
              type="checkbox"
              checked={advertisingChecked}
              onChange={e => setAdvertisingChecked(e.target.checked)}
            />
            <span>
              <b>Analítica y publicidad</b> — nos ayudan a entender qué se lee y a financiar el
              contenido.
            </span>
          </label>
        </div>
      )}

      <div className="cookie-notice-actions">
        {showPrefs ? (
          <button type="button" className="btn accent" onClick={savePreferences}>
            Guardar preferencias
          </button>
        ) : (
          <>
            <button type="button" className="btn accent" onClick={acceptAll}>
              Aceptar todo
            </button>
            <button type="button" className="btn light" onClick={() => setShowPrefs(true)}>
              Gestionar preferencias
            </button>
          </>
        )}
      </div>
    </div>
  );
}

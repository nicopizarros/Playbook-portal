'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { readConsent, writeConsent } from '@/lib/consent';
import { gsap } from '@/lib/gsap';

// Fase 7: upgraded from the old notice-only banner to a real advertising
// consent flow (LFPDPPP framework — essential and aggregate analytics
// always on, advertising strictly opt-in; narrowed from "advertising/
// analytics" to advertising-only on 2026-07-31, see lib/consent.ts). Two
// paths: "Aceptar todo" grants advertising in one tap; "Gestionar
// preferencias" expands an inline panel (not a modal, deliberately — no
// position:fixed layering beyond the banner itself, no focus-trap machinery
// to get wrong) with the three categories. The stored shape and the
// migration of the old dismissal flag live in lib/consent.ts; every ad slot
// (components/ads/AdSlot.tsx) gates on what this banner persists — GA4
// (components/analytics/GoogleAnalytics.tsx) no longer does.
export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [advertisingChecked, setAdvertisingChecked] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // readConsent() also migrates the pre-Fase-7 dismissal flag
    // (playbook_cookie_notice_dismissed → advertising:true), so previously
    // informed readers never see the banner again.
    if (!readConsent()) setVisible(true);
  }, []);

  // The prefs panel used to just appear — a conditional render with no
  // transition at all. It only ever opens (never collapses back — "Guardar
  // preferencias" dismisses the whole banner), so a one-shot reveal on
  // mount is all this needs, no exit animation to coordinate.
  useEffect(() => {
    if (!showPrefs) return;
    const el = prefsRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
  }, [showPrefs]);

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
        del mes) y de analítica agregada para entender qué se lee. Con tu permiso, además, cookies
        de publicidad.{' '}
        <Link href="/privacidad">Más información</Link>.
      </p>

      {showPrefs && (
        <div className="cookie-prefs" ref={prefsRef}>
          <label className="cookie-pref">
            <input type="checkbox" checked disabled />
            <span>
              <b>Esenciales</b> — siempre activas. Sesión, seguridad y conteo de lecturas
              gratuitas.
            </span>
          </label>
          <label className="cookie-pref">
            <input type="checkbox" checked disabled />
            <span>
              <b>Analítica</b> — siempre activa. Tráfico agregado del sitio, no te identifica
              individualmente.
            </span>
          </label>
          <label className="cookie-pref">
            <input
              type="checkbox"
              checked={advertisingChecked}
              onChange={e => setAdvertisingChecked(e.target.checked)}
            />
            <span>
              <b>Publicidad</b> — nos ayuda a financiar el contenido.
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

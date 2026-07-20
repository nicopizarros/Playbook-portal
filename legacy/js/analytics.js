'use strict';

// GA4 site analytics. Loaded on every public page (not /admin — editors
// aren't the audience being measured). GA4_MEASUREMENT_ID is a public,
// client-side ID, not a secret, so it's fine committed here — same as any
// other public config value in this repo.
//
// Propiedad confirmada por el equipo el 16 jul 2026: G-0CG7JMK8RZ.
//
// En la propia GA4 conviene además:
//  - Activar "Enhanced measurement" en Admin → Data Streams: da scroll
//    tracking genérico y clics salientes gratis, sin tocar este archivo.
//  - Vincular la propiedad a Search Console para ver términos de búsqueda.
//
// Nota: este ID solo sirve para MANDAR eventos a GA4 (lo que hace este
// archivo). El módulo "Más leídas" de la portada LEE datos de vuelta desde
// GA4 y necesita credenciales distintas (una cuenta de servicio, no este
// ID) — ver lib/ga4.js.
const GA4_MEASUREMENT_ID = 'G-0CG7JMK8RZ';

function loadGtag() {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// Fire-and-forget custom event helper for the rest of the site. Safe to call
// before gtag has loaded (e.g. right after navigation) — it just no-ops
// instead of throwing.
export function track(eventName, params) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
}

loadGtag();

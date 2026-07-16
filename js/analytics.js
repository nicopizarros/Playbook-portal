'use strict';

// GA4 site analytics. Loaded on every public page (not /admin — editors
// aren't the audience being measured). GA4_MEASUREMENT_ID is a public,
// client-side ID, not a secret, so it's fine committed here — same as any
// other public config value in this repo.
//
// TODO(equipo): reemplazar con el ID real de la propiedad GA4 (formato
// G-XXXXXXXXXX) una vez creada en Google Analytics. Hasta entonces esto no
// manda datos reales, solo avisa una vez en consola.
//
// Una vez configurado el ID real, en la propia GA4 conviene además:
//  - Activar "Enhanced measurement" en Admin → Data Streams: da scroll
//    tracking genérico y clics salientes gratis, sin tocar este archivo.
//  - Vincular la propiedad a Search Console para ver términos de búsqueda.
const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';

function loadGtag() {
  if (GA4_MEASUREMENT_ID.indexOf('XXXX') !== -1) {
    console.warn('[Playbook] GA4_MEASUREMENT_ID no está configurado (js/analytics.js) — no se está midiendo tráfico real todavía.');
    return;
  }

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
// before gtag has loaded, or while the measurement ID is still a
// placeholder — it just no-ops instead of throwing.
export function track(eventName, params) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
}

loadGtag();

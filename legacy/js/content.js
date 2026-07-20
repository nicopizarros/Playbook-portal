'use strict';

import {
  navLinksTemplate,
  opinionSectionHeadTemplate, opinionGridTemplate,
  productsSectionHeadTemplate, productsGridTemplate,
  midCtaTemplate,
  videoSectionHeadTemplate, videoFeatureTemplate, videoSecondaryTemplate, videoClipsTemplate,
  instagramReelsTemplate,
  infinitasSectionHeadTemplate, infinitasWrapTemplate,
  statsHeadingTemplate, statsGridTemplate,
  testimonialsSectionHeadTemplate, testimonialsGridTemplate,
  aboutCardTemplate,
  footerContentTemplate, footerCopyrightTemplate
} from './templates.js';

let siteContent = null;
let contentReady = false;
const readyCallbacks = [];

function mount(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// Renders one section in isolation: a malformed field in one section (a bad
// manual edit, a save that slipped past validation) throws and logs instead
// of aborting every section rendered after it.
function safeMount(id, templateFn, arg) {
  try {
    mount(id, templateFn(arg));
  } catch (err) {
    console.error(`[Playbook] Error rendering #${id}:`, err);
  }
}

function render(data) {
  safeMount('nav-links-dynamic', navLinksTemplate, data.nav);
  try {
    const navCta = document.getElementById('nav-cta');
    if (navCta) {
      navCta.setAttribute('href', data.nav.ctaUrl);
      navCta.textContent = data.nav.ctaLabel;
    }
  } catch (err) {
    console.error('[Playbook] Error rendering #nav-cta:', err);
  }

  safeMount('opinion-section-head', opinionSectionHeadTemplate, data.opinionSection);
  safeMount('opinion-grid', opinionGridTemplate, data.opinionSection);

  safeMount('products-section-head', productsSectionHeadTemplate, data.productsSection);
  safeMount('products-grid', productsGridTemplate, data.productsSection);

  safeMount('mid-cta-box', midCtaTemplate, data.midCta);

  safeMount('video-section-head', videoSectionHeadTemplate, data.videoSection);
  safeMount('video-feature', videoFeatureTemplate, data.videoSection.featured);
  safeMount('video-feature-copy', videoSecondaryTemplate, data.videoSection.secondary);
  safeMount('video-clips', videoClipsTemplate, data.videoSection);
  safeMount('video-ig-reels', instagramReelsTemplate, data.videoSection);

  safeMount('infinitas-section-head', infinitasSectionHeadTemplate, data.infinitasSection);
  safeMount('infinitas-wrap', infinitasWrapTemplate, data.infinitasSection);

  safeMount('stats-heading', statsHeadingTemplate, data.statsSection);
  safeMount('stats-grid', statsGridTemplate, data.statsSection);

  safeMount('testimonials-section-head', testimonialsSectionHeadTemplate, data.testimonialsSection);
  safeMount('testimonials-grid', testimonialsGridTemplate, data.testimonialsSection);

  safeMount('about-card', aboutCardTemplate, data.aboutSection);

  safeMount('footer-content', footerContentTemplate, data.footer);
  safeMount('footer-copyright', footerCopyrightTemplate, data.footer);

  document.dispatchEvent(new CustomEvent('playbook:content-rendered'));
  processInstagramEmbeds();
}

// embed.js corre su propio auto-proceso de blockquotes una sola vez, al
// cargar — los que safeMount inyecta después no se convierten solos, hay
// que pedírselo explícitamente. Reintenta unas cuantas veces por si el
// fetch de content.json termina antes de que //www.instagram.com/embed.js
// haya cargado (no cubre el caso de que un ad-blocker/tracking-protection
// bloquee ese script directamente — ahí el fallback del blockquote es lo
// que se ve, ver instagramReelTemplate en templates.js).
function processInstagramEmbeds(attempt) {
  if (window.instgrm && window.instgrm.Embeds) {
    window.instgrm.Embeds.process();
  } else if ((attempt || 0) < 30) {
    setTimeout(() => processInstagramEmbeds((attempt || 0) + 1), 300);
  }
}

// Respaldo del polling de arriba: si el script de Instagram termina de
// cargar recién después de que se agotaron los reintentos (red lenta),
// esto lo agarra igual en cuanto dispara su evento 'load'.
const igEmbedScript = document.querySelector('script[src*="instagram.com/embed.js"]');
if (igEmbedScript) {
  igEmbedScript.addEventListener('load', () => processInstagramEmbeds());
}

function notifyReady() {
  contentReady = true;
  readyCallbacks.splice(0).forEach(cb => cb(siteContent));
}

export function getContent() {
  return siteContent;
}

export function whenContentReady(callback) {
  if (contentReady) {
    callback(siteContent);
  } else {
    readyCallbacks.push(callback);
  }
}

function init() {
  fetch('/content.json')
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(data => {
      siteContent = data;
      render(data);
      notifyReady();
    })
    .catch(() => {
      notifyReady();
    });
}

init();

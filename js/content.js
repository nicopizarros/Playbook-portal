'use strict';

import {
  navLinksTemplate,
  opinionSectionHeadTemplate, opinionGridTemplate,
  productsSectionHeadTemplate, productsGridTemplate,
  midCtaTemplate,
  videoSectionHeadTemplate, videoFeatureTemplate, videoFeatureCopyTemplate, videoClipsTemplate,
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
  safeMount('video-feature-copy', videoFeatureCopyTemplate, data.videoSection.featured);
  safeMount('video-clips', videoClipsTemplate, data.videoSection);

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

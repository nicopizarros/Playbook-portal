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

function render(data) {
  mount('nav-links', navLinksTemplate(data.nav));
  const navCta = document.getElementById('nav-cta');
  if (navCta) {
    navCta.setAttribute('href', data.nav.ctaUrl);
    navCta.textContent = data.nav.ctaLabel;
  }

  mount('opinion-section-head', opinionSectionHeadTemplate(data.opinionSection));
  mount('opinion-grid', opinionGridTemplate(data.opinionSection));

  mount('products-section-head', productsSectionHeadTemplate(data.productsSection));
  mount('products-grid', productsGridTemplate(data.productsSection));

  mount('mid-cta-box', midCtaTemplate(data.midCta));

  mount('video-section-head', videoSectionHeadTemplate(data.videoSection));
  mount('video-feature', videoFeatureTemplate(data.videoSection.featured));
  mount('video-feature-copy', videoFeatureCopyTemplate(data.videoSection.featured));
  mount('video-clips', videoClipsTemplate(data.videoSection));

  mount('infinitas-section-head', infinitasSectionHeadTemplate(data.infinitasSection));
  mount('infinitas-wrap', infinitasWrapTemplate(data.infinitasSection));

  mount('stats-heading', statsHeadingTemplate(data.statsSection));
  mount('stats-grid', statsGridTemplate(data.statsSection));

  mount('testimonials-section-head', testimonialsSectionHeadTemplate(data.testimonialsSection));
  mount('testimonials-grid', testimonialsGridTemplate(data.testimonialsSection));

  mount('about-card', aboutCardTemplate(data.aboutSection));

  mount('footer-content', footerContentTemplate(data.footer));
  mount('footer-copyright', footerCopyrightTemplate(data.footer));

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
  fetch('/content.json?t=' + Date.now())
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

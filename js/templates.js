'use strict';

// Pure, DOM-free template functions: data -> HTML string.
// Imported by js/content.js (production render) and admin/dashboard.js (live
// preview) for the homepage content.json sections, so the two are
// guaranteed to produce identical markup — and also by js/articles.js,
// js/archive-page.js, js/article-page.js, and admin/dashboard.js again for
// the shared article tag-pill row (tagPillsRowTemplate below), which used
// to be duplicated near-identically in each of those files.

export function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

// escapeHtml prevents attribute-breakout, but doesn't validate URL scheme —
// a `javascript:` value has no special chars to escape. Content editors are
// trusted, but this collapses anything but http(s)/mailto/tel/relative/hash
// URLs to a harmless '#' so a compromised or mistaken editor entry can't
// turn into a click-to-execute link on the live homepage.
export function safeUrl(url) {
  const value = String(url == null ? '' : url).trim();
  if (value === '') return '';
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith('#') || value.startsWith('/')) return value;
  return '#';
}

const e = escapeHtml;
const su = url => e(safeUrl(url));

// ---------- Article tag pills ----------

// Renders an article's scope/sport/vertical tags as real links to their
// /tema.html topic page (js/tema-page.js) instead of static pills, so a
// reader can jump from "this piece is tagged Fútbol" to everything else
// tagged Fútbol. Shared by js/articles.js, js/archive-page.js,
// js/article-page.js, and admin/dashboard.js's live preview.
export function tagPillsRowTemplate(a) {
  const t = a.tags || {};
  const entries = [
    ...(t.scope || []).map(value => ({ tier: 'scope', value })),
    ...(t.sport || []).map(value => ({ tier: 'sport', value })),
    ...(t.vertical || []).map(value => ({ tier: 'vertical', value }))
  ];
  if (!entries.length) return '';
  return `<div class="tag-pill-row">${entries.map(({ tier, value }) =>
    `<a class="tag-mini" href="/tema.html?${tier}=${encodeURIComponent(value)}">${e(value)}</a>`
  ).join('')}</div>`;
}

// ---------- Nav ----------

export function navLinksTemplate(nav) {
  const links = nav.links.map(l =>
    `<a class="${l.variant === 'infinitas' ? 'nav-link-infinitas' : ''}" href="${su(l.href)}">${e(l.label)}</a>`
  ).join('');
  const cta = `<a class="btn nav-drawer-cta" href="${su(nav.ctaUrl)}" target="_blank" rel="noopener noreferrer">${e(nav.ctaLabel)}</a>`;
  return links + cta;
}

// ---------- Opinion section ----------

export function opinionCardTemplate(card) {
  if (card.variant === 'banner') {
    return `<a class="opinion-card tfbr reveal" href="${su(card.url)}" target="_blank" rel="noopener noreferrer">
      <img src="${e(card.image)}" width="900" height="160" alt="${e(card.imageAlt || card.title)}" loading="lazy" decoding="async" />
      <div class="tfbr-copy">
        <h3>${e(card.title)}</h3>
        <p>${e(card.excerpt)}</p>
      </div>
    </a>`;
  }
  return `<a class="opinion-card reveal" href="${su(card.url)}" target="_blank" rel="noopener noreferrer">
    <div class="masthead">${e(card.masthead)}</div>
    <h3>${e(card.title)}</h3>
    <p>${e(card.excerpt)}</p>
  </a>`;
}

export function opinionSectionHeadTemplate(data) {
  return `<div><h2>${e(data.heading)}</h2></div>
    <a class="section-link" href="${su(data.archiveLinkUrl)}" target="_blank" rel="noopener noreferrer">${e(data.archiveLinkLabel)}</a>`;
}

export function opinionGridTemplate(data) {
  return (data.cards || []).map(opinionCardTemplate).join('');
}

// ---------- Products section ----------

export function productCardTemplate(p) {
  const media = p.variant === 'glyph'
    ? `<div class="product-mark"><span class="glyph" aria-hidden="true">${e(p.glyph)}</span><span class="word">${e(p.wordmark)}</span></div>`
    : `<img class="product-banner" src="${e(p.image)}" width="900" height="160" alt="${e(p.imageAlt || '')}" loading="lazy" decoding="async" />`;
  const meta = p.meta ? `<span class="meta">${e(p.meta)}</span>` : '';
  return `<a class="product reveal" href="${su(p.url)}" target="_blank" rel="noopener noreferrer">
    ${media}
    <div class="product-copy">
      <p>${e(p.description)}</p>
      ${meta}
      <span class="product-arrow" aria-hidden="true">→</span>
    </div>
  </a>`;
}

export function productsSectionHeadTemplate(data) {
  return `<div><h2>${e(data.heading)}</h2></div>`;
}

export function productsGridTemplate(data) {
  return (data.products || []).map(productCardTemplate).join('');
}

// ---------- Mid CTA ----------

export function midCtaTemplate(data) {
  return `<div>
      <h2>${e(data.headingMain)} <em>${e(data.headingEm)}</em></h2>
      <p>${e(data.body)}</p>
    </div>
    <form class="pill-form mid-cta-form" action="${su(data.formUrl)}" target="_blank" rel="noopener noreferrer">
      <div class="nl-fields">
        <label class="visually-hidden" for="nl-email-2">Correo electrónico</label>
        <input id="nl-email-2" name="email" type="text" inputmode="email" placeholder="Tu correo" aria-label="Correo electrónico" autocomplete="email" required />
        <button class="btn" type="submit">${e(data.buttonLabel)}</button>
      </div>
      <p class="nl-success" role="status">${e(data.successMessage)}</p>
      <span class="nl-error" role="alert"></span>
    </form>`;
}

// ---------- Video section ----------

export function videoSectionHeadTemplate(data) {
  return `<div>
      <h2>${e(data.heading)}</h2>
      <p class="sub">${e(data.sub)}</p>
    </div>
    <a class="section-link" href="${su(data.channelLinkUrl)}" target="_blank" rel="noopener noreferrer">${e(data.channelLinkLabel)}</a>`;
}

export function videoFeatureTemplate(featured) {
  return `<div class="frame">
      <iframe src="https://www.youtube.com/embed/${e(featured.embedId)}" title="${e(featured.embedTitle)}" loading="lazy" allowfullscreen></iframe>
    </div>
    <h3 class="video-card-title">${e(featured.title)}</h3>`;
}

export function videoSecondaryTemplate(secondary) {
  const episodes = (secondary.episodeLinks || []).map(ep =>
    `<a href="${su(ep.url)}" target="_blank" rel="noopener noreferrer">${e(ep.label)} <span>Ver video</span></a>`
  ).join('');
  return `<div class="frame">
      <iframe src="https://www.youtube.com/embed/${e(secondary.embedId)}" title="${e(secondary.embedTitle)}" loading="lazy" allowfullscreen></iframe>
    </div>
    <h3 class="video-card-title">${e(secondary.title)}</h3>
    <div class="more-eps">${episodes}</div>`;
}

export function videoClipTemplate(clip) {
  if (clip.platform === 'instagram') {
    return `<a class="clip-card reveal" href="${su(clip.url)}" target="_blank" rel="noopener noreferrer">
      <div class="frame ig-visual${clip.variant ? ' ' + e(clip.variant) : ''}">
        <div class="ig-phone">${e(clip.handle)}<br><br>${e(clip.igText)}</div>
        <span class="platform-badge">Instagram</span>
        <div class="clip-copy"><span>${e(clip.handle)}</span><h4>${e(clip.title)}</h4></div>
      </div>
    </a>`;
  }
  return `<a class="clip-card reveal" href="${su(clip.url)}" target="_blank" rel="noopener noreferrer">
    <div class="frame">
      <img src="${e(clip.thumbnail)}" width="480" height="360" alt="${e(clip.title)}" loading="lazy" decoding="async" />
      <span class="platform-badge">YouTube</span>
      <div class="play-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.35)"/><path d="M10 8l6 4-6 4V8z" fill="#fff"/></svg></div>
      <div class="clip-copy"><span>${e(clip.handle)}</span><h4>${e(clip.title)}</h4></div>
    </div>
  </a>`;
}

export function videoClipsTemplate(data) {
  return (data.clips || []).map(videoClipTemplate).join('');
}

// Embed oficial de Instagram (oEmbed público vía embed.js, sin API key).
// Los blockquotes se inyectan como HTML crudo; js/content.js debe llamar a
// window.instgrm.Embeds.process() después de montarlos para que el script
// de Instagram los convierta en iframes. Ese script es bloqueado con
// frecuencia por ad-blockers y protecciones de tracking del navegador (Brave
// Shields, Safari ITP, etc.) — cuando eso pasa, el contenido de este
// blockquote (el <a> de abajo) es lo único que queda visible, así que tiene
// que verse como una tarjeta real y no como un link suelto. Si Instagram sí
// logra procesarlo, reemplaza este contenido por su propio iframe.
export function instagramReelTemplate(reel) {
  return `<blockquote class="instagram-media" data-instgrm-permalink="${su(reel.url)}" data-instgrm-version="14" style="background:var(--paper);border:0;border-radius:3px;margin:0 auto;max-width:400px;min-width:326px;width:100%;">
    <a class="ig-fallback-link" href="${su(reel.url)}" target="_blank" rel="noopener noreferrer">
      <svg class="ig-fallback-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.4" stroke="currentColor" stroke-width="1.6"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>
      <span>Ver reel en Instagram</span>
    </a>
  </blockquote>`;
}

export function instagramReelsTemplate(data) {
  return (data.instagramReels || []).map(instagramReelTemplate).join('');
}

// ---------- Infinitas section ----------

export function infinitasSectionHeadTemplate(data) {
  return `<div>
      <h2>${e(data.heading)}</h2>
      <p class="sub">${e(data.sub)}</p>
    </div>
    <a class="section-link" href="${su(data.linkUrl)}" target="_blank" rel="noopener noreferrer">${e(data.linkLabel)}</a>`;
}

function infCardTemplate(card, headingTag) {
  const H = headingTag || 'h3';
  return `<a class="inf-card reveal" href="${su(card.url)}" target="_blank" rel="noopener noreferrer">
    <img class="inf-bg" src="${e(card.image)}" width="1200" height="750" alt="" loading="lazy" decoding="async" />
    <div class="inf-content">
      <span class="eyebrow">${e(card.eyebrow)}</span>
      <${H}>${e(card.title)}</${H}>
      ${card.body ? `<p>${e(card.body)}</p>` : ''}
    </div>
  </a>`;
}

export function infinitasWrapTemplate(data) {
  const featured = infCardTemplate(data.featured, 'h3');
  const side = (data.sideCards || []).map(c => infCardTemplate(c, 'h4')).join('');
  return `${featured}
    <div class="inf-side">${side}</div>`;
}

// ---------- Stats section ----------

export function statsHeadingTemplate(data) {
  return e(data.heading);
}

export function statsGridTemplate(data) {
  return (data.stats || []).map(s =>
    `<div class="stat reveal"><b>${e(s.value)}</b><span>${e(s.label)}</span></div>`
  ).join('');
}

// ---------- Testimonials section ----------

export function testimonialsSectionHeadTemplate(data) {
  return `<div><h2>${e(data.heading)}</h2></div>`;
}

export function testimonialsGridTemplate(data) {
  return (data.testimonials || []).map(t => `<div class="quote reveal">
      <p>&quot;${e(t.quote)}&quot;</p>
      <div class="attribution">
        <span class="avatar" aria-hidden="true"></span>
        <div><b>${e(t.name)}</b><span>${e(t.role)}</span></div>
      </div>
    </div>`).join('');
}

// ---------- About section ----------

export function aboutCardTemplate(data) {
  return `<a class="about-visual reveal" href="${su(data.videoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Ver Al Banquillo en YouTube">
      <img src="${e(data.image)}" width="1280" height="720" alt="${e(data.imageAlt)}" loading="lazy" decoding="async" />
      <div class="about-visual-badge">
        <span>${e(data.badgeEyebrow)}</span>
        <strong>${e(data.badgeTitle)}</strong>
      </div>
    </a>
    <div class="about-copy reveal">
      <span class="eyebrow">${e(data.eyebrow)}</span>
      <p class="pull">${e(data.pullQuoteMain)}<span class="punct">.</span> <em>${e(data.pullQuoteEm)}<span class="punct">.</span></em></p>
      <p>${e(data.body)}</p>
      <div class="products-line">${e(data.productsLine)} <span>${e(data.productsLineNote)}</span></div>
      <div class="about-actions">
        ${(data.actions || []).map(a =>
          `<a class="btn ${e(a.style)}" href="${su(a.url)}" target="_blank" rel="noopener noreferrer">${e(a.label)}</a>`
        ).join('')}
      </div>
    </div>`;
}

// ---------- Footer ----------

export function footerContentTemplate(data) {
  const social = (data.socialLinks || []).map(s =>
    `<a class="pill" href="${su(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)}</a>`
  ).join('');
  return `<div class="footer-brand">
      <img src="/assets/img/playbook-logo-dark.png" width="180" height="44" alt="Playbook" loading="lazy" decoding="async" />
      <p>${e(data.brandBlurb)}</p>
    </div>
    <div>
      <div class="social-row">${social}</div>
      <div style="margin-top:12px;">
        <a class="pill inf-pill" href="${su(data.infinitasLinkUrl)}" target="_blank" rel="noopener noreferrer">${e(data.infinitasLinkLabel)}</a>
      </div>
    </div>`;
}

export function footerCopyrightTemplate(data) {
  return e(data.copyrightText);
}

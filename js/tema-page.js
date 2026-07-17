'use strict';

// Only tema.html loads this module. Reuses the articles.json fetch already
// in flight from js/articles.js, same pattern as archive-page.js/author-page.js.
// Unlike archivo.html (js/archive-page.js's overflowArticles(), which is
// deliberately "everything NOT on the homepage right now"), a topic page
// needs to show the FULL pool tagged with a value, homepage lead included
// — the opposite scope. That's why this is its own page instead of a mode
// of the archive.
import { whenArticlesReady, getArticles } from './articles.js';
import { rankArticles } from './rank.js';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS } from './taxonomy.js';

// window.location.origin, not a hardcoded domain literal — see the same
// fix (and why it mattered) in js/article-page.js, js/author-page.js.
const SITE_URL = window.location.origin;

const TIERS = {
  scope: SCOPE_OPTIONS,
  sport: SPORT_OPTIONS,
  vertical: VERTICAL_OPTIONS
};

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

// Upgrades the static feed.xml <link> shipped in tema.html's <head> to a
// topic-specific feed URL once the real tier/value are known — matches
// api/feed.js's optional ?scope=/sport=/vertical= filter.
function setAlternateFeed(href) {
  const link = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
  if (link) link.setAttribute('href', href);
}

function rowTemplate(a) {
  return `<a class="news-row reveal is-visible" data-source="${escapeHtml(a.source)}" href="/articulo.html?id=${escapeHtml(a.id)}">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
    </a>`;
}

// Reads exactly one of ?scope=/?sport=/?vertical= and validates it against
// the closed taxonomy in taxonomy.js. Unlike author-page.js (any string is
// a "plausible" author name), a topic page can and should tell a genuinely
// unknown tag apart from a real one that just has zero articles right now.
function parseTopicFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const present = Object.keys(TIERS).filter(tier => params.has(tier));
  if (present.length !== 1) return null;
  const tier = present[0];
  const value = params.get(tier);
  if (!value || TIERS[tier].indexOf(value) === -1) return null;
  return { tier, value };
}

function notFoundTemplate() {
  return `<div class="empty-state error-state">
      <p>No encontramos este tema.</p>
      <p><a href="/index.html">Volver a Playbook</a></p>
    </div>`;
}

function emptyTemplate(value) {
  return `<p class="empty-state">Todavía no hay artículos sobre ${escapeHtml(value)}.</p>`;
}

function render() {
  const root = document.getElementById('tema-root');
  const heading = document.getElementById('tema-heading');
  if (!root) return;

  const topic = parseTopicFromUrl();

  if (!topic) {
    document.title = 'Tema no encontrado — Playbook';
    setMeta('name', 'robots', 'noindex, nofollow');
    if (heading) heading.textContent = 'Tema';
    root.innerHTML = notFoundTemplate();
    document.dispatchEvent(new CustomEvent('playbook:tema-rendered'));
    return;
  }

  const { tier, value } = topic;
  const articles = rankArticles(getArticles().filter(a => ((a.tags || {})[tier] || []).indexOf(value) !== -1));
  const canonicalUrl = `${SITE_URL}/tema.html?${tier}=${encodeURIComponent(value)}`;

  setCanonical(canonicalUrl);
  setAlternateFeed(`${SITE_URL}/feed.xml?${tier}=${encodeURIComponent(value)}`);
  document.title = `${value} — Playbook`;
  if (heading) heading.textContent = value;

  if (articles.length) {
    setMeta('name', 'description', `Todo lo publicado en Playbook sobre ${value}.`);
    setMeta('name', 'robots', 'index, follow');
    root.innerHTML = `<div class="news-list">${articles.map(rowTemplate).join('')}</div>`;
  } else {
    setMeta('name', 'robots', 'noindex, follow');
    root.innerHTML = emptyTemplate(value);
  }

  document.dispatchEvent(new CustomEvent('playbook:tema-rendered'));
}

whenArticlesReady(render);

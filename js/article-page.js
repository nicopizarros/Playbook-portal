'use strict';

// Only articulo.html loads this module. It reuses the fetch already in
// flight from js/articles.js (loaded alongside it, on this page, purely for
// the ticker + search) instead of fetching articles.json a second time.
import { whenArticlesReady, getArticles } from './articles.js';

const SITE_URL = 'https://www.playbookmedia.mx';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/playbook-logo.webp`;
const RELATED_COUNT = 3;

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function tagPillsRow(a) {
  const t = a.tags || {};
  const all = [...(t.scope || []), ...(t.sport || []), ...(t.vertical || [])];
  if (!all.length) return '';
  return `<div class="tag-pill-row">${all.map(x => `<span class="tag-mini">${escapeHtml(x)}</span>`).join('')}</div>`;
}

// ---------------------------------------------------------------- SEO (Etapa 1)
// setAttribute() never parses its value as markup, so these are safe against
// injection even though article data ultimately comes from editors/RSS —
// unlike the innerHTML templates above, no escapeHtml() call is needed here.

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

function setJsonLd(data) {
  let script = document.getElementById('article-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-jsonld';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

// Every article page ships with the same static <title>/meta as a build-time
// fallback (see articulo.html <head>) since there's no server render step.
// This fills them in with the real article once articles.json has loaded, so
// social scrapers and search engines that execute JS (Googlebot, most social
// previews) see per-article data instead of one generic card for every URL.
function applyArticleSeo(article) {
  const canonicalUrl = `${SITE_URL}/articulo.html?id=${encodeURIComponent(article.id)}`;
  const image = article.imageUrl || DEFAULT_OG_IMAGE;
  const description = article.excerpt || '';

  document.title = `${article.title} — Playbook`;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', 'index, follow');
  setCanonical(canonicalUrl);

  setMeta('property', 'og:type', 'article');
  setMeta('property', 'og:site_name', 'Playbook');
  setMeta('property', 'og:title', article.title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:locale', 'es_MX');
  if (article.date) setMeta('property', 'article:published_time', article.date);
  if (article.publication) setMeta('property', 'article:section', article.publication);

  setMeta('name', 'twitter:card', article.imageUrl ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', article.title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description,
    image: [image],
    datePublished: article.date || undefined,
    dateModified: article.date || undefined,
    articleSection: article.publication || undefined,
    inLanguage: 'es-MX',
    author: { '@type': 'Organization', name: article.publication || 'Playbook' },
    publisher: {
      '@type': 'Organization',
      name: 'Playbook',
      logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl }
  });
}

// A not-found id still gets a valid, crawlable page — this just keeps search
// engines from indexing it as if it were real content under a random URL.
function applyNotFoundSeo() {
  document.title = 'Artículo no encontrado — Playbook';
  setMeta('name', 'robots', 'noindex, follow');
}

// ---------------------------------------------------------------- Related articles

function sharedTags(a, b) {
  const ta = a.tags || {}, tb = b.tags || {};
  const bAll = new Set([...(tb.scope || []), ...(tb.sport || []), ...(tb.vertical || [])]);
  return [...(ta.scope || []), ...(ta.sport || []), ...(ta.vertical || [])]
    .filter(t => bAll.has(t)).length;
}

// Ranks the rest of the pool by tag overlap (plus a same-source nudge), then
// tops up with the most recent remaining articles so a thinly-tagged piece
// still gets a full "sigue leyendo" row instead of one or two links.
function relatedArticles(article, pool) {
  const others = pool.filter(a => a.id !== article.id);
  const scored = others
    .map(a => ({ a, score: sharedTags(article, a) + (a.source === article.source ? 1 : 0) }))
    .filter(x => x.score > 0)
    .sort((x, y) => y.score - x.score || (y.a.date || '').localeCompare(x.a.date || ''))
    .map(x => x.a);

  const picked = scored.slice(0, RELATED_COUNT);
  if (picked.length < RELATED_COUNT) {
    const usedIds = new Set([article.id, ...picked.map(a => a.id)]);
    const filler = others
      .filter(a => !usedIds.has(a.id))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    picked.push(...filler.slice(0, RELATED_COUNT - picked.length));
  }
  return picked;
}

function relatedRowTemplate(a) {
  return `<a class="news-row reveal is-visible" data-source="${escapeHtml(a.source)}" href="/articulo.html?id=${escapeHtml(a.id)}">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
    </a>`;
}

function relatedSection(article, pool) {
  const related = relatedArticles(article, pool);
  if (!related.length) return '';
  return `<section class="article-related">
      <h2>Sigue leyendo</h2>
      <div class="news-list">${related.map(relatedRowTemplate).join('')}</div>
    </section>`;
}

// Decorative filler shown blurred below the real teaser, as a visual hook
// toward the Substack CTA — fixed placeholder copy, not per-article data,
// so it's not real content and must never be mistaken for it (aria-hidden,
// unselectable, see .article-blur-filler in css/article.css).
const BLUR_FILLER_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam.',
  'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.'
];

function blurFillerBlock() {
  const paragraphs = BLUR_FILLER_PARAGRAPHS.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  return `<div class="article-body article-blur-filler" aria-hidden="true">${paragraphs}</div>`;
}

function articleTemplate(a) {
  const photo = a.imageUrl
    ? `<div class="lead-photo article-photo"><img src="${escapeHtml(a.imageUrl)}" alt="${escapeHtml(a.title)}" fetchpriority="high" decoding="async" /></div>`
    : '';
  const paragraphs = String(a.teaser || a.excerpt || '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p)}</p>`)
    .join('');
  return `<article class="article-detail">
      <span class="tag">${escapeHtml(a.publication)}</span>
      ${photo}
      <h1>${escapeHtml(a.title)}</h1>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
      ${tagPillsRow(a)}
      <div class="article-body">${paragraphs || `<p>${escapeHtml(a.excerpt || '')}</p>`}</div>
      ${blurFillerBlock()}
      <a class="btn article-cta" href="${escapeHtml(a.substack_url)}" target="_blank" rel="noopener noreferrer">Leer la nota completa</a>
    </article>`;
}

function notFoundTemplate() {
  return `<div class="empty-state error-state article-not-found">
      <p>No encontramos este artículo.</p>
      <p><a href="/index.html">Volver a Playbook</a></p>
    </div>`;
}

function render() {
  const root = document.getElementById('article-root');
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const pool = getArticles();
  const article = id ? pool.find(a => a.id === id) : null;

  if (article) {
    root.innerHTML = articleTemplate(article) + relatedSection(article, pool);
    applyArticleSeo(article);
  } else {
    root.innerHTML = notFoundTemplate();
    applyNotFoundSeo();
  }
  document.dispatchEvent(new CustomEvent('playbook:article-rendered'));
}

whenArticlesReady(render);

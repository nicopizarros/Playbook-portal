'use strict';

// Only articulo.html loads this module. It reuses the fetch already in
// flight from js/articles.js (loaded alongside it, on this page, purely for
// the ticker + search) instead of fetching articles.json a second time.
import { whenArticlesReady, getArticles } from './articles.js';
import { track } from './analytics.js';

const SITE_URL = 'https://www.playbookmedia.mx';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/playbook-logo.webp`;
const RELATED_COUNT = 3;
const SCROLL_MILESTONES = [25, 50, 75, 100];

// Only site-wide config this page needs (the author-byline switch), fetched
// directly instead of importing js/content.js — that module's render() also
// targets index.html-only sections (nav, opinion grid, etc.) that don't
// exist here, so pulling it in would do unrelated, wasted rendering work.
let siteSettings = null;

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
  const articleBody = article.teaser || article.excerpt || '';

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
    articleBody,
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

// Shows the author when the article opts in individually (mostrar_autor) or
// when the team has turned it on site-wide from the admin's Ajustes tab
// (content.json siteSettings.mostrarAutorGlobal) — either one is enough.
function shouldShowAuthor(a) {
  return a.mostrar_autor === true || (siteSettings && siteSettings.mostrarAutorGlobal === true);
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
  const authorBit = shouldShowAuthor(a) && a.author ? ` · Por ${escapeHtml(a.author)}` : '';
  return `<article class="article-detail">
      <span class="tag">${escapeHtml(a.publication)}</span>
      ${photo}
      <h1>${escapeHtml(a.title)}</h1>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min${authorBit}</div>
      ${tagPillsRow(a)}
      <div class="article-body">${paragraphs || `<p>${escapeHtml(a.excerpt || '')}</p>`}</div>
      <a class="btn light article-cta" href="${escapeHtml(a.substack_url)}" target="_blank" rel="noopener noreferrer">Ver en Substack</a>
    </article>`;
}

function notFoundTemplate() {
  return `<div class="empty-state error-state article-not-found">
      <p>No encontramos este artículo.</p>
      <p><a href="/index.html">Volver a Playbook</a></p>
    </div>`;
}

// Tracks how far into the article body a reader actually gets. 100% is the
// meaningful "read to the end" signal now that the body is the full article
// and not a teaser — no separate "article complete" event needed.
function initScrollTracking(articleId) {
  const body = document.querySelector('.article-body');
  if (!body) return;
  const sent = new Set();

  function check() {
    const rect = body.getBoundingClientRect();
    if (rect.height <= 0) return;
    const seen = Math.min(rect.height, Math.max(0, window.innerHeight - rect.top));
    const percent = Math.round((seen / rect.height) * 100);
    SCROLL_MILESTONES.forEach(milestone => {
      if (percent >= milestone && !sent.has(milestone)) {
        sent.add(milestone);
        track('article_scroll', { article_id: articleId, percent: milestone });
      }
    });
    if (sent.size === SCROLL_MILESTONES.length) window.removeEventListener('scroll', onScroll);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => { check(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  check();
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
    track('article_view', {
      article_id: article.id,
      article_title: article.title,
      publication: article.publication,
      source: article.source
    });
    initScrollTracking(article.id);
  } else {
    root.innerHTML = notFoundTemplate();
    applyNotFoundSeo();
  }
  document.dispatchEvent(new CustomEvent('playbook:article-rendered'));
}

// Waits on both articles.json (the article itself) and content.json (the
// global author-visibility switch) before the first render, so a slow
// content.json fetch can't cause the byline to render without the author
// and then never update.
let articlesReady = false;
function tryRender() {
  if (articlesReady && siteSettings !== null) render();
}

whenArticlesReady(() => { articlesReady = true; tryRender(); });

fetch('/content.json')
  .then(r => (r.ok ? r.json() : {}))
  .catch(() => ({}))
  .then(data => { siteSettings = data.siteSettings || {}; tryRender(); });

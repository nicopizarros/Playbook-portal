'use strict';

// Only articulo.html loads this module. It reuses the fetch already in
// flight from js/articles.js (loaded alongside it, on this page, purely for
// the ticker + search) instead of fetching articles.json a second time.
import { whenArticlesReady, getArticles } from './articles.js';

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
  const article = id ? getArticles().find(a => a.id === id) : null;
  root.innerHTML = article ? articleTemplate(article) : notFoundTemplate();
  document.title = article ? `${article.title} — Playbook` : 'Artículo no encontrado — Playbook';
  document.dispatchEvent(new CustomEvent('playbook:article-rendered'));
}

whenArticlesReady(render);

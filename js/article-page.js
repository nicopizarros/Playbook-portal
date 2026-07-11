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

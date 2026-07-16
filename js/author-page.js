'use strict';

// Only autor.html loads this module. Reuses the articles.json fetch already
// in flight from js/articles.js (loaded alongside it for the ticker +
// search), same pattern as js/archive-page.js and js/article-page.js.
import { whenArticlesReady, getArticles } from './articles.js';

const SITE_URL = 'https://www.playbookmedia.mx';

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

function rowTemplate(a) {
  return `<a class="news-row reveal is-visible" data-source="${escapeHtml(a.source)}" href="/articulo.html?id=${escapeHtml(a.id)}">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
    </a>`;
}

function emptyTemplate(name) {
  return name
    ? `<p class="empty-state">Todavía no hay artículos de este autor.</p>`
    : `<div class="empty-state error-state">
        <p>No encontramos a este autor.</p>
        <p><a href="/index.html">Volver a Playbook</a></p>
      </div>`;
}

function render() {
  const root = document.getElementById('author-root');
  const heading = document.getElementById('author-heading');
  if (!root) return;

  const name = new URLSearchParams(window.location.search).get('nombre');
  const articles = name
    ? getArticles().filter(a => a.author === name).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    : [];

  const canonicalUrl = `${SITE_URL}/autor.html${name ? '?nombre=' + encodeURIComponent(name) : ''}`;
  setCanonical(canonicalUrl);

  if (heading) heading.textContent = name || 'Autor';

  if (name && articles.length) {
    document.title = `${name} — Playbook`;
    setMeta('name', 'description', `Artículos publicados por ${name} en Playbook.`);
    setMeta('name', 'robots', 'index, follow');
    root.innerHTML = `<div class="news-list">${articles.map(rowTemplate).join('')}</div>`;
  } else {
    document.title = 'Autor — Playbook';
    setMeta('name', 'robots', 'noindex, follow');
    root.innerHTML = emptyTemplate(name);
  }

  document.dispatchEvent(new CustomEvent('playbook:author-rendered'));
}

whenArticlesReady(render);

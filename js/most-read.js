'use strict';

// Homepage "Más leídas" module. Pulls real GA4 pageview data from
// /api/top-articles (backed by lib/ga4.js) — if GA4 isn't configured yet,
// or has no data for the window, the endpoint returns an empty list and
// this whole section just stays hidden. No hardcoded popularity numbers.

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function rowTemplate(a) {
  return `<a class="news-row reveal is-visible" data-source="${escapeHtml(a.source)}" href="/articulo.html?id=${escapeHtml(a.id)}">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
    </a>`;
}

fetch('/api/top-articles')
  .then(r => (r.ok ? r.json() : { articles: [] }))
  .catch(() => ({ articles: [] }))
  .then(data => {
    const articles = Array.isArray(data.articles) ? data.articles : [];
    if (!articles.length) return;

    const section = document.getElementById('mas-leidas');
    const list = document.getElementById('mas-leidas-list');
    if (!section || !list) return;

    list.innerHTML = articles.map(rowTemplate).join('');
    section.hidden = false;
  });

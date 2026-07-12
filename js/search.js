'use strict';

import { getArticles, whenArticlesReady } from './articles.js';

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function matches(article, query) {
  const q = query.toLowerCase();
  return (article.title || '').toLowerCase().includes(q)
    || (article.excerpt || '').toLowerCase().includes(q)
    || (article.publication || '').toLowerCase().includes(q);
}

function resultTemplate(a) {
  return `<a class="sr-item" href="/articulo.html?id=${escapeHtml(a.id)}" target="_blank" rel="noopener noreferrer">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <h4>${escapeHtml(a.title)}</h4>
    </a>`;
}

function initSearch() {
  const wrap = document.querySelector('.nav-search');
  const input = wrap ? wrap.querySelector('input[type="search"]') : null;
  const results = document.getElementById('search-results');
  if (!wrap || !input || !results) return;

  function open() { results.classList.add('is-open'); }
  function close() { results.classList.remove('is-open'); }

  function runSearch() {
    const query = input.value.trim();
    if (!query) {
      results.innerHTML = '';
      close();
      return;
    }
    const matched = getArticles().filter(a => matches(a, query)).slice(0, 8);
    if (!matched.length) {
      results.innerHTML = `<p class="sr-empty">Sin resultados para "${escapeHtml(query)}"</p>`;
    } else {
      results.innerHTML = matched.map(resultTemplate).join('');
    }
    open();
  }

  input.addEventListener('input', runSearch);
  input.addEventListener('focus', () => { if (input.value.trim()) open(); });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      close();
      input.blur();
    }
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) close();
  });

  whenArticlesReady(() => {
    if (input.value.trim()) runSearch();
  });
}

initSearch();

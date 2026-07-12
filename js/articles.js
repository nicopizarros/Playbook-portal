'use strict';

import { rankArticles, selectHero } from './rank.js';

const KNOWN_SOURCES = ['industry-shots', 'la-lana', 'infinitas', 'playbook'];
const LEAD_COUNT = 1;
const LIST_COUNT = 5;
const STRIP_COUNT = 0;
const TICKER_COUNT = 6;
const FILTER_FADE_MS = 180;

let allArticles = [];
let activeSource = 'all';
let articlesReady = false;
const readyCallbacks = [];

function normalizeSource(article) {
  if (KNOWN_SOURCES.indexOf(article.source) !== -1) return article.source;
  console.warn(`[Playbook] Artículo con "source" desconocido o ausente ("${article.source}"). Usando "playbook" por defecto.`, article);
  return 'playbook';
}

function bySourceFiltered() {
  const pool = activeSource === 'all'
    ? allArticles
    : allArticles.filter(a => a.source === activeSource);
  return rankArticles(pool);
}

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

function leadTemplate(a) {
  const photo = a.imageUrl
    ? `<div class="lead-photo"><img src="${escapeHtml(a.imageUrl)}" alt="${escapeHtml(a.title)}" fetchpriority="high" decoding="async" /></div>`
    : '';
  return `<a class="lead-story reveal" data-source="${escapeHtml(a.source)}" href="/articulo.html?id=${escapeHtml(a.id)}">
      ${photo}
      <span class="tag">${escapeHtml(a.publication)}</span>
      <h1>${escapeHtml(a.title)}</h1>
      <p class="desc">${escapeHtml(a.excerpt)}</p>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
      ${tagPillsRow(a)}
    </a>`;
}

function rowTemplate(a, heading) {
  const H = heading || 'h3';
  return `<a class="news-row reveal" data-source="${escapeHtml(a.source)}" href="/articulo.html?id=${escapeHtml(a.id)}">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <${H}>${escapeHtml(a.title)}</${H}>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
    </a>`;
}

function skeletonCard() {
  return `<div class="skeleton-card">
      <div class="skel skel-badge"></div>
      <div class="skel skel-title"></div>
      <div class="skel skel-title skel--short"></div>
      <div class="skel skel-desc"></div>
      <div class="skel skel-meta"></div>
    </div>`;
}

function renderSkeleton() {
  const grid = document.getElementById('news-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="news-list">${skeletonCard()}${skeletonCard()}${skeletonCard()}</div>`;
}

function render() {
  const filtered = bySourceFiltered();

  const grid = document.getElementById('news-grid');
  if (grid) {
    if (!filtered.length) {
      grid.innerHTML = '<p class="empty-state">Sin artículos en esta categoría todavía.</p>';
    } else {
      const hero = selectHero(filtered);
      const list = filtered.filter(a => a !== hero).slice(0, LIST_COUNT);
      const leadHtml = hero ? leadTemplate(hero) : '';
      const listHtml = `<div class="news-list">${list.map(a => rowTemplate(a, 'h3')).join('')}</div>`;
      grid.innerHTML = leadHtml + listHtml;
    }
  }

  const verMasBtn = document.getElementById('btn-ver-archivo');
  if (verMasBtn) {
    const overflow = Math.max(0, filtered.length - LEAD_COUNT - LIST_COUNT);
    verMasBtn.textContent = overflow > 0 ? `Ver más (${overflow})` : 'Ver más';
  }

  document.dispatchEvent(new CustomEvent('playbook:rendered'));
}

function renderTicker() {
  const ranked = rankArticles(allArticles).slice(0, TICKER_COUNT);
  const el = document.getElementById('ticker-content');
  if (!ranked.length || !el) return;
  const visible = ranked.map(a => `<span class="ticker-item">${escapeHtml(a.title)}</span>`).join('');
  const duplicate = ranked.map(a => `<span class="ticker-item" aria-hidden="true">${escapeHtml(a.title)}</span>`).join('');
  el.innerHTML = visible + duplicate; // duplicado intencional (marcado aria-hidden) para el loop del CSS
}

function applyFilterChange(source) {
  const grid = document.getElementById('news-grid');
  activeSource = source;
  if (grid) grid.classList.add('fade-swap', 'is-fading');
  window.setTimeout(() => {
    render();
    if (grid) grid.classList.remove('is-fading');
  }, FILTER_FADE_MS);
}

function notifyReady() {
  articlesReady = true;
  const detail = { articles: allArticles };
  document.dispatchEvent(new CustomEvent('playbook:articles-loaded', { detail }));
  readyCallbacks.splice(0).forEach(cb => cb(allArticles));
}

export function getArticles() {
  return allArticles;
}

export function whenArticlesReady(callback) {
  if (articlesReady) {
    callback(allArticles);
  } else {
    readyCallbacks.push(callback);
  }
}

function init() {
  renderSkeleton();

  fetch('/articles.json')
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(data => {
      const rawArticles = Array.isArray(data.articles) ? data.articles : [];
      allArticles = rawArticles.map(a => ({ ...a, source: normalizeSource(a) }));
      render();
      renderTicker();
      notifyReady();
    })
    .catch(() => {
      const grid = document.getElementById('news-grid');
      if (grid) grid.innerHTML = '<p class="empty-state error-state">No se pudieron cargar los artículos. Intenta recargar la página.</p>';
      notifyReady();
    });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      applyFilterChange(this.dataset.source);
    });
  });
}

init();

'use strict';

const KNOWN_SOURCES = ['industry-shots', 'la-lana', 'infinitas', 'playbook'];
const LEAD_COUNT = 1;
const LIST_COUNT = 6;
const STRIP_COUNT = 4;
const TICKER_COUNT = 6;
const FILTER_FADE_MS = 180;
const SUBSTACK_URL = 'https://playbookmedia.substack.com/';

let allArticles = [];
let activeSource = 'all';
let archivoVisible = false;
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
  // Ranking: mayor "priority" = más importante; si empatan, la fecha más reciente gana.
  return pool.slice().sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 0;
    const pb = typeof b.priority === 'number' ? b.priority : 0;
    if (pb !== pa) return pb - pa;
    return (b.date || '').localeCompare(a.date || '');
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function readTime(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function leadTemplate(a) {
  const photo = a.imageUrl
    ? `<div class="lead-photo"><img src="${escapeHtml(a.imageUrl)}" alt="${escapeHtml(a.title)}" fetchpriority="high" decoding="async" /></div>`
    : '';
  return `<article class="lead-story reveal" data-source="${escapeHtml(a.source)}">
      ${photo}
      <span class="tag">${escapeHtml(a.publication)}</span>
      <h1>${escapeHtml(a.title)}</h1>
      <p class="desc">${escapeHtml(a.excerpt)}</p>
      <div class="byline"><b>${escapeHtml(a.author)}</b> · ${escapeHtml(a.dateFormatted)} · ${readTime(a.excerpt)} min</div>
    </article>`;
}

function rowTemplate(a, heading) {
  const H = heading || 'h3';
  return `<a class="news-row reveal" data-source="${escapeHtml(a.source)}" href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <${H}>${escapeHtml(a.title)}</${H}>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${readTime(a.excerpt)} min</div>
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
  const lead = filtered.slice(0, LEAD_COUNT);
  const list = filtered.slice(LEAD_COUNT, LEAD_COUNT + LIST_COUNT);
  const strip = filtered.slice(LEAD_COUNT + LIST_COUNT, LEAD_COUNT + LIST_COUNT + STRIP_COUNT);
  const archivo = filtered.slice(LEAD_COUNT + LIST_COUNT + STRIP_COUNT);

  const grid = document.getElementById('news-grid');
  if (grid) {
    if (!filtered.length) {
      grid.innerHTML = '<p class="empty-state">Sin artículos en esta categoría todavía.</p>';
    } else {
      const leadHtml = lead.map(leadTemplate).join('');
      const listHtml = `<div class="news-list">${list.map(a => rowTemplate(a, 'h3')).join('')}</div>`;
      grid.innerHTML = leadHtml + listHtml;
    }
  }

  const stripEl = document.getElementById('news-strip');
  if (stripEl) {
    stripEl.innerHTML = strip.map(a => rowTemplate(a, 'h4')).join('');
    stripEl.style.display = strip.length ? 'grid' : 'none';
  }

  const archEl = document.getElementById('archivo-container');
  if (archEl) {
    archEl.innerHTML = archivo.length
      ? archivo.map(a => rowTemplate(a, 'h3')).join('')
      : '<p class="empty-state">No hay más artículos.</p>';
    archEl.style.display = (archivoVisible && archivo.length > 0) ? 'flex' : 'none';
  }

  const btn = document.getElementById('btn-ver-archivo');
  if (btn) {
    btn.setAttribute('aria-expanded', String(archivoVisible && archivo.length > 0));
    if (archivo.length > 0) {
      btn.textContent = archivoVisible ? 'Ocultar archivo' : `Ver archivo (${archivo.length} más)`;
      btn.onclick = function () {
        archivoVisible = !archivoVisible;
        render();
      };
    } else {
      btn.textContent = 'Ver en Substack';
      btn.onclick = function () {
        window.open(SUBSTACK_URL, '_blank', 'noopener,noreferrer');
      };
    }
  }

  document.dispatchEvent(new CustomEvent('playbook:rendered'));
}

function renderTicker() {
  const ranked = allArticles.slice().sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 0;
    const pb = typeof b.priority === 'number' ? b.priority : 0;
    return pb - pa;
  }).slice(0, TICKER_COUNT);
  const el = document.getElementById('ticker-content');
  if (!ranked.length || !el) return;
  const visible = ranked.map(a => `<span class="ticker-item">${escapeHtml(a.title)}</span>`).join('');
  const duplicate = ranked.map(a => `<span class="ticker-item" aria-hidden="true">${escapeHtml(a.title)}</span>`).join('');
  el.innerHTML = visible + duplicate; // duplicado intencional (marcado aria-hidden) para el loop del CSS
}

function applyFilterChange(source) {
  const grid = document.getElementById('news-grid');
  const strip = document.getElementById('news-strip');
  activeSource = source;
  archivoVisible = false;
  if (grid) grid.classList.add('fade-swap', 'is-fading');
  if (strip) strip.classList.add('fade-swap', 'is-fading');
  window.setTimeout(() => {
    render();
    if (grid) grid.classList.remove('is-fading');
    if (strip) strip.classList.remove('is-fading');
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

  fetch('/articles.json?t=' + Date.now())
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

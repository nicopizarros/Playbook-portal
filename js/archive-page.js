'use strict';

// Only archivo.html loads this module. Reuses the articles.json fetch already
// in flight from js/articles.js (loaded alongside it for the ticker + search)
// and the shared ranking logic from js/rank.js, so "what's on the homepage"
// (and therefore what counts as overflow here) is defined in exactly one place.
import { whenArticlesReady, getArticles } from './articles.js';
import { rankArticles, selectHero } from './rank.js';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS } from './taxonomy.js';

const LEAD_COUNT = 1;
const LIST_COUNT = 5;
const FILTER_FADE_MS = 180;

const TAG_TIERS = [
  { key: 'scope', label: 'Alcance', options: SCOPE_OPTIONS },
  { key: 'sport', label: 'Deporte', options: SPORT_OPTIONS },
  { key: 'vertical', label: 'Vertical de negocio', options: VERTICAL_OPTIONS }
];

let activeSource = 'all';
const activeTags = { scope: 'all', sport: 'all', vertical: 'all' };

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

function rowTemplate(a) {
  return `<a class="news-row reveal" data-source="${escapeHtml(a.source)}" href="/articulo.html?id=${escapeHtml(a.id)}" target="_blank" rel="noopener noreferrer">
      <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
      ${tagPillsRow(a)}
    </a>`;
}

// The homepage shows 1 hero + LIST_COUNT cards, always ranked from the FULL,
// unfiltered pool — the archive's "overflow" is defined against that same
// unfiltered pool so it matches whatever a visitor actually saw on Playbook's
// homepage, regardless of which filters are active here.
function overflowArticles() {
  const all = getArticles();
  const ranked = rankArticles(all);
  const hero = selectHero(ranked);
  const list = ranked.filter(a => a !== hero).slice(0, LIST_COUNT);
  const shownIds = new Set([hero, ...list].filter(Boolean).map(a => a.id));
  return ranked.filter(a => !shownIds.has(a.id));
}

function matchesActiveFilters(a) {
  if (activeSource !== 'all' && a.source !== activeSource) return false;
  const tags = a.tags || {};
  return TAG_TIERS.every(tier => {
    const active = activeTags[tier.key];
    return active === 'all' || (tags[tier.key] || []).indexOf(active) !== -1;
  });
}

function render() {
  const listEl = document.getElementById('archive-list');
  if (!listEl) return;
  const filtered = overflowArticles().filter(matchesActiveFilters);
  listEl.innerHTML = filtered.length
    ? filtered.map(rowTemplate).join('')
    : '<p class="empty-state">No hay más artículos con estos filtros.</p>';
  document.dispatchEvent(new CustomEvent('playbook:archive-rendered'));
}

function applyFilterChange() {
  const listEl = document.getElementById('archive-list');
  if (listEl) listEl.classList.add('is-fading');
  window.setTimeout(() => {
    render();
    if (listEl) listEl.classList.remove('is-fading');
  }, FILTER_FADE_MS);
}

function buildTagFilters() {
  const wrap = document.getElementById('archive-tag-filters');
  if (!wrap) return;
  wrap.innerHTML = TAG_TIERS.map(tier => `
    <div class="tag-filter-group" role="group" aria-label="Filtrar por ${escapeHtml(tier.label)}">
      <span class="tag-filter-label">${escapeHtml(tier.label)}</span>
      <button class="filter-btn active" data-tier="${tier.key}" data-value="all" aria-pressed="true">Todo</button>
      ${tier.options.map(o => `<button class="filter-btn" data-tier="${tier.key}" data-value="${escapeHtml(o)}" aria-pressed="false">${escapeHtml(o)}</button>`).join('')}
    </div>
  `).join('');

  wrap.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const tier = this.dataset.tier;
      wrap.querySelectorAll(`.filter-btn[data-tier="${tier}"]`).forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      activeTags[tier] = this.dataset.value;
      applyFilterChange();
    });
  });
}

document.querySelectorAll('#archive-source-filter .filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    activeSource = this.dataset.source;
    applyFilterChange();
  });
});

buildTagFilters();
whenArticlesReady(render);

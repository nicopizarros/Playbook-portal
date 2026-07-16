'use strict';

// Only archivo.html loads this module. Reuses the articles.json fetch already
// in flight from js/articles.js (loaded alongside it for the ticker + search)
// and the shared ranking logic from js/rank.js, so "what's on the homepage"
// (and therefore what counts as overflow here) is defined in exactly one place.
import { whenArticlesReady, getArticles } from './articles.js';
import { rankArticles, selectHero } from './rank.js';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS } from './taxonomy.js';
import { tagPillsRowTemplate } from './templates.js';

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

// .news-row is no longer the anchor itself — see the same note in
// js/articles.js's leadTemplate for why (tag pills now link to
// /tema.html, and an <a> can't nest inside another <a>).
function rowTemplate(a) {
  return `<div class="news-row reveal" data-source="${escapeHtml(a.source)}">
      <a class="card-link" href="/articulo.html?id=${escapeHtml(a.id)}">
        <span class="tag-mini ${escapeHtml(a.source)}">${escapeHtml(a.publication)}</span>
        <h3>${escapeHtml(a.title)}</h3>
        <div class="byline">${escapeHtml(a.dateFormatted)} · ${escapeHtml(a.reading_time || 1)} min</div>
      </a>
      ${tagPillsRowTemplate(a)}
    </div>`;
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
      <button class="filter-btn${activeTags[tier.key] === 'all' ? ' active' : ''}" data-tier="${tier.key}" data-value="all" aria-pressed="${activeTags[tier.key] === 'all'}">Todo</button>
      ${tier.options.map(o => `<button class="filter-btn${activeTags[tier.key] === o ? ' active' : ''}" data-tier="${tier.key}" data-value="${escapeHtml(o)}" aria-pressed="${activeTags[tier.key] === o}">${escapeHtml(o)}</button>`).join('')}
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
      syncUrl();
      applyFilterChange();
    });
  });
}

// Reflects activeSource/activeTags on the static (server-rendered) source
// filter buttons — buildTagFilters() above generates its own buttons fresh
// each call so it can bake state in directly, but #archive-source-filter's
// markup lives in archivo.html and always starts hardcoded to "Todo".
function syncSourceButtonsUi() {
  document.querySelectorAll('#archive-source-filter .filter-btn').forEach(btn => {
    const isActive = btn.dataset.source === activeSource;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

// Reads ?source=&scope=&sport=&vertical= so a filtered view of /archivo.html
// is reloadable/shareable/bookmarkable. Unrecognized values just render an
// empty result (existing "No hay más artículos con estos filtros." state)
// rather than being validated here — unlike tema.html's topic pages, this
// page has no need to distinguish "bad value" from "valid value, no matches".
function readStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const source = params.get('source');
  if (source) activeSource = source;
  TAG_TIERS.forEach(tier => {
    const value = params.get(tier.key);
    if (value) activeTags[tier.key] = value;
  });
}

// Mirrors current filter state into the URL with history.replaceState (not
// pushState): filters get clicked repeatedly in one browsing session, and
// making every click its own back-button stop would turn "go back" into
// "undo last filter" instead of "leave the page". The address bar still
// ends up shareable/bookmarkable, which is all "URL-addressable" requires.
function syncUrl() {
  const params = new URLSearchParams();
  if (activeSource !== 'all') params.set('source', activeSource);
  TAG_TIERS.forEach(tier => {
    if (activeTags[tier.key] !== 'all') params.set(tier.key, activeTags[tier.key]);
  });
  const query = params.toString();
  history.replaceState(null, '', query ? `${location.pathname}?${query}` : location.pathname);
}

document.querySelectorAll('#archive-source-filter .filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    activeSource = this.dataset.source;
    syncSourceButtonsUi();
    syncUrl();
    applyFilterChange();
  });
});

readStateFromUrl();
syncSourceButtonsUi();
buildTagFilters();
whenArticlesReady(render);

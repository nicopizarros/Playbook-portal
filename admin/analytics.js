'use strict';

// Standalone analytics dashboard for the admin panel — see api/analytics-data.js
// and lib/vercel-analytics.js for where the data actually comes from and why
// "top articles" needs a custom event instead of the automatic pageview data.

const TOKEN_KEY = 'playbook_admin_token';
const USERNAME_KEY = 'playbook_admin_username';

const state = {
  token: sessionStorage.getItem(TOKEN_KEY) || null,
  username: sessionStorage.getItem(USERNAME_KEY) || '',
  charts: {}
};

if (!state.token) {
  window.location.replace('/admin');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function formatNumber(n) {
  return typeof n === 'number' ? n.toLocaleString('es-MX') : '—';
}

function truncate(str, max) {
  const s = String(str || '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function deltaBadge(value) {
  if (value === null || value === undefined) {
    return '<span class="analytics-delta is-neutral">sin referencia</span>';
  }
  const sign = value > 0 ? '+' : '';
  const kind = value > 0 ? 'is-up' : value < 0 ? 'is-down' : 'is-neutral';
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '·';
  return `<span class="analytics-delta ${kind}">${arrow} ${sign}${value}%</span>`;
}

function setStatus(text, kind) {
  const el = document.getElementById('admin-status');
  if (!el) return;
  el.textContent = text;
  el.className = 'admin-status' + (kind === 'ok' ? ' is-ok' : kind === 'error' ? ' is-error' : '');
}

function showToast(message, kind) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = 'admin-toast' + (kind === 'error' ? ' is-error' : '');
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 250);
  }, 4200);
}

function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
  window.location.replace('/admin');
}

async function apiLoadAnalytics() {
  const res = await fetch('/api/analytics-data', {
    headers: { Authorization: 'Bearer ' + state.token }
  });
  if (res.status === 401) {
    logout();
    throw new Error('Sesión expirada, vuelve a entrar.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'No se pudo cargar la analítica');
  return body;
}

// ---------------------------------------------------------------- KPI cards

function kpiCardHtml(label, stats) {
  if (!stats || stats.pageviews === null || stats.pageviews === undefined) {
    return `<div class="analytics-kpi-card">
        <span class="analytics-kpi-label">${escapeHtml(label)}</span>
        <p class="analytics-kpi-empty">Sin datos todavía</p>
      </div>`;
  }
  return `<div class="analytics-kpi-card">
      <span class="analytics-kpi-label">${escapeHtml(label)}</span>
      <div class="analytics-kpi-row">
        <div>
          <b>${formatNumber(stats.pageviews)}</b>
          <span>vistas</span>
          ${deltaBadge(stats.deltaPageviews)}
        </div>
        <div>
          <b>${formatNumber(stats.visitors)}</b>
          <span>visitantes</span>
          ${deltaBadge(stats.deltaVisitors)}
        </div>
      </div>
    </div>`;
}

function renderKpis(kpis) {
  const el = document.getElementById('analytics-kpis');
  if (!el) return;
  el.innerHTML = [
    kpiCardHtml('Hoy', kpis.today),
    kpiCardHtml('Últimos 7 días', kpis.last7),
    kpiCardHtml('Últimos 30 días', kpis.last30)
  ].join('');
}

// ---------------------------------------------------------------- Panels

function emptyPanelHtml(message) {
  return `<p class="analytics-empty">${escapeHtml(message)}</p>`;
}

function destroyChart(key) {
  if (state.charts[key]) {
    state.charts[key].destroy();
    delete state.charts[key];
  }
}

// Chart.js is loaded from a CDN (see admin/analytics.html) — if that fails
// to load, this just no-ops and the plain <ol> list next to it still shows
// the same numbers, so a blocked/offline CDN degrades the page, not breaks it.
function barChart(key, canvasId, labels, values, color) {
  destroyChart(key);
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;
  state.charts[key] = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 4, maxBarThickness: 22 }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + formatNumber(ctx.parsed.x) + ' vistas' } }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { ticks: { autoSkip: false, font: { size: 11 } } }
      }
    }
  });
}

function renderTopArticles(panel) {
  const body = document.querySelector('#panel-top-articles .analytics-panel-body');
  if (!body) return;
  if (!panel.available) {
    body.innerHTML = emptyPanelHtml('No se pudo cargar. Revisa que los eventos personalizados de Vercel Analytics estén disponibles en este plan (ver lib/vercel-analytics.js).');
    return;
  }
  if (!panel.items.length) {
    body.innerHTML = emptyPanelHtml('Todavía no hay suficientes datos.');
    return;
  }
  body.innerHTML = `
    <div class="analytics-chart-wrap"><canvas id="chart-top-articles"></canvas></div>
    <ol class="analytics-list">
      ${panel.items.map(a => `<li><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.title)}</a><b>${formatNumber(a.count)}</b></li>`).join('')}
    </ol>`;
  const chartItems = panel.items.slice().reverse();
  barChart('topArticles', 'chart-top-articles',
    chartItems.map(a => truncate(a.title, 40)),
    chartItems.map(a => a.count),
    '#9aea39');
}

function renderReferrers(panel) {
  const body = document.querySelector('#panel-referrers .analytics-panel-body');
  if (!body) return;
  if (!panel.available) {
    body.innerHTML = emptyPanelHtml('No se pudo cargar este panel.');
    return;
  }
  if (!panel.items.length) {
    body.innerHTML = emptyPanelHtml('Todavía no hay suficientes datos.');
    return;
  }
  body.innerHTML = `
    <div class="analytics-chart-wrap"><canvas id="chart-referrers"></canvas></div>
    <ol class="analytics-list">
      ${panel.items.map(r => `<li><span>${escapeHtml(r.label)}</span><b>${formatNumber(r.pageviews)}</b></li>`).join('')}
    </ol>`;
  const chartItems = panel.items.slice().reverse();
  barChart('referrers', 'chart-referrers',
    chartItems.map(r => truncate(r.label, 26)),
    chartItems.map(r => r.pageviews),
    '#1c2b4a');
}

function barListHtml(panel) {
  if (!panel.available) return emptyPanelHtml('No se pudo cargar este panel.');
  if (!panel.items.length) return emptyPanelHtml('Todavía no hay suficientes datos.');
  const max = Math.max(...panel.items.map(i => i.pageviews)) || 1;
  return `<div class="analytics-barlist">
      ${panel.items.map(i => `
        <div class="analytics-barlist-row">
          <span class="analytics-barlist-label">${escapeHtml(i.label)}</span>
          <div class="analytics-barlist-track"><div class="analytics-barlist-fill" style="width:${Math.round((i.pageviews / max) * 100)}%"></div></div>
          <span class="analytics-barlist-value">${formatNumber(i.pageviews)}</span>
        </div>`).join('')}
    </div>`;
}

function renderCountries(panel) {
  const body = document.querySelector('#panel-countries .analytics-panel-body');
  if (body) body.innerHTML = barListHtml(panel);
}

function renderDevices(panel) {
  const body = document.querySelector('#panel-devices .analytics-panel-body');
  if (body) body.innerHTML = barListHtml(panel);
}

// ---------------------------------------------------------------- Boot

function formatUpdatedAt(iso) {
  try {
    return 'Actualizado ' + new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

async function load() {
  const refreshBtn = document.getElementById('analytics-refresh');
  setStatus('Cargando…');
  if (refreshBtn) refreshBtn.disabled = true;
  try {
    const data = await apiLoadAnalytics();
    renderKpis(data.kpis);
    renderTopArticles(data.topArticles);
    renderReferrers(data.referrers);
    renderCountries(data.countries);
    renderDevices(data.devices);
    const updatedEl = document.getElementById('analytics-updated');
    if (updatedEl) updatedEl.textContent = formatUpdatedAt(data.updatedAt);
    if (data.error) {
      setStatus(data.error, 'error');
      showToast(data.error, 'error');
    } else {
      setStatus('Listo', 'ok');
    }
  } catch (err) {
    setStatus('Error al cargar', 'error');
    showToast(err.message || 'No se pudo cargar la analítica.', 'error');
    const updatedEl = document.getElementById('analytics-updated');
    if (updatedEl) updatedEl.textContent = 'No se pudo actualizar';
    ['top-articles', 'referrers', 'countries', 'devices'].forEach(id => {
      const body = document.querySelector(`#panel-${id} .analytics-panel-body`);
      if (body) body.innerHTML = emptyPanelHtml('No se pudo cargar la analítica en este momento.');
    });
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

function init() {
  const whoEl = document.getElementById('admin-whoami');
  if (whoEl) whoEl.textContent = state.username ? `Sesión: ${state.username}` : '';
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  const refreshBtn = document.getElementById('analytics-refresh');
  if (refreshBtn) refreshBtn.addEventListener('click', load);
  load();
}

init();

'use client';

import { useState } from 'react';
import type { AnalyticsSnapshot, PeriodKpi } from '@/lib/analytics-data';
import { refreshAnalytics } from '@/lib/actions/analytics';
import { BarChart } from './BarChart';

function formatNumber(n: number | null | undefined) {
  return (n ?? 0).toLocaleString('es-MX');
}

function formatUpdatedAt(iso: string) {
  return `Actualizado ${new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="analytics-delta is-neutral">sin referencia</span>;
  }
  const kind = value > 0 ? 'is-up' : value < 0 ? 'is-down' : 'is-neutral';
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '·';
  const sign = value > 0 ? '+' : '';
  return <span className={`analytics-delta ${kind}`}>{arrow} {sign}{value}%</span>;
}

function KpiCard({ label, kpi }: { label: string; kpi: PeriodKpi }) {
  return (
    <div className="analytics-kpi-card">
      <div className="analytics-kpi-label">{label}</div>
      {kpi.pageviews === null ? (
        <p className="analytics-kpi-empty">Sin datos todavía</p>
      ) : (
        <div className="analytics-kpi-row">
          <div>
            <b>{formatNumber(kpi.pageviews)}</b>
            <span>Vistas <DeltaBadge value={kpi.deltaPageviews} /></span>
          </div>
          <div>
            <b>{formatNumber(kpi.visitors)}</b>
            <span>Visitantes <DeltaBadge value={kpi.deltaVisitors} /></span>
          </div>
        </div>
      )}
    </div>
  );
}

function BarList({ items }: { items: { label: string; pageviews: number }[] }) {
  if (!items.length) return <p className="analytics-empty">Todavía no hay suficientes datos.</p>;
  const max = Math.max(1, ...items.map(i => i.pageviews));
  return (
    <div className="analytics-barlist">
      {items.map((item, i) => (
        <div className="analytics-barlist-row" key={i}>
          <span className="analytics-barlist-label">{item.label}</span>
          <div className="analytics-barlist-track">
            <div className="analytics-barlist-fill" style={{ width: `${(item.pageviews / max) * 100}%` }} />
          </div>
          <span className="analytics-barlist-value">{formatNumber(item.pageviews)}</span>
        </div>
      ))}
    </div>
  );
}

function unavailableMessage(panel: string) {
  if (panel === 'topArticles') {
    return 'No se pudo cargar — este panel necesita eventos personalizados (permiso "Custom Events" de Vercel Analytics, ver lib/vercel-analytics.ts).';
  }
  return 'No se pudo cargar este panel todavía.';
}

export function AnalyticsView({ initialSnapshot }: { initialSnapshot: AnalyticsSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const fresh = await refreshAnalytics();
      setSnapshot(fresh);
      if (fresh.error) setError(fresh.error);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="analytics-page">
      <div className="analytics-head">
        <div>
          <h2 className="admin-section-title">Analítica</h2>
          <p className="admin-section-desc">Tráfico del sitio en los últimos 30 días.</p>
        </div>
        <div className="analytics-head-actions">
          <span className="analytics-updated">{error ? 'No se pudo actualizar' : formatUpdatedAt(snapshot.updatedAt)}</span>
          <button type="button" className="btn-mini" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="analytics-kpi-grid">
        <KpiCard label="Hoy" kpi={snapshot.kpis.today} />
        <KpiCard label="Últimos 7 días" kpi={snapshot.kpis.last7} />
        <KpiCard label="Últimos 30 días" kpi={snapshot.kpis.last30} />
      </div>

      <div className="analytics-panel-grid">
        <section className="analytics-panel">
          <h3 className="analytics-panel-title">
            Artículos más leídos <span className="analytics-panel-sub">últimos 30 días</span>
          </h3>
          {snapshot.topArticles.available ? (
            <BarChart
              labels={snapshot.topArticles.items.map(a => a.title)}
              values={snapshot.topArticles.items.map(a => a.count)}
              color="#9aea39"
            />
          ) : (
            <p className="analytics-empty">{unavailableMessage('topArticles')}</p>
          )}
          {snapshot.topArticles.available && snapshot.topArticles.items.length > 0 && (
            <ul className="analytics-list">
              {snapshot.topArticles.items.map(a => (
                <li key={a.id}>
                  <a href={a.url}>{a.title}</a>
                  <b>{formatNumber(a.count)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="analytics-panel">
          <h3 className="analytics-panel-title">
            Referidos <span className="analytics-panel-sub">últimos 30 días</span>
          </h3>
          {snapshot.referrers.available ? (
            <BarChart
              labels={snapshot.referrers.items.map(r => r.label)}
              values={snapshot.referrers.items.map(r => r.pageviews)}
              color="#1c2b4a"
            />
          ) : (
            <p className="analytics-empty">{unavailableMessage('referrers')}</p>
          )}
        </section>

        <section className="analytics-panel">
          <h3 className="analytics-panel-title">
            Países <span className="analytics-panel-sub">últimos 30 días</span>
          </h3>
          {snapshot.countries.available ? (
            <BarList items={snapshot.countries.items} />
          ) : (
            <p className="analytics-empty">{unavailableMessage('countries')}</p>
          )}
        </section>

        <section className="analytics-panel">
          <h3 className="analytics-panel-title">
            Dispositivos <span className="analytics-panel-sub">últimos 30 días</span>
          </h3>
          {snapshot.devices.available ? (
            <BarList items={snapshot.devices.items} />
          ) : (
            <p className="analytics-empty">{unavailableMessage('devices')}</p>
          )}
        </section>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { rankArticles, selectHero } from '@/lib/rank';
import { LEAD_COUNT, LIST_COUNT, KNOWN_SOURCES, SOURCE_LABELS } from '@/lib/constants';
import type { Article } from '@/lib/data/articles';
import { LeadStory } from '../article/LeadStory';
import { NewsRow } from '../article/NewsRow';

const FILTERS: { source: string; label: string }[] = [
  { source: 'all', label: 'Todo' },
  ...KNOWN_SOURCES.map(source => ({ source, label: SOURCE_LABELS[source] })),
];

// Ported from legacy/js/articles.js's render()/applyFilterChange(). All 30
// articles are already on the page (server-rendered, no fetch delay), so
// this is a pure client-side re-filter — the 180ms fade is cosmetic, not
// covering a loading state.
export function NewsGrid({ articles }: { articles: Article[] }) {
  const [activeSource, setActiveSource] = useState('all');
  const [isFading, setIsFading] = useState(false);

  function selectSource(source: string) {
    if (source === activeSource) return;
    setIsFading(true);
    window.setTimeout(() => {
      setActiveSource(source);
      setIsFading(false);
    }, 180);
  }

  const pool = activeSource === 'all' ? articles : articles.filter(a => a.source === activeSource);
  const filtered = rankArticles(pool);
  const hero = selectHero(filtered);
  const list = filtered.filter(a => a !== hero).slice(0, LIST_COUNT);
  const overflow = Math.max(0, filtered.length - LEAD_COUNT - LIST_COUNT);

  return (
    <>
      <div className="section-head" style={{ borderBottom: 'none', marginBottom: 0, paddingTop: 0 }}>
        <div>
          <h2>Último en Playbook</h2>
          <p className="sub">
            La casa editorial para entender el negocio del deporte: newsletter, portal, video y
            comunidad en un mismo sistema editorial.
          </p>
        </div>
        <Link className="section-link" id="btn-ver-archivo" href="/archivo">
          {overflow > 0 ? `Ver más (${overflow})` : 'Ver más'}
        </Link>
      </div>

      <div className="source-filter" role="group" aria-label="Filtrar por fuente">
        {FILTERS.map(f => (
          <button
            key={f.source}
            className={`filter-btn${activeSource === f.source ? ' active' : ''}`}
            data-source={f.source}
            aria-pressed={activeSource === f.source}
            onClick={() => selectSource(f.source)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        <div className={`news-grid fade-swap${isFading ? ' is-fading' : ''}`}>
          {!filtered.length ? (
            <p className="empty-state">Sin artículos en esta categoría todavía.</p>
          ) : (
            <>
              {hero && <LeadStory article={hero} />}
              <div className="news-list">
                {list.map(a => (
                  <NewsRow key={a.id} article={a} heading="h3" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

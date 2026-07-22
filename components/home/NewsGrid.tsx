'use client';

import { useState } from 'react';
import Link from 'next/link';
import { rankArticles, selectHero } from '@/lib/rank';
import { LEAD_COUNT, LIST_COUNT, FEED_COUNT, KNOWN_SOURCES, SOURCE_LABELS } from '@/lib/constants';
import type { Article } from '@/lib/data/articles';
import { LeadStory } from '../article/LeadStory';
import { NewsRow } from '../article/NewsRow';
import { StoryCard } from './StoryCard';
import { AdSlot } from '@/components/ads/AdSlot';

const FILTERS: { source: string; label: string }[] = [
  { source: 'all', label: 'Todo' },
  ...KNOWN_SOURCES.map(source => ({ source, label: SOURCE_LABELS[source] })),
];

// Ported from legacy/js/articles.js's render()/applyFilterChange(). All 30
// articles are already on the page (server-rendered, no fetch delay), so
// this is a pure client-side re-filter — the 180ms fade is cosmetic, not
// covering a loading state.
//
// Fase 7 UX layout, top to bottom:
//   1. Lead package — hero + 5-row list (the pre-existing news-grid).
//   2. leaderboard-home ad slot, between the lead package and the feed.
//   3. Two columns: story-card feed (v23 prototype pattern, with the
//      inline-feed ad slot after the sixth card) on the left, sticky
//      sidebar (Most Read + rail ad) on the right. The sidebar arrives as
//      a pre-rendered ReactNode from the server (see HomeSidebar) so this
//      client component never re-renders it — source filters only re-rank
//      the articles.
export function NewsGrid({ articles, sidebar }: { articles: Article[]; sidebar?: React.ReactNode }) {
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
  const feed = filtered.filter(a => a !== hero).slice(LIST_COUNT, LIST_COUNT + FEED_COUNT);
  const shown = (hero ? LEAD_COUNT : 0) + list.length + feed.length;
  const overflow = Math.max(0, filtered.length - shown);

  // The inline-feed slot goes after the sixth card of the feed grid — when
  // the active filter leaves fewer than six, it trails the last one.
  const adIndex = Math.min(6, feed.length);
  const feedWithAd: React.ReactNode[] = feed.map(a => <StoryCard key={a.id} article={a} />);
  if (feed.length > 0) {
    feedWithAd.splice(adIndex, 0, <AdSlot key="ad-inline-feed" slot="inline-feed" />);
  }

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

        <AdSlot slot="leaderboard-home" />

        <div className="home-columns">
          <div className={`home-feed fade-swap${isFading ? ' is-fading' : ''}`}>
            {feed.length > 0 && <div className="feed-grid">{feedWithAd}</div>}
          </div>
          <aside className="home-sidebar" aria-label="Lo más leído y patrocinio">
            {sidebar}
          </aside>
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { rankArticles, selectHero } from '@/lib/rank';
import { LEAD_COUNT, LIST_COUNT, KNOWN_SOURCES, SOURCE_LABELS } from '@/lib/constants';
import type { Article } from '@/lib/data/articles';
import { LeadStory } from '../article/LeadStory';
import { NewsRow } from '../article/NewsRow';
import { AdSlot } from '@/components/ads/AdSlot';
import { gsap } from '@/lib/gsap';

// 'opinion' is deliberately excluded from BOTH the filter chips and the
// story pool below. The homepage now renders a live Análisis/Opinión
// section immediately under this band, built from exactly these articles
// (see components/sections/OpinionSection.tsx) — so leaving them in the
// news package meant the same piece could appear twice on one screen, and
// gave the chip row an "Opinión" filter that duplicated a whole section
// sitting a few hundred pixels lower. This band is the NEWS package;
// opinion has its own home.
const NEWS_SOURCES = KNOWN_SOURCES.filter(source => source !== 'opinion');

const FILTERS: { source: string; label: string }[] = [
  { source: 'all', label: 'Todo' },
  ...NEWS_SOURCES.map(source => ({ source, label: SOURCE_LABELS[source] })),
];

// Ported from legacy/js/articles.js's render()/applyFilterChange(). All 30
// articles are already on the page (server-rendered, no fetch delay), so
// this is a pure client-side re-filter — the 180ms fade is cosmetic, not
// covering a loading state.
//
// The news package is deliberately compact: hero + 5-row list + 300px
// sidebar in ONE three-column band. The 1+5 count is a negotiated
// compromise with the sales side (keep the text block short so readers
// reach the commercial sections quickly) — do not grow it; polish it.
// A first pass of this session added a 9-card feed below it and that was
// reverted for exactly this reason. The inline-feed ad slot sits after
// the sixth story (end of the list), native format, collapsed while
// empty (see styles/ads.css). The sidebar (Más leídas + rail ad +
// newsletter module) arrives as a pre-rendered ReactNode from the server
// (see HomeSidebar) — source filters re-rank the stories without ever
// re-rendering it.
export function NewsGrid({ articles, sidebar }: { articles: Article[]; sidebar?: React.ReactNode }) {
  const [activeSource, setActiveSource] = useState('all');
  const gridRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Was a CSS class toggle (.is-fading) paired with a 180ms setTimeout
  // guessing when the fade-out would finish — except .fade-swap's actual
  // CSS transition ran on --duration-base (220ms), so the DOM swap fired
  // 40ms before the fade-out visually completed: a real, visible glitch
  // (new content flashing in through the still-fading-out old content),
  // not just a rougher edge. Driving both the fade-out and the swap from
  // the same GSAP tween's onComplete keeps them from ever drifting apart
  // again — the swap can't run before the fade finishes by construction.
  function selectSource(source: string) {
    if (source === activeSource) return;
    const el = gridRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveSource(source);
      return;
    }
    gsap.to(el, {
      opacity: 0,
      duration: 0.18,
      ease: 'power1.in',
      onComplete: () => setActiveSource(source),
    });
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = gridRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.to(el, { opacity: 1, duration: 0.22, ease: 'power1.out' });
  }, [activeSource]);

  const news = articles.filter(a => a.source !== 'opinion');
  const pool = activeSource === 'all' ? news : news.filter(a => a.source === activeSource);
  const filtered = rankArticles(pool);
  const hero = selectHero(filtered);
  const list = filtered.filter(a => a !== hero).slice(0, LIST_COUNT);
  const overflow = Math.max(0, filtered.length - LEAD_COUNT - LIST_COUNT);

  return (
    <>
      <div className="section-head" style={{ borderBottom: 'none', marginBottom: 0, paddingTop: 0 }}>
        <div>
          <h2>Último en Playbook</h2>
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
        <div className="news-grid" ref={gridRef}>
          {!filtered.length ? (
            <p className="empty-state">Sin artículos en esta categoría todavía.</p>
          ) : (
            <>
              {hero && <LeadStory article={hero} />}
              <div className="news-list">
                {list.map(a => (
                  <NewsRow key={a.id} article={a} heading="h3" />
                ))}
                <AdSlot slot="inline-feed" />
              </div>
            </>
          )}
          <aside className="home-sidebar" aria-label="Lo más leído y newsletter">
            {sidebar}
          </aside>
        </div>
      </div>
    </>
  );
}

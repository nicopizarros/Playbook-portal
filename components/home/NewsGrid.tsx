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

// 'opinion' is deliberately excluded from the filter chips. The homepage
// renders a live Análisis/Opinión section immediately under this band,
// built from exactly those articles (see components/sections/
// OpinionSection.tsx) — an "Opinión" chip here would duplicate a whole
// section sitting a few hundred pixels lower. This band is the NEWS
// package; opinion has its own home.
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
  // The source a still-running fade-out will commit when it finishes — the
  // guard below must compare against it, not against activeSource: state
  // only commits at fade-out completion, so during those 180ms
  // activeSource still holds the OUTGOING source, and a quick "back to
  // where I was" click (Todo → Infinitas → Todo… then Infinitas again
  // within the fade) matched the stale state and was silently swallowed.
  // That was the intermittent "hero keeps showing the news hero" bug: the
  // last click lost, whichever fade happened to be in flight won.
  const pendingSource = useRef<string | null>(null);
  // Single in-flight tween (fade-out or fade-in). Each click kills it
  // before starting its own: a killed tween's onComplete never fires, so a
  // superseded selection can never commit after a newer one — last click
  // wins by construction, without delays or forced re-renders.
  const fadeTween = useRef<ReturnType<typeof gsap.to> | null>(null);

  // Was a CSS class toggle (.is-fading) paired with a 180ms setTimeout
  // guessing when the fade-out would finish — except .fade-swap's actual
  // CSS transition ran on --duration-base (220ms), so the DOM swap fired
  // 40ms before the fade-out visually completed: a real, visible glitch
  // (new content flashing in through the still-fading-out old content),
  // not just a rougher edge. Driving both the fade-out and the swap from
  // the same GSAP tween's onComplete keeps them from ever drifting apart
  // again — the swap can't run before the fade finishes by construction.
  function selectSource(source: string) {
    if (source === (pendingSource.current ?? activeSource)) return;
    const el = gridRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pendingSource.current = null;
      fadeTween.current?.kill();
      fadeTween.current = null;
      setActiveSource(source);
      return;
    }
    pendingSource.current = source;
    fadeTween.current?.kill();
    fadeTween.current = gsap.to(el, {
      opacity: 0,
      duration: 0.18,
      ease: 'power1.in',
      onComplete: () => {
        pendingSource.current = null;
        setActiveSource(source);
        // Fade-in chained here rather than from a [activeSource] effect:
        // when the fade lands back on the source already committed (the
        // swallowed-click scenario above, now allowed through), setState
        // is a no-op, no re-render happens, and an effect would never run
        // — leaving the grid parked at opacity 0. The state update above
        // flushes in a microtask, before this tween's first RAF tick, so
        // the swap still happens behind the fade.
        fadeTween.current = gsap.to(el, { opacity: 1, duration: 0.22, ease: 'power1.out' });
      },
    });
  }

  // Navigating away mid-fade must not leave a tween ticking on a detached
  // node (its onComplete would also set state on an unmounted component).
  useEffect(() => () => fadeTween.current?.kill(), []);

  // Ref instead of a `selectSource` dependency: this listener is registered
  // once and must always call the CURRENT selectSource (it closes over
  // activeSource each render), not the one from whichever render happened
  // to run when the listener was attached.
  const selectSourceRef = useRef(selectSource);
  selectSourceRef.current = selectSource;

  // BrandLink.tsx dispatches this when the logo is clicked while already on
  // "/" (a plain Link href="/" is a no-op in that case, so filtering down
  // to one source and clicking the logo did nothing — real bug report,
  // 2026-08-01). Brings the 5+1 back to its default "all" view.
  useEffect(() => {
    function resetToDefault() {
      selectSourceRef.current('all');
    }
    window.addEventListener('playbook:reset-home', resetToDefault);
    return () => window.removeEventListener('playbook:reset-home', resetToDefault);
  }, []);

  // Roadmap Agosto 2026, Fase 4: opinion pieces stay out of the 5+1 by
  // default (see the NEWS_SOURCES comment above), but an editor can force
  // one in by marking it `featured` -- the same "editor's deliberate call"
  // flag rank.ts's selectHero()/featuredBoost() already use to promote a
  // story into the hero slot, extended here to also unlock a featured
  // opinion piece INTO the pool at all (a non-featured one still never
  // competes, never mind wins). No new field, no second override
  // mechanism: reuses exactly the escape hatch that already exists.
  const news = articles.filter(a => a.source !== 'opinion' || a.featured);
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

      <div className="news-grid-more">
        <Link className="section-link" id="btn-ver-archivo" href="/archivo">
          {overflow > 0 ? `Más noticias (${overflow})` : 'Más noticias'}
        </Link>
      </div>
    </>
  );
}

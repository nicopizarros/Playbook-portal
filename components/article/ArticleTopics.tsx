'use client';

import { useRef } from 'react';
import type { Article } from '@/lib/data/articles';
import { topicsForSection, type TaxonomyTier } from '@/lib/taxonomy';
import { gsap } from '@/lib/gsap';

const TIER_COLUMN: Record<TaxonomyTier, 'tagsScope' | 'tagsSport' | 'tagsVertical'> = {
  scope: 'tagsScope',
  sport: 'tagsSport',
  vertical: 'tagsVertical',
};

// Full topic index at the foot of an article — collapsed by default behind
// a native <details> disclosure (user feedback, 2026-07-23: readers should
// never be greeted by taxonomy; it's an index you opt into, like a filter).
// <details>/<summary> on purpose: works with JS disabled, keyboard
// accessible for free, and the chips stay in the DOM so /tema links remain
// crawlable. Square chips = metadata (same family as the .tag publication
// chip), round = action (.btn/.filter-btn) — the shape distinction is part
// of the system.
//
// The open/close itself is animated (this file is 'use client' for exactly
// that): native <details> has no transition of its own — the content just
// snaps in/out — so the summary's click is intercepted to drive a GSAP
// height tween instead, while `open` still reflects real state throughout
// (nothing here changes what a no-JS reader gets). Closing has to run the
// collapse animation BEFORE flipping `open` off, since the browser removes
// the content from layout the instant `open` goes false and there'd be
// nothing left to animate.
//
// ——— 2026-07-24: the row is per-section now, not one generic order for
// every article on the site. Which tier leads, and how the disclosure is
// worded, comes from lib/taxonomy.ts's SECTION_TOPICS keyed on the
// article's `source`; see that table for the reasoning behind each
// section's order. Ordering only — no tier is hidden, so nothing an editor
// tagged stops being reachable, and `data-tier` still drives the visual
// weighting in CSS.
export function ArticleTopics({
  article,
}: {
  article: Pick<Article, 'source' | 'tagsScope' | 'tagsSport' | 'tagsVertical'>;
}) {
  const { order, label } = topicsForSection(article.source);
  const entries = order.flatMap(tier =>
    article[TIER_COLUMN[tier]].map(value => ({ tier, value })),
  );

  const listRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  function handleSummaryClick(e: React.MouseEvent<HTMLElement>) {
    const details = e.currentTarget.closest('details');
    const list = listRef.current;
    if (!details || !list || animatingRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    e.preventDefault();
    animatingRef.current = true;

    if (details.open) {
      const height = list.scrollHeight;
      gsap.fromTo(
        list,
        { height, opacity: 1 },
        {
          height: 0,
          opacity: 0,
          duration: 0.28,
          ease: 'power2.inOut',
          onComplete() {
            details.open = false;
            gsap.set(list, { clearProps: 'height,opacity' });
            animatingRef.current = false;
          },
        },
      );
    } else {
      details.open = true;
      const height = list.scrollHeight;
      gsap.fromTo(
        list,
        { height: 0, opacity: 0 },
        {
          height,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
          onComplete() {
            gsap.set(list, { clearProps: 'height,opacity' });
            animatingRef.current = false;
          },
        },
      );
    }
  }

  if (!entries.length) return null;

  return (
    <details className="article-topics" data-source={article.source}>
      <summary className="article-topics-summary" onClick={handleSummaryClick}>
        <span className="article-topics-label">
          {label} <span className="article-topics-count">({entries.length})</span>
        </span>
        <svg className="article-topics-chevron" viewBox="0 0 12 8" width="11" height="7" aria-hidden="true">
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="article-topics-list" ref={listRef}>
        {entries.map(({ tier, value }) => (
          <a
            key={`${tier}-${value}`}
            className="topic-chip"
            data-tier={tier}
            href={`/tema?${tier}=${encodeURIComponent(value)}`}
          >
            {value}
          </a>
        ))}
      </div>
    </details>
  );
}

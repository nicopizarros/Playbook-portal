import { rankArticles } from '@/lib/rank';
import { TICKER_COUNT } from '@/lib/constants';
import type { Article } from '@/lib/data/articles';
import { TickerScramble } from './TickerScramble';

// Server component; the marquee scroll and hover-to-pause stay plain CSS
// (see styles/header.css's @keyframes scrollTicker). TickerScramble adds
// the one JS touch — the label flaps in split-flap style on load
// (La Portada, 2026-08-05) — width-locked so the track never shifts.
// The item list is duplicated with aria-hidden on the second copy,
// same as legacy/js/articles.js's renderTicker, to feed the CSS loop.
export function Ticker({ articles }: { articles: Article[] }) {
  const ranked = rankArticles(articles).slice(0, TICKER_COUNT);
  if (!ranked.length) return null;

  return (
    <div className="ticker">
      <div className="ticker-label">
        <span className="dot" aria-hidden="true"></span>
        <span className="ticker-label-text">Playbook hoy</span>
        <TickerScramble />
      </div>
      <div className="ticker-track">
        <div className="ticker-content" aria-label="Titulares del día">
          {ranked.map(a => (
            <span className="ticker-item" key={a.id}>{a.title}</span>
          ))}
          {ranked.map(a => (
            <span className="ticker-item" aria-hidden="true" key={`dup-${a.id}`}>{a.title}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

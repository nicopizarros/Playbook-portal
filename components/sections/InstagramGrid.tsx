import { safeUrl } from '@/lib/safe-url';
import type { InstagramReel } from '@/lib/data/site-content';

// Fase 7 UX replacement for the old InstagramReels embed widgets
// (components/sections/InstagramReels.tsx, removed in the same session):
// no Instagram script, no
// third-party iframe, no like counts, no embed chrome — and therefore no
// blank-gap failure mode when embed.js is blocked or silently dropped
// (the live-site bug this replaces; see HANDOFF.md's LazyEmbed entry for
// the network trace that documented it). Each reel renders as a clean
// 9/16 tile in the site's own visual language (the ig-visual gradient +
// green frame already used by the video clip cards) linking straight out
// to Instagram, with one profile link below the grid.
//
// Instagram's oEmbed thumbnails require loading their script or hitting
// their API — both reintroduce exactly the dependency this removes — so
// the tiles are deliberately typographic/brand surfaces, not photos.
function reelLabel(index: number) {
  return `Reel ${String(index + 1).padStart(2, '0')}`;
}

export function InstagramGrid({
  reels,
  profileUrl,
  handle,
}: {
  reels: InstagramReel[];
  profileUrl: string;
  handle: string;
}) {
  if (!reels.length) return null;

  return (
    <div className="ig-grid-wrap">
      <div className="ig-reels-head reveal">
        <h3>Playbook en Instagram</h3>
      </div>
      <div className="ig-grid reveal">
        {reels.map((reel, i) => (
          <a
            key={i}
            className="ig-tile"
            href={safeUrl(reel.url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="ig-tile-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
            </svg>
            <span className="ig-tile-handle">{handle}</span>
            <span className="ig-tile-label">{reelLabel(i)} · Ver en Instagram</span>
          </a>
        ))}
      </div>
      <a
        className="ig-profile-link reveal"
        href={safeUrl(profileUrl)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver en Instagram →
      </a>
    </div>
  );
}

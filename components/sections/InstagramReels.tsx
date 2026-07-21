'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { safeUrl } from '@/lib/safe-url';
import type { InstagramReel } from '@/lib/data/site-content';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

// Ported from legacy/js/content.js's processInstagramEmbeds(). Instagram's
// oEmbed script (embed.js) only auto-converts blockquotes present at the
// moment it first loads — anything rendered after that (which, with a
// third-party async script racing page render, is basically guaranteed
// here) needs Embeds.process() called explicitly. Retries for a few
// seconds in case embed.js is still loading; a load listener catches it if
// that races past the retry budget on a slow connection. If Instagram's
// script never loads at all (ad-blockers, tracking protection — common),
// the blockquote's fallback link (below) is what stays visible.
function useInstagramEmbedProcessing() {
  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function tryProcess() {
      if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      } else if (attempts < 30) {
        attempts += 1;
        timer = setTimeout(tryProcess, 300);
      }
    }
    tryProcess();
    return () => clearTimeout(timer);
  }, []);
}

function ReelFallback({ reel }: { reel: InstagramReel }) {
  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={safeUrl(reel.url)}
      data-instgrm-version="14"
      style={{ background: '#FAF8F5', border: 0, borderRadius: 3, margin: '0 auto', maxWidth: 400, minWidth: 326, width: '100%' }}
    >
      <a className="ig-fallback-link" href={safeUrl(reel.url)} target="_blank" rel="noopener noreferrer">
        <svg className="ig-fallback-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
        </svg>
        <span>Ver reel en Instagram</span>
      </a>
    </blockquote>
  );
}

export function InstagramReels({ reels }: { reels: InstagramReel[] }) {
  useInstagramEmbedProcessing();
  if (!reels.length) return null;

  return (
    <>
      <div className="ig-reels-head reveal">
        <h3>Reels de Instagram</h3>
      </div>
      <div className="ig-reels-row">
        {reels.map((reel, i) => (
          <ReelFallback key={i} reel={reel} />
        ))}
      </div>
      <Script async src="https://www.instagram.com/embed.js" strategy="afterInteractive" />
    </>
  );
}

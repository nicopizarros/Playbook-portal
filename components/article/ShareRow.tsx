'use client';

import { gsap } from '@/lib/gsap';

// Ported from legacy/js/article-page.js's shareRow(): native share URLs
// only, no SDKs, no third-party scripts, no tracking pixels. WhatsApp
// first — the primary distribution channel for a Mexican audience.
export function ShareRow({ url, title }: { url: string; title: string }) {
  const shareText = `${title} — Playbook`;
  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;

  // Small tactile feedback on tap — the link still navigates away in a new
  // tab (target="_blank"), so this just plays out harmlessly underneath.
  function pulse(e: React.MouseEvent<HTMLAnchorElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(e.currentTarget, { scale: 0.86 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
  }

  return (
    <div className="share-row" role="group" aria-label="Compartir este artículo">
      <span className="share-label">Compartir</span>
      <a className="share-btn" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Compartir en WhatsApp" onClick={pulse}>
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M4 20l1.2-3.6A8 8 0 1 1 8.6 19L4 20z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        WhatsApp
      </a>
      <a className="share-btn" href={xHref} target="_blank" rel="noopener noreferrer" aria-label="Compartir en X" onClick={pulse}>
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
          <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
        X
      </a>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { gsap } from '@/lib/gsap';

// Native share URLs only, no SDKs, no third-party scripts, no tracking
// pixels (ported from legacy/js/article-page.js's shareRow()). WhatsApp
// first — the primary distribution channel for a Mexican audience.
//
// Redesigned for La Lectura (2026-08-06, user feedback: the outlined
// text-pills read as dated next to the new article system). The row now
// speaks the device language: the mono "Compartir" label with the accent
// square, then icon-first circular actions that fill with each network's
// own brand color on hover — X uses the theme-adaptive ink instead of a
// hardcoded black so it stays visible on dark. Copy-link keeps its text
// (its label IS its feedback: "Copiar enlace" → "¡Copiado!"). Round
// shapes on purpose: the design system's documented language is round =
// action, square = metadata. Accessibility unchanged — every button
// keeps its aria-label, and the network names move into title tooltips.
export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const shareText = `${title} — Playbook`;
  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  // Small tactile feedback on tap — the link still navigates away in a new
  // tab (target="_blank"), so this just plays out harmlessly underneath.
  function pulse(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(e.currentTarget, { scale: 0.86 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
  }

  async function copyLink(e: React.MouseEvent<HTMLButtonElement>) {
    pulse(e);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable (older browser, insecure
      // context) -- the other four share buttons still work, so this just
      // silently no-ops rather than showing an error for a non-essential
      // convenience action.
    }
  }

  return (
    <div className="share-row" role="group" aria-label="Compartir este artículo">
      <span className="share-label">Compartir</span>
      <div className="share-btns">
        <a
          className="share-btn share-btn-net share-wa reveal"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en WhatsApp"
          title="WhatsApp"
          onClick={pulse}
        >
          <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
            <path d="M4 20l1.2-3.6A8 8 0 1 1 8.6 19L4 20z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </a>
        <a
          className="share-btn share-btn-net share-fb reveal"
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en Facebook"
          title="Facebook"
          onClick={pulse}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path d="M15 4h-2a4 4 0 0 0-4 4v2H7v3h2v7h3v-7h2.5l.5-3H12V8a1 1 0 0 1 1-1h2z" fill="currentColor" />
          </svg>
        </a>
        <a
          className="share-btn share-btn-net share-x reveal"
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en X"
          title="X"
          onClick={pulse}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </svg>
        </a>
        <a
          className="share-btn share-btn-net share-li reveal"
          href={liHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir en LinkedIn"
          title="LinkedIn"
          onClick={pulse}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path
              fill="currentColor"
              d="M5.5 8.5h3V19h-3V8.5zM7 7.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zM10.5 8.5h2.9v1.4h.04c.4-.76 1.4-1.56 2.86-1.56 3.06 0 3.6 2 3.6 4.6V19h-3v-5.3c0-1.26-.02-2.9-1.76-2.9-1.76 0-2.03 1.37-2.03 2.8V19h-3V8.5z"
            />
          </svg>
        </a>
        <button
          type="button"
          className={`share-btn share-copy reveal${copied ? ' is-copied' : ''}`}
          aria-label="Copiar enlace del artículo"
          onClick={copyLink}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                d="M9.5 14.5l5-5M8.2 16.3l-1.4 1.4a3 3 0 0 1-4.2-4.2l2.8-2.8a3 3 0 0 1 4.2 0M15.8 7.7l1.4-1.4a3 3 0 0 1 4.2 4.2l-2.8 2.8a3 3 0 0 1-4.2 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {copied ? '¡Copiado!' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  );
}

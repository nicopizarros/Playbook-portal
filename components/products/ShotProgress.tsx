'use client';

import { useEffect, useRef, useState } from 'react';

// Industry Shots' reading-progress indicator: a shot glass that fills as
// the reader scrolls through the article body — the product's bottle
// metaphor doing actual work instead of decorating a header. Fixed to the
// viewport corner; progress is measured against the article body element,
// not the whole document, so the glass is full exactly when the reporting
// ends (related links and footer don't count as drinking).
//
// Plain rAF-throttled scroll math, no GSAP: this must track position
// exactly (a progress indicator that eases is lying), and a passive
// listener + one transform write per frame is cheaper than a scrubbed
// tween for a single element.
export function ShotProgress({ targetSelector = '.article-body' }: { targetSelector?: string }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) return;

    const measure = () => {
      frame.current = 0;
      const rect = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when the body's top reaches the lower third of the screen, 1
      // when its bottom passes the same line — matches where the reader's
      // eyes actually are rather than raw document offsets.
      const readLine = viewport * 0.7;
      const total = rect.height;
      const advanced = readLine - rect.top;
      setProgress(Math.min(1, Math.max(0, total > 0 ? advanced / total : 0)));
    };

    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [targetSelector]);

  const pct = Math.round(progress * 100);
  // Glass interior in SVG units: y from 10 (rim) to 44 (bottom). The fill
  // rect grows upward from the bottom as progress advances.
  const fillHeight = 34 * progress;

  return (
    <div
      className="shot-progress"
      role="progressbar"
      aria-label="Progreso de lectura"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-full={progress >= 0.995 ? 'true' : undefined}
    >
      <svg viewBox="0 0 36 48" width="30" height="40" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="shot-glass-clip">
            {/* Tapered shot-glass interior. */}
            <path d="M6 10 L30 10 L26 44 L10 44 Z" />
          </clipPath>
        </defs>
        <rect
          className="shot-progress-fill"
          x="4"
          y={44 - fillHeight}
          width="28"
          height={fillHeight}
          clipPath="url(#shot-glass-clip)"
        />
        <path className="shot-progress-glass" d="M5 8 L31 8 L26.5 45 L9.5 45 Z" fill="none" />
      </svg>
      <span className="shot-progress-pct">{pct}%</span>
    </div>
  );
}

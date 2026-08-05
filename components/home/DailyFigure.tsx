'use client';

import { useEffect, useRef } from 'react';
import { splitFigure, parseNumeric, formatNumeric } from '@/lib/figures';

// The number inside the sidebar's "La cifra del día" module (La Portada
// round 2, 2026-08-05): counts up from 0 on first view, once — same
// IntersectionObserver + eased-rAF mechanics as the Infinitas Scoreboard,
// over the shared lib/figures parsing so "MX$42.8 millones" animates its
// numeric part only. Server-renders the final figure (no-JS and
// reduced-motion readers see the real number immediately).
const TICK_DURATION_MS = 1400;

export function DailyFigure({ figure }: { figure: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const parts = splitFigure(figure);
    const numeric = parts && parseNumeric(parts.num);
    if (!parts || !numeric) return;

    // Lock the final width so the rail never reflows while the number runs.
    el.style.display = 'inline-block';
    el.style.minWidth = `${el.offsetWidth}px`;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / TICK_DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = parts.pre + formatNumeric(numeric.value * eased, numeric.decimals) + parts.post;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = figure;
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting) && !started.current) {
          started.current = true;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.textContent = figure;
      el.style.removeProperty('display');
      el.style.removeProperty('min-width');
    };
  }, [figure]);

  return (
    <span className="side-cifra-value" ref={ref}>
      {figure}
    </span>
  );
}

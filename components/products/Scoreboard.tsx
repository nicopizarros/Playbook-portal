'use client';

import { useEffect, useRef } from 'react';

// Infinitas' "El Marcador": the hub's thesis — women's sports as a
// business force — made structural. A scoreboard of real growth metrics
// that ticks upward when it enters view, so the reader watches the numbers
// happen instead of being told about them. Numbers animate from 0 to their
// real value once (IntersectionObserver, no re-trigger); with
// prefers-reduced-motion the final values render immediately.

export type ScoreboardMetric = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** Attribution, e.g. "Deloitte, 2025" — a scoreboard without sources is marketing. */
  source: string;
};

function formatValue(value: number, decimals: number): string {
  return value.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const TICK_DURATION_MS = 1600;

export function Scoreboard({ metrics }: { metrics: ScoreboardMetric[] }) {
  const rootRef = useRef<HTMLDListElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const numbers = Array.from(root.querySelectorAll<HTMLElement>('.scoreboard-value'));

    const finish = () => {
      numbers.forEach(el => {
        el.textContent = formatValue(Number(el.dataset.value), Number(el.dataset.decimals));
      });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / TICK_DURATION_MS);
        // easeOutCubic: fast early movement, settling into the final value
        // — reads as a counter catching up, not a linear odometer.
        const eased = 1 - Math.pow(1 - t, 3);
        numbers.forEach(el => {
          el.textContent = formatValue(Number(el.dataset.value) * eased, Number(el.dataset.decimals));
        });
        if (t < 1) requestAnimationFrame(tick);
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
      { threshold: 0.35 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <dl className="scoreboard" ref={rootRef}>
      {metrics.map(metric => (
        <div className="scoreboard-item" key={metric.label}>
          <dt className="scoreboard-label">{metric.label}</dt>
          <dd className="scoreboard-figure">
            {metric.prefix && <span className="scoreboard-affix">{metric.prefix}</span>}
            <span
              className="scoreboard-value"
              data-value={metric.value}
              data-decimals={metric.decimals ?? 0}
            >
              {formatValue(0, metric.decimals ?? 0)}
            </span>
            {metric.suffix && <span className="scoreboard-affix">{metric.suffix}</span>}
            <span className="scoreboard-source">{metric.source}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import type { SiteContentData } from '@/lib/data/site-content';

// Ported from legacy/js/ui.js's animateCount()/initStatCounters(): counts
// up from 0 to the real value once the stat is 40% visible, preserving the
// original string's decimal precision and suffix (e.g. "3.5M+").
function StatValue({ raw }: { raw: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const match = raw.match(/^([\d.]+)(.*)$/);
    if (!match) return;
    const target = parseFloat(match[1]);
    const decimals = (match[1].split('.')[1] || '').length;
    const suffix = match[2];

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const duration = 1400;
          const start = performance.now();
          function tick(now: number) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el!.textContent = (target * eased).toFixed(decimals) + suffix;
            if (t < 1) requestAnimationFrame(tick);
            else el!.textContent = raw;
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [raw]);

  return <b ref={ref}>{raw}</b>;
}

// Fase 7 UX: compressed — the section heading is gone (data.heading stays
// in the CMS Stats tab, unused here on purpose: the numbers read
// themselves), leaving a slim horizontal strip of three stats with
// vertical rules. Renders back-to-back with TestimonialsSection as one
// proof band (see app/(public)/page.tsx).
export function StatsSection({ data }: { data: SiteContentData['statsSection'] }) {
  return (
    <section className="container proof">
      <div className="proof-grid">
        {data.stats.map((s, i) => (
          <div className="stat reveal" key={i}>
            <StatValue raw={s.value} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

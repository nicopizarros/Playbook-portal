'use client';

import { useEffect, useRef } from 'react';
import type { SiteContentData } from '@/lib/data/site-content';
import { gsap } from '@/lib/gsap';

// Ported from legacy/js/ui.js's animateCount()/initStatCounters(), now
// driven by GSAP + ScrollTrigger instead of a hand-rolled rAF loop —
// counts up from 0 to the real value once the stat is 85% into view,
// preserving the original string's decimal precision and suffix (e.g.
// "3.5M+"). `once: true` on the ScrollTrigger keeps the old
// observer.unobserve()-after-first-trigger behavior: it never re-counts on
// scroll back into view.
function StatValue({ raw }: { raw: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const match = raw.match(/^([\d.]+)(.*)$/);
    if (!match) return;
    const target = parseFloat(match[1]);
    const decimals = (match[1].split('.')[1] || '').length;
    const suffix = match[2];
    const counter = { value: 0 };

    const tween = gsap.to(counter, {
      value: target,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate() {
        el.textContent = counter.value.toFixed(decimals) + suffix;
      },
      onComplete() {
        el.textContent = raw;
      },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
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

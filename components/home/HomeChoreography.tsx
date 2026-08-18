'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';

// La Portada (design brief 2026-08-05): section rules that sweep in on
// scroll. A green accent draws itself along each section's existing ink
// rule as the section enters view, then fades out and leaves the original
// newspaper rule untouched — a transient flourish, not a redesign of the
// rules. Mounted ONLY on the homepage (app/(public)/page.tsx), so no
// other route pays for it.
//
// Everything happens from JS: the pt-sweep-* classes (styles/portada.css)
// are added here, so a no-JS or reduced-motion render never has them and
// the page is byte-identical to the pre-flourish design — the "static
// final state, never missing content" rule satisfied by construction.
// .infsec-head excluded: the Infinitas section frames itself with its own
// violet top rule (2026-08-14 redesign) and has no bottom border for the
// green sweep to ride — sweeping green through the one violet-branded
// section would fight its identity.
const BOTTOM_EDGE_SELECTOR = '.section-head:not(.page-head):not(.infsec-head)';
const TOP_EDGE_SELECTOR = '.mr-band, .still-matters, .proof-grid, .topic-directory';

export function HomeChoreography() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets: { el: HTMLElement; cls: string }[] = [];
    document
      .querySelectorAll<HTMLElement>(BOTTOM_EDGE_SELECTOR)
      .forEach(el => targets.push({ el, cls: 'pt-sweep-bottom' }));
    document
      .querySelectorAll<HTMLElement>(TOP_EDGE_SELECTOR)
      .forEach(el => targets.push({ el, cls: 'pt-sweep-top' }));

    const tweens: { kill(): void; scrollTrigger?: { kill(): void } | null }[] = [];
    targets.forEach(({ el, cls }) => {
      el.classList.add(cls);
      el.style.setProperty('--sweep', '0');
      el.style.setProperty('--sweep-alpha', '1');
      tweens.push(
        gsap.to(el, {
          '--sweep': 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onComplete() {
            tweens.push(gsap.to(el, { '--sweep-alpha': 0, duration: 0.6, delay: 0.2 }));
          },
        }),
      );
    });

    return () => {
      tweens.forEach(t => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      targets.forEach(({ el, cls }) => {
        el.classList.remove(cls);
        el.style.removeProperty('--sweep');
        el.style.removeProperty('--sweep-alpha');
      });
    };
  }, []);

  return null;
}

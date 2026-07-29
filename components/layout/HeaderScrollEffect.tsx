'use client';

import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const FADE_OUT_DURATION = 0.16;
const FADE_IN_DURATION = 0.22;

// Two things live here: the .is-scrolled shrink treatment that already
// existed in CSS (smaller logo, shorter nav, box-shadow — see
// styles/header.css) but was never wired to anything until this component,
// and — the actual point of this file now — a crossfade between the full
// wordmark and the compact isotope mark as that same threshold is crossed.
//
// header.css's is-scrolled rules are the single source of truth for WHICH
// of the four logo <img>s (wordmark × 2 themes, compact × 2 themes) is
// display:block for a given (theme, scrolled) pair — this component only
// ever toggles the `is-scrolled` class and runs the opacity/scale
// crossfade alongside it. It never has to know which theme is active: the
// two `querySelectorAll` groups below always contain both theme variants,
// and CSS ensures only the theme-correct one in each group is actually
// visible, so animating the whole group is a no-op on the hidden one and
// a real fade on the shown one either way.
export function HeaderScrollEffect() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('header.topbar');
    const wordmark = document.querySelectorAll<HTMLElement>('.brand img.logo-light, .brand img.logo-dark');
    const compact = document.querySelectorAll<HTMLElement>(
      '.brand img.logo-light-compact, .brand img.logo-dark-compact',
    );
    if (!header) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animating = false;

    function setScrolled(isScrolled: boolean) {
      if (header!.classList.contains('is-scrolled') === isScrolled) return;

      if (reducedMotion || !wordmark.length || !compact.length || animating) {
        header!.classList.toggle('is-scrolled', isScrolled);
        return;
      }

      animating = true;
      const outGroup = isScrolled ? wordmark : compact;
      const inGroup = isScrolled ? compact : wordmark;

      gsap
        .timeline({ onComplete: () => { animating = false; } })
        .to(outGroup, { opacity: 0, scale: 0.85, duration: FADE_OUT_DURATION, ease: 'power1.in' })
        .call(() => header!.classList.toggle('is-scrolled', isScrolled))
        .set(inGroup, { opacity: 0, scale: 0.85 })
        .to(inGroup, { opacity: 1, scale: 1, duration: FADE_IN_DURATION, ease: 'power2.out' });
    }

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top -4',
      onEnter: () => setScrolled(true),
      onLeaveBack: () => setScrolled(false),
    });

    return () => trigger.kill();
  }, []);

  return null;
}

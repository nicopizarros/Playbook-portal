'use client';

import { useEffect } from 'react';
import { gsap, ScrollTrigger, SteppedEase } from '@/lib/gsap';

// Measured directly from public/assets/img/playbook-logo-dark.png
// (640×158 intrinsic): pixel content starts at x=8, and the "P" glyph's
// right edge — the gap before "l" starts — sits at x≈90. That's the
// fraction of the wordmark's own rendered width to crop down to so the
// wipe lands just past the P, not mid-letter.
const P_FRACTION = 90 / 640;

// "Playbook" minus the P is 7 characters (l-a-y-b-o-o-k) — SteppedEase
// jumps the width in that many discrete increments instead of
// interpolating smoothly, so it reads as a reverse typewriter deleting one
// character at a time rather than a smooth zoom/crop. (Most of those
// letters actually touch in the raster with no clean pixel gap between
// them — Anton-style display wordmarks kern tight — so the steps land at
// even intervals rather than each letter's real width; at the size this
// renders in, that's not distinguishable from hitting real letter edges.)
const LETTER_STEPS = 7;

// styles/header.css already had a full is-scrolled shrink treatment
// (smaller logo, shorter nav, box-shadow) carried over from the legacy
// port, but nothing ever toggled the class — no scroll listener existed
// anywhere. This component supplies that trigger, and — the main event —
// narrows the wordmark's own rendered width on the way in, which (with
// object-fit:cover;object-position:left in header.css) crops away its
// right side as it shrinks. A small CSS bracket accent (styles/header.css's
// .brand-mark-accent, same clip-path shape as the end-of-article mark)
// appears right as the first character is deleted and stays visible for
// the rest of the sequence — since it's positioned with right:-5px
// relative to .brand (sized by the wordmark's own shrinking width), it
// rides along for free at each step, reading as a cursor taking the place
// of whatever was just deleted, landing next to the "P" once the wipe
// finishes.
export function HeaderScrollEffect() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('header.topbar');
    const wordmarks = Array.from(
      document.querySelectorAll<HTMLElement>('.brand img.logo-light, .brand img.logo-dark'),
    );
    const accent = document.querySelector<HTMLElement>('.brand-mark-accent');
    if (!header || !wordmarks.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animating = false;

    // A single shared measurement, not one per image: logo-light and
    // logo-dark render at the same CSS height (header.css's .brand img
    // rule doesn't differ by theme) so they always share the same natural
    // width — and only ONE of them is ever display:block at a time
    // (theme-gated), so measuring the OTHER one directly would read 0
    // (getBoundingClientRect on a display:none element is always empty).
    // Real bug this replaced: toggling dark mode while already scrolled
    // revealed logo-dark at width:0 — invisible — because its own rect
    // had been measured back when it was the hidden one.
    // Cleared (clearProps) every time a reader returns to rest, so a
    // viewport resize between interactions gets a fresh measurement.
    let restingWidth: number | null = null;

    function currentRestingWidth(): number {
      if (restingWidth !== null) return restingWidth;
      const visible = wordmarks.find(img => getComputedStyle(img).display !== 'none');
      restingWidth = visible ? visible.getBoundingClientRect().width : 0;
      return restingWidth;
    }

    function settleAtRest() {
      wordmarks.forEach(img => gsap.set(img, { clearProps: 'width' }));
      restingWidth = null;
    }

    function setScrolled(isScrolled: boolean) {
      if (header!.classList.contains('is-scrolled') === isScrolled) return;
      header!.classList.toggle('is-scrolled', isScrolled);

      if (reducedMotion || animating) {
        const full = currentRestingWidth();
        wordmarks.forEach(img => gsap.set(img, { width: isScrolled ? full * P_FRACTION : full }));
        if (accent) gsap.set(accent, { opacity: isScrolled ? 1 : 0 });
        if (!isScrolled) settleAtRest();
        return;
      }

      animating = true;
      const full = currentRestingWidth();
      const tl = gsap.timeline({
        onComplete: () => {
          animating = false;
          if (!isScrolled) settleAtRest();
        },
      });

      if (isScrolled) {
        wordmarks.forEach(img => {
          tl.to(
            img,
            { width: full * P_FRACTION, duration: 0.56, ease: SteppedEase.config(LETTER_STEPS) },
            0,
          );
        });
        // Appears right after the first character-deletion step, then
        // just rides .brand's shrinking edge for the rest of the sequence.
        if (accent) tl.to(accent, { opacity: 1, duration: 0.1, ease: 'none' }, 0.56 / LETTER_STEPS);
      } else {
        if (accent) tl.to(accent, { opacity: 0, duration: 0.08, ease: 'none' }, 0);
        wordmarks.forEach(img => {
          tl.to(
            img,
            { width: full, duration: 0.48, ease: SteppedEase.config(LETTER_STEPS) },
            0.04,
          );
        });
      }
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

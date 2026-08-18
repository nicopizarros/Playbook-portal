'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
// Registered locally, NOT in lib/gsap's shared entry point — per that
// file's guidance (same as DeparturesBoard/ArticleMotion).
import { ScrambleTextPlugin } from '@/vendor/gsap/esm/ScrambleTextPlugin.js';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

// La Portada (2026-08-05): the split-flap touch on the PLAYBOOK HOY
// ticker. Only the LABEL flaps — scrambling the marquee items would
// change their widths mid-scroll and make the whole track jitter. The
// label's width is locked to its final size before the flap starts, so
// the animation causes zero layout shift; on completion the lock is
// released and the DOM is byte-identical to the server render.
export function TickerScramble() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = document.querySelector<HTMLElement>('.ticker-label-text');
    if (!el || !el.textContent) return;

    const finalText = el.textContent;
    el.style.display = 'inline-block';
    el.style.width = `${el.offsetWidth}px`;
    const tween = gsap.to(el, {
      duration: 1.2,
      delay: 0.3,
      scrambleText: { text: finalText, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', speed: 0.35 },
      onComplete() {
        el.style.removeProperty('width');
        el.style.removeProperty('display');
      },
    });

    return () => {
      tween.kill();
      el.textContent = finalText;
      el.style.removeProperty('width');
      el.style.removeProperty('display');
    };
  }, []);

  return null;
}

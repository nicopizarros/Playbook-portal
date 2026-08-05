'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
// Registered locally, NOT in lib/gsap's shared entry point — per that
// file's guidance (same as DeparturesBoard): only article pages use the
// scramble here, so the plugin shouldn't ship to every GSAP route.
import { ScrambleTextPlugin } from '@/vendor/gsap/esm/ScrambleTextPlugin.js';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrambleTextPlugin);
}

// La Lectura's shared motion kit (article redesign, 2026-08-05). One
// mount, four devices, all progressive enhancement over server-rendered
// final states — no-JS and prefers-reduced-motion readers get the complete
// article with nothing missing:
//   1. Kicker scramble: the publication chip flaps into place like the
//      split-flap boards the product hubs already use.
//   2. Cover parallax: the cover photo drifts subtly inside its fixed
//      16/10 frame as the page scrolls (transform-only, pre-scaled so no
//      edge ever shows — zero layout impact).
//   3. Drawn rules: .lect-rule dividers and in-body <hr>s draw themselves
//      in as the reader reaches them.
//   4. Inline count-ups: any <strong> in the body whose entire text is a
//      figure ("US$9,612 millones", "22%"), plus the pull-figure beats
//      ([data-lect-countup]), tick up from 0 on first view. The element's
//      width is locked to its server-rendered (final) size first, so the
//      surrounding text never reflows while the number runs.
//
// Everything is queried from the DOM rather than passed as props on
// purpose: the body markup comes from three different render paths
// (TipTap HTML, HTML teaser, plain-text paragraphs) and this stays
// correct for all of them without threading structure through the page.

const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·';

// Full-match check that a <strong>'s entire text is a standalone figure —
// mirrors lib/product-hubs.ts's FIGURE_PATTERNS, anchored, so a bolded
// sentence that merely contains a number never animates.
const FIGURE_TEXT_RE =
  /^\s*(?:€|US\$|USD\s?|MX\$|\$)?\s?\d[\d.,]*\s?(?:%|mil\s+millones|millones|billones|mdd|mdp|[MBK])?(?:\s?\/\s?a[nñ]o)?\s*$/i;

// "US$9,612 millones" → prefix "US$", numeric "9,612", suffix " millones".
function splitFigure(text: string): { pre: string; num: string; post: string } | null {
  const match = text.match(/^([\s\S]*?)(\d[\d.,]*)([\s\S]*)$/);
  if (!match) return null;
  return { pre: match[1], num: match[2], post: match[3] };
}

// es-MX numbers: a trailing [.,] + 1-2 digits is a decimal part ("42.8",
// "2.35"); every other separator is a thousands group ("9,612", "91,553").
function parseNumeric(num: string): { value: number; decimals: number } | null {
  let intPart = num;
  let decPart = '';
  const dec = num.match(/^(.+)[.,](\d{1,2})$/);
  if (dec) {
    intPart = dec[1];
    decPart = dec[2];
  }
  const value = Number(decPart ? `${intPart.replace(/[.,]/g, '')}.${decPart}` : intPart.replace(/[.,]/g, ''));
  if (Number.isNaN(value)) return null;
  return { value, decimals: decPart.length };
}

function formatNumeric(value: number, decimals: number): string {
  return value.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function ArticleMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tweens: { kill(): void; scrollTrigger?: { kill(): void } | null }[] = [];
    const cleanups: (() => void)[] = [];

    // 1 — Kicker scramble. Width-locked before the flap so the chip (and
    // anything after it on the line) never shifts.
    const kicker = document.querySelector<HTMLElement>('.article-kicker .tag');
    if (kicker && kicker.textContent) {
      const finalText = kicker.textContent;
      const width = kicker.offsetWidth;
      kicker.style.minWidth = `${width}px`;
      tweens.push(
        gsap.to(kicker, {
          duration: 0.9,
          delay: 0.1,
          scrambleText: { text: finalText, chars: FLAP_CHARS, speed: 0.4 },
        }),
      );
      cleanups.push(() => {
        kicker.textContent = finalText;
        kicker.style.removeProperty('min-width');
      });
    }

    // 2 — Cover parallax. Pre-scaled 1.12 so ±5% drift never exposes the
    // frame; transform-only, scrubbed, no layout involvement.
    const photo = document.querySelector<HTMLElement>('.article-photo');
    const cover = photo?.querySelector<HTMLElement>('img');
    if (photo && cover) {
      gsap.set(cover, { scale: 1.12 });
      tweens.push(
        gsap.fromTo(
          cover,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
          },
        ),
      );
      cleanups.push(() => {
        cover.style.removeProperty('transform');
      });
    }

    // 3 — Drawn rules.
    document.querySelectorAll<HTMLElement>('.lect-rule, .article-body hr').forEach(rule => {
      gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });
      tweens.push(
        gsap.to(rule, {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: rule, start: 'top 92%', once: true },
        }),
      );
      cleanups.push(() => rule.style.removeProperty('transform'));
    });

    // 4 — Inline count-ups.
    const numberEls = new Set<HTMLElement>();
    document.querySelectorAll<HTMLElement>('[data-lect-countup]').forEach(el => numberEls.add(el));
    document.querySelectorAll<HTMLElement>('.article-body strong').forEach(el => {
      if (FIGURE_TEXT_RE.test(el.textContent || '')) numberEls.add(el);
    });
    numberEls.forEach(el => {
      const finalText = el.textContent || '';
      const parts = splitFigure(finalText);
      const numeric = parts && parseNumeric(parts.num);
      if (!parts || !numeric) return;
      // Lock the final width so the running number never reflows the line.
      el.style.display = 'inline-block';
      el.style.minWidth = `${el.offsetWidth}px`;
      const counter = { value: 0 };
      el.textContent = parts.pre + formatNumeric(0, numeric.decimals) + parts.post;
      tweens.push(
        gsap.to(counter, {
          value: numeric.value,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate() {
            el.textContent = parts.pre + formatNumeric(counter.value, numeric.decimals) + parts.post;
          },
          onComplete() {
            el.textContent = finalText;
          },
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
      );
      cleanups.push(() => {
        el.textContent = finalText;
        el.style.removeProperty('display');
        el.style.removeProperty('min-width');
      });
    });

    return () => {
      tweens.forEach(t => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      cleanups.forEach(fn => fn());
    };
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import {
  createScope,
  disposeScope,
  parallax,
  staggerIn,
  countUp,
  highlightFigures,
} from '@/lib/motion-kit';

// The Lectura motion vocabulary, applied outside the article page
// (2026-08-10). Mounted on the homepage and the four product hubs — the
// surfaces a reader actually lands on — so the site moves like one
// publication instead of one animated template surrounded by static ones.
//
// It deliberately does NOT re-implement anything that already moves. Before
// this existed the homepage had section-rule sweeps (HomeChoreography), stat
// count-ups (StatsSection) and the sidebar's cifra del día (DailyFigure);
// /infinitas had El Marcador (Scoreboard). All of those keep their own
// mechanics and are excluded from the selectors below — two animations
// driving one element is a jitter bug, not twice the motion. What was
// missing everywhere was the article page's own signatures: figures that
// tick up, a lead photo that drifts, groups that arrive in sequence, and
// money in prose wearing a marker swipe.
//
// Every primitive lives in lib/motion-kit.ts, shared with ArticleMotion, so
// the two surfaces can't drift into different easings and durations.

// Figures that should tick up. Text-only elements ONLY: countUp rewrites
// textContent, so an element wrapping an icon (.tfbr-board-value holds a
// TrendArrow SVG) has to hand over an inner text span instead — that is what
// .tfbr-board-figure is for.
const COUNTUP_SELECTOR = ['.lana-pull-figure', '.shots-figure-chip', '.tfbr-board-figure'].join(', ');

// One lead photo per surface, in document order — the first match wins.
// Scrubbed parallax is the most expensive thing here, and a page running it
// on eight cards reads as seasick rather than alive.
const LEAD_PHOTO_SELECTOR = [
  '.lead-story .lead-photo', // homepage hero
  '.lana-folder-lead .lana-folder-photo', // /la-lana case file
  '.shots-feature-photo', // /noticias feature band
  '.infhub-lead-card .infhub-duotone', // /infinitas lead
  '.tfbr-cover-photo', // /futbol-business-review cover
].join(', ');

// Groups whose children arrive in sequence. Nothing here may carry
// `.reveal`: components/ScrollReveal.tsx already owns those and staggers
// them itself, and two observers tweening one element's opacity fight.
const STAGGER_SELECTOR = ['.tfbr-board-grid', '.shots-quick'].join(', ');

// Prose that can carry the marker swipe. Restricted to hub lead excerpts on
// purpose: highlightFigures splits text nodes and inserts <mark> elements
// into the live DOM, which is safe under `dangerouslySetInnerHTML` (how the
// article body renders) and safe in server-rendered JSX that never
// re-renders — but NOT safe anywhere React may reconcile the same children
// later. The homepage's 1+5 source filter re-renders its card descriptions
// from client state, so `.desc` is deliberately absent from this list.
const HIGHLIGHT_SELECTOR = [
  '.lana-case-excerpt',
  '.shots-lead-excerpt',
  '.tfbr-cover-excerpt',
].join(', ');

// A hub lead is a card, not an article: past a few swipes the excerpt reads
// as highlighted rather than annotated.
const MAX_HUB_FIGS = 4;

// The masthead rules that sweep as the page opens, reusing the homepage's
// pt-sweep-bottom treatment verbatim (styles/portada.css). Only mastheads
// that already have a bottom rule are listed — the class draws its accent
// along an existing edge, so an element without one grows a stray line.
// Each hub tints the sweep with its own accent via --sweep-color
// (styles/product-hubs.css).
const SWEEP_SELECTOR = ['.hub-lana-masthead', '.hub-shots-masthead'].join(', ');

export function SiteMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scope = createScope();

    countUp(scope, document.querySelectorAll<HTMLElement>(COUNTUP_SELECTOR));

    const frame = document.querySelector<HTMLElement>(LEAD_PHOTO_SELECTOR);
    const img = frame?.querySelector<HTMLElement>('img');
    if (frame && img) parallax(scope, frame, img);

    document.querySelectorAll<HTMLElement>(STAGGER_SELECTOR).forEach(group => {
      staggerIn(scope, group, Array.from(group.children) as HTMLElement[]);
    });

    highlightFigures(scope, document.querySelectorAll<HTMLElement>(HIGHLIGHT_SELECTOR), MAX_HUB_FIGS);

    // Same shape as HomeChoreography: the class is added from JS and removed
    // on cleanup, so a no-JS or reduced-motion render is byte-identical to
    // the design without it.
    // Unlike the homepage's version this sweep does NOT fade the accent back
    // out: on a hub the masthead is the page's title block and the accent is
    // part of the product's identity, where on the homepage it is a flourish
    // passing over a shared newspaper rule.
    const swept: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>(SWEEP_SELECTOR).forEach(el => {
      el.classList.add('pt-sweep-bottom');
      el.style.setProperty('--sweep', '0');
      swept.push(el);
      scope.tweens.push(
        gsap.to(el, {
          '--sweep': 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }),
      );
    });
    scope.cleanups.push(() => {
      swept.forEach(el => {
        el.classList.remove('pt-sweep-bottom');
        el.style.removeProperty('--sweep');
      });
    });

    return () => disposeScope(scope);
  }, []);

  return null;
}

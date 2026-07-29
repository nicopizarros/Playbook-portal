'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';

// The reveal itself (the kind of thing var(--ease-out) has full CSS-transition
// support for) is expressed as a GSAP tween now, not a CSS transition toggled
// by a class — reusing the same cubic-bezier the rest of the site's hover
// states already use (tokens.css's --ease-out) so the motion still reads as
// one system, just driven by GSAP's own per-element stagger delay instead of
// a hand-set `transitionDelay` inline style, which is the same 60ms cadence
// with less bookkeeping.
const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const REVEAL_DURATION = 0.38;
const STAGGER_STEP = 0.06;

// Reproduces legacy/js/ui.js's initScrollReveal(): every element with the
// `.reveal` class fades/slides in once it's 15% visible, staggered by 60ms
// per sibling within the same parent.
//
// Real production bug found and fixed here, not a hypothetical: this
// component is rendered once in app/(public)/layout.tsx, which — unlike a
// full page reload — Next.js's App Router keeps mounted across client-side
// navigations between routes under this same layout (that's the whole
// point of layouts). A `useEffect` with an empty dependency array therefore
// only ever runs once per session, the first time a reader lands on any
// public page. Reproduced with Playwright: land on /articulo, click the
// real "← Volver a Playbook" link (client-side nav, not a reload) back to
// "/" — the 39 `.reveal` elements freshly mounted by the home page's
// NewsGrid were never passed to querySelectorAll/observe, so all 39 stayed
// at the CSS default `opacity:0` forever: present in the DOM, fully
// clickable (real <a href> tags don't need JS or visibility to navigate),
// but completely invisible. This is what a reader reported as "the page
// went blank" after hitting the free-article wall and navigating back —
// confirmed against a real build, not assumed. Depending on `pathname`
// re-runs this effect (and its cleanup, disconnecting the previous
// IntersectionObserver) on every route change, so newly-mounted `.reveal`
// elements always get observed, regardless of whether this was a fresh
// load or a client-side navigation within the same layout.
//
// ——— 2026-07-24: `pathname` turned out to be only a third of the fix.
// A `.reveal` element can enter the DOM three different ways, and
// re-running on pathname change only covers the first:
//
//   1. Route change (/articulo -> /)              pathname changes ✔
//   2. Query-string-only navigation               pathname does NOT change:
//      (/archivo -> /archivo?view=list, plus      usePathname() returns
//      every archive filter link — all <Link>s    '/archivo' both times ✘
//      that keep the same pathname)
//   3. Pure client state, no navigation at all    nothing to depend on ✘
//      (the homepage's 1+5 source filter
//      re-renders NewsRow children keyed by id)
//
// Both misses were reproduced with Playwright against this build, and both
// are what the editorial team reported from an iPad:
//   - "cuando cambias entre lista y cuadrícula no se ve" — all 24 archive
//     rows present in the DOM at computed opacity 0 after the view toggle.
//   - "cuando le pones los filtros a los 5+1 del homepage solo se ve 1" —
//     exactly 1 of 6 visible. The lead story survives because it renders
//     unkeyed, so React reuses that DOM node along with the .is-visible
//     class already on it; the five list rows are keyed by article id, so
//     filtering unmounts them and mounts brand-new nodes no observer has
//     ever seen.
//
// A MutationObserver on <body> covers all three at their common root — "a
// .reveal element entered the DOM after the effect ran" — instead of
// enumerating navigation shapes and hoping the list stays complete. The
// pathname dependency is kept too: it resets the per-parent stagger index
// on a real page change, the one thing the DOM watcher can't distinguish
// from an in-page update.
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      // Still needs the DOM watcher: without it, elements mounted later
      // keep the stylesheet's default opacity:0 forever — the same bug,
      // just reached by a different branch.
      const revealAll = () =>
        document
          .querySelectorAll<HTMLElement>('.reveal:not(.is-visible)')
          .forEach(el => el.classList.add('is-visible'));
      revealAll();
      const mo = new MutationObserver(revealAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    // Per-element stagger delay, computed at observe time (same as the old
    // transitionDelay assignment) but consumed later, inside the
    // intersection callback, since a GSAP tween's delay is a call argument
    // rather than a persistent inline style.
    const staggerDelay = new WeakMap<Element, number>();

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add('is-visible');
            observer.unobserve(el);
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: REVEAL_DURATION,
              ease: REVEAL_EASE,
              delay: staggerDelay.get(el) ?? 0,
            });
          }
        });
      },
      { threshold: 0.15 },
    );

    // Per-parent, and persists across observeAll() calls within this
    // effect, so a batch appended to an existing list continues the 60ms
    // cadence instead of restarting it mid-row.
    const groupIndex = new Map<Element | null, number>();

    // :not(.is-visible) so an update that leaves already-revealed elements
    // mounted doesn't reset their stagger delay or re-observe them.
    function observeAll(root: ParentNode) {
      root.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)').forEach(el => {
        if (el.dataset.revealObserved === '1') return;
        el.dataset.revealObserved = '1';
        const parent = el.parentElement;
        const idx = groupIndex.get(parent) || 0;
        staggerDelay.set(el, idx * STAGGER_STEP);
        groupIndex.set(parent, idx + 1);
        observer.observe(el);
      });
    }

    observeAll(document);

    // childList + subtree only. Attributes are deliberately NOT watched:
    // this observer's own downstream effect adds `is-visible` and sets a
    // data attribute on the elements it finds, so watching attributes
    // would make it retrigger itself on every single reveal.
    const mutationObserver = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          const el = node as HTMLElement;
          // The added node may itself be a .reveal, or merely contain some
          // (React usually mounts a subtree, not a single element).
          if (el.classList?.contains('reveal')) {
            observeAll(el.parentNode ?? document);
          } else {
            observeAll(el);
          }
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      // The marker is scoped to this observer instance, not to the
      // element's lifetime: after a route change a brand-new
      // IntersectionObserver has to be able to pick these same elements up
      // again, and a stale '1' would make it skip them.
      document.querySelectorAll<HTMLElement>('[data-reveal-observed]').forEach(el => {
        delete el.dataset.revealObserved;
      });
    };
  }, [pathname]);

  return null;
}

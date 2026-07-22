'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // :not(.is-visible) so a route change that leaves some already-revealed
    // elements mounted (e.g. only the query string changed) doesn't reset
    // their transition-delay or redundantly re-observe them.
    const elements = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    const groupIndex = new Map<Element | null, number>();
    elements.forEach(el => {
      const parent = el.parentElement;
      const idx = groupIndex.get(parent) || 0;
      el.style.transitionDelay = `${idx * 60}ms`;
      groupIndex.set(parent, idx + 1);
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

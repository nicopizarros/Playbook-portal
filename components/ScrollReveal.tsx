'use client';

import { useEffect } from 'react';

// Reproduces legacy/js/ui.js's initScrollReveal(): every element with the
// `.reveal` class fades/slides in once it's 15% visible, staggered by 60ms
// per sibling within the same parent. Unlike the legacy site (which had to
// re-run this after each async content.json/articles.json fetch completed,
// hence its custom `playbook:*-rendered` event listeners), Server
// Components render every `.reveal` element into the initial HTML, so one
// pass on mount covers everything — no re-run hooks needed.
export function ScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = document.querySelectorAll<HTMLElement>('.reveal');

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
  }, []);

  return null;
}

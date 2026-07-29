'use client';

import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';

// A scroll-triggered "pop" on the green end-of-article mark — it's a
// ::after pseudo-element on .article-body's last paragraph (see
// styles/article.css), and GSAP can't hold a ref to a pseudo-element, so
// this tweens a CSS custom property the ::after's transform reads instead.
// --mark-scale defaults to 1 in CSS, so both the no-JS and
// prefers-reduced-motion paths simply leave the mark at full scale.
export function ArticleEndMark() {
  useEffect(() => {
    const body = document.querySelector<HTMLElement>('.article-body');
    if (!body || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    body.style.setProperty('--mark-scale', '0');
    const tween = gsap.to(body, {
      '--mark-scale': 1,
      duration: 0.5,
      ease: 'back.out(2.2)',
      scrollTrigger: { trigger: body, start: 'bottom bottom-=60' },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      body.style.removeProperty('--mark-scale');
    };
  }, []);

  return null;
}

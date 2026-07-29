'use client';

import { useEffect, useRef } from 'react';
import { gsap, SplitText } from '@/lib/gsap';

// Word-by-word cascade reveal on load — the kind of entrance a plain CSS
// transition can't do on its own (SplitText is what actually splits the
// heading into individually animatable spans). Server-rendered as plain
// text underneath (SEO/crawlers/no-JS all see the real heading); SplitText
// only re-wraps it client-side, after hydration, as a progressive
// enhancement, and reverts on unmount so nothing lingers in the DOM.
export function ArticleHeadline({ title }: { title: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const split = new SplitText(el, { type: 'words' });
    const tween = gsap.from(split.words, {
      opacity: 0,
      y: 14,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.035,
    });

    return () => {
      tween.kill();
      split.revert();
    };
  }, [title]);

  return <h1 ref={ref}>{title}</h1>;
}

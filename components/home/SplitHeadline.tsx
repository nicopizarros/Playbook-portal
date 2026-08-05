'use client';

import { useEffect, useRef } from 'react';
import { gsap, SplitText } from '@/lib/gsap';

// La Portada (design brief 2026-08-05): SplitText arrival for the lead
// headline — the same word-cascade ArticleHeadline gives article titles,
// generalized so LeadStory can use it in both of its shapes (photo hero
// h1 and the imageless .visual-label h1). Server-renders as plain text
// (SEO / no-JS / LCP all see the real heading painted immediately);
// SplitText re-wraps it only after hydration, as pure enhancement, and
// reverts on unmount. No CLS: words animate opacity/transform only.
export function SplitHeadline({ text, className }: { text: string; className?: string }) {
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
  }, [text]);

  return (
    <h1 ref={ref} className={className}>
      {text}
    </h1>
  );
}

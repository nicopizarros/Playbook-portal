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
//
// key={text} on the <h1> is load-bearing (user bug report, 2026-08-05):
// SplitText replaces the h1's children with its own word <span>s, so when
// the 5+1 source filter re-renders the (unkeyed) LeadStory with a new
// article, React's text-node diff lands in DOM it no longer owns and the
// cleanup's revert() restores the OLD title — the hero headline visibly
// never changed. Keying by text remounts the h1 per title: cleanup
// reverts on the outgoing node, the fresh node carries the new text, and
// the effect re-splits it.
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
    <h1 key={text} ref={ref} className={className}>
      {text}
    </h1>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

// Defers mounting a third-party embed (YouTube iframe, Instagram's
// embed.js) until its container is about to enter the viewport, instead
// of requesting it unconditionally on every page load.
//
// Real bug this fixes: on networks that silently drop (rather than
// actively reject) requests to certain third-party hosts -- common for
// social/video domains on restrictive corporate or mobile networks -- an
// eagerly-loaded embed can hang for many seconds before the browser gives
// up on it. Until it does, the browser's own loading indicator stays
// active, which reads as the page being frozen (reported specifically
// after navigating back into the embed-heavy homepage). `loading="lazy"`
// on an <iframe> is the native browser hint for this, but empirically
// (Playwright network trace, not assumed) its distance-from-viewport
// threshold is generous enough that a normal homepage layout doesn't
// reliably delay the request -- the video section's iframes fired within
// ~200ms of page load despite already having loading="lazy" set. This is
// an explicit, stricter version of the same idea, same IntersectionObserver
// pattern components/ScrollReveal.tsx already uses elsewhere in this repo.
export function LazyEmbed({
  children,
  rootMargin = '300px',
  className,
}: {
  children: React.ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} style={{ width: '100%', height: '100%' }}>
      {visible ? children : null}
    </div>
  );
}

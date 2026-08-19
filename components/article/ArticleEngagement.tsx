'use client';

import { useEffect } from 'react';
import {
  registerPageProduct,
  trackEvent,
  type ProductKey,
} from '@/lib/analytics-events';

// Depth and completion for a single article. Rendered ONLY from the
// full-access branch of app/(public)/articulo/page.tsx, alongside
// ArticleAnalyticsBeacon and under the same rule that governs it: a walled
// reader has no body to scroll, so measuring "read depth" there would
// record the height of the email wall as if it were reading.
//
// MEASURED AGAINST .article-body, NOT THE VIEWPORT. Page-level scroll
// percentage answers "how far down the document did they get", which on
// this template includes the header, the lead photo, the topics
// disclosure, "Sigue leyendo" and the footer -- so a reader who bounced
// after the third paragraph of a short piece can score higher than one who
// finished a long one. Measuring the body element instead makes 100% mean
// "reached the end of the prose", which is the only version of this number
// worth reporting.
//
// GA4's Enhanced Measurement already auto-collects a `scroll` event at a
// single 90% page depth. This is deliberately a different event name
// (`scroll_depth`) at four thresholds against a different element -- it
// sits beside that data rather than colliding with it. See
// lib/analytics-events.ts.

const THRESHOLDS = [25, 50, 75, 100] as const;

// A "read" needs both: the end of the prose AND time actually spent on it.
// Either alone is noise -- an anchor jump or a flung scroll reaches the
// bottom in under a second, and a tab left open in the background
// accumulates time without a reader.
const READ_COMPLETE_MIN_SECONDS = 20;

export function ArticleEngagement({
  articleId,
  product,
}: {
  articleId: string;
  product: ProductKey;
}) {
  useEffect(() => {
    // Lets the site-wide delegated listeners (components/analytics/
    // SiteEvents.tsx) attribute outbound and tag clicks on this page to the
    // right product -- /articulo's product comes from the row, not the URL.
    registerPageProduct(product);

    const body = document.querySelector<HTMLElement>('.article-body');
    const fired = new Set<number>();
    let readComplete = false;

    // Engaged time, not wall-clock: the timer only advances while the tab
    // is actually visible, so a piece left open in a background tab never
    // accumulates its way to a "read".
    let engagedMs = 0;
    let lastTick = document.visibilityState === 'visible' ? Date.now() : null;

    function engagedSeconds(): number {
      const pending = lastTick === null ? 0 : Date.now() - lastTick;
      return Math.round((engagedMs + pending) / 1000);
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        lastTick = Date.now();
      } else if (lastTick !== null) {
        engagedMs += Date.now() - lastTick;
        lastTick = null;
      }
    }

    let ticking = false;

    function measure() {
      ticking = false;
      if (!body) return;

      const rect = body.getBoundingClientRect();
      const height = rect.height;
      if (height <= 0) return;

      // How much of the body has passed the bottom of the viewport.
      const consumed = window.innerHeight - rect.top;
      const percent = Math.max(0, Math.min(100, (consumed / height) * 100));

      for (const threshold of THRESHOLDS) {
        if (percent >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          trackEvent('scroll_depth', {
            percent: threshold,
            product,
            article_id: articleId,
          });
        }
      }

      if (!readComplete && percent >= 100) {
        const seconds = engagedSeconds();
        if (seconds >= READ_COMPLETE_MIN_SECONDS) {
          readComplete = true;
          trackEvent('article_read_complete', {
            product,
            article_id: articleId,
            seconds_engaged: seconds,
          });
        }
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(measure);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    // A short article can be fully visible without a single scroll event,
    // and the reader still has to clear the time bar before it counts --
    // so re-measure on a slow interval rather than only on scroll.
    const timer = window.setInterval(measure, 5000);
    measure();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(timer);
      registerPageProduct(null);
    };
  }, [articleId, product]);

  return null;
}

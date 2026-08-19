'use client';

import { useEffect, useRef } from 'react';
import { trackEvent, type EventParams, type PlaybookEvent } from '@/lib/analytics-events';

// Fires one event once, on mount, from a Server Component page. The same
// shape components/article/ArticleAnalyticsBeacon.tsx already established
// for Vercel's `pageview_article`, generalised so the destination pages
// (product hubs, coverage hubs) don't each need their own client file.
//
// These are deliberately SEPARATE events from GA4's automatic page_view,
// which already records the URL. A page_view tells you /infinitas was
// loaded; `product_hub_visit` carries the product key, so per-product
// reporting is one filter on a dimension rather than a set of hand-written
// path patterns that silently miss a route the day someone adds one.
//
// The ref guard matters in development: React 18+ StrictMode mounts every
// effect twice, which would double-count every hub visit locally and make
// the numbers look wrong for a reason that has nothing to do with the
// site. It stores the last-sent key rather than a bare boolean, so it
// suppresses only the immediate double-mount -- navigating from one hub to
// another reuses this component with different params, and that IS a
// second visit that has to fire.
export function VisitBeacon({
  event,
  params,
}: {
  event: Extract<PlaybookEvent, 'hub_visit' | 'product_hub_visit'>;
  params: EventParams;
}) {
  const sentKey = useRef<string | null>(null);
  // Serialised so the effect re-runs when the page's identity actually
  // changes (client-side navigation between two hubs reuses this
  // component) without taking a new object literal as a change every
  // render.
  const key = `${event}:${JSON.stringify(params)}`;

  useEffect(() => {
    if (sentKey.current === key) return;
    sentKey.current = key;
    trackEvent(event, JSON.parse(key.slice(event.length + 1)) as EventParams);
  }, [event, key]);

  return null;
}

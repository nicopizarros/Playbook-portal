'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

// beforeSend must live inside a client component: the callback runs in the
// browser and can't cross the server/client boundary as a prop from a
// Server Component (app/layout.tsx), so it's defined here instead of
// inlined where <Analytics/> used to be rendered directly.
//
// Trims two sources of billed Web Analytics events that aren't real reader
// traffic (see Vercel's usage-optimization guidance: "use beforeSend to
// exclude page views and events that might not be relevant"):
//   - /admin/*: the CMS dashboard, visited only by the internal team.
//   - anything not on the production hostname: preview deployments build
//     with the same NODE_ENV=production as production itself, so @vercel/
//     analytics' automatic dev/prod detection can't tell them apart and
//     sends events for both. productionHost (derived from SITE_URL, which
//     resolves from Vercel's VERCEL_PROJECT_PRODUCTION_URL — stable across
//     preview and production builds) lets beforeSend do that filtering.
function makeBeforeSend(productionHost: string) {
  return (event: BeforeSendEvent): BeforeSendEvent | null => {
    if (event.url.includes('/admin')) return null;
    if (typeof window !== 'undefined' && window.location.hostname !== productionHost) return null;
    return event;
  };
}

export function AnalyticsClient({ productionHost }: { productionHost: string }) {
  return <Analytics beforeSend={makeBeforeSend(productionHost)} />;
}

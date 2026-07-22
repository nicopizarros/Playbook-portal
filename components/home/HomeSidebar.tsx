import { MostReadSection } from './MostReadSection';
import { AdSlot } from '@/components/ads/AdSlot';

// Right rail of the homepage's two-column news layout (Fase 7 UX). Server
// component: MostReadSection needs GA4 data access. Rendered by
// app/(public)/page.tsx and passed INTO the client-side NewsGrid as a
// ReactNode prop — the sidebar itself never re-renders when the reader
// changes source filters, only the feed does.
//
// When GA4 isn't configured (available:false degradation, see
// lib/most-read.ts) the Most Read list renders nothing and the rail ad
// reservation is all that remains — the column still exists so the layout
// doesn't reflow the day the credentials land.
export function HomeSidebar() {
  return (
    <div className="sidebar-sticky">
      <MostReadSection />
      <AdSlot slot="rail-home" />
    </div>
  );
}

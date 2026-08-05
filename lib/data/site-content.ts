import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '../db/client';
import { siteContent } from '../db/schema';
// Product-hub copy types live in lib/product-hubs-content.ts (client-safe,
// no db import — the admin dashboard needs them at runtime); the section
// itself is stored inside this blob, see `productHubs` below.
import type { ProductHubsContent } from '../product-hubs-content';

export const SITE_CONTENT_CACHE_TAG = 'site-content';

// Mirrors content.json's shape 1:1 — see lib/db/schema.ts's comment on
// site_content for why this lives as one jsonb blob instead of normalized
// tables (keeps the section-rendering logic a direct port).

export type NavLink = { label: string; href: string; variant?: 'infinitas' };
export type OpinionCard = {
  variant: 'standard' | 'banner';
  masthead: string;
  title: string;
  excerpt: string;
  url: string;
  image: string;
  imageAlt?: string;
};
export type ProductCard = {
  variant: 'banner' | 'glyph';
  glyph: string;
  wordmark: string;
  description: string;
  meta: string;
  url: string;
  image: string;
  imageAlt?: string;
};
export type VideoEpisodeLink = { label: string; url: string };
export type VideoClip = {
  platform: 'youtube' | 'instagram';
  url: string;
  thumbnail?: string;
  title: string;
  handle: string;
  igText?: string;
  variant?: string;
};
export type InstagramReel = { url: string };
export type InfinitasCard = { image: string; eyebrow: string; title: string; body?: string; url: string };
export type Stat = { value: string; label: string };
export type Testimonial = { quote: string; name: string; role: string; avatar?: string };
export type AboutAction = { label: string; url: string; style: 'light' };
export type SocialLink = { label: string; url: string };

export type SiteContentData = {
  lastUpdated: string;
  siteSettings: { mostrarAutorGlobal: boolean };
  nav: { links: NavLink[]; ctaLabel: string; ctaUrl: string };
  opinionSection: { heading: string; archiveLinkLabel: string; archiveLinkUrl: string; cards: OpinionCard[] };
  productsSection: { heading: string; products: ProductCard[] };
  midCta: {
    headingMain: string; headingEm: string; body: string; buttonLabel: string;
    formUrl: string; successMessage: string;
  };
  videoSection: {
    heading: string; sub: string; channelLinkLabel: string; channelLinkUrl: string;
    featured: { embedId: string; embedTitle: string; title: string };
    secondary: { embedId: string; embedTitle: string; title: string; episodeLinks: VideoEpisodeLink[] };
    clips: VideoClip[];
    instagramReels: InstagramReel[];
  };
  infinitasSection: {
    heading: string; sub: string; linkLabel: string; linkUrl: string;
    featured: InfinitasCard; sideCards: InfinitasCard[];
  };
  statsSection: { heading: string; stats: Stat[] };
  testimonialsSection: { heading: string; testimonials: Testimonial[] };
  aboutSection: {
    image: string; imageAlt: string; videoUrl: string; badgeEyebrow: string; badgeTitle: string;
    eyebrow: string; pullQuoteMain: string; pullQuoteEm: string; body: string;
    productsLine: string; productsLineNote: string; actions: AboutAction[];
  };
  footer: {
    brandBlurb: string; socialLinks: SocialLink[]; infinitasLinkLabel: string;
    infinitasLinkUrl: string; copyrightText: string;
  };
  /** Optional: rows saved before 2026-08-05 don't carry it — read via
      productHubsContent(), never directly. */
  productHubs?: ProductHubsContent;
};

// Also cached across requests for 60s (unstable_cache, tagged so the admin
// save action can invalidate it immediately) — every (public) route is
// force-dynamic, so without this every page view re-ran this query even
// though site_content (nav links, homepage sections, footer) changes only
// when an editor saves it.
const querySiteContent = unstable_cache(
  async () => {
    const [row] = await db.select().from(siteContent).limit(1);
    if (!row) {
      throw new Error('site_content has no row (id=1) — run npm run migrate:json first');
    }
    return row.data as SiteContentData;
  },
  ['site-content-row'],
  { revalidate: 60, tags: [SITE_CONTENT_CACHE_TAG] },
);

// React's cache() dedupes this within a single request/render — several
// components (Header, Footer, each homepage section) all want the same
// row without each issuing its own query.
export const getSiteContent = cache(querySiteContent);

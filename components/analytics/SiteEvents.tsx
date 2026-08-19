'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { resolvePageProduct, trackEvent } from '@/lib/analytics-events';

// Two site-wide behaviours that would otherwise mean touching dozens of
// components: every outbound link, and every taxonomy chip.
//
// DELEGATED, not per-component, for a specific reason. The taxonomy chips
// are rendered in two places -- components/article/TagPillRow.tsx (a SERVER
// component, on cards and archive rows) and components/article/
// ArticleTopics.tsx (the article foot) -- and outbound links are scattered
// across the article CTA, the sidebar, the hub modules and article bodies
// that are raw HTML strings (lib/article-devices.ts), which have no React
// components to attach handlers to at all. One listener on document catches
// every case including the raw-HTML ones, and crucially keeps TagPillRow a
// server component: converting it just to add an onClick would ship the
// whole card tree to the client for one analytics call.
//
// Listener is passive and never calls preventDefault -- navigation must
// behave identically whether or not analytics is loaded or blocked.

// Both classes render the same thing (a /tema link carrying data-tier);
// they differ only in visual language -- square chips at the article foot,
// quiet text links on cards. See each component for why.
const TAG_SELECTOR = 'a.tag-topic, a.topic-chip';

function isOutbound(anchor: HTMLAnchorElement): boolean {
  // anchor.protocol/hostname are resolved against the document, so relative
  // hrefs correctly report the current host rather than parsing as invalid.
  if (anchor.protocol !== 'http:' && anchor.protocol !== 'https:') return false;
  return anchor.hostname !== window.location.hostname;
}

export function SiteEvents() {
  const pathname = usePathname();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const tagLink = target.closest(TAG_SELECTOR);
      if (tagLink instanceof HTMLAnchorElement) {
        trackEvent('tag_nav_click', {
          tier: tagLink.dataset.tier ?? 'unknown',
          tag: tagLink.textContent?.trim().slice(0, 100) ?? '',
          product: resolvePageProduct(pathname),
        });
        return;
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || !isOutbound(anchor)) return;

      trackEvent('outbound_click', {
        // Full href is capped at GA4's 100-char parameter limit; the host
        // is sent separately so "where does our traffic leak to" stays a
        // clean group-by even when a long URL is truncated.
        link_url: anchor.href.slice(0, 100),
        link_host: anchor.hostname,
        // Substack is the publication's other living surface, not a generic
        // outbound link -- worth being able to isolate in one filter.
        is_substack: anchor.hostname.endsWith('substack.com'),
        product: resolvePageProduct(pathname),
      });
    }

    // Capture phase: a click on a chip inside an element that stops
    // propagation (the article-foot disclosure intercepts its own summary
    // clicks) would never reach a bubble-phase listener on document.
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [pathname]);

  return null;
}

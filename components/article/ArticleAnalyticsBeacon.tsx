'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';

// Fires the custom Vercel Analytics event the admin dashboard's "top
// articles" panel already queries for (lib/analytics-data.ts's
// ARTICLE_EVENT_NAME = 'pageview_article', grouped by eventData/article_id)
// — port of legacy/js/article-page.js's `window.va('event', { name:
// 'pageview_article', data: { article_id } })` call, using the maintained
// npm package instead of the manual shim. Only ever rendered from the
// full-access branch of app/(public)/articulo/page.tsx, never for a walled
// view — same "nothing about this article reaches an unentitled reader"
// discipline already applied to that page's JSON-LD block.
export function ArticleAnalyticsBeacon({ articleId }: { articleId: string }) {
  useEffect(() => {
    track('pageview_article', { article_id: articleId });
  }, [articleId]);

  return null;
}

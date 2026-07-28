import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    // /archivo?* blocks crawling of its filter permutations (source × scope
    // × sport × vertical × view — thousands of crawlable combinations from
    // FILTER_TIERS in app/(public)/archivo/page.tsx, each a real <a href>
    // with no query-string-aware crawl control until now). A crawler
    // discovering that link graph is what took Web Analytics from near-zero
    // to 57K+ page views on /archivo alone in a few days despite ~125 real
    // visitors — see the analytics dashboard's Pages breakdown. Plain
    // /archivo (no query string) stays crawlable/indexable.
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/archivo?*'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

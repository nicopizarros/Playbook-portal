import { getAllArticles } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { shouldShowAuthor } from '@/lib/related-articles';
import { TAXONOMY, type TaxonomyTier } from '@/lib/taxonomy';
import { SITE_URL } from '@/lib/site-url';

// RSS 2.0, ported from legacy/api/feed.js. Next.js has no native RSS
// helper (unlike sitemap.ts/robots.ts), so this stays a plain Route Handler
// generating XML by hand, same as the legacy serverless function did.

export const dynamic = 'force-dynamic';

const FEED_TITLE = 'Playbook';
const FEED_DESCRIPTION = 'Noticias, análisis y video para entender el negocio del deporte en México y LATAM.';
const MAX_ITEMS = 50;

function xmlEscape(str: string) {
  return String(str || '').replace(/[&<>"']/g, s => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s] as string
  ));
}

function cdata(str: string) {
  return `<![CDATA[${String(str || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function toRfc822(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return isNaN(d.getTime()) ? new Date(0).toUTCString() : d.toUTCString();
}

function parseTopicFromQuery(url: URL) {
  const tiers = Object.keys(TAXONOMY) as TaxonomyTier[];
  const present = tiers.filter(tier => url.searchParams.has(tier));
  if (present.length !== 1) return null;
  const tier = present[0];
  const value = url.searchParams.get(tier);
  if (!value || !TAXONOMY[tier].includes(value)) return null;
  return { tier, value };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = parseTopicFromQuery(url);
  const [articles, content] = await Promise.all([getAllArticles(), getSiteContent()]);
  const mostrarAutorGlobal = content.siteSettings.mostrarAutorGlobal;

  const pool = topic
    ? articles.filter(a => {
        const column = topic.tier === 'scope' ? a.tagsScope : topic.tier === 'sport' ? a.tagsSport : a.tagsVertical;
        return column.includes(topic.value);
      })
    : articles;

  const sorted = pool.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const items = sorted
    .slice(0, MAX_ITEMS)
    .map(a => {
      const link = `${SITE_URL}/articulo?id=${encodeURIComponent(a.id)}`;
      const description = a.teaser || a.excerpt || '';
      const creator = shouldShowAuthor(a, mostrarAutorGlobal) && a.author
        ? `\n    <dc:creator>${cdata(a.author)}</dc:creator>`
        : '';
      return `  <item>
    <title>${cdata(a.title)}</title>
    <link>${xmlEscape(link)}</link>
    <guid isPermaLink="true">${xmlEscape(link)}</guid>
    <description>${cdata(description)}</description>
    <pubDate>${toRfc822(a.date)}</pubDate>${creator}
  </item>`;
    })
    .join('\n');

  const lastBuildDate = sorted.length ? toRfc822(sorted[0].date) : new Date(0).toUTCString();
  const feedTitle = topic ? `Playbook — ${topic.value}` : FEED_TITLE;
  const feedDescription = topic ? `Artículos de Playbook sobre ${topic.value}.` : FEED_DESCRIPTION;
  const selfHref = topic
    ? `${SITE_URL}/feed.xml?${topic.tier}=${encodeURIComponent(topic.value)}`
    : `${SITE_URL}/feed.xml`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xmlEscape(feedTitle)}</title>
  <link>${xmlEscape(SITE_URL)}/</link>
  <atom:link href="${xmlEscape(selfHref)}" rel="self" type="application/rss+xml" />
  <description>${xmlEscape(feedDescription)}</description>
  <language>es-mx</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
</channel>
</rss>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
    },
  });
}

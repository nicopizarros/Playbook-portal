// api/feed.js
// Genera feed.xml (RSS 2.0) desde el articles.json y content.json públicos,
// para que lectores y agregadores externos sigan a Playbook sin depender de
// Substack. Igual que api/sitemap.js: hace fetch de los JSON ya públicos en
// vez de leerlos del disco — el bundler de Vercel solo empaqueta lo que
// puede trazar desde imports estáticos, y esto evita depender de eso.
// Se recalcula en cada request (con cache corta abajo), así que el feed
// queda al día solo con que articles.json cambie — sin paso manual.

import { resolveSiteUrl } from '../lib/site-url.js';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS } from '../js/taxonomy.js';

const FEED_TITLE = 'Playbook';
const FEED_DESCRIPTION = 'Noticias, análisis y video para entender el negocio del deporte en México y LATAM.';
const MAX_ITEMS = 50;

// Same three tiers as js/taxonomy.js / js/tema-page.js / api/sitemap.js —
// lets ?scope=/?sport=/?vertical= narrow this feed to one topic.
const TAXONOMY = {
  scope: SCOPE_OPTIONS,
  sport: SPORT_OPTIONS,
  vertical: VERTICAL_OPTIONS
};

// Reads exactly one of ?scope=/?sport=/?vertical= from the request URL,
// validated against the closed taxonomy. Anything else (0, 2+ present, an
// unrecognized key, or a stale/unknown value) falls through to null, which
// callers treat as "unfiltered feed" — today's behavior, unchanged.
function parseTopicFromQuery(reqUrl, siteUrl) {
  const params = new URL(reqUrl, siteUrl).searchParams;
  const present = Object.keys(TAXONOMY).filter(tier => params.has(tier));
  if (present.length !== 1) return null;
  const tier = present[0];
  const value = params.get(tier);
  if (!value || TAXONOMY[tier].indexOf(value) === -1) return null;
  return { tier, value };
}

function xmlEscape(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

// CDATA lets title/description carry raw text (quotes, ampersands, accents)
// without hand-escaping every entity — only the CDATA close sequence itself
// needs neutralizing if it ever appears inside the text.
function cdata(str) {
  return `<![CDATA[${String(str || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function toRfc822(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return isNaN(d.getTime()) ? new Date(0).toUTCString() : d.toUTCString();
}

// Same OR logic as js/article-page.js shouldShowAuthor(): a per-article
// opt-in or the site-wide switch in content.json is enough either way.
function showsAuthor(article, siteSettings) {
  return article.mostrar_autor === true || (siteSettings && siteSettings.mostrarAutorGlobal === true);
}

function itemXml(siteUrl, article, siteSettings) {
  const link = `${siteUrl}/articulo.html?id=${encodeURIComponent(article.id)}`;
  const description = article.teaser || article.excerpt || '';
  const creator = showsAuthor(article, siteSettings) && article.author
    ? `\n    <dc:creator>${cdata(article.author)}</dc:creator>`
    : '';
  return `  <item>
    <title>${cdata(article.title)}</title>
    <link>${xmlEscape(link)}</link>
    <guid isPermaLink="true">${xmlEscape(link)}</guid>
    <description>${cdata(description)}</description>
    <pubDate>${toRfc822(article.date)}</pubDate>${creator}
  </item>`;
}

export default async function handler(req, res) {
  const siteUrl = resolveSiteUrl(req);
  const topic = parseTopicFromQuery(req.url, siteUrl);
  let articles = [];
  let siteSettings = {};
  try {
    const [articlesRes, contentRes] = await Promise.all([
      fetch(`${siteUrl}/articles.json`),
      fetch(`${siteUrl}/content.json`)
    ]);
    if (articlesRes.ok) {
      const data = await articlesRes.json();
      articles = Array.isArray(data.articles) ? data.articles : [];
    }
    if (contentRes.ok) {
      const data = await contentRes.json();
      siteSettings = data.siteSettings || {};
    }
  } catch {
    // Fuentes inalcanzables: se sirve un feed vacío pero válido en vez de un 500.
  }

  // A recognized-but-currently-empty topic legitimately yields a valid,
  // empty feed — not an error, and not a silent fallback to the full
  // firehose, which would surprise a subscriber who asked for one topic.
  const pool = topic
    ? articles.filter(a => ((a.tags || {})[topic.tier] || []).indexOf(topic.value) !== -1)
    : articles;

  const sorted = pool.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const items = sorted.slice(0, MAX_ITEMS).map(a => itemXml(siteUrl, a, siteSettings)).join('\n');
  const lastBuildDate = sorted.length ? toRfc822(sorted[0].date) : new Date(0).toUTCString();

  const feedTitle = topic ? `Playbook — ${topic.value}` : FEED_TITLE;
  const feedDescription = topic ? `Artículos de Playbook sobre ${topic.value}.` : FEED_DESCRIPTION;
  const selfHref = topic ? `${siteUrl}/feed.xml?${topic.tier}=${encodeURIComponent(topic.value)}` : `${siteUrl}/feed.xml`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xmlEscape(feedTitle)}</title>
  <link>${xmlEscape(siteUrl)}/</link>
  <atom:link href="${xmlEscape(selfHref)}" rel="self" type="application/rss+xml" />
  <description>${xmlEscape(feedDescription)}</description>
  <language>es-mx</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
</channel>
</rss>
`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).send(xml);
}

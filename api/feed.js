// api/feed.js
// Genera feed.xml (RSS 2.0) desde el articles.json y content.json públicos,
// para que lectores y agregadores externos sigan a Playbook sin depender de
// Substack. Igual que api/sitemap.js: hace fetch de los JSON ya públicos en
// vez de leerlos del disco — el bundler de Vercel solo empaqueta lo que
// puede trazar desde imports estáticos, y esto evita depender de eso.
// Se recalcula en cada request (con cache corta abajo), así que el feed
// queda al día solo con que articles.json cambie — sin paso manual.

import { resolveSiteUrl } from '../lib/site-url.js';

const FEED_TITLE = 'Playbook';
const FEED_DESCRIPTION = 'Noticias, análisis y video para entender el negocio del deporte en México y LATAM.';
const MAX_ITEMS = 50;

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

  const sorted = articles.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const items = sorted.slice(0, MAX_ITEMS).map(a => itemXml(siteUrl, a, siteSettings)).join('\n');
  const lastBuildDate = sorted.length ? toRfc822(sorted[0].date) : new Date(0).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xmlEscape(FEED_TITLE)}</title>
  <link>${xmlEscape(siteUrl)}/</link>
  <atom:link href="${xmlEscape(siteUrl)}/feed.xml" rel="self" type="application/rss+xml" />
  <description>${xmlEscape(FEED_DESCRIPTION)}</description>
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

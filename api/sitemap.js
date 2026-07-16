// api/sitemap.js
// Generates sitemap.xml from the live articles.json (+ content.json for the
// author-visibility switch) on every request, so a new article or a newly
// visible byline shows up with no manual step. Same pattern as api/feed.js:
// fetches the already-public JSON over HTTP instead of reading it from
// disk — Vercel's Node bundler only ships files it can trace from static
// imports, and this sidesteps that entirely.

import { resolveSiteUrl } from '../lib/site-url.js';

// Priority/changefreq tiers, matching actual content hierarchy — Google
// disregards sitemaps where every URL claims priority 1.0, so these are
// deliberately differentiated:
//   Homepage             1.0 / daily    — everything funnels through here
//   Archivo (aggregate)  0.6 / daily    — changes whenever anything publishes
//   Artículo             0.8 / weekly   — the actual content, second only to home
//   Autor (author archive) 0.4 / monthly — thinnest, lowest-value pages
// No dedicated tag/topic pages exist yet — the tag filters on /archivo.html
// are client-side button state, not their own URLs (see Etapa 4 of the
// roadmap) — so there's nothing to add for "tag pages" until those exist.
const TIERS = {
  home: { priority: '1.0', changefreq: 'daily' },
  archive: { priority: '0.6', changefreq: 'daily' },
  article: { priority: '0.8', changefreq: 'weekly' },
  author: { priority: '0.4', changefreq: 'monthly' }
};

// The sitemap protocol's hard cap on a single file. If this ever fires, the
// fix is to split buildEntries()'s output across multiple child sitemap
// files (e.g. api/sitemap-articles-2.js) and have this handler emit a
// <sitemapindex> pointing at them instead of a <urlset> — robots.txt and
// the sitemap already submitted in Search Console keep pointing at this
// same /sitemap.xml URL either way, nothing there needs to change.
const MAX_URLS_PER_SITEMAP = 50000;

function xmlEscape(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

// Sitemap <lastmod> must be a W3C-datetime string; articles.json stores
// `date` as YYYY-MM-DD, which qualifies. Anything else (missing, malformed
// from a bad manual edit) is dropped rather than papered over with
// today's date — an absent <lastmod> is honest, a fabricated one actively
// misleads GSC's recrawl prioritization.
function isValidDate(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}/.test(str) && !isNaN(new Date(str).getTime());
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  const parts = [`    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

// Same OR logic as js/article-page.js shouldShowAuthor() / api/feed.js
// showsAuthor() — kept in sync by hand across the three since each lives
// in a different runtime context (browser vs. two separate functions).
function showsAuthor(article, siteSettings) {
  return article.mostrar_autor === true || (siteSettings && siteSettings.mostrarAutorGlobal === true);
}

function mostRecentDate(dates) {
  const valid = dates.filter(isValidDate);
  return valid.length ? valid.sort().slice(-1)[0] : undefined;
}

function buildEntries(siteUrl, articles, siteSettings) {
  const entries = [];
  // Every <url> block gets a <lastmod>, including the two static pages —
  // GSC uses it to prioritize recrawls, and an omitted one just reads as
  // "unknown" rather than helping. Neither / nor /archivo.html has a
  // publish date of its own, so both use the most recent article date as
  // the honest proxy for "when this listing last actually changed".
  const latestArticleDate = mostRecentDate(articles.map(a => a.date));

  entries.push(urlEntry(`${siteUrl}/`, { ...TIERS.home, lastmod: latestArticleDate }));
  entries.push(urlEntry(`${siteUrl}/archivo.html`, { ...TIERS.archive, lastmod: latestArticleDate }));

  articles.forEach(a => {
    entries.push(urlEntry(`${siteUrl}/articulo.html?id=${encodeURIComponent(a.id)}`, {
      ...TIERS.article,
      lastmod: isValidDate(a.date) ? a.date : undefined
    }));
  });

  // Author archive pages: only for an author with at least one article
  // actually showing that byline right now. Listing every author who has
  // ever written something, regardless of whether mostrar_autor is on,
  // would put pages in the sitemap that are reachable from nowhere on the
  // site and show an empty state if crawled (see js/author-page.js).
  const authorDates = new Map();
  articles.forEach(a => {
    if (!a.author || !showsAuthor(a, siteSettings)) return;
    const existing = authorDates.get(a.author) || [];
    existing.push(a.date);
    authorDates.set(a.author, existing);
  });
  authorDates.forEach((dates, name) => {
    entries.push(urlEntry(`${siteUrl}/autor.html?nombre=${encodeURIComponent(name)}`, {
      ...TIERS.author,
      lastmod: mostRecentDate(dates)
    }));
  });

  // feed.xml (not an HTML page) and 404.html (not real content) are
  // deliberately never added here.

  if (entries.length > MAX_URLS_PER_SITEMAP) {
    console.warn(`[Playbook] sitemap.xml tiene ${entries.length} URLs, por arriba del límite de ${MAX_URLS_PER_SITEMAP} para un solo archivo — hace falta partirlo en un sitemap index (ver comentario de MAX_URLS_PER_SITEMAP).`);
  }

  return entries;
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
    // Fuentes inalcanzables: se sirve un sitemap con solo las páginas
    // estáticas en vez de fallar toda la respuesta con un 500.
  }

  const entries = buildEntries(siteUrl, articles, siteSettings);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).send(xml);
}

// api/sitemap.js
// Generates sitemap.xml from the live articles.json plus the site's static
// pages, so a new article shows up in the sitemap with no manual step.
//
// Fetches the already-public articles.json over HTTP instead of reading it
// from disk or calling the GitHub API: Vercel's Node bundler only ships
// files it can statically trace from imports, and a dynamic fs read of a
// JSON file living outside this function isn't guaranteed to be included.

const SITE_URL = 'https://www.playbookmedia.mx';
const STATIC_PATHS = ['/', '/archivo.html'];

function xmlEscape(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function urlEntry(loc, lastmod) {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
}

export default async function handler(req, res) {
  let articles = [];
  try {
    const r = await fetch(`${SITE_URL}/articles.json`);
    if (r.ok) {
      const data = await r.json();
      articles = Array.isArray(data.articles) ? data.articles : [];
    }
  } catch {
    // articles.json unreachable: still serve the static pages below instead
    // of failing the whole sitemap.
  }

  const entries = [
    ...STATIC_PATHS.map(p => urlEntry(`${SITE_URL}${p}`)),
    ...articles.map(a => urlEntry(`${SITE_URL}/articulo.html?id=${encodeURIComponent(a.id)}`, a.date))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).send(xml);
}

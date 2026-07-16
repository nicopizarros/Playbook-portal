// api/article-page.js
// Serves /articulo.html through a function instead of the static file
// directly (see the rewrite + functions.includeFiles in vercel.json), so
// that link-preview crawlers get correct per-article meta tags.
//
// Why this exists: js/article-page.js already sets the real title/OG/
// Twitter tags client-side (applyArticleSeo), which is enough for real
// readers and for Googlebot (which renders JS). It is NOT enough for
// WhatsApp, X/Twitter, Facebook, Slack, LinkedIn, Discord, Telegram — none
// of those link-preview crawlers execute JavaScript. They fetch the raw
// HTML once and read whatever <meta> tags are already there, so every
// article was showing the same generic Playbook card when shared, image
// included. This function rewrites those tags server-side, per request,
// for exactly that kind of client — and otherwise gets out of the way.
//
// Human requests get the untouched static file (byte-for-byte what was
// served before this existed) plus one small, purely additive addition: a
// <link rel="preload"> for the article's real hero image, so the browser
// can start fetching it before articles.json even loads — a meaningful
// LCP win on a slow connection, and safe even if it's ever wrong (an
// unused preload hint is just a few wasted bytes, never a broken page).

import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.playbookmedia.mx';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/playbook-logo.webp`;

// Crawlers that fetch a URL once for a link preview and do not run JS.
// Matched case-insensitively as a substring of the User-Agent header.
const BOT_USER_AGENTS = [
  'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot', 'slackbot',
  'telegrambot', 'whatsapp', 'discordbot', 'redditbot', 'applebot',
  'googlebot', 'bingbot', 'vkshare', 'w3c_validator'
];

function isBotRequest(userAgent) {
  const ua = String(userAgent || '').toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function escapeAttr(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

// Replaces the value between two fixed markers found via `pattern` (a regex
// with two capture groups: everything up to the value, and everything
// after it). If `pattern` doesn't match — a tag renamed or reordered in
// articulo.html without updating this file — replace() just returns the
// input unchanged, so a drift here degrades to "stale tag", never a crash.
function replaceValue(html, pattern, value) {
  return html.replace(pattern, (_match, pre, post) => `${pre}${escapeAttr(value)}${post}`);
}

function injectArticleMeta(html, article) {
  const canonicalUrl = `${SITE_URL}/articulo.html?id=${encodeURIComponent(article.id)}`;
  const image = article.imageUrl || DEFAULT_OG_IMAGE;
  const description = article.excerpt || '';
  const title = `${article.title} — Playbook`;

  let out = html;
  out = replaceValue(out, /(<title>)[^<]*(<\/title>)/, title);
  out = replaceValue(out, /(<meta name="description" content=")[^"]*("\s*\/>)/, description);
  out = replaceValue(out, /(<link rel="canonical" href=")[^"]*("\s*\/>)/, canonicalUrl);
  out = replaceValue(out, /(<meta property="og:title" content=")[^"]*("\s*\/>)/, title);
  out = replaceValue(out, /(<meta property="og:description" content=")[^"]*("\s*\/>)/, description);
  out = replaceValue(out, /(<meta property="og:url" content=")[^"]*("\s*\/>)/, canonicalUrl);
  out = replaceValue(out, /(<meta property="og:image" content=")[^"]*("\s*\/>)/, image);
  out = replaceValue(out, /(<meta name="twitter:card" content=")[^"]*("\s*\/>)/, article.imageUrl ? 'summary_large_image' : 'summary');
  out = replaceValue(out, /(<meta name="twitter:title" content=")[^"]*("\s*\/>)/, title);
  out = replaceValue(out, /(<meta name="twitter:description" content=")[^"]*("\s*\/>)/, description);
  out = replaceValue(out, /(<meta name="twitter:image" content=")[^"]*("\s*\/>)/, image);
  return out;
}

function injectPreloadHint(html, article) {
  if (!article.imageUrl) return html;
  const tag = `<link rel="preload" as="image" href="${escapeAttr(article.imageUrl)}" fetchpriority="high" />\n</head>`;
  return html.replace('</head>', tag);
}

export default async function handler(req, res) {
  const template = fs.readFileSync(path.join(process.cwd(), 'articulo.html'), 'utf8');
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const bot = isBotRequest(req.headers['user-agent']);

  let article = null;
  if (id) {
    try {
      const r = await fetch(`${SITE_URL}/articles.json`);
      if (r.ok) {
        const data = await r.json();
        article = (data.articles || []).find(a => a.id === id) || null;
      }
    } catch {
      // articles.json unreachable: fall through and serve the generic
      // static template below, same as if the id just didn't match.
    }
  }

  let html = template;
  if (article && bot) {
    html = injectArticleMeta(html, article);
  } else if (article) {
    html = injectPreloadHint(html, article);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  // The response body differs by client type (bot vs. human) for the same
  // URL — tell any cache in front of this not to mix the two up.
  res.setHeader('Vary', 'User-Agent');
  return res.status(200).send(html);
}

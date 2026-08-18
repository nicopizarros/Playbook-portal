---
name: verify
description: How to actually run this site locally to verify a change (no build step, no npm, no vercel CLI in sandbox)
---

# Verifying Playbook Portal locally

No `package.json`, no `vercel` CLI available in the sandbox, no `ADMIN_TOKEN_SECRET`/`ADMIN_USERS`/real GitHub write access to lean on. `GITHUB_TOKEN` may be present (proxy-injected) — never exercise `api/admin-save.js`/`api/admin-content.js`/`api/update-articles.js` live, they write to the real repo via `lib/github.js`.

## What actually works: a tiny local Node server

Public pages + read-only API routes (`api/sitemap.js`, `api/feed.js`, `api/article-page.js`) don't need Vercel or GitHub — they self-fetch `/articles.json`/`/content.json` over HTTP from whatever host served them. Stand up a plain `http.createServer` that:

1. Imports the handler modules directly (`(await import('api/sitemap.js')).default`) and dispatches to them for their rewritten paths (`/sitemap.xml`, `/feed.xml`, `/articulo.html`), matching `vercel.json`'s rewrites.
2. Serves everything else as static files from the repo root (mimics Vercel's static hosting, including `/articles.json`/`/content.json` that the handlers above self-fetch).
3. **Gotcha:** `lib/site-url.js`'s `resolveSiteUrl()` always builds an `https://` origin from the request's Host header — a plain local `http.createServer` has no TLS listener, so the handlers' internal self-fetch to `https://localhost:PORT/...` fails silently (caught, degrades to empty data) unless you monkeypatch `globalThis.fetch` in the harness to rewrite `https://localhost:PORT` back to `http://localhost:PORT` before the real fetch fires. Do this before importing the handler modules.
4. Run with cwd = repo root (`api/article-page.js` reads `articulo.html` via `fs.readFileSync(path.join(process.cwd(), 'articulo.html'))`).

Pick a port and check nothing else already owns it first (`curl -s -o /dev/null -w '%{http_code}' http://localhost:PORT/` — a `000` means it's free); this sandbox has had stale listeners survive across tool calls with no visible PID (`ss`/`netstat`/`ps` came up empty), so if a port refuses to bind, just pick a different one rather than debugging the ghost process.

## Driving the browser

Playwright is installed globally, not resolvable via plain `import 'playwright'` — either set `NODE_PATH` won't help (ESM ignores it) or, simplest: `import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'`. Launch with `executablePath: '/opt/pw-browsers/chromium'` (pre-installed; don't run `playwright install`).

Useful checks for anything touching `.lead-story`/`.news-row`/tag pills:
- Nested-`<a>` check (this codebase has bitten itself on this before — pills used to sit inside the card's own anchor):
  ```js
  document.querySelectorAll('a').forEach... // check no <a> has an <a> ancestor
  ```
- `history.replaceState`-based filters (archive page): click, check `location.search`, reload that literal URL, confirm button `aria-pressed` state and results match — `history.length` should only grow from real navigations, not filter clicks.

## What's blocked in this sandbox

Full `/admin` CMS flow (login → load content → save) needs `ADMIN_TOKEN_SECRET`/`ADMIN_USERS` (login always fails closed without them) and would hit the real GitHub repo for content once past login. Verified CMS-side JS/CSS changes instead via: `node --check` on the file, and confirming the *shared* template/CSS code paths (e.g. `js/templates.js`'s `tagPillsRowTemplate`, `.card-link` stretched-link CSS) work correctly on the public pages that use the same functions/classes.

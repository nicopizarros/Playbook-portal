---
name: verify
description: How to actually run, drive and measure this site locally — dev server, production build, Playwright screenshots, Lighthouse, and direct Neon queries. Use before claiming any visual, behavioural or performance change works.
---

# Verifying Playbook Portal

**Rewritten 2026-08-18.** The previous version described the pre-Next.js
static site ("no `package.json`", `api/sitemap.js`, `legacy/js`) and had been
wrong for months. This version is what was actually executed in the session
that rewrote it.

This is a **Next.js 15 App Router** app: `package.json`, `npm run dev`,
Postgres on Neon, Playwright as a devDependency.

## Environment: do not `source .env.local`

Values contain `&`, so `set -a && . ./.env.local` dies with a zsh parse
error. Extract the one variable you need:

```bash
POSTGRES_URL="$(grep '^POSTGRES_URL=' .env.local | cut -d= -f2- | tr -d '"'"'"'')"
```

Note `BLOB_READ_WRITE_TOKEN` is **present but empty** locally — a naive
`grep -c` says it is set. Uploads to Vercel Blob are not possible from here;
commit assets to `public/` instead and reference them root-relative
(`metadataBase` in `app/layout.tsx` resolves them absolutely for OG tags).

## Running

```bash
# dev
POSTGRES_URL="$(...)" npm run dev                      # :3000

# production (what you must measure against)
POSTGRES_URL="$(...)" npm run build
POSTGRES_URL="$(...)" AUTH_TRUST_HOST=1 PORT=3100 npm start
```

`AUTH_TRUST_HOST=1` silences an `UntrustedHost` error from Auth.js on a
non-canonical host. Harmless, but it fills the log.

## THE TRAP: stale servers. Read this before measuring anything.

`pkill -f "next start"` **never matches** — the running process is named
`next-server`. A "restart" that silently does nothing leaves the old server
bound to the port, and if you rebuilt in between, its `.next` was deleted
underneath it. Symptom: CSS 400s and a completely unstyled page, or worse,
plausible-looking Lighthouse numbers for a build you are not testing.

**Kill by port, then prove the server is current:**

```bash
lsof -ti :3100 | xargs -r kill -9
# … start it, then:
for f in $(curl -s http://localhost:3100/ | grep -o '/_next/static/css/[a-z0-9]*\.css' | sort -u); do
  echo "$f $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100$f)"
done
```

**Every hash must be 200 and exist in `.next/static/css/`.** A 400 means the
served HTML references assets from a build that no longer exists. Two
Lighthouse runs and a screenshot batch were thrown away on 2026-08-18 for
exactly this. Never report a measurement without this check.

## Driving the browser

Playwright is a devDependency, so `import { chromium } from 'playwright'`
works — **but the script must live in the repo root**, not in `/tmp`. Node
resolves `node_modules` from the script's own directory.

```js
// ./_shot.mjs  (delete when done)
import { chromium } from 'playwright';
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2, colorScheme:'dark' });
const p = await c.newPage();
await p.goto('http://localhost:3100/', { waitUntil:'networkidle' });
await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), 'dark');
// the cookie notice covers modules in full-page shots — drop it
await p.evaluate(() => { for (const el of document.querySelectorAll('div,section,aside'))
  if (/Usamos cookies/.test(el.textContent||'') && el.children.length < 8) el.remove(); });
await p.screenshot({ path:'/tmp/shots/x.png', fullPage:true });
await b.close();
```

Theming is a `data-theme` attribute on `<html>` (`light` | `dark`); the
three-layer cascade is documented in `styles/tokens.css`. Set the attribute
**and** `colorScheme` — `prefers-color-scheme` alone does not beat an
explicit toggle.

Ignore these console errors, they are deploy-only:
`/_vercel/insights/script.js` 404 and its MIME warning.

## Lighthouse

```bash
npx --yes lighthouse@12 http://localhost:3100/<route> \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless --no-sandbox" --output=json --output-path=/tmp/lh.json --quiet
```

Always measure a **comparable existing route** too — an absolute score means
little; the delta against `/noticias` is the reportable number. Confirm the
server is current first (above).

## Querying production data

Use Neon's **HTTP** driver. `lib/db/client.ts`'s `pg` Pool needs raw TCP,
which works from this Mac but not from sandboxed sessions — scripts that must
run anywhere use `@neondatabase/serverless`:

```ts
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.POSTGRES_URL!);
const rows = await sql`select id, title from articles limit 5`;
```

Standalone scripts must be `.mts` (or in `scripts/`) — top-level `await` fails
under tsx's CJS output for a bare `.ts`.

## Content does not appear instantly

- `getAllArticles` is `unstable_cache(..., { revalidate: 60 })`. A row
  inserted directly into Postgres shows on the article page immediately (that
  path is uncached) but takes up to a minute in listings, the homepage and the
  sitemap.
- `/feed.xml` additionally sends `Cache-Control: max-age=300`, so RSS lags ~5
  minutes behind.

Neither is a bug. Wait and re-check with an `until` loop rather than
"fixing" it.

## Before claiming a change works

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` clean
- [ ] Server currency verified (CSS hashes 200 + on disk)
- [ ] Screenshots in **both** themes, desktop and mobile
- [ ] Keyboard pass: focus visible, Escape closes, focus returns
- [ ] Console errors, excluding the two deploy-only ones above
- [ ] Delete the throwaway `./_*.mjs` scripts

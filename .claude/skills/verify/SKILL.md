---
name: verify
description: How to actually run this Next.js site locally — Postgres, dev/prod server, Playwright with real external images — to verify a change against a running app instead of only compiling it
---

# Verifying Playbook Portal locally

This file described the **pre-migration static site** (`api/*.js` handlers,
`articulo.html`, no `package.json`) until 2026-08-04. That site is gone —
see HANDOFF.md's Fase 6 entry, `legacy/` was deleted. Everything below is
the current Next.js + Postgres app, and every step was run end to end
during the pre-launch audit.

## 1. Dependencies

`node_modules` is usually absent at session start. `npm install` works and
respects the committed lockfile. `node`, `npm`, `npx`, `psql`,
`pg_ctlcluster` and `sharp` (via Next) are all available.

## 2. Postgres

`postgresql-16` is preinstalled but stopped. Bring up a throwaway local
database — do NOT point local work at the production Neon URL:

```bash
service postgresql start
su postgres -c "psql -c \"CREATE ROLE playbook LOGIN PASSWORD 'playbook' SUPERUSER;\" -c 'CREATE DATABASE playbook OWNER playbook;'"
export PB_DB="postgresql://playbook:playbook@127.0.0.1:5432/playbook"
POSTGRES_URL="$PB_DB" npx tsx scripts/run-migrations.ts
POSTGRES_URL="$PB_DB" npx tsx scripts/migrate-json-to-db.ts   # 30 articles + site_content
POSTGRES_URL="$PB_DB" npx tsx scripts/reset-editor-password.ts aldo   # prints a password once
```

**The environment already exports a real production `POSTGRES_URL`, and a
process env var beats `.env.local`.** Pass `POSTGRES_URL=$PB_DB` inline on
every command (and in the server's env) or you will be reading and writing
production.

Production Neon is reachable over HTTPS only — the `pg` TCP pool times out
from here. Scripts that must touch it use `@neondatabase/serverless` +
`drizzle-orm/neon-http` (see `scripts/fix-lana-rebrand-content.ts` and
friends, all of which support `--dry-run`; always dry-run first).

## 3. The server

```bash
# .env.local — POSTGRES_URL here is ignored, see above
AUTH_SECRET=<any string>
NEXTAUTH_URL=http://localhost:3100
AUTH_GOOGLE_ID=… AUTH_GOOGLE_SECRET=…   # optional; omit to exercise the
                                        # no-Google degradation path
```

`next dev -p 3100` for iteration; `next build && next start -p 3200` for
anything about security headers, error boundaries or real bundle behaviour
(`next dev`'s overlay hides the production error UI). Under `next start`
Auth.js requires `AUTH_TRUST_HOST=1` locally — without it every sign-in
fails `UntrustedHost` and a test harness can report a false success. Vercel
sets `VERCEL=1`, which covers this in production.

Start it detached (`setsid nohup … &`) and wait with
`until curl -s -o /dev/null http://localhost:3100/; do sleep 3; done` —
plain sleeps are blocked.

## 4. Playwright

Globally installed, not resolvable by bare specifier:

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

**Chromium cannot reach the egress proxy** (CONNECT is reset), so every
external editorial photo, YouTube embed and Substack link fails and pages
look broken in screenshots. Node's `fetch` *can*, with
`NODE_USE_ENV_PROXY=1`. Route external requests through it:

```js
await ctx.route('**/*', async route => {
  const url = route.request().url();
  if (url.startsWith('http://localhost') || url.startsWith('data:')) return route.continue();
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const headers = {}; r.headers.forEach((v, k) => {
    if (!['content-encoding','content-length','transfer-encoding'].includes(k)) headers[k] = v; });
  return route.fulfill({ status: r.status, headers, body: Buffer.from(await r.arrayBuffer()) });
});
```

With that in place the audit saw zero broken images on every public page.

### Screenshots lie if you scroll too early

`.reveal` elements start at `opacity:0` and are revealed by
`components/ScrollReveal.tsx`'s IntersectionObserver, installed in a
`useEffect`. A `fullPage` screenshot taken after a fast programmatic scroll
that races hydration shows whole sections blank — **content a real reader
never loses**. This cost real time during the audit before being pinned
down. Always `waitForLoadState('load')`, pause ~1s, then scroll in ~300px
steps with ~110ms gaps before capturing.

Related: assert on `getComputedStyle(el).opacity`, not just
`innerText.length`. A 2026-07-22 session missed a real blank-page bug
because `opacity:0` does not empty `innerText`.

## 5. Checks worth repeating

- Nested anchors: `document.querySelectorAll('a a').length` must be 0 —
  cards put tag pills next to a stretched `.card-link` for this reason.
- Horizontal overflow: `window.scrollTo(9999,0)` then read `window.scrollX`;
  `documentElement.scrollWidth` over-reports because of `overflow-x:clip`
  and the off-screen drawer.
- Computed colour vs background on themed controls — two of the worst bugs
  found in the audit (an invisible drawer CTA, a `display:none` theme
  toggle) were pure CSS-specificity mistakes that only measurement caught.
- Admin: log in at `/admin`, click every tab, watch for console errors. The
  live preview reuses public section components, so it regresses with them.

## 6. Verification gate

`npx tsc --noEmit`, `npx eslint .`, and `npx next build` must all be clean,
**with and without `.env.local`** — Next reads that file off disk, so
unsetting shell variables does not simulate a missing Vercel env var.

## 7. What genuinely cannot be verified here

Real Google OAuth round-trip, real Resend delivery, real Vercel Blob
uploads, live GA4/Vercel Analytics data, AdSense rendering, and the Google
Sheets sync — all need credentials this environment does not have. Say so
explicitly rather than implying they were tested; that is the standard the
rest of HANDOFF.md holds itself to.

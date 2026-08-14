---
name: verify
description: How to actually run this site locally to verify a change (Next.js app; dev server + Playwright against real Postgres, no Vercel CLI needed)
---

# Verifying Playbook Portal locally

(Rewritten 2026-08-13. The previous version of this file described the
pre-Next.js static site — `api/*.js` handlers, `articulo.html`, self-fetched
`/articles.json` — none of which exists anymore. If guidance here contradicts
the repo, trust the repo and update this file.)

This is a Next.js 15 App Router app backed by Postgres (Drizzle, plain `pg`
driver over `POSTGRES_URL`). There is no static fallback: pages query the DB
at request time, so a dev server without a reachable `POSTGRES_URL` renders
errors, not empty pages.

## Static checks (always available, no DB)

```
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run build       # full production build; needs POSTGRES_URL only at request time, not build time
```

`lib/db/client.ts` deliberately does not throw on a missing `POSTGRES_URL` at
import time, so `next build` succeeds without a database.

## Running the real app

```
npm install
npm run dev   # or: npx next dev -p 3100
```

`POSTGRES_URL` must be exported or in `.env.local` (see `.env.local.example`).
In Claude Code web/remote sessions it is usually already exported — check with
`env | grep POSTGRES`. **That is the production Neon database: read-only
verification only.** Never exercise admin save flows, publish scripts, or
anything that writes, unless the human explicitly asked for a publish.

Pick a port and check nothing owns it first
(`curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/` — `000`
means free). If a port refuses to bind, pick another rather than debugging
the ghost process.

## Driving the browser

Playwright is installed globally, not resolvable via plain
`import 'playwright'`. Use:

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

(If that Playwright path doesn't exist, `npm ls playwright` — it's also a
devDependency — and use `./node_modules/playwright/index.mjs`. Never run
`playwright install`; the browser is pre-installed at `/opt/pw-browsers`.)

Ready-made suites, both expecting the dev server on port 3100:

```
node scripts/smoke-test.mjs      # theme toggle, drawer, search, console errors
node scripts/test-email-wall.mjs # metering / email wall behavior
```

## What to check by surface

- **Homepage / hubs (`/`, `/noticias`, `/la-lana`, `/infinitas`,
  `/futbol-business-review`)**: no console errors, no nested `<a>` (this
  codebase has bitten itself on that), motion runs once per element (two
  animation systems driving one element is a jitter bug — see
  `components/SiteMotion.tsx`'s header comment for what already moves).
- **Article page (`/articulo?id=<id>`)**: pick a real id from the DB
  (`select id from articles order by date desc limit 5`). Check device
  rendering (`.lect-*` elements) if the change touches
  `lib/article-devices.ts`.
- **Archive filters (`/archivo`)**: click a filter, check `location.search`,
  reload that URL, confirm `aria-pressed` and results match;
  `history.length` should only grow from real navigations.
- **Theme**: both light and dark, `data-theme` attribute on `<html>`.

## What's blocked in a sandbox

The full `/admin` CMS flow needs editor credentials (`ADMIN_USERS` seeding —
see `docs/ENCYCLOPEDIA.md`) and writes to the production DB past login. Verify
CMS-side changes via typecheck plus the shared code paths exercised on public
pages, or with a component-level check, not by logging into the real admin.

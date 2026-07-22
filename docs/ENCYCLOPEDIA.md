# Playbook Portal — Project Encyclopedia

A comprehensive technical reference for the Playbook Portal codebase: what it
is, how it's built, how every piece fits together, and where to look for
more detail. Written so a new contributor — human or AI agent — can get
oriented without reading the entire git history.

**This document is a snapshot of architecture and how things work.** It does
not track day-to-day progress or session-by-session decisions — that's
[`HANDOFF.md`](../HANDOFF.md)'s job (see "Where to look next" at the bottom).
If the two ever disagree, treat `HANDOFF.md`'s progress log as more current
for *recent* changes, and this document as the map for *how the system is
structured*. Last synced against the codebase: 2026-07-22 (post–Fase 6,
migration complete).

---

## 1. What Playbook Is

**Playbook** is a Spanish-language digital sports-business publication
covering the Mexico/LATAM market — think "the business side of sports":
governance, broadcast rights, M&A, sponsorships, venues, sports finance,
private equity, sports marketing, talent management, audiences, fan
experience, naming rights. Content comes from three editorial lines/sources:

- **Industry Shots** (source key `industry-shots`) — general news digest.
- **La Lana del Mundial** (source key `la-lana`) — World Cup business
  coverage.
- **Infinitas** (source key `infinitas`) — a distinct newsletter product
  with its own homepage section.
- Plus a generic **Playbook** (`playbook`) bucket for content that doesn't
  fit those three.

The publication's actual writing lives on **Substack**
(`playbookmedia.substack.com`); this site is the **owned-and-operated
reading surface**: SEO-indexable article pages, a homepage/archive, a
free-article metering paywall (3 free reads/month for anonymous visitors,
unlimited for anyone who signs in with a magic link), and an internal CMS
for the small editorial team (aldo, nico, guillermo) to manage content
without touching code.

Two content-ingestion paths feed the database:
1. **Make.com webhook** (`POST /api/update-articles`) — an external
   automation (RSS-to-webhook, presumably watching the Substack feed) posts
   new articles automatically.
2. **`publish-newsletter` Claude Code skill** — an agent-driven pipeline that
   reads a Substack edition and drafts+publishes structured articles
   directly, used when the team wants richer editorial framing than the
   webhook's mechanical field-mapping provides.

## 2. History in One Paragraph

Playbook started as a **static site with no build step** — hand-written
HTML/CSS/vanilla JS, served by Vercel Serverless Functions, with
`articles.json`/`content.json` living in the git repo itself as the "database"
(committed via GitHub's Contents API, edited through a hand-rolled admin
panel). Between **2026-07-20 and 2026-07-22**, the project was migrated in
six phases to a proper **Next.js (App Router) app backed by real Postgres**,
keeping the exact same URLs, design, and editorial workflow the team already
knew, while replacing every piece of legacy infrastructure underneath it.
The old static site's code lived in `legacy/` throughout the migration as a
reference and was deleted once the cutover was verified complete (Fase 6,
checkpoint 2). **The migration is functionally done** — what remains is
configuring real production credentials in Vercel (Resend, Vercel Blob, GA4,
Vercel Analytics) and verifying them against live traffic; see §12.

`articles.json` and `content.json` still exist at the repo root — they are
**not read by the running app**. They're the original seed data, consumed
exactly once by `scripts/migrate-json-to-db.ts` to populate Postgres, and
are kept only as historical reference for what the legacy dataset looked
like.

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router), React 19 | Server Components by default, Client Components (`'use client'`) only where interactivity is needed |
| Language | TypeScript, strict mode | `tsc --noEmit` must be clean |
| Database | **Postgres** (Vercel Postgres / Neon in production, local Postgres in dev) | Chosen over Supabase Postgres |
| ORM | **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`) | Chosen over Prisma |
| Auth | **Auth.js (NextAuth) v5** (beta) | One instance, two providers — see §7 |
| Rich text editor | **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/html`) | Powers the admin article body editor |
| Image storage | **Vercel Blob** | Client-direct uploads from the TipTap editor |
| Transactional email | **Resend** | Reader magic-link sign-in |
| Analytics | **GA4** (Data API, read-only, service account) + **Vercel Web Analytics** (REST API) + **`@vercel/analytics`** (client beacon) | Three distinct integrations, see §8.8 |
| Charts | **Chart.js** | Admin analytics dashboard bar charts |
| Password hashing | **bcryptjs** | Editor credentials only |
| Validation | **zod** | Present in deps; used lightly |
| CSS | Hand-written global CSS (no Tailwind, no CSS Modules, no CSS-in-JS) | See §10 |
| Fonts | `next/font/google` — Anton (display) + Inter (body) | Self-hosted, no external `<link>` |
| DB scripting runtime | **tsx** | Runs `.ts` scripts directly (migrations, seeds) |

Full dependency list: [`package.json`](../package.json).

## 4. Repository Map

```
app/                        Next.js App Router — pages, layouts, API routes (§9)
  (public)/                 Public reading site (route group, no URL segment)
  admin/                    Editorial CMS ("/admin")
  api/                      API route handlers
  layout.tsx, error.tsx, global-error.tsx, sitemap.ts, robots.ts, feed.xml/

auth.ts                     Single Auth.js instance (readers + editors)
middleware.ts                Anonymous-reader cookie minting (Node runtime)

lib/
  db/                        schema.ts (Drizzle schema), client.ts (pg Pool)
  data/                      Read-side data-access functions (§6)
  actions/                   Server Actions — the write side (§6)
  *.ts                       Business logic: ranking, metering, taxonomy,
                              slugify, rate limiting, GA4/Vercel Analytics
                              clients, safe-url, site-url, bots, constants

drizzle/                     Generated SQL migrations + snapshots
scripts/                     One-off/ops scripts (§11)

components/
  admin/                     CMS UI (all client components) — §10.1
  sections/, home/, article/, layout/, shared/, theme/, account/, analytics/
                              Public-site UI — §10.2

styles/                      Hand-written global CSS, one file per concern
types/                       next-auth.d.ts module augmentation

docs/                        image-dimensions.md, this file
.claude/skills/               publish-newsletter, verify (Claude Code skills) — §13
.github/workflows/ci.yml      typecheck → lint → build, on push/PR

articles.json, content.json   Legacy seed data — read once by migrate:json, not by the app
HANDOFF.md                    Session-by-session progress log (the "diary")
README.md                     Quick operational reference
```

## 5. Database Schema

Nine tables, defined in [`lib/db/schema.ts`](../lib/db/schema.ts), migrations
in `drizzle/`. Dialect: PostgreSQL.

### `editors`
The internal editorial team. Credentials-based login, **not** wired through
the Auth.js adapter (kept structurally separate from reader identities).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | random default |
| `username` | text, unique | |
| `passwordHash` | text | bcrypt |
| `displayName` | text | |
| `createdAt` | timestamptz | |

### `articles`
The core content table. `id` (text PK) is the **legacy slug**, preserved
verbatim so `/articulo?id=...` URLs never break.

| Column | Type | Notes |
|---|---|---|
| `title`, `excerpt`, `teaser` | text | `teaser` doubles as RSS `<description>` and pre-body fallback |
| `bodyJson` | jsonb, nullable | TipTap document; `null` for legacy articles that never got a native editor body |
| `bodyHtml` | text | **Server-rendered cache** of `bodyJson`, regenerated on every save (`@tiptap/html`'s `generateHTML`) so pages render plain HTML without re-walking the JSON tree per request |
| `author`, `date` (`YYYY-MM-DD` text, not a date column), `dateFormatted` | | |
| `publication` (default `'Playbook'`), `source` (default `'playbook'`) | | |
| `tagsScope`, `tagsSport`, `tagsVertical` | text[], default `{}` | the three-tier taxonomy (§8.2) |
| `priority` | smallint, default 3 | 1–5 star editorial importance |
| `featured` | boolean | hero-eligibility override |
| `mostrarAutor` | boolean | per-article byline opt-in |
| `readingTime` | smallint, default 1 | |
| `substackUrl` | text, default `''` | link to the parent Substack post (may be shared by several articles in a digest) |
| `sourceUrl` | text, nullable, **unique index** | per-item webhook dedup key (see below) — `null` for every migrated/legacy row |
| `imageUrl`, `status` (`'published'`\|`'draft'`, default `'published'`) | | |
| `createdAt`, `updatedAt`, `updatedBy` (FK → `editors.id`, `SET NULL`) | | |

**Why `sourceUrl` is separate from `substackUrl`:** for "Industry Shots"
digest posts, one Substack post (`substackUrl`) legitimately backs *several*
distinct articles, each with its own `sourceUrl` (the webhook payload's
per-item `url`). A unique index on `substackUrl` would have rejected
legitimate digest siblings; `sourceUrl` is the real per-article dedup
identity. Because Postgres treats every `NULL` as distinct in a unique
index, all the `NULL`-`sourceUrl` legacy rows never collide with each other
or with real webhook inserts.

Indexes: `articles_date_idx`, `articles_source_idx`, `articles_author_idx`,
and `articles_source_url_unique` (added in migration `0001`).

### `siteContent`
Single-row table (`id = 1`) holding one `jsonb` blob (`data`) that mirrors
legacy `content.json` 1:1 (nav, all homepage sections, footer, settings —
see §6.2 for the full shape). `version` (int, default 1) is the
optimistic-concurrency counter, replacing GitHub's blob `sha`.

### `contentRevisions`
Append-only audit trail (legacy had git commit history for this; now every
successful article save/create and site-content save inserts a snapshot
row here). `articleId`/`siteContentVersion`/`editorId` nullable, `snapshot`
(jsonb), `createdAt`.

### Auth.js reader tables — `users`, `accounts`, `verificationTokens`
Standard `@auth/drizzle-adapter` shape, scoped to readers only:
- `users` ("user"): `id` uuid PK, `email` unique, `emailVerified`, `name`,
  `image`, `createdAt`.
- `accounts` ("account"): composite PK `(provider, providerAccountId)`,
  `userId` FK `ON DELETE CASCADE`.
- `verificationTokens` ("verification_token"): composite PK
  `(identifier, token)`, keyed by **email string**, no FK to `users`.

### `anonReaders`
One row per anonymous visitor, identified by the signed `pb_anon` cookie
(minted in `middleware.ts`). No PII. `id` uuid PK, `createdAt`,
`lastSeenAt`.

### `articleReads`
Distinct-article-per-month read log backing both the metering quota and the
admin "most read" panel. `readerId` (nullable FK → `users`, cascade) /
`anonId` (nullable FK → `anonReaders`, cascade) — **exactly one is set**,
enforced in application code, not the schema. `articleId` FK → `articles`
(cascade), `monthKey` (`'YYYY-MM'`), `readAt`. Two composite unique indexes
(`(readerId, articleId, monthKey)`, `(anonId, articleId, monthKey)`), neither
partial (`WHERE`-less) — works because NULL columns never collide in a
Postgres unique index.

### `media`
TipTap image uploads: `id`, `url`, `uploadedBy` (nullable FK → editors,
`SET NULL`), `createdAt`.

### Migrations
- `drizzle/0000_rainy_harry_osborn.sql` — initial schema, all nine tables,
  idempotent FK creation, base indexes.
- `drizzle/0001_confused_leopardon.sql` — adds `articles.source_url` +
  its unique index (the change that unlocked atomic webhook dedup).

Regenerate migrations after a schema change with `npm run db:generate`
(runs `drizzle-kit generate`); apply with `npm run db:migrate`.

## 6. Data & Write Layer

### 6.1 Read layer (`lib/data/`)

- **`articles.ts`** — `Article` type is `typeof articles.$inferSelect`.
  - `getAllArticles()` — `React.cache()`-wrapped; all `status='published'`
    rows, sorted by date desc in JS (not SQL — deliberate, mirrors the
    legacy "fetch everything, filter in memory" pattern; fine at ~30 rows).
  - `getArticleById(id)` — full row including body, for full-access
    rendering / admin editing.
  - `getArticleMetaById(id)` — **column-restricted** select that excludes
    `teaser`/`bodyJson`/`bodyHtml`. This is what makes the paywall's
    guarantee real at the query level, not just hidden by CSS: the walled
    render path never even fetches body content.
  - `getArticlesByAuthor(name)`, `getArticlesByTag(tier, value)`,
    `getArchiveArticles(filters)` (computes the ranked pool and homepage
    "overflow" set against the *unfiltered* pool first, then filters —
    keeps "what's in the archive" consistent regardless of active filters),
    `getAllArticlesForAdmin()` (includes drafts, uncached).
  - Re-exports `rankArticles`/`selectHero` (§8.1) and `LEAD_COUNT`.
- **`site-content.ts`** — defines `SiteContentData`'s full TypeScript shape
  (nav, opinionSection, productsSection, midCta, videoSection,
  infinitasSection, statsSection, testimonialsSection, aboutSection, footer,
  siteSettings, lastUpdated). `getSiteContent()` (`React.cache()`-wrapped)
  throws a setup-order error if the `id=1` row is missing (expects
  `migrate:json` to have run).
- **`reader-account.ts`** — `getReaderAccountSummary(readerId)`: email,
  join date, total/this-month read counts, 10 most recent reads (joined to
  `articles` for titles). Purely informational — a registered reader never
  hits the wall regardless of read count (see §8.3).

### 6.2 Write layer — Server Actions (`lib/actions/`)

- **`admin.ts`** — every function starts with `requireEditor()`
  (`auth()` + `role==='editor'` check, re-verified server-side, never
  trusting a client guard).
  - `saveSiteContent(data, expectedVersion)` — single conditional
    `UPDATE ... WHERE id=1 AND version=expectedVersion RETURNING *`,
    atomic (no separate SELECT-then-write race window). Zero rows matched
    → `{conflict: true}`; success inserts a `contentRevisions` snapshot.
  - `saveArticle(id, input, expectedUpdatedAt)` — same optimistic-concurrency
    pattern, keyed on `updatedAt` **truncated to milliseconds on both
    sides** (`date_trunc('milliseconds', ...)`) — a plain equality check
    would falsely conflict on every migrated article's first save, because
    Postgres-generated timestamps carry microsecond precision that a JS
    `Date` can never round-trip. Regenerates `bodyHtml` from `bodyJson` in
    the same write.
  - `archiveArticle(id)` — sets `status: 'draft'` (soft delete; there is no
    hard delete for articles anywhere in the app).
  - `createArticle(input)` — id from `input.id` → `slugify(title)` →
    timestamp fallback; retries once with a suffix on a `23505`
    (unique_violation) collision.
  - `reloadSiteContent()` / `reloadArticle(id)` — back the conflict modal's
    "reload latest" action.
- **`editor-auth.ts`** — `loginAction`, rate-limited (10/5min/IP). Calls
  `signIn('credentials', ...)`, which **throws `AuthError`** on bad
  credentials (verified against next-auth's real source) — different
  failure shape than the Resend flow below, so the two can't share
  error-handling code.
- **`reader-auth.ts`** — `requestMagicLink`, rate-limited (5/10min/IP,
  tighter than editor login — Resend costs money per send and a magic link
  reaches a real inbox). `signIn('resend', {redirect:false})` returns a
  **plain URL string**, not an object — a failed send redirects to an
  `error=` query param rather than throwing, so the code inspects the
  returned URL directly. (A real bug once shipped here: an invalid
  `RESEND_API_KEY` reached Resend, got a 401, and the UI still said
  "check your email" until this URL-inspection fix.)
- **`reader-account.ts`** — `deleteMyAccount()` (ARCO self-service
  deletion): deletes the `users` row (cascades to `accounts`/
  `articleReads`), explicitly also deletes any pending `verificationTokens`
  row for that email (no FK link — Auth.js keys it by email string), then
  `signOut()`.
- **`analytics.ts`** — `refreshAnalytics()`, editor-only wrapper around
  `getAnalyticsSnapshot()` for the dashboard's manual-refresh button.

## 7. Authentication & Authorization

**One Auth.js (NextAuth v5) instance, two disjoint identity flows**,
defined in [`auth.ts`](../auth.ts):

- **Readers** — `Resend` provider (passwordless magic link), backed by the
  Auth.js-adapter tables (`users`/`accounts`/`verificationTokens`).
- **Editors** — `Credentials` provider (username/password, `bcrypt` against
  the separate `editors` table), **never** persisted through the adapter —
  keeps the two identity types physically incapable of being confused.

Session strategy is **JWT** (no `sessions` table needed). The `jwt`
callback derives `token.role` strictly from *which provider actually
authenticated this sign-in* (`account.provider === 'credentials' ?
'editor' : 'reader'`) — never trusted from client input, so a reader can
never end up with `role: 'editor'` except by a real Credentials check
succeeding. `types/next-auth.d.ts` augments the library's types with
`role: 'reader' | 'editor'` and `id: string` on `session.user`.

No custom Auth.js `pages` — readers sign in inline through
`<EmailWall>`/`<AccountSignInPrompt>` (calling `signIn()` directly,
Spanish error handling); editors get a real page at `/admin`.

**Route protection:**
- `/admin/(protected)/*` — guarded in `app/admin/(protected)/layout.tsx`:
  `redirect('/admin')` if no session or `role !== 'editor'`.
- `/api/admin/upload-image` — explicit `role==='editor'` check *before*
  calling Vercel Blob's `handleUpload` (that function validates
  `BLOB_READ_WRITE_TOKEN` unconditionally at its top, before any callback
  runs — so a check placed only inside a callback would be unreachable to
  verify without a real token).
- `/cuenta`, `/api/account/export` — require `role==='reader'`.
- Every Server Action that mutates data re-checks role server-side itself;
  no action trusts a client-side guard alone.

## 8. Core Business Logic (`lib/`)

### 8.1 Homepage ranking — `lib/rank.ts`
`rankArticles(articles, now=new Date())` / `selectHero(articles, now)`.

Originally ported verbatim from legacy (pure priority-first, date only as
tiebreaker — a 5-star article from two weeks ago always beat a 1-star
article from today, with zero decay). **Changed 2026-07-21** after a real
complaint about stale "important" stories dominating the homepage:

```
score = priority * 1.5 - daysSinceArticleDate
```

`1.5` days-per-star is tuned so the max possible priority boost
(5 × 1.5 = 7.5 days) stays well under 14 days — a several-days-old
top-priority story can still beat a fresher low-priority one, but nothing
two weeks old can ever beat *any* same-day story. This is purely an
**ordering** change (no hard age cutoff), so pages that intentionally show
old content (archive, author, tag) are unaffected in what they list, only
in what order. `selectHero()` filters to `featured===true || priority===5`
after ranking, falling back to the single most recent article if nothing
qualifies. `rankArticles`/`selectHero` share exactly one call site's worth
of logic across the homepage, ticker, archive, author, tag pages, and the
admin live preview — "what counts as important" is defined once.

### 8.2 Taxonomy — `lib/taxonomy.ts`
Fixed, closed three-tier tag system, shared by the CMS and every public
filter/tag page:

- **`scope`**: Nacional, Internacional.
- **`sport`**: Fútbol, Liga MX, NFL, NBA, Béisbol, Tenis, Golf, F1,
  Olímpico, Multi-deporte / Otros.
- **`vertical`**: Gobernanza y Regulación, Derechos de TV y Streaming,
  Fusiones y Adquisiciones, Patrocinios, Infraestructura y Venues, Sedes y
  Eventos, Finanzas y Negocio, Private Equity e Inversiones, Mercadotecnia
  Deportiva, Gestión de Talento, Audiencias y Consumo, Fan Experience,
  Naming Rights.

### 8.3 Reader metering / paywall — `lib/metering.ts`
`resolveEntitlement(articleId)` → `Entitlement`:
`{kind:'full', reason:'reader'|'editor'|'bot'|'quota'}` or
`{kind:'walled', readsThisMonth, limit}`.

Decision order (cheapest checks first):
1. `role==='editor'` → full access, no DB read.
2. `role==='reader'` → full access **unconditionally** (registered readers
   never hit the wall), but the read is still logged for the account panel.
3. Known bot user-agent (`lib/bots.ts`, 14 crawler/preview-bot signatures)
   → full access — required so SEO indexing and chat-app link previews
   never get walled (they can't carry a quota cookie across fetches).
4. Anonymous: resolve/lazily-create an `anonReaders` row from the
   `pb_anon` cookie. **Fails open** to full access if the cookie is somehow
   missing (should never happen if middleware ran, but a config problem
   degrades to "always fresh" rather than blocking a real reader).
5. Already read this exact article this month → full access (re-reads
   don't cost quota).
6. Under `FREE_ARTICLES_PER_MONTH` (3, `lib/constants.ts`) distinct reads
   this month → log the read, grant full access.
7. Otherwise → `{kind:'walled', ...}`, and
   `app/(public)/articulo/page.tsx` never even fetches the article body
   (see `getArticleMetaById` above).

Anonymous identity is a signed cookie (`pb_anon`), minted by
`middleware.ts` using `lib/anon-cookie.ts` (Web Crypto HMAC-SHA256, so the
same code works on Edge or Node runtime; reuses `AUTH_SECRET`, justified
because this identifies a quota bucket, not a security boundary — "fail
open" applies here too, both at the cookie-verification level and at the
middleware level, see §8.7).

### 8.4 Related articles — `lib/related-articles.ts`
Scores every candidate by shared-tag count (across all three taxonomy
tiers combined) plus a same-source bonus, sorts by score then date, takes
the top 3 (`RELATED_COUNT`). If fewer than 3 score above zero, backfills
with the most recent unused articles regardless of tags — guarantees a
full "keep reading" row even for thinly-tagged articles. Also home to
`shouldShowAuthor(article, mostrarAutorGlobal)` — `OR` logic: a per-article
opt-in *or* the site-wide toggle is sufficient to show a byline.

### 8.5 Slugs — `lib/slugify.ts`
Lowercase, diacritic-stripped, non-alphanumeric runs collapsed to `-`.
Ported verbatim so a new article created in the admin lands on the same id
a legacy editor's tooling would have produced.

### 8.6 Analytics
Three separate, independently-degrading integrations:
- **`lib/ga4.ts`** — reads GA4 pageview data (hand-rolled service-account
  JWT signing via Node `crypto`, RS256, no `googleapis` dependency) to
  power the public **"Más leídas"** homepage module
  (`lib/most-read.ts` → `components/home/MostReadSection.tsx`, renders
  nothing at all when unconfigured or empty). Filters `pagePath CONTAINS
  '/articulo'` — deliberately adjusted from legacy's `/articulo.html`
  filter to match this site's extensionless URLs.
- **`lib/vercel-analytics.ts`** + **`lib/analytics-data.ts`** — Vercel Web
  Analytics REST API, powers the **admin analytics dashboard** only
  (`/admin/analytics`) — KPIs with period-over-period deltas, top
  articles (via a custom `pageview_article` event — requires Vercel
  "Custom Events" permission), referrer/country/device breakdowns. Every
  panel independently try/catches into `{available:false}` so one missing
  credential degrades only its own panel, not the whole dashboard.
- **`@vercel/analytics`** (`<Analytics/>` in `app/layout.tsx`) + GA4's
  client-side `gtag.js` (`components/analytics/GoogleAnalytics.tsx`,
  public routes only, never `/admin`) — the actual client-side beacons
  that produce the data the two integrations above read back.
- **`ArticleAnalyticsBeacon`** fires `track('pageview_article',
  {article_id})` only on full-access article views, never the walled view.

### 8.7 Rate limiting — `lib/rate-limit.ts`
In-memory, per-instance, fixed-window (`globalThis.__pbRateLimitBuckets`,
survives HMR in dev). **Deliberately not distributed** (no Redis/KV) — the
code candidly documents this only blunts a single-source attacker, not one
spread across concurrent Vercel instances. Applied at:
- editor login: 10 attempts / 5 min / IP
- reader magic-link request: 5 attempts / 10 min / IP
- Make.com webhook: 10 **failed-secret** attempts / 10 min / IP (successful
  requests never count against the limit)

### 8.8 Security headers & CSP — `next.config.ts`
`headers()` sends CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy on every route. CSP's `img-src` is
deliberately the broad `https: data: blob:` rather than an allowlist —
this site ingests editorial photos hotlinked from whatever outlet a story
cites (Unsplash, ESPN, Goal.com, arbitrary domains via the webhook), an
unenumerable set. `script-src`/`style-src` include `'unsafe-inline'` — a
documented tradeoff, needed for `dangerouslySetInnerHTML` article bodies
and inline component styles; a nonce-based CSP would be stricter but
requires per-request nonce propagation from middleware, not done yet.
`frame-src`/`script-src` allowlist YouTube and Instagram (the only
third-party embeds in the app). Also hosts the legacy `*.html` → clean-URL
redirect table (`/index.html` → `/`, etc.) preserving inbound
links/SEO from before the migration.

### 8.9 Misc utilities
- `lib/safe-url.ts` — restricts editor-supplied URLs to `http(s):`,
  `mailto:`, `tel:`, relative, or hash schemes, collapsing anything else
  (e.g. `javascript:`) to `'#'` — guards against a mistaken/compromised CMS
  entry becoming a click-to-execute link.
- `lib/site-url.ts` — resolves the canonical public origin
  (`SITE_URL` env → Vercel's `VERCEL_PROJECT_PRODUCTION_URL` →
  `VERCEL_URL` → hardcoded fallback) for metadata/canonical/sitemap/RSS use.
- `lib/constants.ts` — `LEAD_COUNT=1`, `LIST_COUNT=5`, `TICKER_COUNT=6`,
  `RELATED_COUNT=3`, `FREE_ARTICLES_PER_MONTH=3`, `KNOWN_SOURCES`/
  `SOURCE_LABELS`.
- `lib/tiptap-extensions.ts` — the **single shared array** of TipTap
  extensions (`StarterKit` restricted to H2/H3, `Image`, `Link`) used by
  both the client editor and the server's `generateHTML()` call, so the
  editor can never accept content the server-side renderer doesn't also
  understand.

## 9. Routes Map

All dynamic public routes render with `export const dynamic =
'force-dynamic'` at the `(public)` route-group layout level (Postgres reads
can't be statically prerendered without a live `POSTGRES_URL` at build
time — this bit the project twice during migration; see HANDOFF.md).

### Public site — `app/(public)/*`
| Route | File | Purpose |
|---|---|---|
| `/` | `page.tsx` | Homepage: hero + news grid, most-read, then every `site_content`-driven section |
| `/articulo?id=` | `articulo/page.tsx` | Article page. `generateMetadata` uses body-free `getArticleMetaById`. Renders paywall (`<EmailWall>`) or full body depending on `resolveEntitlement()`. Emits `NewsArticle` JSON-LD (excerpt-only when walled). |
| `/archivo` | `archivo/page.tsx` | Filterable article list — filters are real links (`?source=`, `?scope=`, `?sport=`, `?vertical=`), works with JS disabled |
| `/autor?nombre=` | `autor/page.tsx` | Articles by byline |
| `/tema?scope=\|sport=\|vertical=` | `tema/page.tsx` | Articles by one taxonomy tag, with RSS `alternate` link |
| `/cuenta` | `cuenta/page.tsx` | Reader account: reads-this-month/total, recent reads, export data, delete account |
| `/privacidad`, `/terminos` | `privacidad/page.tsx`, `terminos/page.tsx` | Static legal pages (LFPDPPP/ARCO framing) |
| `/404` + catch-all `not-found.tsx` | | Shared `<NotFoundContent>` |

### Admin — `app/admin/*`
| Route | File | Purpose |
|---|---|---|
| `/admin` | `page.tsx` | Editor login (redirects to dashboard if already signed in) |
| `/admin/dashboard` | `(protected)/dashboard/page.tsx` | The CMS — 12 tabs + live preview, see §10.1 |
| `/admin/analytics` | `(protected)/analytics/page.tsx` | Analytics dashboard |

`app/admin/(protected)/layout.tsx` is the guard for both protected pages
(redirects to `/admin` without a valid editor session) and renders the
shared topbar (tab nav, save-slot portal target, whoami, logout).

### API routes — `app/api/*`
| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js catch-all (re-exports `handlers` from `auth.ts`) |
| `/api/update-articles` | POST | Make.com webhook — see §8, `x-playbook-secret` header auth |
| `/api/admin/upload-image` | POST | Vercel Blob client-upload handshake for TipTap, editor-only |
| `/api/account/export` | GET | Reader data export as downloadable JSON (`Content-Disposition`) |

### SEO infrastructure
`app/sitemap.ts` (force-dynamic — reverted from ISR because build-time
execution has no live DB), `app/robots.ts`, `app/feed.xml/route.ts`
(hand-written RSS 2.0, optional single-topic filter, capped at 50 items).
All three derive from the same `getAllArticles()`/`getSiteContent()` data
sources and the same author-visibility/taxonomy logic as the pages
themselves.

### Error boundaries
Three nested boundaries, added after a real production incident (a
transient Neon cold-start error produced Next's bare unstyled default error
page — see HANDOFF.md's "página en blanco" entries):
- `app/(public)/error.tsx` — catches page-level errors under the public
  route group; Header/Footer (in the layout) survive.
- `app/error.tsx` — one level up, catches layout-level failures (e.g.
  `Header.tsx`'s own DB queries failing).
- `app/global-error.tsx` — last resort, only if the root layout itself
  throws; must define its own `<html>/<body>`, no design tokens available.

## 10. Frontend Component Architecture

### 10.1 Admin CMS (`components/admin/`)
Entirely client-side. `AdminDashboard.tsx` is the orchestrator: owns all
CMS state (content draft, dirty-tracking baselines, active tab, toasts,
save/conflict modal), calls the `lib/actions/admin.ts` Server Actions, and
persists tab order to `localStorage` per editor.

- **`admin/fields/`** — generic reusable primitives: `TextField`/
  `NumberField` (URL fields self-register into `FormValidationContext` for
  centralized pre-save validation), `SelectField`, `CheckboxGroupField`,
  `StarPickerField`, `ArrayEditor` (generic collapsible/drag-reorderable
  list editor — the backbone of nearly every tab).
- **`admin/tabs/`** — one component per `SiteContentData` section, plus
  `ArticlesTab` (the biggest one: title→auto-slug id, excerpt, teaser,
  TipTap body, author + byline toggle, publication/source, three tag
  groups, date, priority stars, featured, substack/image URLs, plus a
  tag-coverage table and a hero/featured-conflict warning) and
  `SettingsTab` (global byline toggle). 12 tabs total: Articles, Opinion,
  Video, Infinitas, Products, Stats, Testimonials, About, Mid-CTA, Nav,
  Footer, Settings.
- **`TipTapEditor.tsx`** — the article body editor; toolbar
  (bold/italic/H2/H3/lists/quote/link/image/undo/redo), image
  upload/paste/drop via `@vercel/blob/client`'s `upload()`.
- **`LivePreview.tsx`** — renders the *real* public-site section
  components (`OpinionSection`, `ProductsSection`, etc.) fed by in-memory
  unsaved edit state, with simplified stand-in header/footer (the real
  ones are async Server Components that can't embed in a client tree).
  Marks changed sections with a "● unsaved changes" badge.
- **`admin/analytics/`** — `AnalyticsView` (KPI cards, bar charts,
  referrer/country/device lists) + `BarChart` (thin Chart.js wrapper).

### 10.2 Public site
- **`components/sections/`** — nine homepage sections
  (About/MidCta/Infinitas/Stats/Products/Opinion/InstagramReels/
  Testimonials/Video), each a Server Component fed by a slice of
  `SiteContentData`, except `StatsSection` (count-up animation) and
  `InstagramReels` (needs `window.instgrm.Embeds.process()`), which are
  Client Components.
- **`components/home/`** — `NewsGrid` (client — cosmetic source-filter
  fade, uses `rankArticles`/`selectHero`) and `MostReadSection` (async
  Server Component, GA4-driven, renders nothing if empty).
- **`components/article/`** — `LeadStory`, `NewsRow` (avoid nesting
  `<a>` inside `<a>` — a real regression this codebase hit once, called
  out in code comments and in `.claude/skills/verify/SKILL.md`),
  `TagPillRow`, `ShareRow`, `EmailWall` (the paywall gate form),
  `ArticleAnalyticsBeacon`.
- **`components/layout/`** — `Header` (async Server Component, parallel
  `getSiteContent()`/`getAllArticles()`/`auth()`), `HeaderNav` (client —
  mobile drawer, theme toggle, search), `SearchBox` (client-side substring
  search over title/excerpt/publication/source), `Ticker`, `Footer`.
- **`components/theme/`** — `theme-store.ts` (vanilla pub/sub,
  `localStorage['playbook_theme']`, falls back to
  `prefers-color-scheme`) + `ThemeToggle.tsx` (`useSyncExternalStore`).
- **`components/account/`** — `AccountSignInPrompt`,
  `DeleteAccountButton` (uses a real `<form action={deleteMyAccount}>`,
  not a manual async call, so `signOut`'s internal `NEXT_REDIRECT` throw
  isn't accidentally swallowed by a `try/catch`).
- **Top-level utilities**: `CookieNotice` (notice-only, doesn't gate
  anything), `ScrollReveal` (`IntersectionObserver` reveal-on-scroll,
  re-runs on every `usePathname()` change — fixes a real bug where content
  stayed invisible after client-side navigation because the App Router
  layout, and thus this effect, never remounted), `LazyEmbed` (generic
  viewport-gated mount wrapper for third-party iframes — fixes a real
  "page feels frozen" bug caused by YouTube/Instagram embeds loading
  unconditionally on every homepage visit), `NotFoundContent`.

### 10.3 Styling
Twelve hand-written global CSS files (~1,300 lines), imported directly from
`app/layout.tsx` in a fixed cascade order (`admin.css` loads separately,
only under `/admin`). Dark mode is a deliberate **3-layer cascade** decided
by source order: `:root` light defaults → `@media(prefers-color-scheme:
dark)` (automatic) → `[data-theme="dark"|"light"]` (manual toggle, always
wins since declared last). An inline `beforeInteractive` script in
`app/layout.tsx` sets `data-theme` before first paint to avoid a dark-mode
flash, paired with `suppressHydrationWarning` on `<html>`.

## 11. Scripts (`scripts/`)

| Script | Run via | Purpose |
|---|---|---|
| `run-migrations.ts` | `npm run db:migrate` | Applies pending Drizzle migrations |
| `migrate-json-to-db.ts` | `npm run migrate:json` | **One-time, idempotent**: loads `articles.json`/`content.json` into Postgres |
| `seed-editors.ts` | `npm run db:seed-editors` (needs `ADMIN_USERS` env) | **One-time**: seeds the `editors` table with bcrypt-hashed passwords from the legacy `user:pass,user:pass` format |
| `publish-newsletter.ts` | `npm run publish:newsletter <file.json>` | The write-side of the `publish-newsletter` Claude skill (§13) — converts markdown to a TipTap doc, inserts articles directly via Neon's HTTP driver (works from HTTPS-only sandboxes) |
| `smoke-test.mjs` | `node scripts/smoke-test.mjs` (manual, against `localhost:3100`) | Playwright: theme toggle persistence, mobile drawer, search |
| `test-email-wall.mjs` | `node scripts/test-email-wall.mjs` (manual) | Playwright: burns the 3-article quota, confirms the paywall form appears |

## 12. Environment Variables

See [`.env.local.example`](../.env.local.example) for the authoritative,
commented list. Summary:

| Variable | Required for | Status as of last handoff entry |
|---|---|---|
| `POSTGRES_URL` | Everything DB-backed | Configured |
| `AUTH_SECRET`, `NEXTAUTH_URL` | Sessions, anon cookie signing | Configured |
| `RESEND_API_KEY`, `EMAIL_FROM` | Reader magic-link email | **Broken in production** — `EMAIL_FROM` not set, Resend rejects the `authjs.dev` default sender domain |
| `BLOB_READ_WRITE_TOKEN` | TipTap image uploads | Pending real credential |
| `PLAYBOOK_SECRET` | Make.com webhook auth | Was misconfigured with wrong casing (`Playbook_secret`) — needs correcting in Vercel |
| `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_EMAIL`, `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` | "Más leídas" homepage module | Same casing bug as above |
| `GA4_MEASUREMENT_ID` | Client-side gtag.js | Confirmed real value `G-0CG7JMK8RZ`, needs loading in Vercel |
| `VERCEL_ANALYTICS_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`/`_SLUG` | Admin analytics dashboard | Pending real credential |
| `ADMIN_USERS` | One-time `db:seed-editors` only | Not a runtime var |

Every one of these degrades gracefully when absent (never crashes a page —
each integration has its own try/catch and `available:false` fallback),
**except** that a missing `EMAIL_FROM` currently causes real magic-link
sends to fail in production (the send itself fails cleanly with a shown
error message — it's not a crash, just non-functional).

## 13. Claude Code Skills (`.claude/skills/`)

- **`publish-newsletter`** — a fully automated, zero-human-review editorial
  pipeline: given one or more Substack URLs, fetches each edition, treats
  each story as a separate article, drafts it in Playbook's two-layer
  editorial voice (facts + "Opinión de Playbook" analysis with a
  Mexico/LATAM angle), and inserts it directly into production Postgres as
  `status: 'published'` via `scripts/publish-newsletter.ts`. Uses the Neon
  HTTP driver rather than the app's normal TCP `pg` Pool, because it's
  designed to run from sandboxes with HTTPS-only egress.
- **`verify`** — documents how to run/verify the site in a sandbox with no
  `npm`/build step/Vercel CLI available. **Note: this skill's content still
  describes the pre-migration legacy static-site architecture**
  (`api/*.js`, self-fetched `articles.json`, `vercel.json` rewrites) and
  has not been updated to reflect the current Next.js/Postgres stack — a
  known stale doc, flagged during a 2026-07-21 investigation session (see
  HANDOFF.md). Treat its specific commands as outdated; its general
  regression-testing advice (no nested `<a>` tags, Playwright checks) is
  still relevant.

## 14. CI/CD

`.github/workflows/ci.yml` — one job (`verify`) on push to `main` and every
PR: `npm ci` → `npm run typecheck` → `npm run lint` → `npm run build`.
Deliberately runs **without** `POSTGRES_URL`/`AUTH_SECRET` configured — the
DB client and middleware both defer their env-var checks past build time
(see §5/§7), so a clean CI build is the same check Vercel's own build
performs before any production env vars are involved. No test suite exists
yet — all verification during the migration was manual (Playwright
scripts, run and discarded, not committed) against real local Postgres;
this is acknowledged technical debt.

Deployment target: **Vercel**, production at
`playbook-portal-phi.vercel.app`. `middleware.ts` explicitly runs on the
**Node.js runtime** (`export const config = { runtime: 'nodejs' }`), not
the Edge default — this project's Vercel Edge Function pipeline broke with
`ReferenceError: __dirname is not defined` for any middleware content at
all, including a literal no-op; Node middleware (stable since Next.js
15.5) sidesteps that broken pipeline entirely. See HANDOFF.md's
"middleware" entries for the full multi-session diagnostic trail if this
ever needs revisiting.

## 15. How to Run Locally

```bash
npm install
cp .env.local.example .env.local   # fill in values, see §12
npm run db:migrate                  # applies Postgres schema
npm run migrate:json                # loads articles.json/content.json (idempotent)
ADMIN_USERS="aldo:pw,nico:pw,guillermo:pw" npm run db:seed-editors
npm run dev
```

Other useful commands: `npm run typecheck`, `npm run lint`,
`npm run build`, `npm run db:generate` (after a schema change).

## 16. Known Gaps / What's Actually Left

As of the last `HANDOFF.md` entry, **all six migration phases are
complete** and verified end-to-end against real Postgres and real servers.
What remains is exclusively **production configuration**, not code:

1. Configure real `RESEND_API_KEY` + a verified-domain `EMAIL_FROM` in
   Vercel (currently broken — confirmed via production runtime logs).
2. Configure real `BLOB_READ_WRITE_TOKEN` (image uploads untestable without
   it).
3. Configure real `VERCEL_ANALYTICS_TOKEN`/`VERCEL_PROJECT_ID`/team vars.
4. Configure real `GA4_*` vars, **and fix the casing** on four variable
   names that were entered with wrong case in Vercel (`PLAYBOOK_SECRET`,
   `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_EMAIL`,
   `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` — env vars are case-sensitive, so the
   app was silently reading `undefined` for all four).
5. Confirm the `pageview_article` custom event actually reaches Vercel
   Analytics' backend once a real token is configured.
6. No automated test suite exists — every phase was verified manually with
   disposable Playwright scripts. Migrating that verification discipline
   into a committed test suite is acknowledged debt, not yet scheduled.
7. `[DOMICILIO FISCAL]` (in `/privacidad`) and `[JURISDICCIÓN]` (in
   `/terminos`) remain literal placeholders pending real values from the
   team.

## 17. Notable Engineering Lessons (Condensed)

These are patterns worth knowing before touching related code — full
diagnostic detail lives in `HANDOFF.md`:

- **Defer env-var validation past module-import time.** Next.js imports
  every route module during `next build`'s "Collecting page data" step
  regardless of `force-dynamic`. An eager `throw` in `lib/db/client.ts`
  for a missing `POSTGRES_URL` crashed *builds*, not just misconfigured
  *requests* — fixed by only failing on the first real query.
- **`next/font` + ISR/ Edge quirks aside, `force-dynamic` beats
  `revalidate` for anything DB-backed** until there's a stable production
  Postgres connected at build time.
- **Timestamp equality across a JS↔Postgres round trip is lossy.**
  Postgres timestamps carry microseconds; JS `Date` only carries
  milliseconds. Any optimistic-concurrency check comparing them needs
  `date_trunc('milliseconds', ...)` on both sides, or it will spuriously
  conflict on real data.
- **`signIn()`'s failure shape differs by provider.** Credentials throws
  `AuthError`; Resend (and other non-Credentials providers) return a
  redirect URL string that must be inspected for `error=`.
- **A component that "has content in the DOM" isn't necessarily visible.**
  The `ScrollReveal` bug (opacity stuck at 0 after client-side nav) passed
  an `innerText`-based verification check because text was present — only
  a computed-style/screenshot check caught it.
- **Middleware has no caller to degrade gracefully for it** — unlike every
  other integration in this codebase (which isolates a failure to one
  panel or one feature), an uncaught throw in `middleware.ts` takes down
  *every* request site-wide. It must fail open internally.
- **Vercel's Edge Function bundling pipeline can break for a given project
  in ways a clean local `next build` won't reproduce** — when it does,
  Node-runtime middleware is a real escape hatch, not just a workaround.

## 18. Where to Look Next

- **`HANDOFF.md`** — the full session-by-session diary: every bug found,
  how it was diagnosed, how it was verified fixed, and what's pending.
  Read it before starting new work; append to it after finishing real work
  (see its own "Convención" section at the bottom for the expected format).
- **`README.md`** — quick operational reference (how to run locally),
  points here and to `HANDOFF.md` for everything else.
- **`docs/image-dimensions.md`** — specific notes on image aspect
  ratios/dimensions across the site's editorial image slots.
- **This document** — update it when the *architecture* changes (new
  table, new route, new integration, a business rule that gets redefined)
  rather than for routine bug fixes or session notes, which belong in
  `HANDOFF.md`.

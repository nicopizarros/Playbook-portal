# Graph Report - Playbook-portal  (2026-08-13)

## Corpus Check
- 221 files · ~859,669 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1210 nodes · 2187 edges · 76 communities (67 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd2b1a43`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- paths.js
- analytics-data.ts
- team.ts
- devDependencies
- Fase 4: plan detallado de lo que falta
- gsap-core.js
- SplitText.js
- dependencies
- AdminDashboard.tsx
- LivePreview.tsx
- site-content.ts
- compilerOptions
- tema/page.tsx
- gsap.ts
- publish-newsletter.ts
- metering.ts
- articles.ts
- TextField.tsx
- feed.xml/route.ts
- DesignSystemGenerator
- ArticlesTab.tsx
- taxonomy.ts
- archivo/page.tsx
- articulo/page.tsx
- Publish Sourced Article: third-party link to Playbook article, with human approval
- client.ts
- (public)/layout.tsx
- core.py
- BM25
- design_system.py
- UI/UX Pro Max - Design Intelligence
- Detalle por contenedor
- Registro de progreso
- schema.ts
- admin.ts
- Publish Newsletter: Substack link to live article, no human in the loop
- test_core.py
- Playbook Portal — Project Encyclopedia
- data/reader-account.ts
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- AdSlot.tsx
- Handoff — Playbook: migración a Next.js
- 5. Database Schema
- 8. Core Business Logic (`lib/`)
- StudioTab.tsx
- app/layout.tsx
- HomeSidebar.tsx
- 404/page.tsx
- search
- Playbook
- detect_domain
- set-password/page.tsx
- EmailWall.tsx
- 9. Routes Map
- reset-editor-password.ts
- Verifying Playbook Portal locally
- eslint.config.mjs
- GsapCore
- next.config.ts
- next-auth.d.ts
- validate_data.py
- 10. Frontend Component Architecture
- admin/layout.tsx
- TopicDirectory.tsx
- 6. Data & Write Layer
- smoke-test.mjs
- sync-skill-feedback.sh
- test-email-wall.mjs
- next-env.d.ts
- gsap/README.md
- { GET, POST }

## God Nodes (most connected - your core abstractions)
1. `Fase 4: plan detallado de lo que falta` - 41 edges
2. `SiteContentData` - 24 edges
3. `DesignSystemGenerator` - 19 edges
4. `Playbook Portal — Project Encyclopedia` - 19 edges
5. `BM25` - 17 edges
6. `Article` - 17 edges
7. `getAllArticles` - 17 edges
8. `db` - 17 edges
9. `safeUrl()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `tierFor()` --calls--> `rankScore()`  [EXTRACTED]
  app/(public)/archivo/page.tsx → lib/rank.ts
- `ArchivoPage()` --calls--> `getArchiveArticles()`  [EXTRACTED]
  app/(public)/archivo/page.tsx → lib/data/articles.ts
- `ArticuloPage()` --calls--> `getAllArticles`  [EXTRACTED]
  app/(public)/articulo/page.tsx → lib/data/articles.ts
- `ArticuloPage()` --calls--> `getSiteContent`  [EXTRACTED]
  app/(public)/articulo/page.tsx → lib/data/site-content.ts
- `ArticuloPage()` --calls--> `resolveEntitlement()`  [EXTRACTED]
  app/(public)/articulo/page.tsx → lib/metering.ts

## Import Cycles
- 3-file cycle: `components/ads/AdSenseProvider.tsx -> lib/adsense.ts -> components/ads/AdSlot.tsx -> components/ads/AdSenseProvider.tsx`

## Communities (76 total, 9 thin omitted)

### Community 0 - "paths.js"
Cohesion: 0.05
Nodes (37): _assertThisInitialized(), Draggable(), NOTE: "force" is actually the "time" when this method gets called by the…, CharSet(), getGlobalMatrix(), Matrix2D(), PathEditor(), arcToSegment() (+29 more)

### Community 1 - "analytics-data.ts"
Cohesion: 0.08
Nodes (42): AdminAnalyticsPage(), AnalyticsView(), BarList(), formatNumber(), formatUpdatedAt(), KpiCard(), unavailableMessage(), BarChart() (+34 more)

### Community 2 - "team.ts"
Cohesion: 0.08
Nodes (37): dynamic, constantTimeEqual(), detectPublication(), escapeRegExp(), getClientIp(), inferTags(), normalizeText(), POST() (+29 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (40): drizzle-kit, eslint, eslint-config-next, @eslint/eslintrc, @neondatabase/serverless, devDependencies, drizzle-kit, eslint (+32 more)

### Community 4 - "Fase 4: plan detallado de lo que falta"
Cohesion: 0.05
Nodes (41): 2026-07-21 — Bug real reportado: página de inicio en blanco tras el muro de artículos; causa raíz real: cero error boundaries en toda la app, 2026-07-21 — Datos legales reales + módulo "Mi cuenta" para lectores, 2026-07-21 — Diagnóstico confirmado: el no-op también falló. Se elimina `middleware.ts` para restaurar el sitio, 2026-07-21 — El `__dirname` persiste tras "Clear Cache and Deploy"; diagnóstico: middleware no-op temporal, 2026-07-21 — Fix: algoritmo de ranking (portada/ticker mostraba noticias de hasta 13 días), 2026-07-21 — Fix: CI agregado (no existía ningún workflow), 2026-07-21 — Fix de despliegue: `middleware` crasheaba en producción (`MIDDLEWARE_INVOCATION_FAILED`), 2026-07-21 — Fix de despliegue: Vercel rechazaba `middleware.ts` ("Edge Function referencing unsupported modules") (+33 more)

### Community 5 - "gsap-core.js"
Cohesion: 0.09
Nodes (24): dynamic, AdminTopbarNav(), HeaderNav(), sectionHref(), matches(), normalize(), SearchableArticle, SearchBox() (+16 more)

### Community 6 - "SplitText.js"
Cohesion: 0.08
Nodes (23): _createClass(), _defineProperties(), ScrollSmoother(), constructor(), _context(), _defaultContext, _disallowInline(), _elements() (+15 more)

### Community 7 - "dependencies"
Cohesion: 0.05
Nodes (37): @auth/drizzle-adapter, bcryptjs, chart.js, drizzle-orm, next, next-auth, dependencies, @auth/drizzle-adapter (+29 more)

### Community 8 - "AdminDashboard.tsx"
Cohesion: 0.07
Nodes (31): DEFAULT_ORDER, GROUPS, LABELS, Props, SAVELESS_TABS, Status, TAB_DEFS, TabKey (+23 more)

### Community 9 - "LivePreview.tsx"
Cohesion: 0.17
Nodes (17): PreviewFooter(), PreviewHeader(), Props, LazyEmbed(), AboutSection(), InfCard(), InfinitasSection(), MidCta() (+9 more)

### Community 10 - "site-content.ts"
Cohesion: 0.13
Nodes (21): ArrayEditor(), ArrayEditorProps, Badge, Option, SelectField(), SelectFieldProps, AboutTab(), Props (+13 more)

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 12 - "tema/page.tsx"
Cohesion: 0.12
Nodes (15): AutorPage(), generateMetadata(), Props, metadata, generateMetadata(), Props, resolveTopic(), TemaPage() (+7 more)

### Community 13 - "gsap.ts"
Cohesion: 0.11
Nodes (13): ArticleEndMark(), ArticleHeadline(), ShareRow(), gsap, GsapTween, ScrollTrigger, ScrollTriggerInstance, ScrollTriggerStatic (+5 more)

### Community 14 - "publish-newsletter.ts"
Cohesion: 0.15
Nodes (17): Props, TipTapEditor(), articles, slugify(), TIPTAP_EXTENSIONS, BackfillEntry, db, main() (+9 more)

### Community 15 - "metering.ts"
Cohesion: 0.17
Nodes (19): ANON_COOKIE_NAME, getKey(), signAnonId(), toBase64Url(), verifyAnonCookie(), BOT_USER_AGENTS, isBotUserAgent(), anonReaders (+11 more)

### Community 16 - "articles.ts"
Cohesion: 0.17
Nodes (18): ArticlesTab(), NewsGrid(), Header(), Ticker(), TICKER_COUNT, ArchiveFilters, ArticleMeta, getAllArticles (+10 more)

### Community 17 - "TextField.tsx"
Cohesion: 0.12
Nodes (16): useFormValidationRegistrar(), isValidUrlValue(), NumberFieldProps, TextField(), TextFieldProps, InfinitasTab(), Props, NavTab() (+8 more)

### Community 18 - "feed.xml/route.ts"
Cohesion: 0.17
Nodes (16): cdata(), dynamic, GET(), parseTopicFromQuery(), toRfc822(), xmlEscape(), HomePage(), dynamic (+8 more)

### Community 19 - "DesignSystemGenerator"
Cohesion: 0.14
Nodes (10): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV. (+2 more)

### Community 20 - "ArticlesTab.tsx"
Cohesion: 0.15
Nodes (15): CheckboxGroupField(), CheckboxGroupFieldProps, StarPickerField(), StarPickerFieldProps, NumberField(), COVERAGE_TIERS, Props, LeadStory() (+7 more)

### Community 21 - "taxonomy.ts"
Cohesion: 0.17
Nodes (14): ArticleTopics(), TIER_COLUMN, Heading, TagPillRow(), TIER_COLUMN, Article, DEFAULT_TOPICS, SCOPE_OPTIONS (+6 more)

### Community 22 - "archivo/page.tsx"
Cohesion: 0.15
Nodes (16): ArchivoPage(), FILTER_TIERS, filterHref(), FilterKey, Filters, groupRiver(), metadata, pickFeaturedIds() (+8 more)

### Community 23 - "articulo/page.tsx"
Cohesion: 0.19
Nodes (15): ArticuloPage(), canonicalUrlFor(), generateMetadata(), looksLikeHtml(), paragraphsFrom(), Props, renderAuthorByline(), ArticleAnalyticsBeacon() (+7 more)

### Community 24 - "Publish Sourced Article: third-party link to Playbook article, with human approval"
Cohesion: 0.11
Nodes (18): 6a. Cover image, default source: the referenced article itself, 6b. No automatic in-body images, Before writing, work the five questions, Building on prior Playbook coverage, Material gráfico (optional, use only when it genuinely helps), Publish Sourced Article: third-party link to Playbook article, with human approval, Requirements before running, Step 1: Read the primary source (+10 more)

### Community 25 - "client.ts"
Cohesion: 0.18
Nodes (8): AdminDashboardPage(), getAllArticlesForAdmin(), db, siteContent, LegacyArticle, main(), migrateArticles(), migrateSiteContent()

### Community 26 - "(public)/layout.tsx"
Cohesion: 0.18
Nodes (11): dynamic, GET(), dynamic, PublicLayout(), AdSenseContext, AdSenseProvider(), GoogleAnalytics(), HeaderScrollEffect() (+3 more)

### Community 27 - "core.py"
Cohesion: 0.17
Nodes (14): _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), Load CSV and return list of dicts, with mtime-based caching., Fitted BM25 index for this file+columns, with mtime-based caching., Core search function using BM25. Returns (results, bm25_or_none)., Nearest known vocabulary terms for a query that returned 0 hits, so the caller… (+6 more)

### Community 28 - "BM25"
Cohesion: 0.15
Nodes (9): BM25, _normalize(), Apply synonym substitution before tokenizing., BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes. (+1 more)

### Community 29 - "design_system.py"
Cohesion: 0.15
Nodes (16): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), Format a page-specific override file with intelligent AI-generated content., Generate intelligent overrides based on page type using layered search. Uses… (+8 more)

### Community 30 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.12
Nodes (16): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements, Step 2: Generate Design System (REQUIRED for new pages/projects) (+8 more)

### Community 31 - "Detalle por contenedor"
Cohesion: 0.12
Nodes (15): 10. Logo — footer, 1. Foto del destacado (hero / lead story), 2. Banner TFBR (tarjeta de opinión con imagen), 3. Banner de producto, 4. Video destacado (panel grande), 5. Clip de video (formato chico, fila de 4), 6. Tarjeta Infinitas destacada, 7. Tarjeta Infinitas lateral (+7 more)

### Community 32 - "Registro de progreso"
Cohesion: 0.12
Nodes (16): 2026-07-20 — Fase 1: scaffold + schema + migración de datos, 2026-07-20 — Fase 2: páginas públicas + SEO + sistema de diseño, 2026-07-20 — Fix: build roto en Vercel (sin `app/`), 2026-07-20 — Fix: `npm run build` roto en Vercel (falta `POSTGRES_URL`), 2026-07-21 — Fase 3: Auth.js + medición + muro de correo, 2026-07-21 — Fase 4 (checkpoint 1 de 5): login de editor + guard del layout protegido, 2026-07-21 — Fase 4 (checkpoint 2 de 5): Server Actions con detección de conflictos, 2026-07-21 — Fase 4 (checkpoint 3 de 5): editor TipTap + subida a Vercel Blob (+8 more)

### Community 33 - "schema.ts"
Cohesion: 0.22
Nodes (9): ALLOWED_CONTENT_TYPES, adapter, { handlers, auth, signIn, signOut }, deleteMyAccount(), requireReader(), accounts, media, users (+1 more)

### Community 34 - "admin.ts"
Cohesion: 0.27
Nodes (14): AdminDashboard(), archiveArticle(), createArticle(), reloadArticle(), reloadSiteContent(), renderBodyHtml(), requireEditor(), sameMillisecond() (+6 more)

### Community 35 - "Publish Newsletter: Substack link to live article, no human in the loop"
Cohesion: 0.14
Nodes (13): 5a. Cover image (`imageUrl` / `imageCredit`), 5b. In-body images, carried over from the source article, Industry Shots / Infinitas, La Lana del Deporte, Publish Newsletter: Substack link to live article, no human in the loop, Requirements before running, Step 1: Read the sources, Step 2: Independent research (+5 more)

### Community 36 - "test_core.py"
Cohesion: 0.18
Nodes (11): format_markdown(), format_master_md(), generate_design_system(), persist_design_system(), Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,…, Slugify a name into a single safe path segment. Only [a-z0-9_-] survives; every…, Persist design system to design-system/<project>/ folder using Master +… (+3 more)

### Community 37 - "Playbook Portal — Project Encyclopedia"
Cohesion: 0.14
Nodes (14): 11. Scripts (`scripts/`), 12. Environment Variables, 13. Claude Code Skills (`.claude/skills/`), 14. CI/CD, 15. How to Run Locally, 16. Known Gaps / What's Actually Left, 17. Notable Engineering Lessons (Condensed), 18. Where to Look Next (+6 more)

### Community 38 - "data/reader-account.ts"
Cohesion: 0.23
Nodes (9): GET(), CuentaPage(), dateFormatter, metadata, DeleteAccountButton(), currentMonthKey(), getReaderAccountSummary(), ReaderAccountSummary (+1 more)

### Community 39 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 40 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 41 - "AdSlot.tsx"
Cohesion: 0.27
Nodes (10): useAdSenseConfig(), AdSlot(), AdSlotName, CookieNotice(), CONSENT_EVENT, CONSENT_KEY, ConsentState, parse() (+2 more)

### Community 42 - "Handoff — Playbook: migración a Next.js"
Cohesion: 0.17
Nodes (12): Convención: cómo mantener este archivo, Cómo correr en local, Decisiones de stack tomadas, Fase 7 — Infraestructura publicitaria y capa de consentimiento, Fase 8 — Admin Studio y mejora de auth de editores, Fase 9 — Mejoras de UX en homepage y páginas, Handoff — Playbook: migración a Next.js, Mapa de archivos (+4 more)

### Community 43 - "5. Database Schema"
Cohesion: 0.20
Nodes (10): 5. Database Schema, `anonReaders`, `articleReads`, `articles`, Auth.js reader tables — `users`, `accounts`, `verificationTokens`, `contentRevisions`, `editors`, `media` (+2 more)

### Community 44 - "8. Core Business Logic (`lib/`)"
Cohesion: 0.20
Nodes (10): 8.1 Homepage ranking — `lib/rank.ts`, 8.2 Taxonomy — `lib/taxonomy.ts`, 8.3 Reader metering / paywall — `lib/metering.ts`, 8.4 Related articles — `lib/related-articles.ts`, 8.5 Slugs — `lib/slugify.ts`, 8.6 Analytics, 8.7 Rate limiting — `lib/rate-limit.ts`, 8.8 Security headers & CSP — `next.config.ts` (+2 more)

### Community 45 - "StudioTab.tsx"
Cohesion: 0.31
Nodes (4): STUDIO_SECTIONS, StudioPrompt, StudioSection, StudioTab()

### Community 46 - "app/layout.tsx"
Cohesion: 0.31
Nodes (7): anton, inter, metadata, RootLayout(), AnalyticsClient(), makeBeforeSend(), getFundingChoicesPublisherId()

### Community 47 - "HomeSidebar.tsx"
Cohesion: 0.36
Nodes (5): HomeSidebar(), MostReadSection(), isValidEmail(), NewsletterForm(), getMostReadArticles()

### Community 48 - "404/page.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundContent()

### Community 49 - "search"
Cohesion: 0.36
Nodes (4): Main search function with auto-domain detection, search(), Known query -> expected top-domain sanity checks (not exact-row pinning, since…, TestSearchDomains

### Community 50 - "Playbook"
Cohesion: 0.25
Nodes (5): Convención: mantener el registro de progreso al día, Cómo correr en local, Estado del proyecto, Estructura, Playbook

### Community 51 - "detect_domain"
Cohesion: 0.43
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 52 - "set-password/page.tsx"
Cohesion: 0.33
Nodes (4): dynamic, metadata, Props, editorInvitations

### Community 53 - "EmailWall.tsx"
Cohesion: 0.47
Nodes (3): AccountSignInPrompt(), EmailWall(), signInWithGoogle()

### Community 54 - "9. Routes Map"
Cohesion: 0.33
Nodes (6): 9. Routes Map, Admin — `app/admin/*`, API routes — `app/api/*`, Error boundaries, Public site — `app/(public)/*`, SEO infrastructure

### Community 55 - "reset-editor-password.ts"
Cohesion: 0.53
Nodes (5): editors, generatePassword(), main(), pick(), shuffle()

### Community 56 - "Verifying Playbook Portal locally"
Cohesion: 0.40
Nodes (4): Driving the browser, Verifying Playbook Portal locally, What actually works: a tiny local Node server, What's blocked in this sandbox

### Community 57 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 59 - "next.config.ts"
Cohesion: 0.40
Nodes (4): csp, legacyHtmlRedirects, nextConfig, securityHeaders

### Community 60 - "next-auth.d.ts"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 61 - "validate_data.py"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 62 - "10. Frontend Component Architecture"
Cohesion: 0.50
Nodes (4): 10.1 Admin CMS (`components/admin/`), 10.2 Public site, 10.3 Styling, 10. Frontend Component Architecture

### Community 65 - "6. Data & Write Layer"
Cohesion: 0.67
Nodes (3): 6.1 Read layer (`lib/data/`), 6.2 Write layer — Server Actions (`lib/actions/`), 6. Data & Write Layer

## Knowledge Gaps
- **393 isolated node(s):** `metadata`, `metadata`, `Filters`, `FilterKey`, `Props` (+388 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `shuffle()` connect `reset-editor-password.ts` to `gsap-core.js`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `db` connect `client.ts` to `schema.ts`, `team.ts`, `admin.ts`, `data/reader-account.ts`, `site-content.ts`, `metering.ts`, `articles.ts`, `set-password/page.tsx`, `reset-editor-password.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `SITE_URL` connect `tema/page.tsx` to `team.ts`, `app/layout.tsx`, `feed.xml/route.ts`, `archivo/page.tsx`, `articulo/page.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestDomainDetection` and `TestPersistence`) actually correct?**
  _`DesignSystemGenerator` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `metadata`, `Filters` to the rest of the system?**
  _393 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `paths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.051615051615051616 - nodes in this community are weakly interconnected._
- **Should `analytics-data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08235294117647059 - nodes in this community are weakly interconnected._
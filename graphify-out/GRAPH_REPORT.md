# Graph Report - .  (2026-08-11)

## Corpus Check
- Large corpus: 370 files · ~528,178 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2003 nodes · 3771 edges · 165 communities (140 shown, 25 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.78)
- Token cost: 573,977 input · 0 output

## Community Hubs (Navigation)
- Admin Analytics Dashboard
- Verification & Deploy Practices
- Admin Form Field Components
- Auth & Database Schema
- GSAP ScrollSmoother
- Homepage & Live Preview
- Article Device Library (code)
- Neon Postgres & Env Config
- Article Page Rendering
- RSS Feed & Public Hubs
- Graphify CLI Integrations
- Login & Auth Forms
- Dev Dependencies
- TypeScript Config
- Product Hubs & Figure Markup
- Runtime Dependencies
- Admin Article Entry State
- Admin Tabs & Field Widgets
- Device Placement Rules
- Editorial Governance & Tiers
- Editor Team Management
- Admin Dashboard Shell
- Readers Sync & Data
- Archive Page & Filters
- Archive Cards & Topic Pills
- UI Design System Generator
- SEO Clustering & Content
- Overlap Check & Dedupe
- La Lana Article Devices
- La Lana Hub & Sidebar
- Article & Site Motion
- Substack Backlog Builder
- World Map Builder
- Skill Governance & Sync
- Dynamic Element Library
- Protected Admin Layout & Theme
- Form Validation Context
- Noticias Product Routing
- Publishing Skills & Taxonomy
- UI Search Core (BM25)
- BM25 Implementation
- Design System Formatting
- Scroll & Home Choreography
- Article Country Map
- GSAP Path Utilities
- GEO / AI Search Optimization
- Article Render Contract
- Infinitas & TFBR Hubs
- GSAP Plugin Bundle
- GSAP Draggable & Flip
- SEO Fetch Safety & Schema
- Article Sources & Credits
- Root Layout & Fonts
- Mobile UI/UX Rules
- Auth Flows & Editor Invites
- Author & Topic Pages
- Noticias Hub & Paywall
- Project Overview & Stack
- NPM Scripts
- Format Doctrine & TFBR
- ArticleInput Fields
- Format Tiers & Uniformity
- Design System Generation
- Device Builders
- GSAP Morph & MotionPath
- Single Source of Truth Rules
- Ads.txt & Public Layout
- Reader Account & Export
- Noticias Page & River
- Daily Figure Widget
- Design Prototypes (v23/v24)
- Header & Brand Nav
- GSAP Core
- Dedupe Outcomes
- Publish Pipeline Rules
- Update Articles API
- Server Actions Write Layer
- Departures Board Updater
- Sourced Research Steps
- Published Body Fixes
- TipTap Editor
- Initial DB Migration
- SEO Audit & Sitemaps
- La Lana Architecture
- Google SEO APIs & CWV
- Admin Studio Guide
- Cookie Consent
- Body HTML Cache & Dedupe
- Taxonomy Options
- 404 Pages
- Privacy, Robots & Site URL
- UI Quick Reference & Share
- Search Domain Tests
- AdSense Slots
- Substack Archive Backlog
- La Lana Rebrand Fix
- Backlink Data Sources
- SEO Drift & Schema Agents
- Local SEO
- SXO & Visual Analysis
- Graphify Pipeline Steps
- Opinion Callout Contract
- Domain Detection Tests
- Footer & Cookie Prefs
- Data Read Layer
- Body Movements & Marks
- Duplicate Finder
- Matador Report Updater
- GSAP MotionPath Helper
- GSAP Text Plugins
- Scoring & Health Metrics
- Taxonomy & Product Routing
- Image Sourcing & Credit
- Skill Feedback Sync
- Accessibility & Scroll Bugs
- Money Trail & GSAP Imports
- GSAP Core API
- Article Standards Backfill
- Language & Mechanical Rules
- Ticker Components
- Newsletter Form
- Analytics Integrations
- ESLint Config
- Next.js Config
- NextAuth Types
- Evidence & Confidence Rules
- Data Validation Script
- Homepage Ranking
- Package Manifest
- GSAP Observer
- Admin Layout
- Error Boundaries
- Public Catch-All Route
- Security Headers & CSP
- Smoke Test
- Email Wall Test
- Byline Rendering
- Root Layout & Dark Mode
- bcryptjs Dependency
- Related Articles
- Next Env Types
- pg Dependency
- react-dom Dependency
- TipTap Image Extension
- TipTap HTML Extension
- zod Dependency
- Vercel Cron Config
- Newsletter Chrome Removal
- Depth Over Length
- Dating and Sourcing
- Six-Phase Report
- Reaction Asymmetries
- NextAuth Route Handlers

## God Nodes (most connected - your core abstractions)
1. `ArticuloPage()` - 27 edges
2. `articles` - 25 edges
3. `SiteContentData` - 24 edges
4. `Article` - 22 edges
5. `getSiteContent` - 21 edges
6. `getAllArticles` - 20 edges
7. `db` - 20 edges
8. `gsap` - 20 edges
9. `DesignSystemGenerator` - 19 edges
10. `safeUrl()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `resolveSiteUrl https self-fetch gotcha` --references--> `SITE_URL`  [AMBIGUOUS]
  .claude/skills/verify/SKILL.md → lib/site-url.ts
- `Ad slots demostrativos (ad-wide/ad-rail/article-ad)` --conceptually_related_to--> `AdSlot()`  [INFERRED]
  docs/playbook-ux-02-trafico-interno-ads.html → components/ads/AdSlot.tsx
- `Animation rules (MEDIUM)` --conceptually_related_to--> `ArticleMotion()`  [INFERRED]
  .claude/skills/ui-ux-pro-max/references/quick-reference.md → components/article/ArticleMotion.tsx
- `Patrón rank-list / filter-bar del v24` --references--> `MostReadSection()`  [INFERRED]
  docs/playbook-portal-v24-medio-consulta(1).html → components/home/MostReadSection.tsx
- `Make.com webhook ingestion path` --references--> `POST()`  [EXTRACTED]
  docs/ENCYCLOPEDIA.md → app/api/update-articles/route.ts

## Import Cycles
- 3-file cycle: `components/ads/AdSenseProvider.tsx -> lib/adsense.ts -> components/ads/AdSlot.tsx -> components/ads/AdSenseProvider.tsx`

## Hyperedges (group relationships)
- **Agents writing findings under the audit orchestrator persistence contract** — _claude_agents_seo_backlinks_seo_backlinks, _claude_agents_seo_cluster_seo_cluster, _claude_agents_seo_content_seo_content, _claude_agents_seo_drift_seo_drift, _claude_agents_seo_ecommerce_seo_ecommerce, _claude_agents_seo_geo_seo_geo, _claude_agents_seo_google_seo_google, _claude_agents_seo_local_seo_local, _claude_agents_seo_maps_seo_maps, _claude_agents_seo_performance_seo_performance, _claude_agents_seo_schema_seo_schema, _claude_agents_seo_sitemap_seo_sitemap, _claude_agents_seo_sxo_seo_sxo, _claude_agents_seo_technical_seo_technical, _claude_agents_seo_visual_seo_visual, _claude_agents_seo_backlinks_audit_persistence_contract [EXTRACTED 1.00]
- **SPA-aware fetch pipeline (render_page.py v2.0.0) shared across agents** — _claude_agents_seo_backlinks_render_page, _claude_agents_seo_backlinks_url_safety_ssrf, _claude_agents_seo_content_extracted_text_scoring, _claude_agents_seo_ecommerce_client_side_schema_injection, _claude_agents_seo_schema_bounded_json_ld_artifact, _claude_agents_seo_drift_fetch_page_ssrf_guard [EXTRACTED 1.00]
- **Tiered-capability scoring pattern with weight redistribution** — _claude_agents_seo_backlinks_tier_based_source_ladder, _claude_agents_seo_backlinks_confidence_weighted_scoring, _claude_agents_seo_google_credential_tiers, _claude_agents_seo_maps_tier_weight_redistribution, _claude_agents_seo_backlinks_insufficient_data_rule [INFERRED 0.85]
- **The thirteen designed devices form the element library** — _claude_playbook_editorial_dynamic_element_library_cifra_clave, _claude_playbook_editorial_dynamic_element_library_jugada, _claude_playbook_editorial_dynamic_element_library_cronologia, _claude_playbook_editorial_dynamic_element_library_recibo, _claude_playbook_editorial_dynamic_element_library_ecuacion, _claude_playbook_editorial_dynamic_element_library_salto, _claude_playbook_editorial_dynamic_element_library_reparto, _claude_playbook_editorial_dynamic_element_library_alineacion, _claude_playbook_editorial_dynamic_element_library_cotizacion, _claude_playbook_editorial_dynamic_element_library_resultados, _claude_playbook_editorial_dynamic_element_library_duelo, _claude_playbook_editorial_dynamic_element_library_serie, _claude_playbook_editorial_dynamic_element_library_mapa, _claude_playbook_editorial_dynamic_element_library_library [EXTRACTED 1.00]
- **Shared editorial rule files participate in the publish-newsletter decision flow** — _claude_skills_publish_newsletter_skill_decision_flow, _claude_playbook_editorial_overlap_check_overlap_check, _claude_playbook_editorial_format_tiers_three_website_tiers, _claude_playbook_editorial_voice_and_style_idea_central, _claude_playbook_editorial_dynamic_element_library_library, _claude_playbook_editorial_fields_and_taxonomy_articleinput, _claude_playbook_editorial_images_cover_image, _claude_playbook_editorial_voice_and_style_publication_checklist [EXTRACTED 1.00]
- **graphify build pipeline: detect, AST, semantic, merge, cluster** — _claude_skills_graphify_skill_detect_files, _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_ast_semantic, _claude_skills_graphify_skill_build_cluster_analyze, _claude_skills_graphify_skill_label_communities, _claude_skills_graphify_skill_manifest_and_cost [EXTRACTED 1.00]
- **Publishing pipeline: source link to live article** — _claude_skills_publish_newsletter_references_ingestion_read_the_sources, _claude_skills_publish_newsletter_references_overlap_check_the_check, _claude_skills_publish_newsletter_references_fields_and_taxonomy_articleinput, _claude_skills_publish_newsletter_references_images_cover_image, _claude_skills_publish_newsletter_references_publishing_mechanics_publish_step, scripts_publish_newsletter, lib_db_schema_articles, _claude_skills_publish_newsletter_references_publishing_mechanics_report_back [EXTRACTED 1.00]
- **Render-time authoring contract: plain markdown conventions become design** — _claude_skills_publish_newsletter_references_format_tiers_render_time_transform, _claude_skills_publish_sourced_article_references_dynamic_element_library_collection, _claude_skills_publish_sourced_article_references_dynamic_element_library_automatic_elements, _claude_skills_publish_newsletter_references_format_tiers_opinion_callout_contract, _claude_skills_publish_newsletter_references_format_tiers_fuentes_credit_line, _claude_skills_publish_newsletter_references_voice_and_style_subheads_and_leadins, scripts_publish_newsletter [EXTRACTED 1.00]
- **Shared editorial tree: one copy, two skills, one masthead** — _claude_skills_publish_sourced_article_skill_shared_vs_own_symlinks, _claude_skills_publish_sourced_article_references__governance_single_source_of_truth, _claude_skills_publish_sourced_article_references__governance_truncation_incident, _claude_skills_publish_sourced_article_references__governance_convergence_check, _claude_skills_publish_sourced_article_references__governance_syncing, scripts_sync_skill_feedback, _claude_skills_publish_sourced_article_references_voice_and_style, _claude_skills_publish_newsletter_references_voice_and_style [EXTRACTED 1.00]
- **Pipeline de publicación de La Lana (spec → skill → script → devices → board)** — docs_la_lana_article_spec, claude_skills_publish_newsletter_skill_publish_newsletter, scripts_publish_newsletter_main, lib_article_devices_apply_body_devices, scripts_update_lana_board_main [EXTRACTED 1.00]
- **Flujo de metering/paywall del lector anónimo** — docs_encyclopedia_metering_paywall, middleware_middleware, lib_anon_cookie_anon_cookie, lib_metering_resolve_entitlement, lib_db_schema_article_reads, lib_data_articles_get_article_meta_by_id, components_article_emailwall_emailwall [EXTRACTED 1.00]
- **Sistema de identidad por producto (4 hubs + registro + skins de artículo)** — handoff_el_expediente, handoff_el_trago, handoff_la_sala_de_juntas, handoff_el_marcador, lib_product_hubs_product_hubs, handoff_la_lectura, styles_product_hubs_product_hubs_css [EXTRACTED 1.00]

## Communities (165 total, 25 thin omitted)

### Community 0 - "Admin Analytics Dashboard"
Cohesion: 0.07
Nodes (48): AdminAnalyticsPage(), AdminDashboardPage(), AnalyticsView(), BarList(), formatNumber(), formatUpdatedAt(), KpiCard(), unavailableMessage() (+40 more)

### Community 1 - "Verification & Deploy Practices"
Cohesion: 0.07
Nodes (40): Every change ships with a convergence check, resolveSiteUrl https self-fetch gotcha, Tiny local http.createServer harness, Driving the browser with global Playwright, verify skill — run the site locally in a sandbox, CI/CD y despliegue en Vercel, Diferir la validación de env vars más allá del import, Notable Engineering Lessons (+32 more)

### Community 2 - "Admin Form Field Components"
Cohesion: 0.08
Nodes (33): ArrayEditor(), ArrayEditorProps, Badge, Option, SelectField(), SelectFieldProps, AboutTab(), Props (+25 more)

### Community 3 - "Auth & Database Schema"
Cohesion: 0.07
Nodes (29): ALLOWED_CONTENT_TYPES, adapter, { handlers, auth, signIn, signOut }, Database Schema (nine Drizzle tables), deleteMyAccount(), requireReader(), accounts, anonReaders table (+21 more)

### Community 4 - "GSAP ScrollSmoother"
Cohesion: 0.08
Nodes (23): _createClass(), _defineProperties(), ScrollSmoother(), constructor(), _context(), _defaultContext, _disallowInline(), _elements() (+15 more)

### Community 5 - "Homepage & Live Preview"
Cohesion: 0.14
Nodes (21): metadata, PreviewFooter(), PreviewHeader(), Props, TopicDirectory(), TOPICS, LazyEmbed(), AboutSection() (+13 more)

### Community 6 - "Article Device Library (code)"
Cohesion: 0.08
Nodes (29): ALL_DEVICES, decodeEntities(), Delta, Device, DEVICES, Duel, DuelRow, Equation (+21 more)

### Community 7 - "Neon Postgres & Env Config"
Cohesion: 0.09
Nodes (21): Neon HTTP driver, not the pg Pool, POSTGRES_URL env var (production Neon DB), Requirements: POSTGRES_URL and the Neon HTTP driver, dynamic, metadata, Props, Variables de entorno y degradación por integración, Known gaps: solo configuración de producción (+13 more)

### Community 8 - "Article Page Rendering"
Cohesion: 0.12
Nodes (24): ArticuloPage(), canonicalUrlFor(), generateMetadata(), looksLikeHtml(), paragraphsFrom(), pathFor(), PlainBlock, plainBlocksFor() (+16 more)

### Community 9 - "RSS Feed & Public Hubs"
Cohesion: 0.11
Nodes (26): app/admin/(protected)/dashboard/page.tsx, cdata(), dynamic, GET(), parseTopicFromQuery(), toRfc822(), xmlEscape(), app/(public)/archivo/page.tsx — archivo filtrable (+18 more)

### Community 10 - "Graphify CLI Integrations"
Cohesion: 0.09
Nodes (28): /graphify add (URL ingest), --watch folder watcher, FalkorDB export and push, graphify MCP stdio server, Neo4j export and push, Token reduction benchmark, graphify clone (GitHub repos), graphify merge-graphs (cross-repo / monorepo) (+20 more)

### Community 11 - "Login & Auth Forms"
Cohesion: 0.15
Nodes (16): dynamic, AccountSignInPrompt(), PasswordAuthForm(), LoginForm(), EmailWall(), loginAction(), LoginState, PasswordAuthState (+8 more)

### Community 12 - "Dev Dependencies"
Cohesion: 0.07
Nodes (27): drizzle-kit, eslint, eslint-config-next, @eslint/eslintrc, @neondatabase/serverless, devDependencies, drizzle-kit, eslint (+19 more)

### Community 13 - "TypeScript Config"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 14 - "Product Hubs & Figure Markup"
Cohesion: 0.10
Nodes (24): Convención de autoría "Ruta del dinero:", CIFRA_HTML_RE, CIFRA_TEXT_PREFIX, CifraFigure, cifraMarkup(), FIGURE_PATTERNS, Jugada, JUGADA_HTML_RE (+16 more)

### Community 15 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (25): @auth/drizzle-adapter, chart.js, drizzle-orm, next, next-auth, dependencies, @auth/drizzle-adapter, chart.js (+17 more)

### Community 16 - "Admin Article Entry State"
Cohesion: 0.15
Nodes (23): AdminDashboard(), applyServerArticle(), ArticleEntry, articleToEntry(), isEntryDirty(), newArticleEntry(), toData(), toPreviewArticle() (+15 more)

### Community 17 - "Admin Tabs & Field Widgets"
Cohesion: 0.16
Nodes (20): CheckboxGroupField(), CheckboxGroupFieldProps, StarPickerField(), StarPickerFieldProps, NumberField(), ArticlesTab(), COVERAGE_TIERS, Props (+12 more)

### Community 18 - "Device Placement Rules"
Cohesion: 0.10
Nodes (24): Automatic Elements (nothing to author), Device Budget (readingTime + priority), Jugada (connection strip device), lib/article-devices.ts, Device Per-Run Checklist, Rules of Device Placement, Breaking News Priority Override, featured (Destacado) flag (+16 more)

### Community 19 - "Editorial Governance & Tiers"
Cohesion: 0.13
Nodes (23): Date It and Name Its Source, One Rule, One Home, Place Before You Create (file ownership table), ArticleInput Field Shape, date / dateFormatted fields, Análisis tier, Flash tier (80-150 words), Noticia Playbook tier (+15 more)

### Community 20 - "Editor Team Management"
Cohesion: 0.17
Nodes (19): SetPasswordForm(), dateFmt, dateTimeFmt, Props, TeamTab(), acceptInvitation(), AcceptInvitationState, getTeamData() (+11 more)

### Community 21 - "Admin Dashboard Shell"
Cohesion: 0.12
Nodes (17): DEFAULT_ORDER, GROUPS, LABELS, Props, SAVELESS_TABS, Status, TAB_DEFS, TabKey (+9 more)

### Community 22 - "Readers Sync & Data"
Cohesion: 0.18
Nodes (16): constantTimeEqual(), GET(), dateFmt, ReadersTab(), getReadersData(), requireEditor(), getAllReaders(), ReaderRow (+8 more)

### Community 23 - "Archive Page & Filters"
Cohesion: 0.14
Nodes (18): ArchivoPage(), FILTER_TIERS, filterHref(), FilterKey, Filters, groupRiver(), metadata, monthKeyOf() (+10 more)

### Community 24 - "Archive Cards & Topic Pills"
Cohesion: 0.17
Nodes (14): ArchiveFeatureRow(), ArchiveGridCard(), ArticleTopics(), TIER_COLUMN, TagPillRow(), TIER_COLUMN, SplitHeadline(), ArchiveFilters (+6 more)

### Community 25 - "UI Design System Generator"
Cohesion: 0.14
Nodes (10): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV. (+2 more)

### Community 26 - "SEO Clustering & Content"
Cohesion: 0.11
Nodes (19): Keyword cannibalization check, cluster-plan.json output artifact, Hub-and-spoke cluster architecture, Internal link matrix (mandatory/recommended/optional), Keyword intent classification, seo-cluster agent, SERP overlap methodology and thresholds, AI Content Assessment (Sept 2025 QRG) (+11 more)

### Community 27 - "Overlap Check & Dedupe"
Cohesion: 0.12
Nodes (19): sourceUrl Unique Dedupe Key, substackUrl field (differs by funnel), If It Was Already Published Twice (48-hour rule), scripts/find-duplicates.mjs, Outcome A: Same event, nothing new, do not publish, Outcome C: New development, new article linking back, Outcome D: Different product, different thesis, cross-linked, The Overlap Check (+11 more)

### Community 28 - "La Lana Article Devices"
Cohesion: 0.19
Nodes (19): The hero figure (defining number verbatim in title/excerpt), Four evidence levels that never blend, Titles: protagonista + movimiento + dato, Alineacion: the lineup chips, Cifra clave: the pull-figure, The dynamic element library (thirteen devices), Cotizacion: the market tile, Cronologia: the drawn timeline (+11 more)

### Community 29 - "La Lana Hub & Sidebar"
Cohesion: 0.19
Nodes (14): boardKey(), LaLanaHubPage(), metadata, RelatedCard(), HomeSidebar(), BoardRow, DeparturesBoard(), statusBlinks() (+6 more)

### Community 30 - "Article & Site Motion"
Cohesion: 0.24
Nodes (16): ArticleMotion(), COUNTUP_SELECTOR, HIGHLIGHT_SELECTOR, LEAD_PHOTO_SELECTOR, SiteMotion(), STAGGER_SELECTOR, SWEEP_SELECTOR, countUp() (+8 more)

### Community 31 - "Substack Backlog Builder"
Cohesion: 0.22
Nodes (18): archive(), bodyHtml(), CACHE, cached(), digestItems(), FOCUS, getJSON(), headings() (+10 more)

### Community 32 - "World Map Builder"
Cohesion: 0.13
Nodes (17): ASSOCIATION_POINTS, centroidOf(), CFU, CONMEBOL, EXTRA_POINTS, Feature, FRAME_SIZES, main() (+9 more)

### Community 33 - "Skill Governance & Sync"
Cohesion: 0.11
Nodes (18): Convergence Check (two skills, zero divergence), Single Source of Truth for Editorial Rules, Six-Phase Skill Work Report, 2026-08-11 Monolithic SKILL.md Truncation Incident, scripts/sync-skill-feedback.sh SYNC_PATHS, Shared Device Declaration Syntax, Devices Fail Loud, Not Silent, The Fuentes: Credit Line (+10 more)

### Community 34 - "Dynamic Element Library"
Cohesion: 0.16
Nodes (18): Alineación (lineup chips device), Cifra clave (pull-figure device), Cotización (market tile device), Cronología (drawn timeline device), Duelo (butterfly chart device), La cifra del día (homepage sidebar reads Cifra clave), lib/article-map.ts, lib/product-hubs.ts (+10 more)

### Community 35 - "Protected Admin Layout & Theme"
Cohesion: 0.22
Nodes (11): dynamic, AdminTopbarNav(), applyThemeColor(), isDarkActive(), listeners, notify(), storedTheme(), subscribeTheme() (+3 more)

### Community 36 - "Form Validation Context"
Cohesion: 0.14
Nodes (14): FormValidationContext, FormValidationHandle, FormValidationProvider, Registration, useFormValidationRegistrar(), Validator, isValidUrlValue(), NumberFieldProps (+6 more)

### Community 37 - "Noticias Product Routing"
Cohesion: 0.16
Nodes (13): publication/source product routing pair, The product is called Noticias ('Industry Shots' retired), Fixed product routing: Noticias / industry-shots, metadata, FILTERS, NEWS_SOURCES, docs/TODO.md, FREE_ARTICLES_PER_MONTH (+5 more)

### Community 38 - "Publishing Skills & Taxonomy"
Cohesion: 0.13
Nodes (17): publish-newsletter skill, publish-sourced-article skill, components/admin/studio-prompts.ts, Claude Code skills del proyecto, Make.com webhook ingestion path, Taxonomía cerrada de tres niveles, docs/la-lana-article-spec.md, TODO 1 — clasificación de noticias (+9 more)

### Community 39 - "UI Search Core (BM25)"
Cohesion: 0.17
Nodes (14): _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), Load CSV and return list of dicts, with mtime-based caching., Fitted BM25 index for this file+columns, with mtime-based caching., Core search function using BM25. Returns (results, bm25_or_none)., Nearest known vocabulary terms for a query that returned 0 hits, so the caller… (+6 more)

### Community 40 - "BM25 Implementation"
Cohesion: 0.15
Nodes (9): BM25, _normalize(), Apply synonym substitution before tokenizing., BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes. (+1 more)

### Community 41 - "Design System Formatting"
Cohesion: 0.15
Nodes (16): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), Format a page-specific override file with intelligent AI-generated content., Generate intelligent overrides based on page type using layered search. Uses… (+8 more)

### Community 42 - "Scroll & Home Choreography"
Cohesion: 0.15
Nodes (8): ArticleEndMark(), HomeChoreography(), gsap, GsapTween, ScrollTriggerInstance, ScrollTriggerStatic, TODO: potential idea: use legitimate CSS scroll snapping by pushing invisible…, ScrollTrigger()

### Community 43 - "Article Country Map"
Cohesion: 0.17
Nodes (16): ArticleMap, buildMap(), codesFrom(), COUNTRIES, CountryEntry, esc(), fold(), FRAME_ALIASES (+8 more)

### Community 44 - "GSAP Path Utilities"
Cohesion: 0.24
Nodes (16): cacheRawPathMeasurements(), copyRawPath(), getClosestData(), getClosestProgressOnBezier(), getPositionOnPath(), getProgressData(), getRotationAtBezierT(), getRotationAtProgress() (+8 more)

### Community 45 - "GEO / AI Search Optimization"
Cohesion: 0.13
Nodes (16): AI citation readiness score, AI Crawler Access (GPTBot, ClaudeBot, PerplexityBot, CCBot), Brand mention correlation with AI citations, Passage citability signals (134-167 word passages), GEO Health Score (0-100, 5 dimensions), llms.txt and RSL 1.0 licensing check, seo-geo agent, local-schema-types.md reference (shared with seo-maps) (+8 more)

### Community 46 - "Article Render Contract"
Cohesion: 0.16
Nodes (16): app/(public)/articulo/page.tsx — página de artículo, Presupuesto de dispositivos (piso, no techo), Regla: la presentación del cuerpo se decide en render, no al publicar, Convención de autoría "Cifra clave:", Presupuesto de dispositivos por readingTime/priority, La colección de dispositivos de artículo, La Lectura — un esqueleto, cuatro pieles de artículo, applyBodyDevices() (+8 more)

### Community 47 - "Infinitas & TFBR Hubs"
Cohesion: 0.23
Nodes (12): FutbolBusinessReviewHubPage(), metadata, InfinitasHubPage(), metadata, toScoreboardMetric(), formatValue(), Scoreboard(), ScoreboardMetric (+4 more)

### Community 49 - "GSAP Draggable & Flip"
Cohesion: 0.18
Nodes (5): _assertThisInitialized(), Draggable(), NOTE: "force" is actually the "time" when this method gets called by the…, getGlobalMatrix(), Matrix2D()

### Community 50 - "SEO Fetch Safety & Schema"
Cohesion: 0.14
Nodes (15): render_page.py SPA-aware page fetcher, url_safety.py SSRF and DNS-rebinding protection, API credit efficiency rules (bulk endpoints, no re-fetch), fetch_page.py private/loopback IP validation, Client-side product schema injection (prefer --mode always), DataForSEO cost guardrails (check/log before Merchant API), Product schema completeness validation, seo-ecommerce agent (+7 more)

### Community 51 - "Article Sources & Credits"
Cohesion: 0.21
Nodes (13): The Fuentes: credit line, Find each primary co-issuer's own posting, ArticleSources(), ArticleSource, collectAnchors(), decodeEntities(), extractSourcesFromHtml(), extractSourcesFromParagraphs() (+5 more)

### Community 52 - "Root Layout & Fonts"
Cohesion: 0.19
Nodes (12): The 16:10 crop check (no cropped-looking covers), anton, inter, metadata, RootLayout(), AnalyticsClient(), makeBeforeSend(), getFundingChoicesPublisherId() (+4 more)

### Community 53 - "Mobile UI/UX Rules"
Cohesion: 0.19
Nodes (15): Icons & visual elements rules, Interaction (app) rules, Layout & spacing rules (safe areas, 4/8dp rhythm), Light/dark mode contrast rules, Pre-Delivery Checklist (canonical - the only one), Scope notice: native/mobile app UI only, ui-ux-pro-max scripts/search.py, Step 2c: design dials (variance, motion, density) (+7 more)

### Community 54 - "Auth Flows & Editor Invites"
Cohesion: 0.17
Nodes (13): app/admin/(protected)/layout.tsx — guard de editor, app/admin/set-password/page.tsx, POST(), auth.ts — instancia única de Auth.js, Un Auth.js, dos flujos de identidad (lectores/editores), Invitaciones de editores por email (token hasheado), acceptInvitation(), editorInvitations table (+5 more)

### Community 55 - "Author & Topic Pages"
Cohesion: 0.21
Nodes (12): AutorPage(), generateMetadata(), Props, generateMetadata(), Props, resolveTopic(), TemaPage(), TIER_LABELS (+4 more)

### Community 56 - "Noticias Hub & Paywall"
Cohesion: 0.14
Nodes (13): app/(public)/noticias/page.tsx — hub Noticias, Mark, MARKS, ShotProgress(), Fuentes editoriales (Noticias, La Lana, Infinitas, Opinión), Metering / paywall de lectores (3 gratis al mes), TODO 2 — retirar la clave source `industry-shots`, El Trago — hub /noticias (ex /industry-shots) (+5 more)

### Community 57 - "Project Overview & Stack"
Cohesion: 0.14
Nodes (15): graphify knowledge-graph workflow convention, Playbook — publicación de negocio del deporte MX/LATAM, Repository Map, Tech Stack (Next.js 15, Drizzle, Auth.js v5, TipTap, Blob), Foto del destacado — 16:10, Logo del header — única imagen con variación por breakpoint, Referencia de formatos de imagen, Campos obligatorios del artículo La Lana (+7 more)

### Community 58 - "NPM Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:generate, db:migrate, db:reset-editor-password, dev, fix:lana-rebrand, fix:newsletter-success-copy (+7 more)

### Community 59 - "Format Doctrine & TFBR"
Cohesion: 0.15
Nodes (14): Ecuación (display math device), Definitional Antithesis (TFBR thesis move), The Four-Movement Brief (Noticias / Infinitas), The Futbol Business Review format, The Uniformity Contract (four products, one masthead), Las diez palancas, Fórmulas bajo vigilancia, La aritmética (no arithmetic showmanship) (+6 more)

### Community 60 - "ArticleInput Fields"
Cohesion: 0.18
Nodes (14): ArticleInput field shape (20 fields), author / mostrarAutor byline rules, Breaking News override (priority 5 + featured), featured (Destacado) flag, priority (Importancia) 1-5 scale, substackUrl (funnel-specific), The device budget (by readingTime, +1 at priority 5), Per-run device checklist (+6 more)

### Community 61 - "Format Tiers & Uniformity"
Cohesion: 0.18
Nodes (14): publish-newsletter references/format-tiers.md, Definitional antithesis (TFBR thesis move), The Futbol Business Review (ghostwritten for Interticket), The three website tiers (Flash / Noticia Playbook / Analisis), The uniformity contract (four products, one masthead), Features vs briefs (readingTime 2 vs 4), TFBR: translate the argument, not the sentences, check-voice.mjs is a mirror, not a gate (+6 more)

### Community 62 - "Design System Generation"
Cohesion: 0.18
Nodes (11): format_markdown(), format_master_md(), generate_design_system(), persist_design_system(), Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,…, Slugify a name into a single safe path segment. Only [a-z0-9_-] survives; every…, Persist design system to design-system/<project>/ folder using Master +… (+3 more)

### Community 63 - "Device Builders"
Cohesion: 0.23
Nodes (14): buildDelta(), buildDuel(), buildEquation(), buildLineup(), buildQuote(), buildReceipt(), buildResults(), buildSeries() (+6 more)

### Community 64 - "GSAP Morph & MotionPath"
Cohesion: 0.24
Nodes (9): arcToSegment(), convertToPath(), flatPointsToSegment(), getRawPath(), pointsToSegment(), rawPathToString(), reverseSegment(), stringToRawPath() (+1 more)

### Community 65 - "Single Source of Truth Rules"
Cohesion: 0.21
Nodes (13): publish-newsletter references/fields-and-taxonomy.md, publish-newsletter references/images.md, publish-newsletter references/overlap-check.md, publish-newsletter references/voice-and-style.md, One rule, one home (cross-reference, never copy), Place before you create (file ownership table), Single source of truth (never fork a rule into a skill-local file), Why the shared tree exists (2026-08-11 truncation incident) (+5 more)

### Community 66 - "Ads.txt & Public Layout"
Cohesion: 0.21
Nodes (9): dynamic, GET(), dynamic, PublicLayout(), AdSenseProvider(), GoogleAnalytics(), HeaderScrollEffect(), getAdSenseConfig() (+1 more)

### Community 67 - "Reader Account & Export"
Cohesion: 0.23
Nodes (9): GET(), CuentaPage(), dateFormatter, metadata, DeleteAccountButton(), currentMonthKey(), getReaderAccountSummary(), ReaderAccountSummary (+1 more)

### Community 68 - "Noticias Page & River"
Cohesion: 0.26
Nodes (11): articleHref(), groupRiver(), Measure(), metadata, NewsBlock, NoticiasHubPage(), tierFor(), When() (+3 more)

### Community 69 - "Daily Figure Widget"
Cohesion: 0.28
Nodes (11): DailyFigure(), isCountable(), magnitudeOf(), parseDelta(), parseDuel(), unitOf(), FIGURE_INLINE_RE, FIGURE_TEXT_RE (+3 more)

### Community 70 - "Design Prototypes (v23/v24)"
Cohesion: 0.21
Nodes (13): StoryCard.tsx, Vocabulario CSS analysis-grid / base-grid del v23, Prototipo v23 — Playbook medio de consulta, Prototipo v24 — Playbook medio de consulta (iteración más reciente), Patrón rank-list / filter-bar del v24, Ad slots demostrativos (ad-wide/ad-rail/article-ad), Playbook UX 02 — tráfico interno y ads, TODO 3 — archivos stale y peso muerto del repo (+5 more)

### Community 71 - "Header & Brand Nav"
Cohesion: 0.24
Nodes (9): BrandLink(), Header(), HeaderNav(), sectionHref(), matches(), normalize(), SearchableArticle, SearchBox() (+1 more)

### Community 72 - "GSAP Core"
Cohesion: 0.23
Nodes (6): _assertThisInitialized(), PropTween(), TODO: repeat: Infinity on a timeline's children must flag that timeline…, NOTE: wrap() CANNOT be an arrow function! A very odd compiling bug causes…, Timeline(), Tween()

### Community 73 - "Dedupe Outcomes"
Cohesion: 0.20
Nodes (12): sourceUrl unique dedupe key, El Marcador (Infinitas hub scoreboard) - flag, don't fix, The product hubs read the body, If it was already published twice (48-hour rule), Outcome A: same event, nothing new - don't publish, Outcome C: new development - a new article that links back, Outcome D: different product, different thesis - both run cross-linked, Reporting overlap outcomes (a skipped item is work done) (+4 more)

### Community 74 - "Publish Pipeline Rules"
Cohesion: 0.26
Nodes (10): Regenerate a published body, never hand-edit the HTML, Every visual treatment is a render-time transform, Publish: JSON array through publish-newsletter.ts, Step 8: human review before anything touches the database, Step 9: publish only what was approved, slugify(), ArticleInput, db (+2 more)

### Community 75 - "Update Articles API"
Cohesion: 0.29
Nodes (11): constantTimeEqual(), decodeEntities(), detectPublication(), escapeRegExp(), getClientIp(), inferTags(), normalizeText(), POST() (+3 more)

### Community 76 - "Server Actions Write Layer"
Cohesion: 0.20
Nodes (11): Concurrencia optimista con date_trunc('milliseconds'), Rate limiting en memoria, no distribuido, Write layer — Server Actions (lib/actions/), archiveArticle(id) — soft delete, createArticle(input), saveArticle(id, input, expectedUpdatedAt), saveSiteContent(data, expectedVersion), loginAction() (+3 more)

### Community 77 - "Departures Board Updater"
Cohesion: 0.21
Nodes (11): Tablero de salidas: empujar conexiones tras publicar, CASE_OPEN_DAYS, buildRow(), CaseRow, db, DRY_RUN, IncomingConnection, main() (+3 more)

### Community 78 - "Sourced Research Steps"
Cohesion: 0.25
Nodes (11): date / dateFormatted, The four-movement brief (Noticias / Infinitas), In-body images (differs by funnel), Step 2: independent research (mandatory for Noticias/Infinitas), Step 1: read the sources (four WebFetch passes), The regional connection (Mexico / LATAM) - research it, don't infer it, Step 2: cross-reference other coverage (mandatory), The ten-step decision flow (+3 more)

### Community 79 - "Published Body Fixes"
Cohesion: 0.25
Nodes (10): Outcome B: source adds facts - upgrade the existing article, When the sources disagree (better-attributed figure wins), Fixing a published body via update-article.ts, Fixing a published body (sourced funnel), COLUMNS, db, dryRun, Entry (+2 more)

### Community 80 - "TipTap Editor"
Cohesion: 0.27
Nodes (7): Props, TipTapEditor(), TIPTAP_EXTENSIONS, dryRun, main(), nodeText(), sql

### Community 81 - "Initial DB Migration"
Cohesion: 0.18
Nodes (10): "account", "anon_readers", "article_reads", "articles", "content_revisions", "editors", "media", "site_content" (+2 more)

### Community 82 - "SEO Audit & Sitemaps"
Cohesion: 0.24
Nodes (10): Audit persistence contract (output_dir/findings + audit-data.json), seo-backlinks agent, validate_backlink_report.py pre-delivery validator, seo-sitemap agent, sitemap_discovery.py validated-found-entries rule, Sitemap per-file limits (50k URLs / 50MB, 1k for news), Nine technical SEO analysis categories, robots.txt sitemap declaration is not a passing result (+2 more)

### Community 83 - "La Lana Architecture"
Cohesion: 0.22
Nodes (10): The departures board (la-lana connections), La Lana del Deporte fixed architecture, ## La Opinion de Playbook - exactly three bullets, The promise block (verbatim + three reader questions), Ruta del dinero (the money trail), La Lana ingestion note (no outside research), After a la-lana article: the departures board run steps, Openings en frio (+2 more)

### Community 84 - "Google SEO APIs & CWV"
Cohesion: 0.25
Nodes (9): Core Web Vitals thresholds (LCP/INP/CLS), Google credential tiers (API key / service account / GA4), GSC totals_complete rule (do not sum anonymized rows), INP replaced FID (March 12, 2024), seo-google agent, Core Web Vitals metrics and 75th percentile rule, Prefer CrUX field data over Lighthouse lab data, Lighthouse 13.x insight-based audits and PSI API v5 (+1 more)

### Community 85 - "Admin Studio Guide"
Cohesion: 0.31
Nodes (4): STUDIO_SECTIONS, StudioPrompt, StudioSection, StudioTab()

### Community 86 - "Cookie Consent"
Cohesion: 0.36
Nodes (7): CookieNotice(), CONSENT_EVENT, CONSENT_KEY, ConsentState, parse(), readConsent(), writeConsent()

### Community 87 - "Body HTML Cache & Dedupe"
Cohesion: 0.25
Nodes (7): bodyHtml como cache server-rendered de bodyJson, sourceUrl como identidad de dedup por artículo, body_html es cache de body_json — no editar a mano, Detección de ediciones ya procesadas por substackUrl, articles, db, DRY_RUN

### Community 88 - "Taxonomy Options"
Cohesion: 0.29
Nodes (7): tagsScope / tagsSport / tagsVertical taxonomy, DEFAULT_TOPICS, SCOPE_OPTIONS, SECTION_TOPICS, SectionTopics, SPORT_OPTIONS, VERTICAL_OPTIONS

### Community 89 - "404 Pages"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundContent()

### Community 91 - "UI Quick Reference & Share"
Cohesion: 0.25
Nodes (7): Animation rules (MEDIUM), Navigation Patterns (HIGH), Performance rules (HIGH), UI/UX Quick Reference Rule Set (10 categories), Touch & Interaction rules (CRITICAL), ShareRow(), Rediseño del share row (acciones circulares 44px)

### Community 92 - "Search Domain Tests"
Cohesion: 0.36
Nodes (4): Main search function with auto-domain detection, search(), Known query -> expected top-domain sanity checks (not exact-row pinning, since…, TestSearchDomains

### Community 93 - "AdSense Slots"
Cohesion: 0.43
Nodes (5): AdSenseContext, useAdSenseConfig(), AdSlot(), AdSlotName, AdSenseConfig

### Community 94 - "Substack Archive Backlog"
Cohesion: 0.25
Nodes (8): Backlog del archivo Substack → playbook.la, Orden sugerido de ataque (6 lotes), Contenido perecedero vs. permanente, Inventario por serie (13 series, P1/P2), La Sala de Juntas — hub /futbol-business-review, Interticket, Inc. (Oscar Galiano, Director México), Luis Hernández "El Matador" como activo de marca, El Matador, Inc. — reporte de caso de Playbook

### Community 95 - "La Lana Rebrand Fix"
Cohesion: 0.43
Nodes (7): db, deepReplace(), DRY_RUN, fixArticles(), fixSiteContent(), main(), replaceBrand()

### Community 96 - "Backlink Data Sources"
Cohesion: 0.29
Nodes (7): Bing Webmaster source (bing_webmaster.py), Common Crawl web graph source (commoncrawl_graph.py), Moz API source (moz_api.py), Tier-Based Backlink Source Ladder (Tier 0-3), claude-seo output conventions (tables, XX/100, priority ladder), Fail-closed MCP policy (never bypass with raw HTTP), seo-dataforseo agent

### Community 97 - "SEO Drift & Schema Agents"
Cohesion: 0.29
Nodes (7): Baseline / Compare / History drift workflow, seo-drift agent, Drift severity classification (CRITICAL/WARNING/INFO), SQLite baseline store with SHA-256 content hashes, OG / social preview image audit, seo-image-gen agent, seo-schema agent

### Community 98 - "Local SEO"
Cohesion: 0.29
Nodes (7): Business type detection (brick-and-mortar / SAB / hybrid), Local SEO Score (0-100, 6 dimensions), NAP consistency extraction and discrepancy flagging, seo-local agent, Whitespark 2026 critical local ranking factors, Doorway page penalty risk, Location page quality gates (30+ warning, 50+ hard stop)

### Community 99 - "SXO & Visual Analysis"
Cohesion: 0.29
Nodes (7): Common LCP / INP / CLS bottlenecks, Persona scoring (Relevance/Clarity/Trust/Action), SXO Gap Score (separate from SEO Health Score), Above-the-fold analysis, capture_screenshot.py Playwright automation, seo-visual agent, Viewport test matrix (desktop/laptop/tablet/mobile)

### Community 100 - "Graphify Pipeline Steps"
Cohesion: 0.29
Nodes (7): Wiki export (--wiki), --cluster-only self-contained rerun, Step 4: Build, Cluster, Analyze, Generate Outputs, Step 4.5: Graph Health Check, Step 5: Label Communities, Part C: Merge AST + Semantic Extraction, graph.json Shrink Guard (#479)

### Community 101 - "Opinion Callout Contract"
Cohesion: 0.29
Nodes (7): The Opinion callout is a UI contract, Las diez palancas, La idea central (movimiento, mecanismo, incentivo, consecuencia), La Opinion de Playbook: reencuadra, palanca, consecuencia, On a running political story, read the alignment - don't keep score, Checklist de publicacion (ten points), styles/tokens.css --mark-* tokens

### Community 102 - "Domain Detection Tests"
Cohesion: 0.43
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 103 - "Footer & Cookie Prefs"
Cohesion: 0.38
Nodes (4): REOPEN_COOKIE_NOTICE_EVENT, CookiePreferencesLink(), Footer(), SocialIcon()

### Community 104 - "Data Read Layer"
Cohesion: 0.29
Nodes (4): El muro se garantiza a nivel de query (getArticleMetaById), Read layer (lib/data/), getArchiveArticles(filters), getArticleMetaById()

### Community 105 - "Body Movements & Marks"
Cohesion: 0.29
Nodes (6): Los cuatro movimientos del cuerpo, Lead-ins en negrita por bloque (markLeadIns), ## La Opinión de Playbook con tres bullets, Promise block — tres preguntas, Convención "La opinión de Playbook" → callout, markOpinionCallout()

### Community 106 - "Duplicate Finder"
Cohesion: 0.52
Nodes (6): figures(), main(), score(), STOP, strip(), tokens()

### Community 107 - "Matador Report Updater"
Cohesion: 0.38
Nodes (6): markdownToTipTap(), parseInlineMarks(), dryRun, Input, main(), sql

### Community 109 - "GSAP Text Plugins"
Cohesion: 0.62
Nodes (4): CharSet(), emojiSafeSplit(), getText(), splitInnerHTML()

### Community 110 - "Scoring & Health Metrics"
Cohesion: 0.33
Nodes (6): Backlink Health Score (0-100), Confidence-Weighted Multi-Source Scoring, INSUFFICIENT DATA rule (no misleading scores), Geo-grid rank tracking and SoLV, Maps Health Score (0-100, 6 dimensions), Tier 0 weight redistribution

### Community 111 - "Taxonomy & Product Routing"
Cohesion: 0.33
Nodes (6): Deleted "playbook" source key, lib/taxonomy.ts, Pick the Most Specific Tag Rule, Product Routing (publication / source pair), Taxonomy Tags (tagsScope / tagsSport / tagsVertical), "Industry Shots" Retired; the Product Is Noticias

### Community 112 - "Image Sourcing & Credit"
Cohesion: 0.33
Nodes (6): The agency exclusion (Getty, iStock, AP), The broad search (cast a wide net across platforms), Cover image (imageUrl / imageCredit), When a photo carries no credit at all, Verify and credit (imageCredit), app/(public)/terminos/page.tsx

### Community 113 - "Skill Feedback Sync"
Cohesion: 0.40
Nodes (4): Capture feedback for next time, automatically, Syncing (SYNC_PATHS covers skills and playbook-editorial), Step 10: capture feedback for next time, sync-skill-feedback.sh script

### Community 114 - "Accessibility & Scroll Bugs"
Cohesion: 0.33
Nodes (6): Accessibility rules (CRITICAL), Nested <a> regression check, LeadStory(), ScrollReveal(), Arquitectura de componentes del sitio público, Bug de ScrollReveal tras navegación cliente-side

### Community 115 - "Money Trail & GSAP Imports"
Cohesion: 0.40
Nodes (5): MoneyTrail(), routePath(), lib/gsap — registra y re-exporta los plugins, Regla: importar solo desde @/lib/gsap, nunca vendor/gsap/esm/*, GSAP + plugins Club GreenSock auto-hospedados

### Community 117 - "Article Standards Backfill"
Cohesion: 0.47
Nodes (5): BackfillEntry, db, main(), unescapeUrl(), updateOne()

### Community 118 - "Language & Mechanical Rules"
Cohesion: 0.40
Nodes (5): Hard mechanical rules (em-dash ban, metric units, currency symbols, no raw HTML), La aritmetica: do the math only when it reveals the business, Language and tone: brief de negocios, formulas bajo vigilancia, Handling wire copy (pacing does not survive translation), A rewrite, not a paraphrase

### Community 119 - "Ticker Components"
Cohesion: 0.50
Nodes (3): Ticker(), TickerScramble(), TICKER_COUNT

### Community 120 - "Newsletter Form"
Cohesion: 0.70
Nodes (3): isValidEmail(), NewsletterForm(), newsletterActionUrl()

### Community 121 - "Analytics Integrations"
Cohesion: 0.40
Nodes (5): Tres integraciones de analítica (GA4, Vercel REST, beacon), lib/analytics-data.ts, lib/ga4.ts — GA4 Data API con JWT propio, lib/most-read.ts, lib/vercel-analytics.ts

### Community 122 - "ESLint Config"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 123 - "Next.js Config"
Cohesion: 0.40
Nodes (4): csp, legacyHtmlRedirects, nextConfig, securityHeaders

### Community 124 - "NextAuth Types"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 125 - "Evidence & Confidence Rules"
Cohesion: 0.50
Nodes (4): When the Sources Disagree (better-attributed figure wins), Four Evidence Levels That Never Blend, Discrete Confidence Rubric, graphify Honesty Rules

### Community 126 - "Data Validation Script"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 127 - "Homepage Ranking"
Cohesion: 0.67
Nodes (4): Homepage ranking (rankArticles/selectHero), rankScore con decaimiento por antigüedad (priority*1.5 - días), rankArticles(), selectHero()

### Community 128 - "Package Manifest"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 129 - "GSAP Observer"
Cohesion: 0.67
Nodes (3): _createClass(), _defineProperties(), Observer()

### Community 131 - "Error Boundaries"
Cohesion: 0.67
Nodes (3): app/global-error.tsx, app/(public)/error.tsx, Tres error boundaries anidados

### Community 133 - "Security Headers & CSP"
Cohesion: 0.67
Nodes (3): Security headers & CSP en next.config.ts, lib/safe-url.ts, next.config.ts headers() — CSP y cabeceras de seguridad

## Ambiguous Edges - Review These
- `SITE_URL` → `resolveSiteUrl https self-fetch gotcha`  [AMBIGUOUS]
  .claude/skills/verify/SKILL.md · relation: references
- `graphify skill trigger` → `seo-backlinks agent`  [AMBIGUOUS]
  .claude/CLAUDE.md · relation: conceptually_related_to
- `Routes Map (public, admin, API, SEO)` → `Google Search Console site verification file`  [AMBIGUOUS]
  public/google5d56d2b62c035791.html · relation: conceptually_related_to
- `Backlog del archivo Substack → playbook.la` → `El Matador, Inc. — reporte de caso de Playbook`  [AMBIGUOUS]
  docs/SUBSTACK-ARCHIVE-BACKLOG.md · relation: cites

## Knowledge Gaps
- **469 isolated node(s):** `metadata`, `metadata`, `metadata`, `Filters`, `FilterKey` (+464 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `SITE_URL` and `resolveSiteUrl https self-fetch gotcha`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `graphify skill trigger` and `seo-backlinks agent`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Routes Map (public, admin, API, SEO)` and `Google Search Console site verification file`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Backlog del archivo Substack → playbook.la` and `El Matador, Inc. — reporte de caso de Playbook`?**
  _Edge tagged AMBIGUOUS (relation: cites) - confidence is low._
- **Why does `articles` connect `Body HTML Cache & Dedupe` to `Auth & Database Schema`, `Reader Account & Export`, `Neon Postgres & Env Config`, `Dedupe Outcomes`, `Publish Pipeline Rules`, `Update Articles API`, `Departures Board Updater`, `Sourced Research Steps`, `Product Hubs & Figure Markup`, `Admin Article Entry State`, `Published Body Fixes`, `Article Standards Backfill`, `Noticias Hub & Paywall`, `Project Overview & Stack`, `Archive Cards & Topic Pills`, `La Lana Rebrand Fix`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `The dynamic element library (thirteen devices)` connect `La Lana Article Devices` to `Article Device Library (code)`, `Article Country Map`, `Sourced Research Steps`, `Product Hubs & Figure Markup`, `ArticleInput Fields`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Every visual treatment is a render-time transform` connect `Publish Pipeline Rules` to `La Lana Architecture`, `Opinion Callout Contract`, `Article Device Library (code)`, `Product Hubs & Figure Markup`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
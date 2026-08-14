# Graph Report - Playbook-portal  (2026-08-14)

## Corpus Check
- 348 files · ~541,085 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2110 nodes · 3944 edges · 175 communities (149 shown, 26 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a902b694`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analytics-data.ts
- metering.ts
- site-content.ts
- siteContent
- SplitText.js
- (public)/page.tsx
- article-devices.ts
- articles
- articulo/page.tsx
- sitemap.ts
- /graphify skill
- reader-auth.ts
- devDependencies
- compilerOptions
- product-hubs.ts
- dependencies
- AdminDashboard.tsx
- rank.ts
- Device Budget (readingTime + priority)
- publish-newsletter Decision Flow (steps 0-8)
- team.ts
- Getting Started with the task-observer meta-skill (aka "One skill to rule them all")
- google-sheets.ts
- archivo/page.tsx
- articles.ts
- DesignSystemGenerator
- seo-schema agent
- The Overlap Check
- The dynamic element library (thirteen devices)
- la-lana/page.tsx
- SiteMotion.tsx
- build-substack-backlog.mjs
- build-world-map.ts
- Single Source of Truth for Editorial Rules
- The Dynamic Element Library
- theme-store.ts
- TextField.tsx
- NewsGrid.tsx
- publish-newsletter skill
- core.py
- BM25
- design_system.py
- gsap.ts
- article-map.ts
- paths.js
- GEO Health Score (0-100, 5 dimensions)
- Presupuesto de dispositivos (piso, no techo)
- getSiteContent
- all.js
- Draggable.js
- render_page.py SPA-aware page fetcher
- article-sources.ts
- app/layout.tsx
- Pre-Delivery Checklist (canonical - the only one)
- Database Schema (nine Drizzle tables)
- tema/page.tsx
- Metering / paywall de lectores (3 gratis al mes)
- Playbook — publicación de negocio del deporte MX/LATAM
- scripts
- La Opinión de Playbook (three moves)
- ArticleInput field shape (20 fields)
- The rhythm: 2-3 sentences, 40-80 words, one thing per paragraph
- test_core.py
- escapeHtml
- MotionPathPlugin.js
- Shared vs own: six symlinks into .claude/playbook-editorial/
- (public)/layout.tsx
- schema.ts
- noticias/page.tsx
- splitFigure
- Fase 7 — infraestructura publicitaria y consentimiento
- HeaderNav.tsx
- gsap-core.js
- The overlap check (run before drafting)
- publish-newsletter.ts
- update-articles/route.ts
- Write layer — Server Actions (lib/actions/)
- update-lana-board.ts
- The four-movement brief (Noticias / Infinitas)
- update-article.ts
- TIPTAP_EXTENSIONS
- 0000_rainy_harry_osborn.sql
- Audit persistence contract (output_dir/findings + audit-data.json)
- La Lana del Deporte fixed architecture
- seo-performance agent
- StudioTab.tsx
- AdSlot.tsx
- AboutTab.tsx
- ArticlesTab.tsx
- 404/page.tsx
- site-url.ts
- UI/UX Quick Reference Rule Set (10 categories)
- search
- Task Observer — Continuous Skill Discovery & Improvement
- TODO 2 — retirar la clave source `industry-shots`
- Skill Authoring — taxonomy, licensing, confidentiality, editing rules
- Tier-Based Backlink Source Ladder (Tier 0-3)
- anon-cookie.ts
- seo-local agent
- seo-visual agent
- Step 4: Build, Cluster, Analyze, Generate Outputs
- La Opinion de Playbook: reencuadra, palanca, consecuencia
- detect_domain
- CookieNotice.tsx
- Read layer (lib/data/)
- docs/la-lana-article-spec.md
- find-duplicates.mjs
- Hubs de producto (carpetas internas)
- PathEditor.js
- ScrambleTextPlugin.js
- seo-maps agent
- Product Routing (publication / source pair)
- Cover image (imageUrl / imageCredit)
- sync-skill-feedback.sh
- LeadStory
- MoneyTrail
- GsapCore
- check-voice.mjs
- Language and tone: brief de negocios, formulas bajo vigilancia
- getAllArticles
- NewsletterForm.tsx
- Tres integraciones de analítica (GA4, Vercel REST, beacon)
- eslint.config.mjs
- next.config.ts
- next-auth.d.ts
- Four Evidence Levels That Never Blend
- validate_data.py
- rankArticles
- package.json
- ScrollTrigger.js
- admin/layout.tsx
- Tres error boundaries anidados
- [...slug]/page.tsx
- Security headers & CSP en next.config.ts
- smoke-test.mjs
- test-email-wall.mjs
- author field and byline rendering
- app/layout.tsx — root layout
- verify skill — run the site locally in a sandbox
- Related articles (shared-tag score + backfill)
- next-env.d.ts
- pg
- react-dom
- @tiptap/extension-image
- @tiptap/html
- zod
- vercel.json
- What gets removed, ever (only the newsletter's own chrome)
- Que se queda fuera (length does not demonstrate depth)
- Date it and name its source
- Report in six phases
- Look for asymmetries in how parties reacted
- { GET, POST }
- seed-jugadas.ts
- Every visual treatment is a render-time transform
- Schema validation checklist
- Environments, Activation Setup, and Handoff-Doc Mode
- Comprehensive Review (scheduled or fallback)
- getMostReadArticles
- GsapTimeline
- parseCifra
- @auth/drizzle-adapter
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `ArticuloPage()` - 27 edges
2. `articles` - 27 edges
3. `escapeHtml()` - 26 edges
4. `SiteContentData` - 24 edges
5. `Article` - 22 edges
6. `getSiteContent` - 21 edges
7. `gsap` - 21 edges
8. `stripTags()` - 20 edges
9. `getAllArticles` - 20 edges
10. `db` - 20 edges

## Surprising Connections (you probably didn't know these)
- `resolveSiteUrl https self-fetch gotcha` --references--> `SITE_URL`  [AMBIGUOUS]
  .claude/skills/verify/SKILL.md → lib/site-url.ts
- `Ad slots demostrativos (ad-wide/ad-rail/article-ad)` --conceptually_related_to--> `AdSlot()`  [INFERRED]
  docs/playbook-ux-02-trafico-interno-ads.html → components/ads/AdSlot.tsx
- `Animation rules (MEDIUM)` --conceptually_related_to--> `ArticleMotion()`  [INFERRED]
  .claude/skills/ui-ux-pro-max/references/quick-reference.md → components/article/ArticleMotion.tsx
- `Backlog del archivo Substack → playbook.la` --cites--> `El Matador, Inc. — reporte de caso de Playbook`  [AMBIGUOUS]
  docs/SUBSTACK-ARCHIVE-BACKLOG.md → public/assets/docs/el-matador-inc.pdf
- `Make.com webhook ingestion path` --references--> `POST()`  [EXTRACTED]
  docs/ENCYCLOPEDIA.md → app/api/update-articles/route.ts

## Import Cycles
- 3-file cycle: `components/ads/AdSenseProvider.tsx -> lib/adsense.ts -> components/ads/AdSlot.tsx -> components/ads/AdSenseProvider.tsx`

## Hyperedges (group relationships)
- **Sistema de identidad por producto (4 hubs + registro + skins de artículo)** — handoff_el_expediente, handoff_el_trago, handoff_la_sala_de_juntas, handoff_el_marcador, lib_product_hubs_product_hubs, handoff_la_lectura, styles_product_hubs_product_hubs_css [EXTRACTED 1.00]
- **Pipeline de publicación de La Lana (spec → skill → script → devices → board)** — docs_la_lana_article_spec, claude_skills_publish_newsletter_skill_publish_newsletter, scripts_publish_newsletter_main, lib_article_devices_apply_body_devices, scripts_update_lana_board_main [EXTRACTED 1.00]
- **Flujo de metering/paywall del lector anónimo** — docs_encyclopedia_metering_paywall, middleware_middleware, lib_anon_cookie_anon_cookie, lib_metering_resolve_entitlement, lib_db_schema_article_reads, lib_data_articles_get_article_meta_by_id, components_article_emailwall_emailwall [EXTRACTED 1.00]
- **Agents writing findings under the audit orchestrator persistence contract** — _claude_agents_seo_backlinks_seo_backlinks, _claude_agents_seo_cluster_seo_cluster, _claude_agents_seo_content_seo_content, _claude_agents_seo_drift_seo_drift, _claude_agents_seo_ecommerce_seo_ecommerce, _claude_agents_seo_geo_seo_geo, _claude_agents_seo_google_seo_google, _claude_agents_seo_local_seo_local, _claude_agents_seo_maps_seo_maps, _claude_agents_seo_performance_seo_performance, _claude_agents_seo_schema_seo_schema, _claude_agents_seo_sitemap_seo_sitemap, _claude_agents_seo_sxo_seo_sxo, _claude_agents_seo_technical_seo_technical, _claude_agents_seo_visual_seo_visual, _claude_agents_seo_backlinks_audit_persistence_contract [EXTRACTED 1.00]
- **graphify build pipeline: detect, AST, semantic, merge, cluster** — _claude_skills_graphify_skill_detect_files, _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_merge_ast_semantic, _claude_skills_graphify_skill_build_cluster_analyze, _claude_skills_graphify_skill_label_communities, _claude_skills_graphify_skill_manifest_and_cost [EXTRACTED 1.00]
- **Shared editorial rule files participate in the publish-newsletter decision flow** — _claude_skills_publish_newsletter_skill_decision_flow, _claude_playbook_editorial_overlap_check_overlap_check, _claude_playbook_editorial_format_tiers_three_website_tiers, _claude_playbook_editorial_voice_and_style_idea_central, _claude_playbook_editorial_dynamic_element_library_library, _claude_playbook_editorial_fields_and_taxonomy_articleinput, _claude_playbook_editorial_images_cover_image, _claude_playbook_editorial_voice_and_style_publication_checklist [EXTRACTED 1.00]
- **Publishing pipeline: source link to live article** — _claude_skills_publish_newsletter_references_ingestion_read_the_sources, _claude_skills_publish_newsletter_references_overlap_check_the_check, _claude_skills_publish_newsletter_references_fields_and_taxonomy_articleinput, _claude_skills_publish_newsletter_references_images_cover_image, _claude_skills_publish_newsletter_references_publishing_mechanics_publish_step, scripts_publish_newsletter, lib_db_schema_articles, _claude_skills_publish_newsletter_references_publishing_mechanics_report_back [EXTRACTED 1.00]
- **Render-time authoring contract: plain markdown conventions become design** — _claude_skills_publish_newsletter_references_format_tiers_render_time_transform, _claude_skills_publish_sourced_article_references_dynamic_element_library_collection, _claude_skills_publish_sourced_article_references_dynamic_element_library_automatic_elements, _claude_skills_publish_newsletter_references_format_tiers_opinion_callout_contract, _claude_skills_publish_newsletter_references_format_tiers_fuentes_credit_line, _claude_skills_publish_newsletter_references_voice_and_style_subheads_and_leadins, scripts_publish_newsletter [EXTRACTED 1.00]
- **Shared editorial tree: one copy, two skills, one masthead** — _claude_skills_publish_sourced_article_skill_shared_vs_own_symlinks, _claude_skills_publish_sourced_article_references__governance_single_source_of_truth, _claude_skills_publish_sourced_article_references__governance_truncation_incident, _claude_skills_publish_sourced_article_references__governance_convergence_check, _claude_skills_publish_sourced_article_references__governance_syncing, scripts_sync_skill_feedback, _claude_skills_publish_sourced_article_references_voice_and_style, _claude_skills_publish_newsletter_references_voice_and_style [EXTRACTED 1.00]
- **SPA-aware fetch pipeline (render_page.py v2.0.0) shared across agents** — _claude_agents_seo_backlinks_render_page, _claude_agents_seo_backlinks_url_safety_ssrf, _claude_agents_seo_content_extracted_text_scoring, _claude_agents_seo_ecommerce_client_side_schema_injection, _claude_agents_seo_schema_bounded_json_ld_artifact, _claude_agents_seo_drift_fetch_page_ssrf_guard [EXTRACTED 1.00]
- **The thirteen designed devices form the element library** — _claude_playbook_editorial_dynamic_element_library_cifra_clave, _claude_playbook_editorial_dynamic_element_library_jugada, _claude_playbook_editorial_dynamic_element_library_cronologia, _claude_playbook_editorial_dynamic_element_library_recibo, _claude_playbook_editorial_dynamic_element_library_ecuacion, _claude_playbook_editorial_dynamic_element_library_salto, _claude_playbook_editorial_dynamic_element_library_reparto, _claude_playbook_editorial_dynamic_element_library_alineacion, _claude_playbook_editorial_dynamic_element_library_cotizacion, _claude_playbook_editorial_dynamic_element_library_resultados, _claude_playbook_editorial_dynamic_element_library_duelo, _claude_playbook_editorial_dynamic_element_library_serie, _claude_playbook_editorial_dynamic_element_library_mapa, _claude_playbook_editorial_dynamic_element_library_library [EXTRACTED 1.00]
- **Tiered-capability scoring pattern with weight redistribution** — _claude_agents_seo_backlinks_tier_based_source_ladder, _claude_agents_seo_backlinks_confidence_weighted_scoring, _claude_agents_seo_google_credential_tiers, _claude_agents_seo_maps_tier_weight_redistribution, _claude_agents_seo_backlinks_insufficient_data_rule [INFERRED 0.85]

## Communities (175 total, 26 thin omitted)

### Community 0 - "analytics-data.ts"
Cohesion: 0.08
Nodes (44): AdminAnalyticsPage(), AdminDashboardPage(), AnalyticsView(), BarList(), formatNumber(), formatUpdatedAt(), KpiCard(), unavailableMessage() (+36 more)

### Community 1 - "metering.ts"
Cohesion: 0.25
Nodes (12): BOT_USER_AGENTS, isBotUserAgent(), anonReaders, countReadsThisMonth(), currentMonthKey(), Entitlement, getOrCreateAnonReaderId(), hasReadThisMonth() (+4 more)

### Community 2 - "site-content.ts"
Cohesion: 0.09
Nodes (26): ArrayEditor(), ArrayEditorProps, Badge, FooterTab(), Props, HubsTab(), Props, InfinitasTab() (+18 more)

### Community 3 - "siteContent"
Cohesion: 0.09
Nodes (22): contentRevisions, siteContent, db, deepReplace(), DRY_RUN, fixArticles(), fixSiteContent(), main() (+14 more)

### Community 4 - "SplitText.js"
Cohesion: 0.08
Nodes (23): _createClass(), _defineProperties(), ScrollSmoother(), constructor(), _context(), _defaultContext, _disallowInline(), _elements() (+15 more)

### Community 5 - "(public)/page.tsx"
Cohesion: 0.13
Nodes (22): metadata, PreviewFooter(), PreviewHeader(), Props, HomeChoreography(), TopicDirectory(), TOPICS, LazyEmbed() (+14 more)

### Community 6 - "article-devices.ts"
Cohesion: 0.06
Nodes (46): AgendaItem, ALL_DEVICES, Clock, ContractRow, Delta, Device, DEVICES, Duel (+38 more)

### Community 7 - "articles"
Cohesion: 0.07
Nodes (29): app/admin/set-password/page.tsx, Variables de entorno y degradación por integración, Known gaps: solo configuración de producción, Scripts de ops y migración, sourceUrl como identidad de dedup por artículo, Tech Stack (Next.js 15, Drizzle, Auth.js v5, TipTap, Blob), Detección de ediciones ya procesadas por substackUrl, Migración automática en cada deploy (vercel-build) (+21 more)

### Community 8 - "articulo/page.tsx"
Cohesion: 0.11
Nodes (25): The device budget (by readingTime, +1 at priority 5), ArticuloPage(), canonicalUrlFor(), generateMetadata(), looksLikeHtml(), paragraphsFrom(), pathFor(), PlainBlock (+17 more)

### Community 9 - "sitemap.ts"
Cohesion: 0.13
Nodes (21): app/admin/(protected)/dashboard/page.tsx, cdata(), dynamic, GET(), parseTopicFromQuery(), toRfc822(), xmlEscape(), app/(public)/archivo/page.tsx — archivo filtrable (+13 more)

### Community 10 - "/graphify skill"
Cohesion: 0.09
Nodes (28): /graphify add (URL ingest), --watch folder watcher, FalkorDB export and push, graphify MCP stdio server, Neo4j export and push, Token reduction benchmark, graphify clone (GitHub repos), graphify merge-graphs (cross-repo / monorepo) (+20 more)

### Community 11 - "reader-auth.ts"
Cohesion: 0.15
Nodes (16): dynamic, AccountSignInPrompt(), PasswordAuthForm(), LoginForm(), EmailWall(), loginAction(), LoginState, PasswordAuthState (+8 more)

### Community 12 - "devDependencies"
Cohesion: 0.07
Nodes (27): drizzle-kit, eslint, eslint-config-next, @eslint/eslintrc, @neondatabase/serverless, devDependencies, drizzle-kit, eslint (+19 more)

### Community 13 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 14 - "product-hubs.ts"
Cohesion: 0.13
Nodes (20): El Marcador (Infinitas hub scoreboard) - flag, don't fix, The product hubs read the body, ProductHtml(), RelatedCard(), CIFRA_HTML_RE, CIFRA_TEXT_PREFIX, CifraFigure, extractMoneyTrailFromHtml() (+12 more)

### Community 15 - "dependencies"
Cohesion: 0.08
Nodes (25): bcryptjs, chart.js, drizzle-orm, next, next-auth, dependencies, bcryptjs, chart.js (+17 more)

### Community 16 - "AdminDashboard.tsx"
Cohesion: 0.11
Nodes (32): AdminDashboard(), DEFAULT_ORDER, GROUPS, LABELS, Props, SAVELESS_TABS, Status, TAB_DEFS (+24 more)

### Community 17 - "rank.ts"
Cohesion: 0.24
Nodes (16): ArticlesTab(), HomeSidebar(), NewsGrid(), StillMattersSection(), Módulo de portada "Lo que sigue importando", getArchiveArticles(), getArticleById, extractCifraFromBody() (+8 more)

### Community 18 - "Device Budget (readingTime + priority)"
Cohesion: 0.10
Nodes (24): Automatic Elements (nothing to author), Device Budget (readingTime + priority), Jugada (connection strip device), lib/article-devices.ts, Device Per-Run Checklist, Rules of Device Placement, Breaking News Priority Override, featured (Destacado) flag (+16 more)

### Community 19 - "publish-newsletter Decision Flow (steps 0-8)"
Cohesion: 0.13
Nodes (23): Date It and Name Its Source, One Rule, One Home, Place Before You Create (file ownership table), ArticleInput Field Shape, date / dateFormatted fields, Análisis tier, Flash tier (80-150 words), Noticia Playbook tier (+15 more)

### Community 20 - "team.ts"
Cohesion: 0.12
Nodes (23): dynamic, metadata, Props, SetPasswordForm(), dateFmt, dateTimeFmt, Props, TeamTab() (+15 more)

### Community 21 - "Getting Started with the task-observer meta-skill (aka "One skill to rule them all")"
Cohesion: 0.12
Nodes (15): Checking in on observations, Checking whether the skill has loaded, Dual-layer activation, Getting kickstarted, Getting Started with the task-observer meta-skill (aka "One skill to rule them all"), How the skill works during a session, Making the skill your own, Open-source vs internal skills (+7 more)

### Community 22 - "google-sheets.ts"
Cohesion: 0.17
Nodes (16): constantTimeEqual(), GET(), dateFmt, ReadersTab(), getReadersData(), requireEditor(), getAllReaders(), ReaderRow (+8 more)

### Community 23 - "archivo/page.tsx"
Cohesion: 0.12
Nodes (21): ArchivoPage(), FILTER_TIERS, filterHref(), FilterKey, Filters, groupRiver(), metadata, monthKeyOf() (+13 more)

### Community 24 - "articles.ts"
Cohesion: 0.15
Nodes (17): AutorPage(), generateMetadata(), Props, ArticleTopics(), TIER_COLUMN, Heading, NewsRow(), TagPillRow() (+9 more)

### Community 25 - "DesignSystemGenerator"
Cohesion: 0.14
Nodes (10): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV. (+2 more)

### Community 26 - "seo-schema agent"
Cohesion: 0.12
Nodes (18): Keyword cannibalization check, cluster-plan.json output artifact, Hub-and-spoke cluster architecture, Internal link matrix (mandatory/recommended/optional), Keyword intent classification, seo-cluster agent, SERP overlap methodology and thresholds, E-E-A-T scoring model (+10 more)

### Community 27 - "The Overlap Check"
Cohesion: 0.12
Nodes (19): sourceUrl Unique Dedupe Key, substackUrl field (differs by funnel), If It Was Already Published Twice (48-hour rule), scripts/find-duplicates.mjs, Outcome A: Same event, nothing new, do not publish, Outcome C: New development, new article linking back, Outcome D: Different product, different thesis, cross-linked, The Overlap Check (+11 more)

### Community 28 - "The dynamic element library (thirteen devices)"
Cohesion: 0.21
Nodes (16): Four evidence levels that never blend, Alineacion: the lineup chips, The dynamic element library (thirteen devices), Cotizacion: the market tile, Cronologia: the drawn timeline, Duelo: the butterfly chart, Mapa: real geography, Per-run device checklist (+8 more)

### Community 29 - "la-lana/page.tsx"
Cohesion: 0.27
Nodes (7): boardKey(), metadata, BoardRow, DeparturesBoard(), statusBlinks(), CabinetFolder, LanaArchiveCabinet()

### Community 30 - "SiteMotion.tsx"
Cohesion: 0.24
Nodes (16): ArticleMotion(), COUNTUP_SELECTOR, HIGHLIGHT_SELECTOR, LEAD_PHOTO_SELECTOR, SiteMotion(), STAGGER_SELECTOR, SWEEP_SELECTOR, countUp() (+8 more)

### Community 31 - "build-substack-backlog.mjs"
Cohesion: 0.22
Nodes (18): archive(), bodyHtml(), CACHE, cached(), digestItems(), FOCUS, getJSON(), headings() (+10 more)

### Community 32 - "build-world-map.ts"
Cohesion: 0.13
Nodes (17): ASSOCIATION_POINTS, centroidOf(), CFU, CONMEBOL, EXTRA_POINTS, Feature, FRAME_SIZES, main() (+9 more)

### Community 33 - "Single Source of Truth for Editorial Rules"
Cohesion: 0.11
Nodes (18): Convergence Check (two skills, zero divergence), Single Source of Truth for Editorial Rules, Six-Phase Skill Work Report, 2026-08-11 Monolithic SKILL.md Truncation Incident, scripts/sync-skill-feedback.sh SYNC_PATHS, Shared Device Declaration Syntax, Devices Fail Loud, Not Silent, The Fuentes: Credit Line (+10 more)

### Community 34 - "The Dynamic Element Library"
Cohesion: 0.16
Nodes (18): Alineación (lineup chips device), Cifra clave (pull-figure device), Cotización (market tile device), Cronología (drawn timeline device), Duelo (butterfly chart device), La cifra del día (homepage sidebar reads Cifra clave), lib/article-map.ts, lib/product-hubs.ts (+10 more)

### Community 35 - "theme-store.ts"
Cohesion: 0.19
Nodes (12): dynamic, AdminTopbarNav(), applyThemeColor(), isDarkActive(), listeners, notify(), storedTheme(), subscribeTheme() (+4 more)

### Community 36 - "TextField.tsx"
Cohesion: 0.13
Nodes (15): FormValidationContext, FormValidationHandle, FormValidationProvider, Registration, useFormValidationRegistrar(), Validator, isValidUrlValue(), NumberField() (+7 more)

### Community 37 - "NewsGrid.tsx"
Cohesion: 0.18
Nodes (13): publication/source product routing pair, The product is called Noticias ('Industry Shots' retired), Fixed product routing: Noticias / industry-shots, FILTERS, NEWS_SOURCES, docs/TODO.md, KNOWN_SOURCES, LEAD_COUNT (+5 more)

### Community 38 - "publish-newsletter skill"
Cohesion: 0.20
Nodes (12): publish-newsletter skill, publish-sourced-article skill, components/admin/studio-prompts.ts, Claude Code skills del proyecto, Make.com webhook ingestion path, Taxonomía cerrada de tres niveles, TODO 1 — clasificación de noticias, Fase 8 — invitaciones de editores + Studio (+4 more)

### Community 39 - "core.py"
Cohesion: 0.17
Nodes (14): _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), Load CSV and return list of dicts, with mtime-based caching., Fitted BM25 index for this file+columns, with mtime-based caching., Core search function using BM25. Returns (results, bm25_or_none)., Nearest known vocabulary terms for a query that returned 0 hits, so the caller… (+6 more)

### Community 40 - "BM25"
Cohesion: 0.15
Nodes (9): BM25, _normalize(), Apply synonym substitution before tokenizing., BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes. (+1 more)

### Community 41 - "design_system.py"
Cohesion: 0.15
Nodes (16): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), Format a page-specific override file with intelligent AI-generated content., Generate intelligent overrides based on page type using layered search. Uses… (+8 more)

### Community 42 - "gsap.ts"
Cohesion: 0.22
Nodes (4): gsap, GsapTween, ScrollTriggerInstance, ScrollTriggerStatic

### Community 43 - "article-map.ts"
Cohesion: 0.15
Nodes (17): ArticleMap, buildMap(), codesFrom(), COUNTRIES, CountryEntry, fold(), FRAME_ALIASES, FRAMES (+9 more)

### Community 44 - "paths.js"
Cohesion: 0.24
Nodes (16): cacheRawPathMeasurements(), copyRawPath(), getClosestData(), getClosestProgressOnBezier(), getPositionOnPath(), getProgressData(), getRotationAtBezierT(), getRotationAtProgress() (+8 more)

### Community 45 - "GEO Health Score (0-100, 5 dimensions)"
Cohesion: 0.25
Nodes (8): AI citation readiness score, AI Crawler Access (GPTBot, ClaudeBot, PerplexityBot, CCBot), Brand mention correlation with AI citations, Passage citability signals (134-167 word passages), GEO Health Score (0-100, 5 dimensions), Deprecated schema types (HowTo, SpecialAnnouncement, CourseInfo), FAQPage rich-result retirement (May 7, 2026), AI Crawler Management section (crawler tokens, robots.txt)

### Community 46 - "Presupuesto de dispositivos (piso, no techo)"
Cohesion: 0.31
Nodes (9): Presupuesto de dispositivos (piso, no techo), Presupuesto de dispositivos por readingTime/priority, La colección de dispositivos de artículo, applyBodyDevices(), Cotización device, Cronología device, deviceBudgetFor(), Recibo device (+1 more)

### Community 47 - "getSiteContent"
Cohesion: 0.16
Nodes (19): FutbolBusinessReviewHubPage(), metadata, InfinitasHubPage(), metadata, toScoreboardMetric(), LaLanaHubPage(), NoticiasHubPage(), HomePage() (+11 more)

### Community 49 - "Draggable.js"
Cohesion: 0.18
Nodes (5): _assertThisInitialized(), Draggable(), NOTE: "force" is actually the "time" when this method gets called by the…, getGlobalMatrix(), Matrix2D()

### Community 50 - "render_page.py SPA-aware page fetcher"
Cohesion: 0.29
Nodes (7): render_page.py SPA-aware page fetcher, url_safety.py SSRF and DNS-rebinding protection, fetch_page.py private/loopback IP validation, FLOW framework (Find/Leverage/Optimize/Win/Local), Context-budget prompt selection (max 5, never load all optimize prompts), seo-flow agent, Untrusted WebFetch content policy

### Community 51 - "article-sources.ts"
Cohesion: 0.21
Nodes (13): The Fuentes: credit line, Find each primary co-issuer's own posting, ArticleSources(), ArticleSource, collectAnchors(), decodeEntities(), extractSourcesFromHtml(), extractSourcesFromParagraphs() (+5 more)

### Community 52 - "app/layout.tsx"
Cohesion: 0.19
Nodes (12): The 16:10 crop check (no cropped-looking covers), anton, inter, metadata, RootLayout(), AnalyticsClient(), makeBeforeSend(), getFundingChoicesPublisherId() (+4 more)

### Community 53 - "Pre-Delivery Checklist (canonical - the only one)"
Cohesion: 0.19
Nodes (15): Icons & visual elements rules, Interaction (app) rules, Layout & spacing rules (safe areas, 4/8dp rhythm), Light/dark mode contrast rules, Pre-Delivery Checklist (canonical - the only one), Scope notice: native/mobile app UI only, ui-ux-pro-max scripts/search.py, Step 2c: design dials (variance, motion, density) (+7 more)

### Community 54 - "Database Schema (nine Drizzle tables)"
Cohesion: 0.17
Nodes (14): app/admin/(protected)/layout.tsx — guard de editor, POST(), auth.ts — instancia única de Auth.js, Un Auth.js, dos flujos de identidad (lectores/editores), Database Schema (nine Drizzle tables), anonReaders table, contentRevisions table, editors (+6 more)

### Community 55 - "tema/page.tsx"
Cohesion: 0.20
Nodes (12): generateMetadata(), Props, resolveTopic(), TemaPage(), TIER_LABELS, getArticlesByTag(), canonicalizeTag(), TaxonomyTier (+4 more)

### Community 56 - "Metering / paywall de lectores (3 gratis al mes)"
Cohesion: 0.17
Nodes (12): app/(public)/articulo/page.tsx — página de artículo, Metering / paywall de lectores (3 gratis al mes), Regla: la presentación del cuerpo se decide en render, no al publicar, Convención de autoría "Cifra clave:", La Lectura — un esqueleto, cuatro pieles de artículo, lib/anon-cookie.ts — HMAC-SHA256 de pb_anon, lib/article-devices.ts, lib/bots.ts — 14 firmas de crawlers (+4 more)

### Community 57 - "Playbook — publicación de negocio del deporte MX/LATAM"
Cohesion: 0.13
Nodes (15): graphify knowledge-graph workflow convention, Playbook — publicación de negocio del deporte MX/LATAM, Repository Map, Foto del destacado — 16:10, Logo del header — única imagen con variación por breakpoint, Referencia de formatos de imagen, Campos obligatorios del artículo La Lana, Guest bylines con markdown inline en `author` (+7 more)

### Community 58 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:generate, db:migrate, db:reset-editor-password, dev, fix:lana-rebrand, fix:newsletter-success-copy (+7 more)

### Community 59 - "La Opinión de Playbook (three moves)"
Cohesion: 0.15
Nodes (14): Ecuación (display math device), Definitional Antithesis (TFBR thesis move), The Four-Movement Brief (Noticias / Infinitas), The Futbol Business Review format, The Uniformity Contract (four products, one masthead), Las diez palancas, Fórmulas bajo vigilancia, La aritmética (no arithmetic showmanship) (+6 more)

### Community 60 - "ArticleInput field shape (20 fields)"
Cohesion: 0.24
Nodes (11): ArticleInput field shape (20 fields), author / mostrarAutor byline rules, Breaking News override (priority 5 + featured), featured (Destacado) flag, priority (Importancia) 1-5 scale, substackUrl (funnel-specific), Publish: JSON array through publish-newsletter.ts, Step 8: human review before anything touches the database (+3 more)

### Community 61 - "The rhythm: 2-3 sentences, 40-80 words, one thing per paragraph"
Cohesion: 0.18
Nodes (14): publish-newsletter references/format-tiers.md, Definitional antithesis (TFBR thesis move), The Futbol Business Review (ghostwritten for Interticket), The three website tiers (Flash / Noticia Playbook / Analisis), The uniformity contract (four products, one masthead), Features vs briefs (readingTime 2 vs 4), TFBR: translate the argument, not the sentences, check-voice.mjs is a mirror, not a gate (+6 more)

### Community 62 - "test_core.py"
Cohesion: 0.18
Nodes (11): format_markdown(), format_master_md(), generate_design_system(), persist_design_system(), Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,…, Slugify a name into a single safe path segment. Only [a-z0-9_-] survives; every…, Persist design system to design-system/<project>/ folder using Master +… (+3 more)

### Community 63 - "escapeHtml"
Cohesion: 0.16
Nodes (22): buildAgenda(), buildClock(), buildContract(), buildDelta(), buildDuel(), buildEquation(), buildLineup(), buildMeter() (+14 more)

### Community 64 - "MotionPathPlugin.js"
Cohesion: 0.24
Nodes (9): arcToSegment(), convertToPath(), flatPointsToSegment(), getRawPath(), pointsToSegment(), rawPathToString(), reverseSegment(), stringToRawPath() (+1 more)

### Community 65 - "Shared vs own: six symlinks into .claude/playbook-editorial/"
Cohesion: 0.21
Nodes (13): publish-newsletter references/fields-and-taxonomy.md, publish-newsletter references/images.md, publish-newsletter references/overlap-check.md, publish-newsletter references/voice-and-style.md, One rule, one home (cross-reference, never copy), Place before you create (file ownership table), Single source of truth (never fork a rule into a skill-local file), Why the shared tree exists (2026-08-11 truncation incident) (+5 more)

### Community 66 - "(public)/layout.tsx"
Cohesion: 0.19
Nodes (11): dynamic, GET(), dynamic, PublicLayout(), AdSenseContext, AdSenseProvider(), AdSlotName, HeaderScrollEffect() (+3 more)

### Community 67 - "schema.ts"
Cohesion: 0.11
Nodes (23): Neon HTTP driver, not the pg Pool, POSTGRES_URL env var (production Neon DB), Requirements: POSTGRES_URL and the Neon HTTP driver, GET(), ALLOWED_CONTENT_TYPES, CuentaPage(), dateFormatter, metadata (+15 more)

### Community 68 - "noticias/page.tsx"
Cohesion: 0.21
Nodes (11): articleHref(), groupRiver(), Measure(), metadata, NewsBlock, tierFor(), When(), MINUTES_PER_SHOT (+3 more)

### Community 69 - "splitFigure"
Cohesion: 0.35
Nodes (9): DailyFigure(), isCountable(), magnitudeOf(), parseDelta(), FIGURE_INLINE_RE, FIGURE_TEXT_RE, formatNumeric(), parseNumeric() (+1 more)

### Community 70 - "Fase 7 — infraestructura publicitaria y consentimiento"
Cohesion: 0.29
Nodes (10): StoryCard.tsx, Vocabulario CSS analysis-grid / base-grid del v23, Prototipo v23 — Playbook medio de consulta, Prototipo v24 — Playbook medio de consulta (iteración más reciente), Ad slots demostrativos (ad-wide/ad-rail/article-ad), Playbook UX 02 — tráfico interno y ads, TODO 3 — archivos stale y peso muerto del repo, Ad slot infrastructure (6 posiciones) (+2 more)

### Community 71 - "HeaderNav.tsx"
Cohesion: 0.36
Nodes (7): HeaderNav(), sectionHref(), matches(), normalize(), SearchableArticle, SearchBox(), NavLink

### Community 72 - "gsap-core.js"
Cohesion: 0.23
Nodes (6): _assertThisInitialized(), PropTween(), TODO: repeat: Infinity on a timeline's children must flag that timeline…, NOTE: wrap() CANNOT be an arrow function! A very odd compiling bug causes…, Timeline(), Tween()

### Community 73 - "The overlap check (run before drafting)"
Cohesion: 0.24
Nodes (10): sourceUrl unique dedupe key, If it was already published twice (48-hour rule), Outcome A: same event, nothing new - don't publish, Outcome C: new development - a new article that links back, Outcome D: different product, different thesis - both run cross-linked, Reporting overlap outcomes (a skipped item is work done), The overlap check (run before drafting), Report back (title, id, live URL, unmet gaps) (+2 more)

### Community 74 - "publish-newsletter.ts"
Cohesion: 0.21
Nodes (13): slugify(), formatTagIssues(), validateTags(), BackfillEntry, db, main(), unescapeUrl(), updateOne() (+5 more)

### Community 75 - "update-articles/route.ts"
Cohesion: 0.29
Nodes (11): constantTimeEqual(), decodeEntities(), detectPublication(), escapeRegExp(), getClientIp(), inferTags(), normalizeText(), POST() (+3 more)

### Community 76 - "Write layer — Server Actions (lib/actions/)"
Cohesion: 0.20
Nodes (11): Concurrencia optimista con date_trunc('milliseconds'), Rate limiting en memoria, no distribuido, Write layer — Server Actions (lib/actions/), archiveArticle(id) — soft delete, createArticle(input), saveArticle(id, input, expectedUpdatedAt), saveSiteContent(data, expectedVersion), loginAction() (+3 more)

### Community 77 - "update-lana-board.ts"
Cohesion: 0.21
Nodes (11): Pre-flight en un bloque, CASE_OPEN_DAYS, buildRow(), CaseRow, db, DRY_RUN, IncomingConnection, main() (+3 more)

### Community 78 - "The four-movement brief (Noticias / Infinitas)"
Cohesion: 0.25
Nodes (11): date / dateFormatted, The four-movement brief (Noticias / Infinitas), In-body images (differs by funnel), Step 2: independent research (mandatory for Noticias/Infinitas), Step 1: read the sources (four WebFetch passes), The regional connection (Mexico / LATAM) - research it, don't infer it, Step 2: cross-reference other coverage (mandatory), The ten-step decision flow (+3 more)

### Community 79 - "update-article.ts"
Cohesion: 0.21
Nodes (12): Outcome B: source adds facts - upgrade the existing article, When the sources disagree (better-attributed figure wins), Fixing a published body via update-article.ts, Fixing a published body (sourced funnel), bodyHtml como cache server-rendered de bodyJson, body_html es cache de body_json — no editar a mano, COLUMNS, db (+4 more)

### Community 80 - "TIPTAP_EXTENSIONS"
Cohesion: 0.24
Nodes (8): Props, TipTapEditor(), Admin CMS (AdminDashboard + 12 pestañas), TIPTAP_EXTENSIONS, dryRun, main(), nodeText(), sql

### Community 81 - "0000_rainy_harry_osborn.sql"
Cohesion: 0.18
Nodes (10): "account", "anon_readers", "article_reads", "articles", "content_revisions", "editors", "media", "site_content" (+2 more)

### Community 82 - "Audit persistence contract (output_dir/findings + audit-data.json)"
Cohesion: 0.15
Nodes (17): Audit persistence contract (output_dir/findings + audit-data.json), seo-backlinks agent, validate_backlink_report.py pre-delivery validator, AI Content Assessment (Sept 2025 QRG), Content word-count minimums by page type, Helpful Content System merged into core (March 2024), seo-content agent, Baseline / Compare / History drift workflow (+9 more)

### Community 83 - "La Lana del Deporte fixed architecture"
Cohesion: 0.22
Nodes (10): The departures board (la-lana connections), The hero figure (defining number verbatim in title/excerpt), La Lana del Deporte fixed architecture, ## La Opinion de Playbook - exactly three bullets, The promise block (verbatim + three reader questions), La Lana ingestion note (no outside research), After a la-lana article: the departures board run steps, Titles: protagonista + movimiento + dato (+2 more)

### Community 84 - "seo-performance agent"
Cohesion: 0.25
Nodes (9): Core Web Vitals thresholds (LCP/INP/CLS), Google credential tiers (API key / service account / GA4), GSC totals_complete rule (do not sum anonymized rows), INP replaced FID (March 12, 2024), seo-google agent, Core Web Vitals metrics and 75th percentile rule, Prefer CrUX field data over Lighthouse lab data, Lighthouse 13.x insight-based audits and PSI API v5 (+1 more)

### Community 85 - "StudioTab.tsx"
Cohesion: 0.31
Nodes (4): STUDIO_SECTIONS, StudioPrompt, StudioSection, StudioTab()

### Community 86 - "AdSlot.tsx"
Cohesion: 0.24
Nodes (11): useAdSenseConfig(), AdSlot(), CookieNotice(), Capa de consentimiento playbook_consent_v1, lib/consent.ts, CONSENT_EVENT, CONSENT_KEY, ConsentState (+3 more)

### Community 87 - "AboutTab.tsx"
Cohesion: 0.15
Nodes (12): Option, SelectField(), SelectFieldProps, AboutTab(), Props, OpinionTab(), Props, ProductsTab() (+4 more)

### Community 88 - "ArticlesTab.tsx"
Cohesion: 0.12
Nodes (18): tagsScope / tagsSport / tagsVertical taxonomy, CheckboxGroupField(), CheckboxGroupFieldProps, StarPickerField(), StarPickerFieldProps, COVERAGE_TIERS, Props, DEFAULT_TOPICS (+10 more)

### Community 89 - "404/page.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundContent()

### Community 90 - "site-url.ts"
Cohesion: 0.21
Nodes (4): metadata, metadata, FREE_ARTICLES_PER_MONTH, SITE_URL

### Community 91 - "UI/UX Quick Reference Rule Set (10 categories)"
Cohesion: 0.29
Nodes (7): Animation rules (MEDIUM), Navigation Patterns (HIGH), Performance rules (HIGH), UI/UX Quick Reference Rule Set (10 categories), Touch & Interaction rules (CRITICAL), ShareRow(), Rediseño del share row (acciones circulares 44px)

### Community 92 - "search"
Cohesion: 0.36
Nodes (4): Main search function with auto-domain detection, search(), Known query -> expected top-domain sanity checks (not exact-row pinning, since…, TestSearchDomains

### Community 93 - "Task Observer — Continuous Skill Discovery & Improvement"
Cohesion: 0.14
Nodes (13): Acting on Observations, Archival on Write, How to Log, Log Structure, Quick Reference, Reference files — load on demand, not up front, Referencing Observations, Session Start Protocol (+5 more)

### Community 94 - "TODO 2 — retirar la clave source `industry-shots`"
Cohesion: 0.25
Nodes (8): app/(public)/noticias/page.tsx — hub Noticias, Fuentes editoriales (Noticias, La Lana, Infinitas, Opinión), Backlog del archivo Substack → playbook.la, Orden sugerido de ataque (6 lotes), Contenido perecedero vs. permanente, Inventario por serie (13 series, P1/P2), TODO 2 — retirar la clave source `industry-shots`, lib/constants.ts — LEAD_COUNT, FREE_ARTICLES_PER_MONTH, KNOWN_SOURCES

### Community 95 - "Skill Authoring — taxonomy, licensing, confidentiality, editing rules"
Cohesion: 0.17
Nodes (11): Author Attribution Template, Confidentiality layers, Editing skills — always start from the live file, Lean Content, Licensing, New skills, Principle Propagation, Skill Authoring — taxonomy, licensing, confidentiality, editing rules (+3 more)

### Community 96 - "Tier-Based Backlink Source Ladder (Tier 0-3)"
Cohesion: 0.17
Nodes (12): Bing Webmaster source (bing_webmaster.py), Common Crawl web graph source (commoncrawl_graph.py), Moz API source (moz_api.py), Tier-Based Backlink Source Ladder (Tier 0-3), API credit efficiency rules (bulk endpoints, no re-fetch), claude-seo output conventions (tables, XX/100, priority ladder), Fail-closed MCP policy (never bypass with raw HTTP), seo-dataforseo agent (+4 more)

### Community 97 - "anon-cookie.ts"
Cohesion: 0.29
Nodes (10): Diferir la validación de env vars más allá del import, Notable Engineering Lessons, Middleware en runtime Node.js (escape del bundler Edge), ANON_COOKIE_NAME, getKey(), signAnonId(), toBase64Url(), verifyAnonCookie() (+2 more)

### Community 98 - "seo-local agent"
Cohesion: 0.29
Nodes (7): Business type detection (brick-and-mortar / SAB / hybrid), Local SEO Score (0-100, 6 dimensions), NAP consistency extraction and discrepancy flagging, seo-local agent, Whitespark 2026 critical local ranking factors, Doorway page penalty risk, Location page quality gates (30+ warning, 50+ hard stop)

### Community 99 - "seo-visual agent"
Cohesion: 0.29
Nodes (7): Common LCP / INP / CLS bottlenecks, Persona scoring (Relevance/Clarity/Trust/Action), SXO Gap Score (separate from SEO Health Score), Above-the-fold analysis, capture_screenshot.py Playwright automation, seo-visual agent, Viewport test matrix (desktop/laptop/tablet/mobile)

### Community 100 - "Step 4: Build, Cluster, Analyze, Generate Outputs"
Cohesion: 0.29
Nodes (7): Wiki export (--wiki), --cluster-only self-contained rerun, Step 4: Build, Cluster, Analyze, Generate Outputs, Step 4.5: Graph Health Check, Step 5: Label Communities, Part C: Merge AST + Semantic Extraction, graph.json Shrink Guard (#479)

### Community 101 - "La Opinion de Playbook: reencuadra, palanca, consecuencia"
Cohesion: 0.40
Nodes (5): Las diez palancas, La idea central (movimiento, mecanismo, incentivo, consecuencia), La Opinion de Playbook: reencuadra, palanca, consecuencia, On a running political story, read the alignment - don't keep score, Checklist de publicacion (ten points)

### Community 102 - "detect_domain"
Cohesion: 0.43
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 103 - "CookieNotice.tsx"
Cohesion: 0.36
Nodes (4): REOPEN_COOKIE_NOTICE_EVENT, CookiePreferencesLink(), Footer(), SocialIcon()

### Community 104 - "Read layer (lib/data/)"
Cohesion: 0.29
Nodes (4): El muro se garantiza a nivel de query (getArticleMetaById), Read layer (lib/data/), getArchiveArticles(filters), getArticleMetaById()

### Community 105 - "docs/la-lana-article-spec.md"
Cohesion: 0.20
Nodes (9): docs/la-lana-article-spec.md, Tablero de salidas: empujar conexiones tras publicar, Los cuatro movimientos del cuerpo, Lead-ins en negrita por bloque (markLeadIns), ## La Opinión de Playbook con tres bullets, Promise block — tres preguntas, El Expediente — hub /la-lana, Convención "La opinión de Playbook" → callout (+1 more)

### Community 106 - "find-duplicates.mjs"
Cohesion: 0.52
Nodes (6): figures(), main(), score(), STOP, strip(), tokens()

### Community 107 - "Hubs de producto (carpetas internas)"
Cohesion: 0.18
Nodes (10): Mark, MARKS, ShotProgress(), El Marcador — hub /infinitas, El Trago — hub /noticias (ex /industry-shots), Hubs de producto (carpetas internas), Convención de autoría "Ruta del dinero:", PRODUCT_HUBS (+2 more)

### Community 109 - "ScrambleTextPlugin.js"
Cohesion: 0.62
Nodes (4): CharSet(), emojiSafeSplit(), getText(), splitInnerHTML()

### Community 110 - "seo-maps agent"
Cohesion: 0.20
Nodes (10): Backlink Health Score (0-100), Confidence-Weighted Multi-Source Scoring, INSUFFICIENT DATA rule (no misleading scores), llms.txt and RSL 1.0 licensing check, seo-geo agent, Free geo APIs (Overpass, Geoapify, Nominatim), Geo-grid rank tracking and SoLV, Maps Health Score (0-100, 6 dimensions) (+2 more)

### Community 111 - "Product Routing (publication / source pair)"
Cohesion: 0.33
Nodes (6): Deleted "playbook" source key, lib/taxonomy.ts, Pick the Most Specific Tag Rule, Product Routing (publication / source pair), Taxonomy Tags (tagsScope / tagsSport / tagsVertical), "Industry Shots" Retired; the Product Is Noticias

### Community 112 - "Cover image (imageUrl / imageCredit)"
Cohesion: 0.33
Nodes (6): The agency exclusion (Getty, iStock, AP), The broad search (cast a wide net across platforms), Cover image (imageUrl / imageCredit), When a photo carries no credit at all, Verify and credit (imageCredit), app/(public)/terminos/page.tsx

### Community 113 - "sync-skill-feedback.sh"
Cohesion: 0.40
Nodes (4): Capture feedback for next time, automatically, Syncing (SYNC_PATHS covers skills and playbook-editorial), Step 10: capture feedback for next time, sync-skill-feedback.sh script

### Community 114 - "LeadStory"
Cohesion: 0.25
Nodes (8): app/(public)/page.tsx — homepage, Accessibility rules (CRITICAL), Nested <a> regression check, LeadStory(), ScrollReveal(), Arquitectura de componentes del sitio público, La Portada — coreografía de homepage dentro de las bardas, Bug de ScrollReveal tras navegación cliente-side

### Community 115 - "MoneyTrail"
Cohesion: 0.40
Nodes (5): MoneyTrail(), routePath(), lib/gsap — registra y re-exporta los plugins, Regla: importar solo desde @/lib/gsap, nunca vendor/gsap/esm/*, GSAP + plugins Club GreenSock auto-hospedados

### Community 117 - "check-voice.mjs"
Cohesion: 0.31
Nodes (9): Every change ships with a convergence check, analyse(), countNegatives(), main(), median(), NEGATIVE_PARALLELISM, pct(), TARGETS (+1 more)

### Community 118 - "Language and tone: brief de negocios, formulas bajo vigilancia"
Cohesion: 0.33
Nodes (6): Hard mechanical rules (em-dash ban, metric units, currency symbols, no raw HTML), La aritmetica: do the math only when it reveals the business, Language and tone: brief de negocios, formulas bajo vigilancia, Ecuacion: display math, Handling wire copy (pacing does not survive translation), A rewrite, not a paraphrase

### Community 119 - "getAllArticles"
Cohesion: 0.29
Nodes (6): BrandLink(), Header(), Ticker(), TickerScramble(), TICKER_COUNT, getAllArticles

### Community 120 - "NewsletterForm.tsx"
Cohesion: 0.70
Nodes (3): isValidEmail(), NewsletterForm(), newsletterActionUrl()

### Community 121 - "Tres integraciones de analítica (GA4, Vercel REST, beacon)"
Cohesion: 0.29
Nodes (6): GoogleAnalytics(), Tres integraciones de analítica (GA4, Vercel REST, beacon), lib/analytics-data.ts, lib/ga4.ts — GA4 Data API con JWT propio, lib/most-read.ts, lib/vercel-analytics.ts

### Community 122 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 123 - "next.config.ts"
Cohesion: 0.40
Nodes (4): csp, legacyHtmlRedirects, nextConfig, securityHeaders

### Community 124 - "next-auth.d.ts"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 125 - "Four Evidence Levels That Never Blend"
Cohesion: 0.50
Nodes (4): When the Sources Disagree (better-attributed figure wins), Four Evidence Levels That Never Blend, Discrete Confidence Rubric, graphify Honesty Rules

### Community 126 - "validate_data.py"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 127 - "rankArticles"
Cohesion: 0.67
Nodes (4): Homepage ranking (rankArticles/selectHero), rankScore con decaimiento por antigüedad (priority*1.5 - días), rankArticles(), selectHero()

### Community 128 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 129 - "ScrollTrigger.js"
Cohesion: 0.38
Nodes (5): _createClass(), _defineProperties(), Observer(), TODO: potential idea: use legitimate CSS scroll snapping by pushing invisible…, ScrollTrigger()

### Community 131 - "Tres error boundaries anidados"
Cohesion: 0.67
Nodes (3): app/global-error.tsx, app/(public)/error.tsx, Tres error boundaries anidados

### Community 133 - "Security headers & CSP en next.config.ts"
Cohesion: 0.67
Nodes (3): Security headers & CSP en next.config.ts, lib/safe-url.ts, next.config.ts headers() — CSP y cabeceras de seguridad

### Community 142 - "verify skill — run the site locally in a sandbox"
Cohesion: 0.22
Nodes (9): resolveSiteUrl https self-fetch gotcha, Tiny local http.createServer harness, Driving the browser with global Playwright, verify skill — run the site locally in a sandbox, CI/CD y despliegue en Vercel, Nunca dejar `main` en rojo (alarma deshabilitada), CI runs without POSTGRES_URL/AUTH_SECRET on purpose, CI verify job (typecheck → lint → build) (+1 more)

### Community 165 - "seed-jugadas.ts"
Cohesion: 0.28
Nodes (8): jugadaMarkup(), markJugada(), parseJugada(), db, DRY_RUN, Incoming, looksLikeHtml(), main()

### Community 166 - "Every visual treatment is a render-time transform"
Cohesion: 0.29
Nodes (8): The Opinion callout is a UI contract, Regenerate a published body, never hand-edit the HTML, Every visual treatment is a render-time transform, Ruta del dinero (the money trail), Openings en frio, Subheads and bold lead-ins advance the argument, Automatic elements (nothing to author, never budgeted), styles/tokens.css --mark-* tokens

### Community 167 - "Schema validation checklist"
Cohesion: 0.29
Nodes (7): Client-side product schema injection (prefer --mode always), Product schema completeness validation, local-schema-types.md reference (shared with seo-maps), LocalBusiness schema subtype validation, Bounded structured_data summary / --json-ld-output artifact, JSON-LD preference and formatting rules, Schema validation checklist

### Community 168 - "Environments, Activation Setup, and Handoff-Doc Mode"
Cohesion: 0.29
Nodes (6): Compaction behaviour, Environments, Activation Setup, and Handoff-Doc Mode, Handoff-doc analysis (when one arrives), Handoff-doc mode (no persistent storage), Recommended activation setup, User-facing documentation

### Community 169 - "Comprehensive Review (scheduled or fallback)"
Cohesion: 0.33
Nodes (5): Approval policy, Comprehensive Review (scheduled or fallback), Constraints, Delivering updated skills, Steps

### Community 170 - "getMostReadArticles"
Cohesion: 0.50
Nodes (4): MostReadSection(), Patrón rank-list / filter-bar del v24, getMostReadArticles(), queryFirstPartyReads

### Community 172 - "parseCifra"
Cohesion: 0.67
Nodes (3): cifraMarkup(), markCifraFigures(), parseCifra()

## Ambiguous Edges - Review These
- `SITE_URL` → `resolveSiteUrl https self-fetch gotcha`  [AMBIGUOUS]
  .claude/skills/verify/SKILL.md · relation: references
- `Routes Map (public, admin, API, SEO)` → `Google Search Console site verification file`  [AMBIGUOUS]
  public/google5d56d2b62c035791.html · relation: conceptually_related_to
- `Backlog del archivo Substack → playbook.la` → `El Matador, Inc. — reporte de caso de Playbook`  [AMBIGUOUS]
  docs/SUBSTACK-ARCHIVE-BACKLOG.md · relation: cites

## Knowledge Gaps
- **529 isolated node(s):** `metadata`, `metadata`, `metadata`, `Filters`, `FilterKey` (+524 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `SITE_URL` and `resolveSiteUrl https self-fetch gotcha`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Routes Map (public, admin, API, SEO)` and `Google Search Console site verification file`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Backlog del archivo Substack → playbook.la` and `El Matador, Inc. — reporte de caso de Playbook`?**
  _Edge tagged AMBIGUOUS (relation: cites) - confidence is low._
- **Why does `Every visual treatment is a render-time transform` connect `Every visual treatment is a render-time transform` to `publish-newsletter.ts`, `ArticleInput field shape (20 fields)`, `article-devices.ts`, `product-hubs.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `articles` connect `articles` to `schema.ts`, `siteContent`, `seed-jugadas.ts`, `The overlap check (run before drafting)`, `publish-newsletter.ts`, `update-articles/route.ts`, `update-lana-board.ts`, `The four-movement brief (Noticias / Infinitas)`, `update-article.ts`, `AdminDashboard.tsx`, `Database Schema (nine Drizzle tables)`, `tema/page.tsx`, `articles.ts`, `Playbook — publicación de negocio del deporte MX/LATAM`, `TODO 2 — retirar la clave source `industry-shots``?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `The dynamic element library (thirteen devices)` connect `The dynamic element library (thirteen devices)` to `article-devices.ts`, `article-map.ts`, `product-hubs.ts`, `The four-movement brief (Noticias / Infinitas)`, `La Lana del Deporte fixed architecture`, `Language and tone: brief de negocios, formulas bajo vigilancia`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _529 weakly-connected nodes found - possible documentation gaps or missing edges._
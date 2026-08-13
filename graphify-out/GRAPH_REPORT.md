# Graph Report - Playbook-portal  (2026-08-13)

## Corpus Check
- 322 files · ~533,682 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2429 nodes · 4125 edges · 185 communities (160 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `948da700`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analytics-data.ts
- TextField.tsx
- site-content.ts
- siteContent
- SplitText.js
- (public)/page.tsx
- article-devices.ts
- Resumen
- articulo/page.tsx
- sitemap.ts
- Detalle por serie
- reader-auth.ts
- devDependencies
- compilerOptions
- product-hubs.ts
- dependencies
- schema.ts
- rankArticles
- Device Budget (readingTime + priority)
- publish-newsletter Decision Flow (steps 0-8)
- team.ts
- Fase 4: plan detallado de lo que falta
- google-sheets.ts
- archivo/page.tsx
- articles.ts
- DesignSystemGenerator
- SERP overlap methodology and thresholds
- MotionPathPlugin.js
- Pre-flight en un bloque
- la-lana/page.tsx
- SiteMotion.tsx
- build-substack-backlog.mjs
- build-world-map.ts
- Single Source of Truth for Editorial Rules
- The Dynamic Element Library
- theme-store.ts
- AdminDashboard.tsx
- ArticlesTab.tsx
- brand-colors.ts
- core.py
- BM25
- design_system.py
- gsap.ts
- article-map.ts
- paths.js
- Schema validation checklist
- check-voice.mjs
- Registro de progreso
- all.js
- Draggable.js
- render_page.py SPA-aware page fetcher
- article-sources.ts
- site-url.ts
- Pre-Delivery Checklist (canonical - the only one)
- Database Schema (nine Drizzle tables)
- tema/page.tsx
- articles
- migrate-json-to-db.ts
- scripts
- La Opinión de Playbook (three moves)
- publish-newsletter.ts
- La Lana del Deporte Fixed Architecture
- admin.ts
- esc
- 2. The thirteen devices
- TIPTAP_EXTENSIONS
- (public)/layout.tsx
- getAllArticles
- noticias/page.tsx
- splitFigure
- The Playbook editorial voice
- Tier-Based Backlink Source Ladder (Tier 0-3)
- gsap-core.js
- HeaderNav.tsx
- seed-jugadas.ts
- update-articles/route.ts
- Write layer — Server Actions (lib/actions/)
- La Lana del Deporte: the exact shape of an article
- publish-sourced-article skill (third-party link to Playbook article)
- Presupuesto de dispositivos (piso, no techo)
- UI/UX Pro Max - Design Intelligence
- update-article.ts
- Audit persistence contract (output_dir/findings + audit-data.json)
- gsap
- seo-performance agent
- Invitaciones de editores por email (token hasheado)
- getSiteContent
- MoneyTrail
- Detalle por contenedor
- 404/page.tsx
- NewsGrid.tsx
- UI/UX Quick Reference Rule Set (10 categories)
- search
- graph-query.py
- metering.ts
- seo-backlinks.md
- Format tiers and per-product architecture
- Execution Steps
- test_core.py
- backfill-article-standards.ts
- NewsletterForm.tsx
- 2026-08-11
- detect_domain
- url_safety.py SSRF and DNS-rebinding protection
- Read layer (lib/data/)
- seo-local agent
- find-duplicates.mjs
- Foto del destacado — 16:10
- PathEditor.js
- ScrambleTextPlugin.js
- Maps Health Score (0-100, 6 dimensions)
- Product Routing (publication / source pair)
- reassign-playbook-tag.ts
- sync-skill-feedback.sh
- What was fixed along the way
- Pre-Delivery Checklist (canonical — the only one)
- GsapCore
- Quick Reference
- seo-performance.md
- 1. Cover image (`imageUrl` / `imageCredit`)
- eslint.config.mjs
- next.config.ts
- next-auth.d.ts
- seo-sitemap.md
- validate_data.py
- seo-visual.md
- package.json
- admin/layout.tsx
- Playbook Portal — Project Encyclopedia
- [...slug]/page.tsx
- Security headers & CSP en next.config.ts
- smoke-test.mjs
- test-email-wall.mjs
- author field and byline rendering
- app/layout.tsx — root layout
- ShotProgress.tsx
- Related articles (shared-tag score + backfill)
- next-env.d.ts
- pg
- react-dom
- @tiptap/extension-image
- @tiptap/html
- zod
- vercel.json
- { GET, POST }
- seo-visual agent
- update-lana-board.ts
- Los cuatro movimientos del cuerpo
- Baseline / Compare / History drift workflow
- TODO
- seo-google.md
- seo-schema.md
- The decision, in two questions
- seo-content.md
- 7. Language and tone
- seo-geo.md
- seo-local.md
- Fields and taxonomy
- seo-maps.md
- The Overlap Check
- seo-cluster.md
- seo-drift.md
- seo-ecommerce.md
- Output Format
- seo-technical.md
- Publish Sourced Article: third-party link to Playbook article, with human approval
- CLAUDE.md
- Publish Newsletter: Substack link to live article, no human in the loop
- Verifying Playbook Portal locally
- Skill observation log (committed copy)
- scripts/check-voice.mjs
- seo-dataforseo.md
- seo-flow.md
- 2026-08-04 — Auditoría pre-lanzamiento completa: 15 defectos reales encontrados y corregidos
- .claude/CLAUDE.md
- graphify-guard.sh
- _GOVERNANCE.md
- gsap/README.md
- publish-newsletter skill
- bcryptjs

## God Nodes (most connected - your core abstractions)
1. `Fase 4: plan detallado de lo que falta` - 66 edges
2. `ArticuloPage()` - 27 edges
3. `SiteContentData` - 24 edges
4. `articles` - 23 edges
5. `Article` - 22 edges
6. `getSiteContent` - 21 edges
7. `getAllArticles` - 20 edges
8. `db` - 20 edges
9. `gsap` - 20 edges
10. `DesignSystemGenerator` - 19 edges

## Surprising Connections (you probably didn't know these)
- `resolveSiteUrl https self-fetch gotcha` --references--> `SITE_URL`  [AMBIGUOUS]
  .claude/skills/verify/SKILL.md → lib/site-url.ts
- `Animation rules (MEDIUM)` --conceptually_related_to--> `ArticleMotion()`  [INFERRED]
  .claude/skills/ui-ux-pro-max/references/quick-reference.md → components/article/ArticleMotion.tsx
- `Patrón rank-list / filter-bar del v24` --references--> `MostReadSection()`  [INFERRED]
  docs/playbook-portal-v24-medio-consulta(1).html → components/home/MostReadSection.tsx
- `Make.com webhook ingestion path` --references--> `POST()`  [EXTRACTED]
  docs/ENCYCLOPEDIA.md → app/api/update-articles/route.ts
- `Google Search Console site verification file` --conceptually_related_to--> `sitemap()`  [INFERRED]
  public/google5d56d2b62c035791.html → app/sitemap.ts

## Import Cycles
- 3-file cycle: `components/ads/AdSenseProvider.tsx -> lib/adsense.ts -> components/ads/AdSlot.tsx -> components/ads/AdSenseProvider.tsx`

## Hyperedges (group relationships)
- **Sistema de identidad por producto (4 hubs + registro + skins de artículo)** — handoff_el_expediente, handoff_el_trago, handoff_la_sala_de_juntas, handoff_el_marcador, lib_product_hubs_product_hubs, handoff_la_lectura, styles_product_hubs_product_hubs_css [EXTRACTED 1.00]
- **Pipeline de publicación de La Lana (spec → skill → script → devices → board)** — docs_la_lana_article_spec, claude_skills_publish_newsletter_skill_publish_newsletter, scripts_publish_newsletter_main, lib_article_devices_apply_body_devices, scripts_update_lana_board_main [EXTRACTED 1.00]
- **Flujo de metering/paywall del lector anónimo** — docs_encyclopedia_metering_paywall, middleware_middleware, lib_anon_cookie_anon_cookie, lib_metering_resolve_entitlement, lib_db_schema_article_reads, lib_data_articles_get_article_meta_by_id, components_article_emailwall_emailwall [EXTRACTED 1.00]
- **Agents writing findings under the audit orchestrator persistence contract** — _claude_agents_seo_backlinks_seo_backlinks, _claude_agents_seo_cluster_seo_cluster, _claude_agents_seo_content_seo_content, _claude_agents_seo_drift_seo_drift, _claude_agents_seo_ecommerce_seo_ecommerce, _claude_agents_seo_geo_seo_geo, _claude_agents_seo_google_seo_google, _claude_agents_seo_local_seo_local, _claude_agents_seo_maps_seo_maps, _claude_agents_seo_performance_seo_performance, _claude_agents_seo_schema_seo_schema, _claude_agents_seo_sitemap_seo_sitemap, _claude_agents_seo_sxo_seo_sxo, _claude_agents_seo_technical_seo_technical, _claude_agents_seo_visual_seo_visual, _claude_agents_seo_backlinks_audit_persistence_contract [EXTRACTED 1.00]
- **Shared editorial rule files participate in the publish-newsletter decision flow** — _claude_skills_publish_newsletter_skill_decision_flow, _claude_playbook_editorial_overlap_check_overlap_check, _claude_playbook_editorial_format_tiers_three_website_tiers, _claude_playbook_editorial_voice_and_style_idea_central, _claude_playbook_editorial_dynamic_element_library_library, _claude_playbook_editorial_fields_and_taxonomy_articleinput, _claude_playbook_editorial_images_cover_image, _claude_playbook_editorial_voice_and_style_publication_checklist [EXTRACTED 1.00]
- **SPA-aware fetch pipeline (render_page.py v2.0.0) shared across agents** — _claude_agents_seo_backlinks_render_page, _claude_agents_seo_backlinks_url_safety_ssrf, _claude_agents_seo_content_extracted_text_scoring, _claude_agents_seo_ecommerce_client_side_schema_injection, _claude_agents_seo_schema_bounded_json_ld_artifact, _claude_agents_seo_drift_fetch_page_ssrf_guard [EXTRACTED 1.00]
- **The thirteen designed devices form the element library** — _claude_playbook_editorial_dynamic_element_library_cifra_clave, _claude_playbook_editorial_dynamic_element_library_jugada, _claude_playbook_editorial_dynamic_element_library_cronologia, _claude_playbook_editorial_dynamic_element_library_recibo, _claude_playbook_editorial_dynamic_element_library_ecuacion, _claude_playbook_editorial_dynamic_element_library_salto, _claude_playbook_editorial_dynamic_element_library_reparto, _claude_playbook_editorial_dynamic_element_library_alineacion, _claude_playbook_editorial_dynamic_element_library_cotizacion, _claude_playbook_editorial_dynamic_element_library_resultados, _claude_playbook_editorial_dynamic_element_library_duelo, _claude_playbook_editorial_dynamic_element_library_serie, _claude_playbook_editorial_dynamic_element_library_mapa, _claude_playbook_editorial_dynamic_element_library_library [EXTRACTED 1.00]
- **Tiered-capability scoring pattern with weight redistribution** — _claude_agents_seo_backlinks_tier_based_source_ladder, _claude_agents_seo_backlinks_confidence_weighted_scoring, _claude_agents_seo_google_credential_tiers, _claude_agents_seo_maps_tier_weight_redistribution, _claude_agents_seo_backlinks_insufficient_data_rule [INFERRED 0.85]

## Communities (185 total, 25 thin omitted)

### Community 0 - "analytics-data.ts"
Cohesion: 0.06
Nodes (51): AdminAnalyticsPage(), AnalyticsView(), BarList(), formatNumber(), formatUpdatedAt(), KpiCard(), unavailableMessage(), BarChart() (+43 more)

### Community 1 - "TextField.tsx"
Cohesion: 0.10
Nodes (23): ArrayEditor(), ArrayEditorProps, Badge, isValidUrlValue(), NumberField(), NumberFieldProps, TextField(), TextFieldProps (+15 more)

### Community 2 - "site-content.ts"
Cohesion: 0.13
Nodes (17): Option, SelectField(), SelectFieldProps, AboutTab(), Props, ProductsTab(), Props, Props (+9 more)

### Community 3 - "siteContent"
Cohesion: 0.09
Nodes (22): contentRevisions, siteContent, db, deepReplace(), DRY_RUN, fixArticles(), fixSiteContent(), main() (+14 more)

### Community 4 - "SplitText.js"
Cohesion: 0.08
Nodes (23): _createClass(), _defineProperties(), ScrollSmoother(), constructor(), _context(), _defaultContext, _disallowInline(), _elements() (+15 more)

### Community 5 - "(public)/page.tsx"
Cohesion: 0.14
Nodes (21): metadata, PreviewFooter(), PreviewHeader(), Props, TopicDirectory(), TOPICS, LazyEmbed(), AboutSection() (+13 more)

### Community 6 - "article-devices.ts"
Cohesion: 0.06
Nodes (38): ALL_DEVICES, Chain, ChainLink, decodeEntities(), Delta, Denominated, Device, DEVICES (+30 more)

### Community 7 - "Resumen"
Cohesion: 0.15
Nodes (13): Orden sugerido de ataque (6 lotes), Backlog del archivo Substack → playbook.la, Contenido perecedero vs. permanente, Cómo leer las estimaciones, Dónde están los huecos, Lo que se puede ignorar, Orden sugerido de ataque, Por serie (+5 more)

### Community 8 - "articulo/page.tsx"
Cohesion: 0.11
Nodes (25): ArticuloPage(), canonicalUrlFor(), generateMetadata(), looksLikeHtml(), paragraphsFrom(), pathFor(), PlainBlock, plainBlocksFor() (+17 more)

### Community 9 - "sitemap.ts"
Cohesion: 0.13
Nodes (21): app/admin/(protected)/dashboard/page.tsx, cdata(), dynamic, GET(), parseTopicFromQuery(), toRfc822(), xmlEscape(), app/(public)/archivo/page.tsx — archivo filtrable (+13 more)

### Community 10 - "Detalle por serie"
Cohesion: 0.14
Nodes (14): Beyond Bounds Arena, Detalle por serie, Ensayo / one-off, Industry Shots, Industry Shots | Players, Infinitas, La Lana, Los Apellidos del Deporte (+6 more)

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
Cohesion: 0.14
Nodes (19): ProductHtml(), CIFRA_HTML_RE, CIFRA_TEXT_PREFIX, CifraFigure, cifraMarkup(), extractCifraFromBody(), extractMoneyTrailFromHtml(), extractMoneyTrailFromParagraphs() (+11 more)

### Community 15 - "dependencies"
Cohesion: 0.08
Nodes (25): @auth/drizzle-adapter, chart.js, drizzle-orm, next, next-auth, dependencies, @auth/drizzle-adapter, chart.js (+17 more)

### Community 16 - "schema.ts"
Cohesion: 0.11
Nodes (21): AdminDashboardPage(), GET(), ALLOWED_CONTENT_TYPES, CuentaPage(), dateFormatter, metadata, adapter, { handlers, auth, signIn, signOut } (+13 more)

### Community 17 - "rankArticles"
Cohesion: 0.23
Nodes (16): ArticlesTab(), HomeSidebar(), NewsGrid(), StillMattersSection(), Módulo de portada "Lo que sigue importando", getArchiveArticles(), getArticleById, daysSince() (+8 more)

### Community 18 - "Device Budget (readingTime + priority)"
Cohesion: 0.20
Nodes (11): Device Budget (readingTime + priority), Device Per-Run Checklist, Rules of Device Placement, Breaking News Priority Override, featured (Destacado) flag, priority (Importancia) 1-5 Scale, Infinitas El Marcador scoreboard, La Lana Hero Figure (title/excerpt scrape) (+3 more)

### Community 19 - "publish-newsletter Decision Flow (steps 0-8)"
Cohesion: 0.16
Nodes (19): Date It and Name Its Source, One Rule, One Home, Place Before You Create (file ownership table), ArticleInput Field Shape, date / dateFormatted fields, Análisis tier, Flash tier (80-150 words), Noticia Playbook tier (+11 more)

### Community 20 - "team.ts"
Cohesion: 0.12
Nodes (23): dynamic, metadata, Props, SetPasswordForm(), dateFmt, dateTimeFmt, Props, TeamTab() (+15 more)

### Community 21 - "Fase 4: plan detallado de lo que falta"
Cohesion: 0.03
Nodes (65): 2026-07-21 — Bug real reportado: página de inicio en blanco tras el muro de artículos; causa raíz real: cero error boundaries en toda la app, 2026-07-21 — Datos legales reales + módulo "Mi cuenta" para lectores, 2026-07-21 — Diagnóstico confirmado: el no-op también falló. Se elimina `middleware.ts` para restaurar el sitio, 2026-07-21 — El `__dirname` persiste tras "Clear Cache and Deploy"; diagnóstico: middleware no-op temporal, 2026-07-21 — Fix: algoritmo de ranking (portada/ticker mostraba noticias de hasta 13 días), 2026-07-21 — Fix: CI agregado (no existía ningún workflow), 2026-07-21 — Fix de despliegue: `middleware` crasheaba en producción (`MIDDLEWARE_INVOCATION_FAILED`), 2026-07-21 — Fix de despliegue: Vercel rechazaba `middleware.ts` ("Edge Function referencing unsupported modules") (+57 more)

### Community 22 - "google-sheets.ts"
Cohesion: 0.17
Nodes (16): constantTimeEqual(), GET(), dateFmt, ReadersTab(), getReadersData(), requireEditor(), getAllReaders(), ReaderRow (+8 more)

### Community 23 - "archivo/page.tsx"
Cohesion: 0.13
Nodes (19): ArchivoPage(), FILTER_TIERS, filterHref(), FilterKey, Filters, groupRiver(), metadata, monthKeyOf() (+11 more)

### Community 24 - "articles.ts"
Cohesion: 0.16
Nodes (17): AutorPage(), generateMetadata(), Props, ArticleTopics(), TIER_COLUMN, Heading, NewsRow(), TagPillRow() (+9 more)

### Community 25 - "DesignSystemGenerator"
Cohesion: 0.14
Nodes (10): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV. (+2 more)

### Community 26 - "SERP overlap methodology and thresholds"
Cohesion: 0.22
Nodes (9): Keyword cannibalization check, Hub-and-spoke cluster architecture, Internal link matrix (mandatory/recommended/optional), Keyword intent classification, SERP overlap methodology and thresholds, Page-type mismatch detection, page-type-taxonomy.md reference, SERP backwards analysis (+1 more)

### Community 27 - "MotionPathPlugin.js"
Cohesion: 0.24
Nodes (9): arcToSegment(), convertToPath(), flatPointsToSegment(), getRawPath(), pointsToSegment(), rawPathToString(), reverseSegment(), stringToRawPath() (+1 more)

### Community 28 - "Pre-flight en un bloque"
Cohesion: 0.17
Nodes (12): publish-sourced-article skill, resolveSiteUrl https self-fetch gotcha, Tiny local http.createServer harness, Driving the browser with global Playwright, verify skill — run the site locally in a sandbox, CI/CD y despliegue en Vercel, Claude Code skills del proyecto, Nunca dejar `main` en rojo (alarma deshabilitada) (+4 more)

### Community 29 - "la-lana/page.tsx"
Cohesion: 0.23
Nodes (10): boardKey(), LaLanaHubPage(), metadata, RelatedCard(), BoardRow, DeparturesBoard(), statusBlinks(), caseStatus() (+2 more)

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
Cohesion: 0.50
Nodes (4): Single Source of Truth for Editorial Rules, 2026-08-11 Monolithic SKILL.md Truncation Incident, scripts/sync-skill-feedback.sh SYNC_PATHS, Shared (symlinked) vs. Skill-Own References

### Community 34 - "The Dynamic Element Library"
Cohesion: 0.16
Nodes (18): Alineación (lineup chips device), Cifra clave (pull-figure device), Cotización (market tile device), Cronología (drawn timeline device), Duelo (butterfly chart device), La cifra del día (homepage sidebar reads Cifra clave), lib/article-map.ts, lib/product-hubs.ts (+10 more)

### Community 35 - "theme-store.ts"
Cohesion: 0.22
Nodes (11): dynamic, AdminTopbarNav(), applyThemeColor(), isDarkActive(), listeners, notify(), storedTheme(), subscribeTheme() (+3 more)

### Community 36 - "AdminDashboard.tsx"
Cohesion: 0.08
Nodes (24): DEFAULT_ORDER, GROUPS, LABELS, Props, SAVELESS_TABS, Status, TAB_DEFS, TabKey (+16 more)

### Community 37 - "ArticlesTab.tsx"
Cohesion: 0.17
Nodes (12): CheckboxGroupField(), CheckboxGroupFieldProps, StarPickerField(), StarPickerFieldProps, COVERAGE_TIERS, Props, DEFAULT_TOPICS, SCOPE_OPTIONS (+4 more)

### Community 38 - "brand-colors.ts"
Cohesion: 0.26
Nodes (16): parseChain(), BRAND_TABLE, BrandPalette, BRANDS, brandStyleAttr(), contrast(), fillForLegibleText(), mix() (+8 more)

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
Cohesion: 0.16
Nodes (8): GsapTween, ScrollTriggerInstance, ScrollTriggerStatic, _createClass(), _defineProperties(), Observer(), TODO: potential idea: use legitimate CSS scroll snapping by pushing invisible…, ScrollTrigger()

### Community 43 - "article-map.ts"
Cohesion: 0.17
Nodes (16): ArticleMap, buildMap(), codesFrom(), COUNTRIES, CountryEntry, esc(), fold(), FRAME_ALIASES (+8 more)

### Community 44 - "paths.js"
Cohesion: 0.24
Nodes (16): cacheRawPathMeasurements(), copyRawPath(), getClosestData(), getClosestProgressOnBezier(), getPositionOnPath(), getProgressData(), getRotationAtBezierT(), getRotationAtProgress() (+8 more)

### Community 45 - "Schema validation checklist"
Cohesion: 0.17
Nodes (12): AI citation readiness score, AI Crawler Access (GPTBot, ClaudeBot, PerplexityBot, CCBot), Brand mention correlation with AI citations, Passage citability signals (134-167 word passages), GEO Health Score (0-100, 5 dimensions), local-schema-types.md reference (shared with seo-maps), LocalBusiness schema subtype validation, Deprecated schema types (HowTo, SpecialAnnouncement, CourseInfo) (+4 more)

### Community 46 - "check-voice.mjs"
Cohesion: 0.27
Nodes (10): analyse(), countNegatives(), findNegatives(), main(), median(), NEGATIVE_PARALLELISM, pct(), TARGETS (+2 more)

### Community 47 - "Registro de progreso"
Cohesion: 0.04
Nodes (44): 2026-07-20 — Fase 1: scaffold + schema + migración de datos, 2026-07-20 — Fase 2: páginas públicas + SEO + sistema de diseño, 2026-07-20 — Fix: build roto en Vercel (sin `app/`), 2026-07-20 — Fix: `npm run build` roto en Vercel (falta `POSTGRES_URL`), 2026-07-21 — Fase 3: Auth.js + medición + muro de correo, 2026-07-21 — Fase 4 (checkpoint 1 de 5): login de editor + guard del layout protegido, 2026-07-21 — Fase 4 (checkpoint 2 de 5): Server Actions con detección de conflictos, 2026-07-21 — Fase 4 (checkpoint 3 de 5): editor TipTap + subida a Vercel Blob (+36 more)

### Community 49 - "Draggable.js"
Cohesion: 0.18
Nodes (5): _assertThisInitialized(), Draggable(), NOTE: "force" is actually the "time" when this method gets called by the…, getGlobalMatrix(), Matrix2D()

### Community 50 - "render_page.py SPA-aware page fetcher"
Cohesion: 0.18
Nodes (13): render_page.py SPA-aware page fetcher, seo-backlinks agent, validate_backlink_report.py pre-delivery validator, Score against extracted_text, not raw content, Client-side product schema injection (prefer --mode always), DataForSEO cost guardrails (check/log before Merchant API), Product schema completeness validation, seo-ecommerce agent (+5 more)

### Community 51 - "article-sources.ts"
Cohesion: 0.31
Nodes (8): ArticleSources(), ArticleSource, collectAnchors(), decodeEntities(), SOURCES_TEXT_PREFIX, SourcesExtraction, splitName(), stripTags()

### Community 52 - "site-url.ts"
Cohesion: 0.14
Nodes (11): anton, inter, metadata, RootLayout(), metadata, AnalyticsClient(), makeBeforeSend(), getFundingChoicesPublisherId() (+3 more)

### Community 53 - "Pre-Delivery Checklist (canonical - the only one)"
Cohesion: 0.19
Nodes (15): Icons & visual elements rules, Interaction (app) rules, Layout & spacing rules (safe areas, 4/8dp rhythm), Light/dark mode contrast rules, Pre-Delivery Checklist (canonical - the only one), Scope notice: native/mobile app UI only, ui-ux-pro-max scripts/search.py, Step 2c: design dials (variance, motion, density) (+7 more)

### Community 54 - "Database Schema (nine Drizzle tables)"
Cohesion: 0.12
Nodes (19): app/admin/(protected)/layout.tsx — guard de editor, POST(), auth.ts — instancia única de Auth.js, Un Auth.js, dos flujos de identidad (lectores/editores), Database Schema (nine Drizzle tables), Metering / paywall de lectores (3 gratis al mes), lib/anon-cookie.ts — HMAC-SHA256 de pb_anon, lib/bots.ts — 14 firmas de crawlers (+11 more)

### Community 55 - "tema/page.tsx"
Cohesion: 0.20
Nodes (13): generateMetadata(), Props, resolveTopic(), TemaPage(), TIER_LABELS, Homepage ranking (rankArticles/selectHero), Taxonomía cerrada de tres niveles, TODO 1 — clasificación de noticias (+5 more)

### Community 56 - "articles"
Cohesion: 0.27
Nodes (9): app/(public)/noticias/page.tsx — hub Noticias, bodyHtml como cache server-rendered de bodyJson, Fuentes editoriales (Noticias, La Lana, Infinitas, Opinión), body_html es cache de body_json — no editar a mano, Detección de ediciones ya procesadas por substackUrl, Inventario por serie (13 series, P1/P2), TODO 2 — retirar la clave source `industry-shots`, lib/constants.ts — LEAD_COUNT, FREE_ARTICLES_PER_MONTH, KNOWN_SOURCES (+1 more)

### Community 57 - "migrate-json-to-db.ts"
Cohesion: 0.11
Nodes (22): graphify knowledge-graph workflow convention, Variables de entorno y degradación por integración, Known gaps: solo configuración de producción, Playbook — publicación de negocio del deporte MX/LATAM, Repository Map, Scripts de ops y migración, Tech Stack (Next.js 15, Drizzle, Auth.js v5, TipTap, Blob), Migración automática en cada deploy (vercel-build) (+14 more)

### Community 58 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:generate, db:migrate, db:reset-editor-password, dev, fix:lana-rebrand, fix:newsletter-success-copy (+7 more)

### Community 59 - "La Opinión de Playbook (three moves)"
Cohesion: 0.22
Nodes (10): Definitional Antithesis (TFBR thesis move), The Four-Movement Brief (Noticias / Infinitas), The Futbol Business Review format, The Uniformity Contract (four products, one masthead), La Opinión de Playbook (three moves), On a Running Political Story, Read the Alignment, Qué se queda fuera, The Regional Connection (México / LATAM), not obligatory (+2 more)

### Community 60 - "publish-newsletter.ts"
Cohesion: 0.26
Nodes (10): ArticleInput, db, insertOne(), main(), markdownToTipTap(), parseInlineMarks(), dryRun, Input (+2 more)

### Community 61 - "La Lana del Deporte Fixed Architecture"
Cohesion: 0.20
Nodes (11): Automatic Elements (nothing to author), Jugada (connection strip device), The Departures Board (post-publish la-lana step), La Lana del Deporte Fixed Architecture, The Opinión Callout Is a UI Contract, The Promise Block (three reader questions), Ruta del dinero (money trail), In-Body Images (differs by funnel) (+3 more)

### Community 62 - "admin.ts"
Cohesion: 0.15
Nodes (23): AdminDashboard(), applyServerArticle(), ArticleEntry, articleToEntry(), isEntryDirty(), newArticleEntry(), toData(), toPreviewArticle() (+15 more)

### Community 63 - "esc"
Cohesion: 0.19
Nodes (18): buildChain(), buildDelta(), buildDuel(), buildEquation(), buildLineup(), buildQuote(), buildReceipt(), buildResults() (+10 more)

### Community 64 - "2. The thirteen devices"
Cohesion: 0.10
Nodes (19): 1. The budget, 2. The thirteen devices, 3. Automatic elements — nothing to author, 4. Per-run checklist, `Alineación:` — the lineup chips, `Cifra clave:` — the pull-figure, `Cotización:` — the market tile, `Cronología:` — the drawn timeline (+11 more)

### Community 65 - "TIPTAP_EXTENSIONS"
Cohesion: 0.27
Nodes (7): Props, TipTapEditor(), TIPTAP_EXTENSIONS, dryRun, main(), nodeText(), sql

### Community 66 - "(public)/layout.tsx"
Cohesion: 0.07
Nodes (38): dynamic, GET(), dynamic, PublicLayout(), AdSenseContext, AdSenseProvider(), useAdSenseConfig(), AdSlot() (+30 more)

### Community 67 - "getAllArticles"
Cohesion: 0.25
Nodes (7): BrandLink(), Header(), Ticker(), TickerScramble(), TICKER_COUNT, getAllArticles, queryPublishedArticles

### Community 68 - "noticias/page.tsx"
Cohesion: 0.23
Nodes (12): articleHref(), groupRiver(), Measure(), metadata, NewsBlock, NoticiasHubPage(), tierFor(), When() (+4 more)

### Community 69 - "splitFigure"
Cohesion: 0.21
Nodes (15): DailyFigure(), denominatedOf(), isCountable(), linkTrackB(), magnitudeOf(), multipleBetween(), normalizeLabel(), parseDelta() (+7 more)

### Community 70 - "The Playbook editorial voice"
Cohesion: 0.11
Nodes (18): 10. Building on prior Playbook coverage, 11. Qué se queda fuera, 12. Checklist de publicación, 2. The rhythm, 3. Titles, 4. Openings, 5. Subheads and lead-ins advance the argument, 6. La Opinión de Playbook (+10 more)

### Community 71 - "Tier-Based Backlink Source Ladder (Tier 0-3)"
Cohesion: 0.25
Nodes (8): Bing Webmaster source (bing_webmaster.py), Common Crawl web graph source (commoncrawl_graph.py), Moz API source (moz_api.py), Tier-Based Backlink Source Ladder (Tier 0-3), API credit efficiency rules (bulk endpoints, no re-fetch), claude-seo output conventions (tables, XX/100, priority ladder), Fail-closed MCP policy (never bypass with raw HTTP), seo-dataforseo agent

### Community 72 - "gsap-core.js"
Cohesion: 0.23
Nodes (6): _assertThisInitialized(), PropTween(), TODO: repeat: Infinity on a timeline's children must flag that timeline…, NOTE: wrap() CANNOT be an arrow function! A very odd compiling bug causes…, Timeline(), Tween()

### Community 73 - "HeaderNav.tsx"
Cohesion: 0.36
Nodes (7): HeaderNav(), sectionHref(), matches(), normalize(), SearchableArticle, SearchBox(), NavLink

### Community 74 - "seed-jugadas.ts"
Cohesion: 0.28
Nodes (8): jugadaMarkup(), markJugada(), parseJugada(), db, DRY_RUN, Incoming, looksLikeHtml(), main()

### Community 75 - "update-articles/route.ts"
Cohesion: 0.26
Nodes (12): constantTimeEqual(), decodeEntities(), detectPublication(), escapeRegExp(), getClientIp(), inferTags(), normalizeText(), POST() (+4 more)

### Community 76 - "Write layer — Server Actions (lib/actions/)"
Cohesion: 0.20
Nodes (11): Concurrencia optimista con date_trunc('milliseconds'), Rate limiting en memoria, no distribuido, Write layer — Server Actions (lib/actions/), archiveArticle(id) — soft delete, createArticle(input), saveArticle(id, input, expectedUpdatedAt), saveSiteContent(data, expectedVersion), loginAction() (+3 more)

### Community 77 - "La Lana del Deporte: the exact shape of an article"
Cohesion: 0.18
Nodes (11): 1. The body, movement by movement, 2. Devices — the budget is a floor, not a ceiling to avoid, 3. Fields, 4. After publishing — the step that has no reminder, 5. How the 2026-08-07 break happened, and the rule that prevents it, 6. The pre-flight, in one block, La Lana del Deporte: the exact shape of an article, Movement 1 — the cold open (+3 more)

### Community 78 - "publish-sourced-article skill (third-party link to Playbook article)"
Cohesion: 0.50
Nodes (5): The ten-step decision flow, Four differences from publish-newsletter, The human approval gate, publish-sourced-article skill (third-party link to Playbook article), Shared vs own: six symlinks into .claude/playbook-editorial/

### Community 79 - "Presupuesto de dispositivos (piso, no techo)"
Cohesion: 0.14
Nodes (18): app/(public)/articulo/page.tsx — página de artículo, Presupuesto de dispositivos (piso, no techo), Regla: la presentación del cuerpo se decide en render, no al publicar, Convención de autoría "Cifra clave:", Presupuesto de dispositivos por readingTime/priority, La colección de dispositivos de artículo, La Lectura — un esqueleto, cuatro pieles de artículo, Convención de autoría "Ruta del dinero:" (+10 more)

### Community 80 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.12
Nodes (16): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements, Step 2: Generate Design System (REQUIRED for new pages/projects) (+8 more)

### Community 81 - "update-article.ts"
Cohesion: 0.33
Nodes (6): COLUMNS, db, dryRun, Entry, main(), resolveId()

### Community 82 - "Audit persistence contract (output_dir/findings + audit-data.json)"
Cohesion: 0.21
Nodes (15): Audit persistence contract (output_dir/findings + audit-data.json), cluster-plan.json output artifact, seo-cluster agent, Content word-count minimums by page type, E-E-A-T scoring model, seo-content agent, seo-drift agent, llms.txt and RSL 1.0 licensing check (+7 more)

### Community 83 - "gsap"
Cohesion: 0.33
Nodes (3): HomeChoreography(), SplitHeadline(), gsap

### Community 84 - "seo-performance agent"
Cohesion: 0.22
Nodes (10): Core Web Vitals thresholds (LCP/INP/CLS), Google credential tiers (API key / service account / GA4), GSC totals_complete rule (do not sum anonymized rows), INP replaced FID (March 12, 2024), Enterprise PDF report generation (google_report.py), seo-google agent, Core Web Vitals metrics and 75th percentile rule, Prefer CrUX field data over Lighthouse lab data (+2 more)

### Community 85 - "Invitaciones de editores por email (token hasheado)"
Cohesion: 0.14
Nodes (11): app/admin/set-password/page.tsx, components/admin/studio-prompts.ts, STUDIO_SECTIONS, StudioPrompt, StudioSection, StudioTab(), Invitaciones de editores por email (token hasheado), Fase 8 — invitaciones de editores + Studio (+3 more)

### Community 86 - "getSiteContent"
Cohesion: 0.13
Nodes (17): FutbolBusinessReviewHubPage(), metadata, InfinitasHubPage(), metadata, toScoreboardMetric(), HomePage(), Footer(), SocialIcon() (+9 more)

### Community 87 - "MoneyTrail"
Cohesion: 0.40
Nodes (5): MoneyTrail(), routePath(), lib/gsap — registra y re-exporta los plugins, Regla: importar solo desde @/lib/gsap, nunca vendor/gsap/esm/*, GSAP + plugins Club GreenSock auto-hospedados

### Community 88 - "Detalle por contenedor"
Cohesion: 0.12
Nodes (15): 10. Logo — footer, 1. Foto del destacado (hero / lead story), 2. Banner TFBR (tarjeta de opinión con imagen), 3. Banner de producto, 4. Video destacado (panel grande), 5. Clip de video (formato chico, fila de 4), 6. Tarjeta Infinitas destacada, 7. Tarjeta Infinitas lateral (+7 more)

### Community 89 - "404/page.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundContent()

### Community 90 - "NewsGrid.tsx"
Cohesion: 0.15
Nodes (13): app/(public)/page.tsx — homepage, metadata, LeadStory(), FILTERS, NEWS_SOURCES, Arquitectura de componentes del sitio público, La Portada — coreografía de homepage dentro de las bardas, FREE_ARTICLES_PER_MONTH (+5 more)

### Community 91 - "UI/UX Quick Reference Rule Set (10 categories)"
Cohesion: 0.20
Nodes (9): Accessibility rules (CRITICAL), Animation rules (MEDIUM), Navigation Patterns (HIGH), Performance rules (HIGH), UI/UX Quick Reference Rule Set (10 categories), Touch & Interaction rules (CRITICAL), Nested <a> regression check, ShareRow() (+1 more)

### Community 92 - "search"
Cohesion: 0.36
Nodes (4): Main search function with auto-domain detection, search(), Known query -> expected top-domain sanity checks (not exact-row pinning, since…, TestSearchDomains

### Community 93 - "graph-query.py"
Cohesion: 0.27
Nodes (15): cmd_explain(), cmd_path(), cmd_query(), cmd_stats(), find_nodes(), fmt_node(), index_edges(), load_graph() (+7 more)

### Community 94 - "metering.ts"
Cohesion: 0.14
Nodes (22): Diferir la validación de env vars más allá del import, Notable Engineering Lessons, Middleware en runtime Node.js (escape del bundler Edge), ANON_COOKIE_NAME, getKey(), signAnonId(), toBase64Url(), verifyAnonCookie() (+14 more)

### Community 95 - "seo-backlinks.md"
Cohesion: 0.13
Nodes (14): Audit Persistence, Confidence-Weighted Scoring, Cross-Skill Delegation, Error Handling, Fetching pages (v2.0.0), Output Format, Pre-Delivery Review (MANDATORY), Step 1: Automated validation (+6 more)

### Community 96 - "Format tiers and per-product architecture"
Cohesion: 0.13
Nodes (14): 1. The three website tiers, 2. The uniformity contract, 3. Noticias / Infinitas — the four-movement brief, 4. La Lana del Deporte — a fixed architecture, 5. The Futbol Business Review, 6. What the page does with all this, 7. The product hubs read the body, 8. The product is called Noticias (+6 more)

### Community 97 - "Execution Steps"
Cohesion: 0.14
Nodes (13): 1. Fetch and Parse Target Page, 2. SERP Analysis, 3. Page-Type Mismatch Detection, 4. User Story Derivation, 5. Gap Analysis, 6. Persona Scoring, 7. Wireframe (Only if requested), Audit Persistence (+5 more)

### Community 98 - "test_core.py"
Cohesion: 0.18
Nodes (11): format_markdown(), format_master_md(), generate_design_system(), persist_design_system(), Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,…, Slugify a name into a single safe path segment. Only [a-z0-9_-] survives; every…, Persist design system to design-system/<project>/ folder using Master +… (+3 more)

### Community 99 - "backfill-article-standards.ts"
Cohesion: 0.47
Nodes (5): BackfillEntry, db, main(), unescapeUrl(), updateOne()

### Community 100 - "NewsletterForm.tsx"
Cohesion: 0.70
Nodes (3): isValidEmail(), NewsletterForm(), newsletterActionUrl()

### Community 101 - "2026-08-11"
Cohesion: 0.12
Nodes (15): 2026-08-11, Observation 10: The unreachable-source ladder has no documented bottom rung, Observation 11: A hook-based health check cannot detect its own harness not running hooks, Observation 12: An agent's impression of "the tool didn't fire" is not evidence, Observation 13: A regression test keyed to live data can be erased by the workflow it guards, Observation 1: Tooling instructions must separate read-only use from rebuild, Observation 2: A health check needs a degraded state, not just pass/fail, Observation 3: Sample a flaky network 3+ times before naming a cause (+7 more)

### Community 102 - "detect_domain"
Cohesion: 0.43
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 103 - "url_safety.py SSRF and DNS-rebinding protection"
Cohesion: 0.33
Nodes (6): url_safety.py SSRF and DNS-rebinding protection, fetch_page.py private/loopback IP validation, FLOW framework (Find/Leverage/Optimize/Win/Local), Context-budget prompt selection (max 5, never load all optimize prompts), seo-flow agent, Untrusted WebFetch content policy

### Community 104 - "Read layer (lib/data/)"
Cohesion: 0.29
Nodes (4): El muro se garantiza a nivel de query (getArticleMetaById), Read layer (lib/data/), getArchiveArticles(filters), getArticleMetaById()

### Community 105 - "seo-local agent"
Cohesion: 0.18
Nodes (11): Business type detection (brick-and-mortar / SAB / hybrid), Local SEO Score (0-100, 6 dimensions), NAP consistency extraction and discrepancy flagging, seo-local agent, Whitespark 2026 critical local ranking factors, Doorway page penalty risk, Location page quality gates (30+ warning, 50+ hard stop), seo-sitemap agent (+3 more)

### Community 106 - "find-duplicates.mjs"
Cohesion: 0.19
Nodes (17): buildIndex(), distinctiveCut(), ENTITY_STOP, figures(), main(), properNouns(), rank(), score() (+9 more)

### Community 107 - "Foto del destacado — 16:10"
Cohesion: 0.40
Nodes (5): Foto del destacado — 16:10, Logo del header — única imagen con variación por breakpoint, Referencia de formatos de imagen, Campos obligatorios del artículo La Lana, Guest bylines con markdown inline en `author`

### Community 109 - "ScrambleTextPlugin.js"
Cohesion: 0.62
Nodes (4): CharSet(), emojiSafeSplit(), getText(), splitInnerHTML()

### Community 110 - "Maps Health Score (0-100, 6 dimensions)"
Cohesion: 0.33
Nodes (6): Backlink Health Score (0-100), Confidence-Weighted Multi-Source Scoring, INSUFFICIENT DATA rule (no misleading scores), Geo-grid rank tracking and SoLV, Maps Health Score (0-100, 6 dimensions), Tier 0 weight redistribution

### Community 111 - "Product Routing (publication / source pair)"
Cohesion: 0.33
Nodes (6): Deleted "playbook" source key, lib/taxonomy.ts, Pick the Most Specific Tag Rule, Product Routing (publication / source pair), Taxonomy Tags (tagsScope / tagsSport / tagsVertical), "Industry Shots" Retired; the Product Is Noticias

### Community 114 - "What was fixed along the way"
Cohesion: 0.22
Nodes (8): 1. The PATH bug, 2. The offline-reader fallback, 3. The coworker-session gap, 4. Two health-check corrections, Graphify + task-observer: setup, fixes, and where it stands, What was fixed along the way, What was installed, Where things stand

### Community 115 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 117 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 119 - "seo-performance.md"
Cohesion: 0.17
Nodes (11): Common CLS Issues, Common INP Issues, Common LCP Issues, Current Metrics (as of 2026), Evaluation Method, Google API Integration (Optional), Output Format, Performance Tooling (2025-2026) (+3 more)

### Community 120 - "1. Cover image (`imageUrl` / `imageCredit`)"
Cohesion: 0.17
Nodes (11): 1. Cover image (`imageUrl` / `imageCredit`), 2. In-body images — **differs by funnel**, Images, No cropped-looking cover images, `publish-newsletter`: carry them all over, `publish-sourced-article`: none, The agency exclusion, The broad search (+3 more)

### Community 122 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 123 - "next.config.ts"
Cohesion: 0.40
Nodes (4): csp, legacyHtmlRedirects, nextConfig, securityHeaders

### Community 124 - "next-auth.d.ts"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 125 - "seo-sitemap.md"
Cohesion: 0.18
Nodes (10): Audit Persistence, Location Page Thresholds, Output Format, Penalty Risk ❌, Quality Gates, Safe at Scale ✅, Safe vs Risky Pages, Sitemap Format (+2 more)

### Community 126 - "validate_data.py"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 127 - "seo-visual.md"
Cohesion: 0.18
Nodes (10): Above-the-Fold Analysis, Mobile Responsiveness, Output Format, Persistence Contract, Prerequisites, Screenshot Script, Viewports to Test, Visual Checks (+2 more)

### Community 128 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 131 - "Playbook Portal — Project Encyclopedia"
Cohesion: 0.04
Nodes (49): app/global-error.tsx, app/(public)/error.tsx, 10.1 Admin CMS (`components/admin/`), 10.2 Public site, 10.3 Styling, 10. Frontend Component Architecture, 11. Scripts (`scripts/`), 12. Environment Variables (+41 more)

### Community 133 - "Security headers & CSP en next.config.ts"
Cohesion: 0.67
Nodes (3): Security headers & CSP en next.config.ts, lib/safe-url.ts, next.config.ts headers() — CSP y cabeceras de seguridad

### Community 142 - "ShotProgress.tsx"
Cohesion: 0.40
Nodes (4): Mark, MARKS, ShotProgress(), El Trago — hub /noticias (ex /industry-shots)

### Community 157 - "seo-visual agent"
Cohesion: 0.29
Nodes (7): Common LCP / INP / CLS bottlenecks, Persona scoring (Relevance/Clarity/Trust/Action), SXO Gap Score (separate from SEO Health Score), Above-the-fold analysis, capture_screenshot.py Playwright automation, seo-visual agent, Viewport test matrix (desktop/laptop/tablet/mobile)

### Community 158 - "update-lana-board.ts"
Cohesion: 0.23
Nodes (11): CASE_OPEN_DAYS, productHubsContent, buildRow(), CaseRow, db, DRY_RUN, IncomingConnection, main() (+3 more)

### Community 160 - "Los cuatro movimientos del cuerpo"
Cohesion: 0.29
Nodes (6): Los cuatro movimientos del cuerpo, Lead-ins en negrita por bloque (markLeadIns), ## La Opinión de Playbook con tres bullets, Promise block — tres preguntas, Convención "La opinión de Playbook" → callout, markOpinionCallout()

### Community 162 - "Baseline / Compare / History drift workflow"
Cohesion: 0.67
Nodes (3): Baseline / Compare / History drift workflow, Drift severity classification (CRITICAL/WARNING/INFO), SQLite baseline store with SHA-256 content hashes

### Community 166 - "TODO"
Cohesion: 0.40
Nodes (4): 1. News classification, 2. Retire the `industry-shots` source key, 3. Stale files and dead weight, TODO

### Community 167 - "seo-google.md"
Cohesion: 0.20
Nodes (9): Audit Persistence, Core Web Vitals Thresholds, Error Handling, Output Format, Report Generation (MANDATORY), Tier 0 (API Key Only), Tier 1 (+ Service Account), Tier 2 (Full) (+1 more)

### Community 168 - "seo-schema.md"
Cohesion: 0.20
Nodes (9): Always Prefer:, Common Schema Types, Core Rules, Fetching pages (v2.0.0), Never Recommend These (Deprecated):, No Rich Results (FAQPage):, Output Format, Persistence Contract (+1 more)

### Community 169 - "The decision, in two questions"
Cohesion: 0.20
Nodes (9): A. Same event, nothing new → don't publish it, B. Same event, the source adds facts → upgrade the existing article, C. A new development on a story already covered → a new article that links back, D. Same event, different product, genuinely different thesis → both may run, cross-linked, If it was already published twice, Reporting, The decision, in two questions, The overlap check — run it before drafting anything (+1 more)

### Community 170 - "seo-content.md"
Cohesion: 0.22
Nodes (8): Helpful Content System merged into core (March 2024), AI Content Assessment (Sept 2025 QRG), Content Minimums, Cross-Skill Delegation, E-E-A-T Scoring, Fetching pages (v2.0.0), Output Format, Persistence Contract

### Community 171 - "7. Language and tone"
Cohesion: 0.20
Nodes (10): Ecuación (display math device), La aritmética (no arithmetic showmanship), Language and Tone (brief de negocios), Negative Parallelism: Exactly One, at the Thesis, 7. Language and tone, Fórmulas bajo vigilancia, Hard mechanical rules, La aritmética (+2 more)

### Community 172 - "seo-geo.md"
Cohesion: 0.22
Nodes (8): AI Crawlers to Check in robots.txt, Audit Persistence, Brand Mention Correlation with AI Citations, DataForSEO Integration (Optional), Fetching pages (v2.0.0), GEO Health Score (0-100), Key Citability Signals, Output Format

### Community 173 - "seo-local.md"
Cohesion: 0.22
Nodes (8): Audit Persistence, Critical Ranking Factors (Whitespark 2026), DataForSEO Integration (Optional), Fetching pages (v2.0.0), Industry-Specific Checks, Key Detection Signals, Local SEO Score (0-100), Output Format

### Community 175 - "Fields and taxonomy"
Cohesion: 0.22
Nodes (8): Dates, Editorial fields, Fields and taxonomy, Identity and dedupe — **differs by funnel**, Images, Product routing, Ranking, Taxonomy

### Community 177 - "seo-maps.md"
Cohesion: 0.25
Nodes (7): Audit Persistence, Cross-Skill Delegation, Maps Health Score (0-100), Output Format, Reference Files, Tier 0 (Free) Capabilities, Tier 1 (DataForSEO) Additional Capabilities

### Community 178 - "The Overlap Check"
Cohesion: 0.17
Nodes (13): lib/article-devices.ts, sourceUrl Unique Dedupe Key, substackUrl field (differs by funnel), Body Presentation Decided at Render Time, Never Publish Time, If It Was Already Published Twice (48-hour rule), scripts/find-duplicates.mjs, Outcome A: Same event, nothing new, do not publish, Outcome B: Upgrade the existing article (+5 more)

### Community 180 - "seo-cluster.md"
Cohesion: 0.29
Nodes (6): Cross-Skill Awareness, How to Report Findings, Output Format, Pre-Delivery Validation Checklist, Reference Files, What to Analyze

### Community 181 - "seo-drift.md"
Cohesion: 0.29
Nodes (6): Audit Persistence, Cross-Skill Delegation, Output, Severity Classification, Tools, Workflow

### Community 182 - "seo-ecommerce.md"
Cohesion: 0.29
Nodes (6): Analysis Priorities, Audit Persistence, Cost Guardrails, Error Handling, Fetching pages (v2.0.0), Output Format

### Community 183 - "Output Format"
Cohesion: 0.29
Nodes (6): Analysis Scope, Error Handling, Image Audit Summary, Image Generation Plan, Output Format, Recommendations

### Community 184 - "seo-technical.md"
Cohesion: 0.29
Nodes (6): Categories to Analyze, Core Web Vitals Reference, Cross-Skill Delegation, Fetching pages (v2.0.0), Output Format, Persistence Contract

### Community 189 - "Publish Sourced Article: third-party link to Playbook article, with human approval"
Cohesion: 0.33
Nodes (5): Decision flow, Publish Sourced Article: third-party link to Playbook article, with human approval, Shared vs. own, What differs from `publish-newsletter`, When this runs

### Community 191 - "CLAUDE.md"
Cohesion: 0.40
Nodes (4): graphify, task-observer, Tooling health check, When the graphify install fails

### Community 192 - "Publish Newsletter: Substack link to live article, no human in the loop"
Cohesion: 0.40
Nodes (4): Decision flow, Publish Newsletter: Substack link to live article, no human in the loop, Shared vs. own, When this runs

### Community 193 - "Verifying Playbook Portal locally"
Cohesion: 0.40
Nodes (4): Driving the browser, Verifying Playbook Portal locally, What actually works: a tiny local Node server, What's blocked in this sandbox

### Community 194 - "Skill observation log (committed copy)"
Cohesion: 0.40
Nodes (4): Skill observation log (committed copy), Snapshot history, Which copy is authoritative, Why this exists

### Community 195 - "scripts/check-voice.mjs"
Cohesion: 0.15
Nodes (13): Convergence Check (two skills, zero divergence), Six-Phase Skill Work Report, Shared Device Declaration Syntax, Devices Fail Loud, Not Silent, The Fuentes: Credit Line, scripts/check-voice.mjs, Em Dash Ban in Drafted Text, The Hammer Line (+5 more)

### Community 196 - "seo-dataforseo.md"
Cohesion: 0.50
Nodes (3): Efficient Tool Usage, Error Handling, Output Format

### Community 197 - "seo-flow.md"
Cohesion: 0.50
Nodes (3): Output Format, Rules, Security Rules

### Community 203 - "2026-08-04 — Auditoría pre-lanzamiento completa: 15 defectos reales encontrados y corregidos"
Cohesion: 0.67
Nodes (3): 2026-08-04 — Auditoría pre-lanzamiento completa: 15 defectos reales encontrados y corregidos, Defectos corregidos, Verificado (y qué no)

### Community 216 - "publish-newsletter skill"
Cohesion: 0.22
Nodes (9): publish-newsletter skill, Make.com webhook ingestion path, Tablero de salidas: empujar conexiones tras publicar, El Expediente — hub /la-lana, El Marcador — hub /infinitas, Hubs de producto (carpetas internas), Roadmap Agosto 2026 (Fases 0-6), main() (+1 more)

## Ambiguous Edges - Review These
- `SITE_URL` → `resolveSiteUrl https self-fetch gotcha`  [AMBIGUOUS]
  .claude/skills/verify/SKILL.md · relation: references
- `SUBSTACK-ARCHIVE-BACKLOG.md` → `El Matador, Inc. — reporte de caso de Playbook`  [AMBIGUOUS]
  docs/SUBSTACK-ARCHIVE-BACKLOG.md · relation: cites
- `Routes Map (public, admin, API, SEO)` → `Google Search Console site verification file`  [AMBIGUOUS]
  public/google5d56d2b62c035791.html · relation: conceptually_related_to

## Knowledge Gaps
- **902 isolated node(s):** `graphify-guard.sh script`, `metadata`, `metadata`, `metadata`, `Filters` (+897 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `SITE_URL` and `resolveSiteUrl https self-fetch gotcha`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `SUBSTACK-ARCHIVE-BACKLOG.md` and `El Matador, Inc. — reporte de caso de Playbook`?**
  _Edge tagged AMBIGUOUS (relation: cites) - confidence is low._
- **What is the exact relationship between `Routes Map (public, admin, API, SEO)` and `Google Search Console site verification file`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `articles` connect `articles` to `backfill-article-standards.ts`, `siteContent`, `seed-jugadas.ts`, `Foto del destacado — 16:10`, `update-articles/route.ts`, `schema.ts`, `reassign-playbook-tag.ts`, `update-article.ts`, `Database Schema (nine Drizzle tables)`, `articles.ts`, `migrate-json-to-db.ts`, `update-lana-board.ts`, `publish-newsletter.ts`, `admin.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `publish-newsletter skill` connect `publish-newsletter skill` to `Resumen`, `publish-newsletter.ts`, `Presupuesto de dispositivos (piso, no techo)`, `Invitaciones de editores por email (token hasheado)`, `tema/page.tsx`, `Pre-flight en un bloque`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `Pre-flight en un bloque` connect `Pre-flight en un bloque` to `find-duplicates.mjs`, `update-lana-board.ts`, `publish-newsletter.ts`, `check-voice.mjs`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `graphify-guard.sh script`, `metadata`, `metadata` to the rest of the system?**
  _902 weakly-connected nodes found - possible documentation gaps or missing edges._
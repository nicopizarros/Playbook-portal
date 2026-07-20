import {
  pgTable,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ---------------------------------------------------------------- Editors
// Playbook's editorial team (aldo/nico/guillermo today). Credentials-based
// auth, JWT sessions — deliberately NOT wired through the Auth.js adapter
// below, which is scoped to reader accounts only (see lib/auth.ts).

export const editors = pgTable('editors', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------- Articles
// id is the legacy slug (articles.json's `id` field) — preserved verbatim
// so /articulo?id=... URLs never change across the migration.

export const articles = pgTable(
  'articles',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull().default(''),
    // Legacy plain-text summary. Kept as the RSS <description> and as the
    // pre-body fallback for articles that predate the TipTap editor.
    teaser: text('teaser').notNull().default(''),
    // TipTap document (nullable: null means "legacy article, no native body
    // yet" -> article page falls back to teaser + Substack link).
    bodyJson: jsonb('body_json').$type<Record<string, unknown> | null>(),
    // Server-rendered cache of bodyJson, regenerated on every save so the
    // article page can render plain HTML instead of walking the JSON tree
    // per request.
    bodyHtml: text('body_html'),
    author: text('author').notNull().default(''),
    date: text('date').notNull(), // YYYY-MM-DD, matches legacy string format
    dateFormatted: text('date_formatted').notNull().default(''),
    publication: text('publication').notNull().default('Playbook'),
    source: text('source').notNull().default('playbook'),
    tagsScope: text('tags_scope').array().notNull().default([]),
    tagsSport: text('tags_sport').array().notNull().default([]),
    tagsVertical: text('tags_vertical').array().notNull().default([]),
    priority: smallint('priority').notNull().default(3),
    featured: boolean('featured').notNull().default(false),
    mostrarAutor: boolean('mostrar_autor').notNull().default(false),
    readingTime: smallint('reading_time').notNull().default(1),
    substackUrl: text('substack_url').notNull().default(''),
    imageUrl: text('image_url').notNull().default(''),
    status: text('status', { enum: ['published', 'draft'] }).notNull().default('published'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by').references(() => editors.id, { onDelete: 'set null' }),
  },
  table => ({
    dateIdx: index('articles_date_idx').on(table.date),
    sourceIdx: index('articles_source_idx').on(table.source),
    authorIdx: index('articles_author_idx').on(table.author),
  }),
);

// ---------------------------------------------------------------- Site content
// Single-row table mirroring content.json's shape 1:1. `version` replaces
// GitHub's blob `sha` for the same optimistic-concurrency conflict UX the
// admin CMS already has (see lib/db/site-content.ts).

export const siteContent = pgTable('site_content', {
  id: integer('id').primaryKey().default(1),
  data: jsonb('data').notNull().$type<Record<string, unknown>>(),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => editors.id, { onDelete: 'set null' }),
});

// Append-only audit trail, replacing the git commit history content.json
// used to have when it lived in the repo.
export const contentRevisions = pgTable('content_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: text('article_id').references(() => articles.id, { onDelete: 'set null' }),
  siteContentVersion: integer('site_content_version'),
  editorId: uuid('editor_id').references(() => editors.id, { onDelete: 'set null' }),
  snapshot: jsonb('snapshot').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------- Auth.js reader tables
// Standard @auth/drizzle-adapter shape, scoped to readers only (email
// passwordless sign-in). Editors never touch these tables.

export const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'account',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  table => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  }),
);

export const verificationTokens = pgTable(
  'verification_token',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

// ---------------------------------------------------------------- Metering

// One row per anonymous visitor, identified by a signed cookie minted in
// middleware.ts. Never carries PII.
export const anonReaders = pgTable('anon_readers', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

// Distinct-article-per-month read log. Backs both the free-article quota
// (lib/metering.ts) and the admin "most read" panel.
export const articleReads = pgTable(
  'article_reads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    readerId: uuid('reader_id').references(() => users.id, { onDelete: 'cascade' }),
    anonId: uuid('anon_id').references(() => anonReaders.id, { onDelete: 'cascade' }),
    articleId: text('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
    monthKey: text('month_key').notNull(), // 'YYYY-MM'
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    // A reader row always has exactly one of readerId/anonId set (enforced
    // in application code, see lib/metering.ts) — two partial unique
    // indexes cover "don't double count the same article twice in a month"
    // for whichever identity is present.
    uniqueReaderRead: uniqueIndex('article_reads_reader_unique')
      .on(table.readerId, table.articleId, table.monthKey),
    uniqueAnonRead: uniqueIndex('article_reads_anon_unique')
      .on(table.anonId, table.articleId, table.monthKey),
    monthIdx: index('article_reads_month_idx').on(table.monthKey),
  }),
);

// ---------------------------------------------------------------- Media (TipTap uploads)

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => editors.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

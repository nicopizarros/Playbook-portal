// The analytics panel's THIRD source: the site's own metering log
// (article_reads, written by lib/metering.ts on every entitled read).
// Same pattern lib/most-read.ts adopted on 2026-08-06 for "Más leídas":
// GA4 and Vercel Analytics both need credentials that have never been
// configured in Vercel, so until they are, the admin panel showed
// "Sin datos todavía" everywhere despite the site logging real readers
// first-party since day one. This module answers what the log can answer
// — KPIs and top articles — and nothing more (referrers, countries and
// devices have no first-party equivalent and stay credential-gated).
//
// Semantics differ from pageviews on purpose, and the UI labels them
// (see AnalyticsView): a "lectura" is one identity × one article × one
// month (the metering table's unique indexes), bots and editors never
// log, and revisits inside the month don't re-count. It measures
// READERS, not hits — stricter, but real.
import { and, desc, gte, lt, sql } from 'drizzle-orm';
import { db } from './db/client';
import { articleReads } from './db/schema';

function rangeFilter(since: string, until: string) {
  return and(gte(articleReads.readAt, new Date(since)), lt(articleReads.readAt, new Date(until)));
}

export async function count({ since, until }: { since: string; until: string }) {
  const [row] = await db
    .select({
      reads: sql<number>`count(*)::int`,
      readers: sql<number>`count(distinct coalesce(${articleReads.readerId}::text, ${articleReads.anonId}::text))::int`,
    })
    .from(articleReads)
    .where(rangeFilter(since, until));
  return { pageviews: row?.reads ?? 0, visitors: row?.readers ?? 0 };
}

export async function topArticles({ since, until, limit }: { since: string; until: string; limit: number }) {
  return db
    .select({ id: articleReads.articleId, count: sql<number>`count(*)::int` })
    .from(articleReads)
    .where(rangeFilter(since, until))
    .groupBy(articleReads.articleId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

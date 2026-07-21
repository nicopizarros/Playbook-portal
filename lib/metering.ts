import { cookies, headers } from 'next/headers';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from './db/client';
import { anonReaders, articleReads } from './db/schema';
import { isBotUserAgent } from './bots';
import { ANON_COOKIE_NAME, verifyAnonCookie } from './anon-cookie';
import { FREE_ARTICLES_PER_MONTH } from './constants';

export type Entitlement =
  | { kind: 'full'; reason: 'reader' | 'editor' | 'bot' | 'quota' }
  | { kind: 'walled'; readsThisMonth: number; limit: number };

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

type Identity = { readerId: string } | { anonId: string };

function identityCondition(identity: Identity, extra: SQL[]) {
  const idClause = 'readerId' in identity
    ? eq(articleReads.readerId, identity.readerId)
    : eq(articleReads.anonId, identity.anonId);
  return and(idClause, ...extra);
}

async function logRead(identity: Identity, articleId: string) {
  await db
    .insert(articleReads)
    .values({
      readerId: 'readerId' in identity ? identity.readerId : null,
      anonId: 'anonId' in identity ? identity.anonId : null,
      articleId,
      monthKey: currentMonthKey(),
    })
    // No target: matches either of the two unique indexes on this table
    // (reader+article+month, anon+article+month) — a re-read this month
    // just no-ops instead of erroring or double-counting.
    .onConflictDoNothing();
}

async function hasReadThisMonth(identity: Identity, articleId: string, monthKey: string): Promise<boolean> {
  const rows = await db
    .select({ id: articleReads.id })
    .from(articleReads)
    .where(identityCondition(identity, [eq(articleReads.articleId, articleId), eq(articleReads.monthKey, monthKey)]))
    .limit(1);
  return rows.length > 0;
}

async function countReadsThisMonth(identity: Identity, monthKey: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articleReads)
    .where(identityCondition(identity, [eq(articleReads.monthKey, monthKey)]));
  // The table's unique indexes already guarantee at most one row per
  // (identity, article, month), so a plain row count already equals the
  // distinct-article count — no separate DISTINCT needed.
  return row?.count ?? 0;
}

// Resolves (and, on the anonymous path, lazily creates) the anon_readers
// row backing the signed cookie middleware.ts already set on this request.
// Deliberately not created in middleware itself — see that file's comment
// — so only visitors who actually reach a metered article get a row here.
async function getOrCreateAnonReaderId(): Promise<string | null> {
  const cookieStore = await cookies();
  const id = await verifyAnonCookie(cookieStore.get(ANON_COOKIE_NAME)?.value);
  if (!id) return null;
  await db.insert(anonReaders).values({ id }).onConflictDoNothing();
  return id;
}

// The single entry point the article page calls. Order matters: session
// check first (cheapest, no DB read for editors), then the bot exemption
// (also no DB read), then the anonymous-quota path (the only branch that
// touches article_reads/anon_readers).
export async function resolveEntitlement(articleId: string): Promise<Entitlement> {
  const session = await auth();

  if (session?.user?.role === 'editor') {
    return { kind: 'full', reason: 'editor' };
  }
  if (session?.user?.role === 'reader') {
    await logRead({ readerId: session.user.id }, articleId);
    return { kind: 'full', reason: 'reader' };
  }

  const headersList = await headers();
  if (isBotUserAgent(headersList.get('user-agent'))) {
    return { kind: 'full', reason: 'bot' };
  }

  const anonId = await getOrCreateAnonReaderId();
  // No valid anon cookie somehow (middleware should always have set one) —
  // fail open to full access rather than walling a reader over an infra
  // hiccup that's neither their fault nor something they can fix.
  if (!anonId) return { kind: 'full', reason: 'quota' };

  const monthKey = currentMonthKey();
  const identity: Identity = { anonId };

  const alreadyReadThisArticle = await hasReadThisMonth(identity, articleId, monthKey);
  if (alreadyReadThisArticle) return { kind: 'full', reason: 'quota' };

  const readsThisMonth = await countReadsThisMonth(identity, monthKey);
  if (readsThisMonth < FREE_ARTICLES_PER_MONTH) {
    await logRead(identity, articleId);
    return { kind: 'full', reason: 'quota' };
  }

  return { kind: 'walled', readsThisMonth, limit: FREE_ARTICLES_PER_MONTH };
}

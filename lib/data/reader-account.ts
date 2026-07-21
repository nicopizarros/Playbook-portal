import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users, articleReads, articles } from '@/lib/db/schema';

export type ReaderAccountSummary = {
  email: string;
  memberSince: Date;
  totalReads: number;
  readsThisMonth: number;
  recentReads: { articleId: string; title: string; readAt: Date }[];
};

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

// A registered reader never hits the free-article wall (lib/metering.ts's
// resolveEntitlement returns 'full' unconditionally for role:'reader') --
// readsThisMonth here is informational, not a quota display.
export async function getReaderAccountSummary(readerId: string): Promise<ReaderAccountSummary | null> {
  const [user] = await db
    .select({ email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, readerId))
    .limit(1);
  if (!user) return null;

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articleReads)
    .where(eq(articleReads.readerId, readerId));

  const [monthRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articleReads)
    .where(and(eq(articleReads.readerId, readerId), eq(articleReads.monthKey, currentMonthKey())));

  const recentReads = await db
    .select({ articleId: articleReads.articleId, readAt: articleReads.readAt, title: articles.title })
    .from(articleReads)
    .innerJoin(articles, eq(articles.id, articleReads.articleId))
    .where(eq(articleReads.readerId, readerId))
    .orderBy(desc(articleReads.readAt))
    .limit(10);

  return {
    email: user.email,
    memberSince: user.createdAt,
    totalReads: totalRow?.count ?? 0,
    readsThisMonth: monthRow?.count ?? 0,
    recentReads,
  };
}

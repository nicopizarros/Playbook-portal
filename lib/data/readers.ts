import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users, articleReads } from '@/lib/db/schema';

export type ReaderRow = {
  id: string;
  email: string;
  name: string | null;
  authMethod: 'google' | 'password';
  createdAt: Date;
  totalReads: number;
};

// Shared by the admin "Lectores" tab (lib/actions/readers.ts, which wraps
// this in its own requireEditor() check) and the periodic Google Sheets
// sync (app/api/cron/sync-readers-sheet/route.ts, which checks CRON_SECRET
// instead) -- no auth check in here itself, callers are responsible for
// gating access before calling this.
//
// No pagination yet -- reader count is small at this stage (Fase 5 auth
// just shipped, see HANDOFF.md). Revisit with a LIMIT/cursor once this
// list is actually long enough to matter.
export async function getAllReaders(): Promise<ReaderRow[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt,
      totalReads: sql<number>`count(${articleReads.id})::int`,
    })
    .from(users)
    .leftJoin(articleReads, eq(articleReads.readerId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  return rows.map(r => ({
    id: r.id,
    email: r.email,
    name: r.name,
    // passwordHash set only for readers who used the email+password
    // option (auth.ts's reader-credentials provider) -- never set for a
    // Google sign-in, see lib/db/schema.ts's comment on that column.
    authMethod: r.passwordHash ? 'password' : 'google',
    createdAt: r.createdAt,
    totalReads: r.totalReads,
  }));
}

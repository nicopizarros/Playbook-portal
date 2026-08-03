'use server';

import { desc, eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { users, articleReads } from '@/lib/db/schema';

// Same guard as lib/actions/team.ts's requireEditor -- redefined here
// because 'use server' modules may only export async server actions, so
// the helper can't be imported across action files.
async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    throw new Error('Unauthorized');
  }
  return session;
}

export type ReaderRow = {
  id: string;
  email: string;
  name: string | null;
  authMethod: 'google' | 'password';
  createdAt: Date;
  totalReads: number;
};

// No pagination yet -- reader count is small at this stage (Fase 5 auth
// just shipped, see HANDOFF.md). Revisit with a LIMIT/cursor once this
// list is actually long enough to matter, same "don't build for a future
// that isn't here yet" call as the rest of this codebase.
export async function getReadersData(): Promise<{ readers: ReaderRow[] }> {
  await requireEditor();

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

  return {
    readers: rows.map(r => ({
      id: r.id,
      email: r.email,
      name: r.name,
      // passwordHash set only for readers who used the email+password
      // option (auth.ts's reader-credentials provider) -- never set for a
      // Google sign-in, see lib/db/schema.ts's comment on that column.
      authMethod: r.passwordHash ? 'password' : 'google',
      createdAt: r.createdAt,
      totalReads: r.totalReads,
    })),
  };
}

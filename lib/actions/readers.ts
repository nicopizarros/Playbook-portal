'use server';

import { auth } from '@/auth';
import { getAllReaders, type ReaderRow } from '@/lib/data/readers';

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

export type { ReaderRow };

export async function getReadersData(): Promise<{ readers: ReaderRow[] }> {
  await requireEditor();
  return { readers: await getAllReaders() };
}
